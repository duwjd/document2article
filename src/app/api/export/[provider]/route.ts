import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  buildBrunchExport,
  exportToNotion,
  exportToVelog,
} from '@/lib/exporters';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  ctx: { params: { provider: string } },
) {
  try {
    const user = await requireUser();
    const provider = ctx.params.provider;
    const body = (await req.json().catch(() => null)) as
      | { articleId?: string; parentPageId?: string }
      | null;
    if (!body?.articleId)
      return NextResponse.json({ error: 'articleId가 필요합니다.' }, { status: 400 });
    const article = await prisma.article.findUnique({
      where: { id: body.articleId },
    });
    if (!article || article.userId !== user.id)
      return NextResponse.json({ error: '아티클을 찾을 수 없습니다.' }, { status: 404 });

    if (provider === 'brunch') {
      const out = buildBrunchExport(article.title, article.content);
      await prisma.exportLog.create({
        data: {
          articleId: article.id,
          provider,
          status: 'success',
          message: 'Manual export prepared',
        },
      });
      return NextResponse.json({ provider, manual: true, ...out });
    }

    const integration = await prisma.integration.findUnique({
      where: { userId_provider: { userId: user.id, provider } },
    });
    if (!integration)
      return NextResponse.json(
        { error: `설정에서 ${provider}을(를) 먼저 연결해주세요.` },
        { status: 400 },
      );

    if (provider === 'notion') {
      const metadata = integration.metadata
        ? (JSON.parse(integration.metadata) as Record<string, string>)
        : {};
      const parentPageId = body.parentPageId || metadata.parentPageId;
      if (!parentPageId)
        return NextResponse.json(
          { error: 'Notion 부모 페이지 ID가 필요합니다. 설정에서 저장하거나 요청에 포함해주세요.' },
          { status: 400 },
        );
      const result = await exportToNotion({
        token: integration.token,
        parentPageId,
        title: article.title,
        markdown: article.content,
      });
      await prisma.exportLog.create({
        data: {
          articleId: article.id,
          provider,
          status: result.status,
          message: result.message,
          externalUrl: result.externalUrl,
        },
      });
      if (result.status === 'success') {
        await prisma.article.update({
          where: { id: article.id },
          data: { status: 'published' },
        });
      }
      return NextResponse.json({ provider, ...result });
    }

    if (provider === 'velog') {
      if (!integration.username)
        return NextResponse.json(
          { error: 'Velog 사용자명을 설정에서 등록해주세요.' },
          { status: 400 },
        );
      const result = await exportToVelog({
        token: integration.token,
        username: integration.username,
        title: article.title,
        markdown: article.content,
      });
      await prisma.exportLog.create({
        data: {
          articleId: article.id,
          provider,
          status: result.status,
          message: result.message,
          externalUrl: result.externalUrl,
        },
      });
      if (result.status === 'success') {
        await prisma.article.update({
          where: { id: article.id },
          data: { status: 'published' },
        });
      }
      return NextResponse.json({ provider, ...result });
    }

    return NextResponse.json({ error: '지원하지 않는 제공자입니다.' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Export 실패';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}
