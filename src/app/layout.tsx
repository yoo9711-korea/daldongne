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
        <header className="app-header">
          <div className="app-header__inner">
            <Link href="/" className="app-brand">
              <img
                src="/brand/icon-mark.png"
                alt=""
                width={40}
                height={40}
                className="app-brand__icon"
              />

              <span className="app-brand__name">달동네 출판사</span>

              {!isLoggedIn ? (
                <small className="app-brand__desc">
                  가치있는 삶의 인생책 제작 서비스
                </small>
              ) : null}
            </Link>

            <nav className="app-nav app-nav--desktop" aria-label="상단 메뉴">
              <Link href="/" className="app-nav__link">
                홈
              </Link>

              <Link href="/guide" className="app-nav__link">
                이용 가이드
              </Link>

              <Link href="/dashboard/book" className="app-nav__link">
                인생책 만들기
              </Link>

              {!isLoggedIn ? (
                <>
                  <Link href="/pricing" className="app-nav__link">
                    상품안내
                  </Link>
                  <Link href="/process" className="app-nav__link">
                    제작 과정
                  </Link>
                  <Link href="/trial" className="app-nav__link">
                    제작 사례
                  </Link>
                  <Link href="/dashboard/book" className="app-nav__link">
                    신청하기
                  </Link>
                </>
              ) : null}

              {isLoggedIn ? (
                <>
                  {isAdmin ? (
                    <Link href="/admin" className="app-nav__button">
                      관리자
                    </Link>
                  ) : null}

                  <Link href="/dashboard" className="app-nav__button">
                    내 책장
                  </Link>

                  <form
                    action={async () => {
                      'use server';
                      await signOut({ redirectTo: '/' });
                    }}
                  >
                    <button type="submit" className="app-nav__button">
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="app-nav__button app-nav__button--dark">
                  로그인
                </Link>
              )}
            </nav>

            <details className="mobile-menu">
              <summary className="mobile-menu__button">
                <span>메뉴</span>
                <strong>☰</strong>
              </summary>

              <div className="mobile-menu__panel">
                <Link href="/" className="mobile-menu__link">
                  홈
                </Link>

                <Link href="/guide" className="mobile-menu__link">
                  이용 가이드
                </Link>

                <Link href="/dashboard/book" className="mobile-menu__link">
                  인생책 만들기
                </Link>

                {isLoggedIn ? (
                  <>
                    <Link href="/dashboard" className="mobile-menu__link">
                      내 작업실
                    </Link>

                    <Link href="/dashboard/library" className="mobile-menu__link">
                      내 책장
                    </Link>

                    <Link href="/dashboard/interview" className="mobile-menu__link">
                      사진·이야기
                    </Link>

                    {isAdmin ? (
                      <Link href="/admin" className="mobile-menu__link">
                        관리자
                      </Link>
                    ) : null}

                    <form
                      action={async () => {
                        'use server';
                        await signOut({ redirectTo: '/' });
                      }}
                    >
                      <button type="submit" className="mobile-menu__logout">
                        로그아웃
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/pricing" className="mobile-menu__link">
                      상품안내
                    </Link>

                    <Link href="/process" className="mobile-menu__link">
                      제작 과정
                    </Link>

                    <Link href="/trial" className="mobile-menu__link">
                      제작 사례
                    </Link>

                    <Link href="/login" className="mobile-menu__login">
                      로그인
                    </Link>
                  </>
                )}
              </div>
            </details>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}