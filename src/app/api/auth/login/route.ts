import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setAuthCookie, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  if (!body?.email || !body.password) {
    return NextResponse.json({ error: '이메일과 비밀번호를 입력하세요.' }, { status: 400 });
  }
  try {
    const email = body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }
    const token = signToken({ sub: user.id, email: user.email });
    const res = NextResponse.json({ id: user.id, email: user.email, name: user.name });
    setAuthCookie(res, token);
    return res;
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
