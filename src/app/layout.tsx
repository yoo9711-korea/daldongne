import type { Metadata } from 'next';
import Link from 'next/link';
import { auth, signOut } from '@/auth';
import './globals.css';

export const metadata: Metadata = {
  title: '달동네 출판사 — 삶의 인생책 제작 서비스',
  description: '사진과 글을 모아, 가족의 삶을 한 권의 책으로 만들어드립니다.',
};

const navLinkStyle: React.CSSProperties = {
  color: '#3a2414',
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '-0.04em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all',
};

const headerButtonStyle: React.CSSProperties = {
  minWidth: 78,
  height: 42,
  padding: '0 16px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #cdbb9c',
  borderRadius: 3,
  background: '#f9f1e3',
  color: '#2d1a0b',
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: '-0.04em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all',
  cursor: 'pointer',
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
                <header
          style={{
            width: '100%',
            borderBottom: '1px solid #e6dcc8',
            background: '#f7efe0',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              minHeight: 74,
              padding: '10px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 300,
                flexShrink: 0,
                textDecoration: 'none',
                color: '#2d1a0b',
                wordBreak: 'keep-all',
                whiteSpace: 'nowrap',
              }}
            >
              <img
                src="/brand/icon-mark.png"
                alt=""
                width={42}
                height={42}
                style={{
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                }}
              />

              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  lineHeight: 1.05,
                  letterSpacing: '-0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                달동네 출판사
              </span>

              <small
                style={{
                  display: 'inline-block',
                  fontSize: 13,
                  fontWeight: 800,
                  lineHeight: 1.35,
                  letterSpacing: '0.08em',
                  color: '#a56518',
                  whiteSpace: 'normal',
                  wordBreak: 'keep-all',
                  maxWidth: 150,
                }}
              >
                가치있는 삶의 인생책 제작 서비스
              </small>
            </Link>

            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 18,
                flex: 1,
                minWidth: 0,
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <Link href="/" style={navLinkStyle}>
                  홈
                </Link>
                <Link href="/guide" style={navLinkStyle}>
                  이용 가이드
                </Link>
                <Link href="/dashboard/book" style={navLinkStyle}>
                  인생책 만들기
                </Link>
                <Link href="/pricing" style={navLinkStyle}>
                  상품안내
                </Link>
                <Link href="/process" style={navLinkStyle}>
                  제작 과정
                </Link>
                <Link href="/trial" style={navLinkStyle}>
                  제작 사례
                </Link>
                <Link href="/dashboard/book" style={navLinkStyle}>
                  신청하기
                </Link>
              </div>

              {session?.user ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {(session.user as { role?: string }).role === 'ADMIN' ? (
                    <Link href="/admin" style={headerButtonStyle}>
                      관리자
                    </Link>
                  ) : null}

                  <Link href="/dashboard" style={headerButtonStyle}>
                    내 책장
                  </Link>

                  <form
                    action={async () => {
                      'use server';
                      await signOut({ redirectTo: '/' });
                    }}
                    style={{ margin: 0 }}
                  >
                    <button type="submit" style={headerButtonStyle}>
                      로그아웃
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  style={{
                    ...headerButtonStyle,
                    background: '#2d1a0b',
                    color: '#fffaf0',
                    borderColor: '#2d1a0b',
                  }}
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