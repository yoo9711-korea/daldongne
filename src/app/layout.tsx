// src/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { auth, signOut } from '@/auth';
import './globals.css';

export const metadata: Metadata = {
  title: '달동네 출판사 — Memory Platform',
  description: '한 사람의 삶을 다음 세대에게 전달하는 Memory Platform',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700;900&family=Noto+Sans+KR:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            <Link href="/" className="brand">
              달동네 출판사<small>DAL-DONG-NE PUBLISHING</small>
            </Link>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {session?.user ? (
                <>
                  <Link href="/dashboard" className="btn btn--ghost-light" style={{ padding: '9px 16px', fontSize: 13.5 }}>
                    내 서재
                  </Link>
                  <form
                    action={async () => {
                      'use server';
                      await signOut({ redirectTo: '/' });
                    }}
                  >
                    <button type="submit" className="btn btn--ghost-light" style={{ padding: '9px 16px', fontSize: 13.5 }}>
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="btn btn--gold" style={{ padding: '9px 16px', fontSize: 13.5 }}>
                  로그인
                </Link>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
