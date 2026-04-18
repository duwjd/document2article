import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setAuthCookie, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string; name?: string }
    | null;
  if (!body?.email || !body.password) {
    return NextResponse.json(
      { error: '이메일과 비밀번호를 입력하세요.' },
      { status: 400 },
    );
  }
  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '이메일 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  if (body.password.length < 6) {
    return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: body.name?.trim() || null },
    });
    const token = signToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({ id: user.id, email: user.email, name: user.name });
    setAuthCookie(res, token);
    return res;
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
