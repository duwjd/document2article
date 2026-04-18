import { Client as NotionClient } from '@notionhq/client';

export type ExportResult = {
  externalUrl?: string;
  status: 'success' | 'failed';
  message: string;
};

export async function exportToNotion(args: {
  token: string;
  parentPageId: string;
  title: string;
  markdown: string;
}): Promise<ExportResult> {
  const notion = new NotionClient({ auth: args.token });
  const blocks = markdownToNotionBlocks(args.markdown);
  try {
    const resp = await notion.pages.create({
      parent: { page_id: args.parentPageId.replace(/-/g, '') } as {
        page_id: string;
      },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: args.title } }],
        },
      },
      children: blocks.slice(0, 100) as unknown as Parameters<
        typeof notion.pages.create
      >[0]['children'],
    });
    const url = (resp as { url?: string }).url;
    return { externalUrl: url, status: 'success', message: 'Exported to Notion' };
  } catch (err) {
    return {
      status: 'failed',
      message: err instanceof Error ? err.message : 'Notion export failed',
    };
  }
}

export async function exportToVelog(args: {
  token: string;
  username: string;
  title: string;
  markdown: string;
}): Promise<ExportResult> {
  const query = `
    mutation WritePost($title: String!, $body: String!, $tags: [String], $is_markdown: Boolean!, $is_private: Boolean!, $is_temp: Boolean!, $url_slug: String) {
      writePost(title: $title, body: $body, tags: $tags, is_markdown: $is_markdown, is_private: $is_private, is_temp: $is_temp, url_slug: $url_slug) {
        id
        url_slug
      }
    }
  `;
  try {
    const res = await fetch('https://v2.velog.io/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${args.token}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          title: args.title,
          body: args.markdown,
          tags: [],
          is_markdown: true,
          is_private: false,
          is_temp: false,
          url_slug: slugify(args.title),
        },
      }),
    });
    const data = (await res.json()) as {
      data?: { writePost?: { id: string; url_slug: string } };
      errors?: { message: string }[];
    };
    if (data.errors?.length) {
      return {
        status: 'failed',
        message: data.errors.map((e) => e.message).join(', '),
      };
    }
    const slug = data.data?.writePost?.url_slug;
    const externalUrl = slug
      ? `https://velog.io/@${args.username}/${slug}`
      : undefined;
    return { externalUrl, status: 'success', message: 'Exported to Velog' };
  } catch (err) {
    return {
      status: 'failed',
      message: err instanceof Error ? err.message : 'Velog export failed',
    };
  }
}

export function buildBrunchExport(title: string, markdown: string) {
  return {
    title,
    markdown,
    instructions:
      'Brunch does not offer a public write API. Copy the markdown above, paste it into Brunch editor (https://brunch.co.kr/publish), and publish manually.',
  };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\uAC00-\uD7A3-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'post';
}

type NotionBlock = {
  object: 'block';
  type: string;
  [key: string]: unknown;
};

function textBlock(type: string, content: string): NotionBlock {
  return {
    object: 'block',
    type,
    [type]: {
      rich_text: [{ type: 'text', text: { content: content.slice(0, 1900) } }],
    },
  };
}

function markdownToNotionBlocks(md: string): NotionBlock[] {
  const lines = md.split('\n');
  const blocks: NotionBlock[] = [];
  let inCode = false;
  let codeLang = 'plain text';
  let codeBuf: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/\t/g, '    ');
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim() || 'plain text';
        codeBuf = [];
      } else {
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            rich_text: [
              { type: 'text', text: { content: codeBuf.join('\n').slice(0, 1900) } },
            ],
            language: codeLang,
          },
        });
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    if (!line.trim()) continue;
    if (line.startsWith('# ')) blocks.push(textBlock('heading_1', line.slice(2)));
    else if (line.startsWith('## ')) blocks.push(textBlock('heading_2', line.slice(3)));
    else if (line.startsWith('### ')) blocks.push(textBlock('heading_3', line.slice(4)));
    else if (/^[-*]\s+/.test(line))
      blocks.push(textBlock('bulleted_list_item', line.replace(/^[-*]\s+/, '')));
    else if (/^\d+\.\s+/.test(line))
      blocks.push(textBlock('numbered_list_item', line.replace(/^\d+\.\s+/, '')));
    else if (line.startsWith('> ')) blocks.push(textBlock('quote', line.slice(2)));
    else blocks.push(textBlock('paragraph', line));
  }
  return blocks;
}
