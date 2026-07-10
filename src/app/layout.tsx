import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

import { auth, signOut } from '@/auth';
import './globals.css';

export const metadata: Metadata = {
  title: '달동네 출판사 — 삶의 인생책 제작 서비스',
  description: '사진과 글을 모아, 가족의 삶을 한 권의 책으로 만들어드립니다.',
  applicationName: '달동네',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: '달동네',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/brand/icon-mark.png',
    apple: '/brand/icon-mark.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6b3f18',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
        />
      </head>

      <body>
        <header className="dd-header">
          <div className="dd-header-inner">
            <Link href={isLoggedIn ? '/dashboard' : '/'} className="dd-brand">
              <img
                src="/brand/icon-mark.png"
                alt=""
                width={38}
                height={38}
                className="dd-brand-icon"
              />
              <span className="dd-brand-name">달동네 출판사</span>
            </Link>

            <nav className="dd-nav" aria-label="상단 메뉴">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="dd-nav-link">
                    내 작업실
                  </Link>

                  <Link href="/dashboard/book" className="dd-nav-link">
                    인생책 만들기
                  </Link>

                  <Link href="/dashboard/library" className="dd-nav-link">
                    내 책장
                  </Link>

                  {isAdmin ? (
                    <Link href="/admin" className="dd-nav-link">
                      관리자
                    </Link>
                  ) : null}

                  <form
                    action={async () => {
                      'use server';
                      await signOut({ redirectTo: '/' });
                    }}
                    className="dd-logout-form"
                  >
                    <button type="submit" className="dd-nav-button">
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/" className="dd-nav-link">
                    홈
                  </Link>

                  <Link href="/guide" className="dd-nav-link">
                    이용 가이드
                  </Link>

                  <Link href="/pricing" className="dd-nav-link">
                    상품안내
                  </Link>

                  <Link href="/login" className="dd-nav-button dd-nav-button-dark">
                    로그인
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}