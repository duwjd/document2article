import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Document2Article',
  description:
    'PDF와 URL을 마크다운 아티클로 변환하고, Velog·Notion·Brunch로 바로 발행하세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
