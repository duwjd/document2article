'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  async function onClick() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  return (
    <button
      onClick={onClick}
      className="ml-2 rounded-lg border border-brand-100 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
    >
      로그아웃
    </button>
  );
}
