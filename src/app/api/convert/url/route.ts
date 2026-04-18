import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { convertUrl } from '@/lib/convert';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    if (!body?.url) return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
    const result = await convertUrl(body.url);
    const article = await prisma.article.create({
      data: {
        userId: user.id,
        title: result.title,
        content: result.markdown,
        sourceType: 'url',
        sourceRef: body.url,
        status: 'draft',
      },
    });
    await prisma.articleHistory.create({
      data: {
        articleId: article.id,
        title: article.title,
        content: article.content,
      },
    });
    return NextResponse.json({ id: article.id, title: article.title });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'URL 변환 실패';
    const status = msg === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
