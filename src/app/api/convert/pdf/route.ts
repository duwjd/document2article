import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { convertPdf } from '@/lib/convert';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'PDF 파일이 필요합니다.' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: '빈 파일입니다.' }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: '파일이 너무 큽니다 (최대 20MB).' }, { status: 400 });
    }
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const fallback = file.name.replace(/\.pdf$/i, '') || '새 PDF 아티클';
    const result = await convertPdf(buffer, fallback);
    const article = await prisma.article.create({
      data: {
        userId: user.id,
        title: result.title,
        content: result.markdown,
        sourceType: 'pdf',
        sourceRef: file.name,
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
    const msg = err instanceof Error ? err.message : 'PDF 변환 실패';
    const status = msg === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
