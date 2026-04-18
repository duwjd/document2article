'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type HistoryEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function HistoryViewer({
  articleId,
  history,
}: {
  articleId: string;
  history: HistoryEntry[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<HistoryEntry | null>(history[0] ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  if (history.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center text-slate-500">
        아직 저장된 이력이 없습니다.
      </p>
    );
  }

  async function restore(entry: HistoryEntry) {
    if (!confirm('이 버전으로 되돌리시겠습니까?')) return;
    setBusy(true);
    const res = await fetch(`/api/articles/${articleId}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historyId: entry.id }),
    });
    setBusy(false);
    if (res.ok) {
      setMessage({ kind: 'ok', text: '복원되었습니다.' });
      setTimeout(() => router.push(`/articles/${articleId}`), 600);
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage({ kind: 'err', text: data.error || '복원 실패' });
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-brand-100 bg-white p-3 shadow-sm">
        <ul className="space-y-1">
          {history.map((h, idx) => (
            <li key={h.id}>
              <button
                onClick={() => setSelected(h)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  selected?.id === h.id
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-700 hover:bg-brand-50'
                }`}
              >
                <div className="font-semibold">
                  {idx === 0 ? '현재 버전' : `버전 #${history.length - idx}`}
                </div>
                <div
                  className={`text-xs ${
                    selected?.id === h.id ? 'text-brand-100' : 'text-slate-500'
                  }`}
                >
                  {new Date(h.createdAt).toLocaleString('ko-KR')}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        {selected ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selected.title}</h2>
                <p className="text-xs text-slate-500">
                  {new Date(selected.createdAt).toLocaleString('ko-KR')}
                </p>
              </div>
              <button
                onClick={() => restore(selected)}
                disabled={busy}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                이 버전으로 되돌리기
              </button>
            </div>
            {message && (
              <div
                className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                  message.kind === 'ok'
                    ? 'bg-brand-50 text-brand-800'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {message.text}
              </div>
            )}
            <article className="markdown-preview mt-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
            </article>
          </>
        ) : (
          <p className="text-slate-500">버전을 선택하세요.</p>
        )}
      </section>
    </div>
  );
}
