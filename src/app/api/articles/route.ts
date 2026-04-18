import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireUser();
    const list = await prisma.article.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ articles: list });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}
