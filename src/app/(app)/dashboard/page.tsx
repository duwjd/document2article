import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import DashboardSearch from '@/components/DashboardSearch';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();
  const [articles, counts] = await Promise.all([
    prisma.article.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    prisma.article.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: true,
    }),
  ]);
  const totals = {
    total: articles.length,
    draft: counts.find((c) => c.status === 'draft')?._count ?? 0,
    published: counts.find((c) => c.status === 'published')?._count ?? 0,
  };
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.name || user.email}님, 지금까지 작성한 아티클을 한눈에 확인하세요.
          </p>
        </div>
        <Link
          href="/new"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700"
        >
          + 새 아티클 만들기
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="전체 아티클" value={totals.total} accent="brand" />
        <StatCard label="초안" value={totals.draft} accent="slate" />
        <StatCard label="발행" value={totals.published} accent="emerald" />
      </div>

      <div className="mt-8">
        <DashboardSearch
          articles={articles.map((a) => ({
            id: a.id,
            title: a.title,
            status: a.status,
            sourceType: a.sourceType,
            sourceRef: a.sourceRef,
            updatedAt: a.updatedAt.toISOString(),
            snippet: a.content.slice(0, 160).replace(/[#*`>_\-]/g, '').trim(),
          }))}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'brand' | 'slate' | 'emerald';
}) {
  const accentMap = {
    brand: 'from-brand-50 to-white text-brand-700 border-brand-100',
    slate: 'from-slate-50 to-white text-slate-700 border-slate-200',
    emerald: 'from-emerald-50 to-white text-emerald-700 border-emerald-100',
  } as const;
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${accentMap[accent]} p-5 shadow-sm`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
