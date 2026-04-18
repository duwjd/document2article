import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen">
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-brand-700 font-bold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              D
            </span>
            Document2Article
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
            <NavLink href="/dashboard" label="대시보드" />
            <NavLink href="/new" label="새 글" />
            <NavLink href="/settings" label="설정" />
            <div className="mx-2 hidden h-5 w-px bg-slate-200 md:block" />
            <span className="hidden md:inline text-slate-500">{user.email}</span>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-slate-600 hover:bg-brand-50 hover:text-brand-700"
    >
      {label}
    </Link>
  );
}
