'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type DashboardArticle = {
  id: string;
  title: string;
  status: string;
  sourceType: string;
  sourceRef: string | null;
  updatedAt: string;
  snippet: string;
};

export default function DashboardSearch({
  articles,
}: {
  articles: DashboardArticle[];
}) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return articles.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (!term) return true;
      return (
        a.title.toLowerCase().includes(term) ||
        a.snippet.toLowerCase().includes(term)
      );
    });
  }, [articles, q, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>
            전체
          </FilterBtn>
          <FilterBtn active={filter === 'draft'} onClick={() => setFilter('draft')}>
            초안
          </FilterBtn>
          <FilterBtn
            active={filter === 'published'}
            onClick={() => setFilter('published')}
          >
            발행됨
          </FilterBtn>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목 또는 내용 검색…"
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center">
          <p className="text-slate-500">
            {articles.length === 0
              ? '아직 작성한 아티클이 없습니다.'
              : '조건에 맞는 아티클이 없습니다.'}
          </p>
          <Link
            href="/new"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            첫 아티클 만들기
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((a) => (
            <li key={a.id}>
              <Link
                href={`/articles/${a.id}`}
                className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {a.title || '제목 없음'}
                      </h3>
                      <StatusBadge status={a.status} />
                      <SourceBadge type={a.sourceType} />
                    </div>
                    {a.snippet && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {a.snippet}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>{new Date(a.updatedAt).toLocaleString('ko-KR')}</div>
                    {a.sourceRef && (
                      <div className="mt-1 max-w-[220px] truncate" title={a.sourceRef}>
                        {a.sourceRef}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterBtn({
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
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-brand-600 text-white shadow'
          : 'bg-white text-slate-600 hover:bg-brand-50'
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-emerald-100 text-emerald-700',
  } as Record<string, string>;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        map[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {status === 'draft' ? '초안' : status === 'published' ? '발행됨' : status}
    </span>
  );
}

function SourceBadge({ type }: { type: string }) {
  return (
    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
      {type === 'pdf' ? 'PDF' : type === 'url' ? 'URL' : type}
    </span>
  );
}
