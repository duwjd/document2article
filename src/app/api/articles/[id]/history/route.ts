import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const article = await prisma.article.findUnique({ where: { id: ctx.params.id } });
    if (!article || article.userId !== user.id)
      return NextResponse.json({ error: '아티클을 찾을 수 없습니다.' }, { status: 404 });
    const history = await prisma.articleHistory.findMany({
      where: { articleId: ctx.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ history });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const article = await prisma.article.findUnique({ where: { id: ctx.params.id } });
    if (!article || article.userId !== user.id)
      return NextResponse.json({ error: '아티클을 찾을 수 없습니다.' }, { status: 404 });
    const body = (await req.json().catch(() => null)) as { historyId?: string } | null;
    if (!body?.historyId)
      return NextResponse.json({ error: 'historyId가 필요합니다.' }, { status: 400 });
    const snap = await prisma.articleHistory.findUnique({ where: { id: body.historyId } });
    if (!snap || snap.articleId !== article.id)
      return NextResponse.json({ error: '이력을 찾을 수 없습니다.' }, { status: 404 });
    const updated = await prisma.article.update({
      where: { id: article.id },
      data: { title: snap.title, content: snap.content },
    });
    await prisma.articleHistory.create({
      data: {
        articleId: article.id,
        title: updated.title,
        content: updated.content,
      },
    });
    return NextResponse.json({ article: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}
