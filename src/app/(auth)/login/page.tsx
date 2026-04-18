'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AuthShell from '@/components/AuthShell';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error || '로그인에 실패했습니다.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <AuthShell title="다시 오신 것을 환영합니다" subtitle="계정으로 로그인하세요">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">이메일</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">비밀번호</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </label>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
          회원가입
        </Link>
      </p>
    </AuthShell>
  );
}
