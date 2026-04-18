'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

type Article = {
  id: string;
  title: string;
  content: string;
  status: string;
  sourceType: string;
  sourceRef: string | null;
  updatedAt: string;
};

type Integration = {
  provider: string;
  username: string | null;
  metadata: string | null;
};

export default function ArticleEditor({
  article,
  integrations,
}: {
  article: Article;
  integrations: Integration[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [status, setStatus] = useState(article.status);
  const [savedAt, setSavedAt] = useState<string | null>(article.updatedAt);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [exporting, setExporting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const dirty = title !== article.title || content !== article.content || status !== article.status;
  const debouncer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirty) return;
    if (debouncer.current) clearTimeout(debouncer.current);
    debouncer.current = setTimeout(() => {
      void save({ silent: true });
    }, 1500);
    return () => {
      if (debouncer.current) clearTimeout(debouncer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, status]);

  async function save(opts: { silent?: boolean } = {}) {
    setSaving(true);
    const res = await fetch(`/api/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, status }),
    });
    setSaving(false);
    if (res.ok) {
      const data = (await res.json()) as { article: Article };
      setSavedAt(data.article.updatedAt);
      if (!opts.silent) setMessage({ kind: 'ok', text: '저장되었습니다.' });
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({ kind: 'err', text: data.error || '저장에 실패했습니다.' });
    }
  }

  async function del() {
    if (!confirm('이 아티클을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/articles/${article.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/dashboard');
    else setMessage({ kind: 'err', text: '삭제에 실패했습니다.' });
  }

  async function doExport(provider: 'velog' | 'notion' | 'brunch') {
    setExporting(provider);
    setMessage(null);
    try {
      if (dirty) await save({ silent: true });
      const res = await fetch(`/api/export/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id }),
      });
      const data = (await res.json()) as {
        externalUrl?: string;
        manual?: boolean;
        markdown?: string;
        instructions?: string;
        error?: string;
        status?: string;
        message?: string;
      };
      if (!res.ok) throw new Error(data.error || '내보내기 실패');
      if (data.manual && data.markdown) {
        await navigator.clipboard.writeText(data.markdown).catch(() => {});
        setMessage({
          kind: 'ok',
          text: `${provider} 내보내기용 마크다운을 클립보드에 복사했습니다. ${data.instructions ?? ''}`,
        });
      } else if (data.externalUrl) {
        setMessage({ kind: 'ok', text: `${provider} 발행 완료: ${data.externalUrl}` });
        window.open(data.externalUrl, '_blank', 'noopener');
      } else {
        setMessage({
          kind: data.status === 'success' ? 'ok' : 'err',
          text: data.message || `${provider} 완료`,
        });
      }
    } catch (err) {
      setMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : '내보내기 실패',
      });
    } finally {
      setExporting(null);
    }
  }

  const connected = useMemo(
    () => new Set(integrations.map((i) => i.provider)),
    [integrations],
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="flex-1 min-w-[260px] border-0 border-b-2 border-transparent bg-transparent text-3xl font-bold text-slate-900 outline-none focus:border-brand-400"
        />
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          >
            <option value="draft">초안</option>
            <option value="published">발행됨</option>
          </select>
          <button
            onClick={() => save()}
            disabled={!dirty || saving}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? '저장 중…' : dirty ? '저장' : '저장됨'}
          </button>
          <button
            onClick={del}
            className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>출처: {article.sourceType === 'pdf' ? 'PDF' : 'URL'}</span>
        {article.sourceRef && (
          <span className="max-w-[50ch] truncate" title={article.sourceRef}>
            {article.sourceRef}
          </span>
        )}
        {savedAt && <span>마지막 저장: {new Date(savedAt).toLocaleString('ko-KR')}</span>}
      </div>

      {message && (
        <div
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            message.kind === 'ok'
              ? 'bg-brand-50 text-brand-800'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex gap-2">
            <TabBtn active={mode === 'edit'} onClick={() => setMode('edit')}>
              편집
            </TabBtn>
            <TabBtn active={mode === 'preview'} onClick={() => setMode('preview')}>
              미리보기
            </TabBtn>
          </div>
          {mode === 'edit' ? (
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(v) => setContent(v ?? '')}
                height={560}
                preview="live"
              />
            </div>
          ) : (
            <article className="markdown-preview prose max-w-none p-4">
              <h1>{title}</h1>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">내보내기</h3>
            <p className="mb-3 text-xs text-slate-500">
              블로그 플랫폼으로 바로 발행하거나, 마크다운을 복사할 수 있어요.
            </p>
            <ExportRow
              provider="velog"
              connected={connected.has('velog')}
              exporting={exporting === 'velog'}
              onClick={() => doExport('velog')}
            />
            <ExportRow
              provider="notion"
              connected={connected.has('notion')}
              exporting={exporting === 'notion'}
              onClick={() => doExport('notion')}
            />
            <ExportRow
              provider="brunch"
              connected
              exporting={exporting === 'brunch'}
              onClick={() => doExport('brunch')}
              hint="수동 발행 (마크다운 복사)"
            />
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(content)
                  .then(() =>
                    setMessage({ kind: 'ok', text: '마크다운이 클립보드에 복사되었습니다.' }),
                  );
              }}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              📋 마크다운 복사
            </button>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-slate-700">상태</h3>
            <ul className="space-y-1 text-xs text-slate-500">
              <li>• 자동 저장이 1.5초 후 적용됩니다.</li>
              <li>• 저장 시마다 히스토리가 기록됩니다.</li>
              <li>
                •{' '}
                <button
                  onClick={() => router.push(`/articles/${article.id}/history`)}
                  className="text-brand-700 hover:underline"
                >
                  이전 버전으로 되돌리기
                </button>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${
        active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
      }`}
    >
      {children}
    </button>
  );
}

function ExportRow({
  provider,
  connected,
  exporting,
  onClick,
  hint,
}: {
  provider: 'velog' | 'notion' | 'brunch';
  connected: boolean;
  exporting: boolean;
  onClick: () => void;
  hint?: string;
}) {
  const labels = {
    velog: 'Velog',
    notion: 'Notion',
    brunch: 'Brunch',
  };
  return (
    <button
      onClick={onClick}
      disabled={exporting || !connected}
      className="mb-2 flex w-full items-center justify-between rounded-lg border border-brand-100 bg-gradient-to-r from-brand-50 to-white px-3 py-2 text-sm font-semibold text-brand-800 hover:from-brand-100 disabled:opacity-60"
    >
      <span>
        {labels[provider]}
        {hint ? <span className="ml-2 text-xs text-slate-500">({hint})</span> : null}
      </span>
      {exporting ? (
        <span className="text-xs">전송 중…</span>
      ) : connected ? (
        <span className="text-xs text-emerald-700">✓ 연결됨</span>
      ) : (
        <span className="text-xs text-slate-500">미연결</span>
      )}
    </button>
  );
}
