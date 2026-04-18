import { NextResponse } from 'next/server';
import { AuthError } from './auth';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function handle<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();
    return ok(data);
  } catch (err) {
    if (err instanceof AuthError) return bad(err.message, 401);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return bad(msg, 500);
  }
}
