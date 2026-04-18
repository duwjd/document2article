import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function getOwned(userId: string, id: string) {
  const a = await prisma.article.findUnique({ where: { id } });
  if (!a || a.userId !== userId) return null;
  return a;
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const article = await getOwned(user.id, ctx.params.id);
    if (!article) return NextResponse.json({ error: '아티클을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ article });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await getOwned(user.id, ctx.params.id);
    if (!existing) return NextResponse.json({ error: '아티클을 찾을 수 없습니다.' }, { status: 404 });
    const body = (await req.json().catch(() => null)) as
      | { title?: string; content?: string; status?: string }
      | null;
    if (!body) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

    const data: { title?: string; content?: string; status?: string } = {};
    if (typeof body.title === 'string') data.title = body.title.trim() || existing.title;
    if (typeof body.content === 'string') data.content = body.content;
    if (typeof body.status === 'string' && ['draft', 'published'].includes(body.status))
      data.status = body.status;

    const contentChanged =
      data.content !== undefined && data.content !== existing.content;
    const titleChanged = data.title !== undefined && data.title !== existing.title;

    const updated = await prisma.article.update({
      where: { id: existing.id },
      data,
    });

    if (contentChanged || titleChanged) {
      await prisma.articleHistory.create({
        data: {
          articleId: updated.id,
          title: updated.title,
          content: updated.content,
        },
      });
    }

    return NextResponse.json({ article: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await getOwned(user.id, ctx.params.id);
    if (!existing) return NextResponse.json({ error: '아티클을 찾을 수 없습니다.' }, { status: 404 });
    await prisma.article.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}
