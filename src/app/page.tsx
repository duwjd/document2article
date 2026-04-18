import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export default async function LandingPage() {
  const user = await getCurrentUser();
  return (
    <main className="min-h-screen">
      <header className="border-b border-brand-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-brand-700 font-bold text-xl">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">D</span>
            Document2Article
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700"
              >
                대시보드로 이동
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700"
                >
                  무료로 시작하기
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
              <span className="h-2 w-2 rounded-full bg-brand-500" /> 문서를 아티클로, 단 몇 초 만에
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
              PDF · URL을{' '}
              <span className="text-brand-600">블로그 아티클</span>로
              <br /> 바로 변환해보세요
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              문서를 업로드하거나 링크를 붙여넣기만 하면, 구조화된 마크다운으로
              변환해 드립니다. Velog, Notion, Brunch로 바로 발행하세요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={user ? '/new' : '/signup'}
                className="rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-brand-200 hover:bg-brand-700"
              >
                지금 변환하기 →
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-brand-200 bg-white px-5 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50"
              >
                로그인
              </Link>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-3 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <Check /> PDF 텍스트 추출
              </li>
              <li className="flex items-center gap-2">
                <Check /> 웹페이지 본문 추출
              </li>
              <li className="flex items-center gap-2">
                <Check /> 마크다운 편집기
              </li>
              <li className="flex items-center gap-2">
                <Check /> 히스토리 자동 저장
              </li>
              <li className="flex items-center gap-2">
                <Check /> Velog / Notion 발행
              </li>
              <li className="flex items-center gap-2">
                <Check /> Brunch 내보내기
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-2xl shadow-brand-100">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-500">
                  article-preview.md
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="h-5 w-3/4 rounded bg-brand-100" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-11/12 rounded bg-slate-100" />
                <div className="h-3 w-10/12 rounded bg-slate-100" />
                <div className="mt-4 h-5 w-1/2 rounded bg-brand-100" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-9/12 rounded bg-slate-100" />
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">
                    #velog
                  </span>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">
                    #notion
                  </span>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">
                    #brunch
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-100 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Document2Article — built with Next.js
      </footer>
    </main>
  );
}

function Check() {
  return (
    <svg
      className="h-5 w-5 text-brand-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
