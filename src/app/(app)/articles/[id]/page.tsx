import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ArticleEditor from '@/components/ArticleEditor';

export const dynamic = 'force-dynamic';

export default async function ArticleEditPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article || article.userId !== user.id) notFound();
  const integrations = await prisma.integration.findMany({
    where: { userId: user.id },
    select: {
      provider: true,
      username: true,
      metadata: true,
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/dashboard" className="text-brand-700 hover:underline">
          ← 대시보드로
        </Link>
        <Link
          href={`/articles/${article.id}/history`}
          className="rounded-lg border border-brand-100 bg-white px-3 py-1.5 font-semibold text-brand-700 hover:bg-brand-50"
        >
          🕒 히스토리
        </Link>
      </div>
      <ArticleEditor
        article={{
          id: article.id,
          title: article.title,
          content: article.content,
          status: article.status,
          sourceType: article.sourceType,
          sourceRef: article.sourceRef,
          updatedAt: article.updatedAt.toISOString(),
        }}
        integrations={integrations.map((i) => ({
          provider: i.provider,
          username: i.username,
          metadata: i.metadata,
        }))}
      />
    </div>
  );
}
