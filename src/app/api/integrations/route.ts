import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const PROVIDERS = new Set(['velog', 'notion', 'brunch']);

export async function GET() {
  try {
    const user = await requireUser();
    const list = await prisma.integration.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        username: true,
        metadata: true,
        connectedAt: true,
      },
    });
    return NextResponse.json({ integrations: list });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => null)) as
      | {
          provider?: string;
          token?: string;
          username?: string;
          metadata?: Record<string, string>;
        }
      | null;
    if (!body?.provider || !PROVIDERS.has(body.provider))
      return NextResponse.json({ error: '지원하지 않는 제공자입니다.' }, { status: 400 });
    if (!body.token)
      return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 });

    const saved = await prisma.integration.upsert({
      where: { userId_provider: { userId: user.id, provider: body.provider } },
      create: {
        userId: user.id,
        provider: body.provider,
        token: body.token,
        username: body.username || null,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
      update: {
        token: body.token,
        username: body.username || null,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    });
    return NextResponse.json({
      integration: {
        id: saved.id,
        provider: saved.provider,
        username: saved.username,
        metadata: saved.metadata,
        connectedAt: saved.connectedAt,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');
    if (!provider || !PROVIDERS.has(provider))
      return NextResponse.json({ error: '제공자가 필요합니다.' }, { status: 400 });
    await prisma.integration.deleteMany({
      where: { userId: user.id, provider },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}
