import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import HistoryViewer from '@/components/HistoryViewer';

export const dynamic = 'force-dynamic';

export default async function HistoryPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article || article.userId !== user.id) notFound();
  const history = await prisma.articleHistory.findMany({
    where: { articleId: article.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href={`/articles/${article.id}`} className="text-brand-700 hover:underline">
          ← 에디터로 돌아가기
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">
        히스토리 — {article.title}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        변경될 때마다 자동으로 스냅샷이 저장됩니다. 과거 버전으로 되돌릴 수 있어요.
      </p>
      <div className="mt-6">
        <HistoryViewer
          articleId={article.id}
          history={history.map((h) => ({
            id: h.id,
            title: h.title,
            content: h.content,
            createdAt: h.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
