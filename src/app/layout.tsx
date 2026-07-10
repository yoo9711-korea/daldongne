import type { Metadata } from 'next';
import Link from 'next/link';
import { auth, signOut } from '@/auth';
import './globals.css';

export const metadata: Metadata = {
  title: '달동네 출판사 — 삶의 인생책 제작 서비스',
  description: '사진과 글을 모아, 가족의 삶을 한 권의 책으로 만들어드립니다.',
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
            <Link href="/" className="brand" style={{ marginLeft: '-24px' }}>
              <img
                src="/brand/icon-mark.png"
                alt=""
                className="brand__icon"
                width={37}
                height={37}
                style={{ width: 37, height: 37 }}
              />

              <span style={{ fontSize: '115%', lineHeight: 1 }}>
                달동네 출판사
              </span>

              <small
                style={{
                  fontSize: '80%',
                  fontWeight: 800,
                  lineHeight: 1.25,
                  display: 'inline-block',
                }}
              >
                가치있는 삶의
                <br />
                인생책 제작 서비스
              </small>
            </Link>

            <nav className="site-nav">
           
            <div className="site-nav__links">
               <Link href="/">홈</Link>
               <Link href="/guide">이용 가이드</Link>
               <Link href="/dashboard/book">인생책 만들기</Link>
               <Link href="/pricing">상품안내</Link>
               <Link href="/process">제작 과정</Link>
               <Link href="/trial">제작 사례</Link>
               <Link href="/dashboard/book">신청하기</Link>
            </div>

              {session?.user ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {session.user.email === process.env.ADMIN_EMAIL ? (
                    <Link
                      href="/admin"
                      className="btn btn--ghost-light"
                      style={{ padding: '9px 16px', fontSize: 13.5 }}
                    >
                      관리자
                    </Link>
                  ) : null}

                  <Link
                    href="/dashboard"
                    className="btn btn--ghost-light"
                    style={{ padding: '9px 16px', fontSize: 13.5 }}
                  >
                    내 책장
                  </Link>

                  <form
                    action={async () => {
                      'use server';
                      await signOut({ redirectTo: '/' });
                    }}
                  >
                    <button
                      type="submit"
                      className="btn btn--ghost-light"
                      style={{ padding: '9px 16px', fontSize: 13.5 }}
                    >
                      로그아웃
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn btn--gold"
                  style={{ padding: '9px 16px', fontSize: 13.5 }}
                >
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