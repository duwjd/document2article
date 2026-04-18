'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Mode = 'url' | 'pdf';

export default function NewArticleForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'url') {
        if (!url) throw new Error('URL을 입력하세요.');
        setProgress('웹페이지 가져오는 중…');
        const res = await fetch('/api/convert/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = (await res.json()) as { id?: string; error?: string };
        if (!res.ok || !data.id) throw new Error(data.error || '변환 실패');
        router.push(`/articles/${data.id}`);
      } else {
        if (!file) throw new Error('PDF 파일을 선택하세요.');
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          throw new Error('PDF 파일만 업로드할 수 있습니다.');
        }
        setProgress('PDF 분석 중…');
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/convert/pdf', { method: 'POST', body: fd });
        const data = (await res.json()) as { id?: string; error?: string };
        if (!res.ok || !data.id) throw new Error(data.error || '변환 실패');
        router.push(`/articles/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-lg shadow-brand-50">
      <div className="flex gap-2 rounded-xl bg-brand-50 p-1">
        <TabBtn active={mode === 'url'} onClick={() => setMode('url')}>
          🔗 URL에서 변환
        </TabBtn>
        <TabBtn active={mode === 'pdf'} onClick={() => setMode('pdf')}>
          📄 PDF 업로드
        </TabBtn>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === 'url' ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">웹페이지 URL</span>
            <input
              type="url"
              required
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
            />
            <p className="mt-2 text-xs text-slate-500">
              블로그, 뉴스, 기술 문서 등의 본문을 자동으로 추출해 마크다운으로 변환합니다.
            </p>
          </label>
        ) : (
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">PDF 파일</span>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-10 text-center transition hover:border-brand-400 hover:bg-brand-50">
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <>
                  <span className="text-4xl">📄</span>
                  <p className="mt-2 font-semibold text-brand-800">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB — 다른 파일 선택
                  </p>
                </>
              ) : (
                <>
                  <span className="text-4xl">⬆️</span>
                  <p className="mt-2 font-semibold text-brand-800">PDF 선택 또는 드래그 앤 드롭</p>
                  <p className="text-xs text-slate-500">최대 10MB 권장</p>
                </>
              )}
            </label>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        {loading && progress && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{progress}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? '변환 중…' : '마크다운으로 변환하기'}
        </button>
      </form>
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
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-white text-brand-700 shadow' : 'text-brand-800/70 hover:text-brand-800'
      }`}
    >
      {children}
    </button>
  );
}
