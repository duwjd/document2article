import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

export type ConvertResult = {
  title: string;
  markdown: string;
  byline?: string;
  excerpt?: string;
  siteName?: string;
};

function makeTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  td.addRule('strikethrough', {
    filter: ['del', 's'] as unknown as TurndownService.Filter,
    replacement: (c) => `~~${c}~~`,
  });
  return td;
}

export async function convertUrl(url: string): Promise<ConvertResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http(s) URLs are supported');
  }
  const res = await fetch(parsed.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; Document2ArticleBot/1.0; +https://document2article.local)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch URL (${res.status})`);
  const html = await res.text();
  const dom = new JSDOM(html, { url: parsed.toString() });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  const td = makeTurndown();
  const content = article?.content ?? dom.window.document.body.innerHTML;
  const markdown = td.turndown(content).trim();
  const title =
    article?.title?.trim() ||
    dom.window.document.title?.trim() ||
    parsed.hostname;
  return {
    title,
    markdown,
    byline: article?.byline ?? undefined,
    excerpt: article?.excerpt ?? undefined,
    siteName: article?.siteName ?? parsed.hostname,
  };
}

export async function convertPdf(
  buffer: Buffer,
  fallbackTitle: string,
): Promise<ConvertResult> {
  const pdfParse = (await import('pdf-parse')).default;
  const parsed = await pdfParse(buffer);
  const raw = (parsed.text || '').replace(/\r/g, '');
  const lines = raw.split('\n').map((l) => l.trim());
  const title =
    (parsed.info as Record<string, unknown> | undefined)?.Title &&
    String((parsed.info as Record<string, unknown>).Title).trim()
      ? String((parsed.info as Record<string, unknown>).Title).trim()
      : lines.find((l) => l.length > 0) || fallbackTitle;

  const paragraphs: string[] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (line === '') {
      if (buf.length) {
        paragraphs.push(buf.join(' ').replace(/\s+/g, ' ').trim());
        buf = [];
      }
    } else {
      buf.push(line);
    }
  }
  if (buf.length) paragraphs.push(buf.join(' ').replace(/\s+/g, ' ').trim());

  const body = paragraphs
    .filter((p) => p && p !== title)
    .map((p) => {
      if (/^(\d+\.|•|-)\s+/.test(p)) return p.replace(/^•\s*/, '- ');
      if (p.length < 80 && /^[A-Z0-9][^.]*$/.test(p)) return `## ${p}`;
      return p;
    })
    .join('\n\n');

  const markdown = `# ${title}\n\n${body}`.trim();
  return { title, markdown, excerpt: paragraphs[1]?.slice(0, 200) };
}
