import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

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

const headerStyle: CSSProperties = {
  width: '100%',
  position: 'sticky',
  top: 0,
  zIndex: 9999,
  background: '#f7efe0',
  borderBottom: '1px solid #e2d4bb',
};

const innerStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1500,
  minHeight: 74,
  margin: '0 auto',
  padding: '10px 30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  boxSizing: 'border-box',
};

const brandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexShrink: 0,
  color: '#2d1a0b',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const brandNameStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  color: '#2d1a0b',
  fontSize: 22,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: '-0.06em',
  whiteSpace: 'nowrap',
};

const brandDescStyle: CSSProperties = {
  display: 'inline-block',
  width: 170,
  color: '#a56518',
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.35,
  letterSpacing: '0.08em',
  wordBreak: 'keep-all',
};

const navStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 18,
  overflowX: 'auto',
  overflowY: 'hidden',
  whiteSpace: 'nowrap',
};

const linkStyle: CSSProperties = {
  height: 40,
  padding: '0 8px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: '#3a2414',
  fontSize: 15,
  fontWeight: 750,
  lineHeight: 1,
  letterSpacing: '-0.04em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all',
};

const buttonStyle: CSSProperties = {
  minWidth: 86,
  height: 44,
  padding: '0 18px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  border: '1px solid #cdbb9c',
  borderRadius: 4,
  background: '#fff8eb',
  color: '#2d1a0b',
  fontSize: 15,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: '-0.04em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all',
  cursor: 'pointer',
};

const darkButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: '#2d1a0b',
  color: '#fffaf0',
  borderColor: '#2d1a0b',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
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
        <div role="banner" style={headerStyle}>
          <div style={innerStyle}>
            <Link href="/" style={brandStyle}>
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

              <span style={brandNameStyle}>달동네 출판사</span>

              <small style={brandDescStyle}>
                가치있는 삶의 인생책 제작 서비스
              </small>
            </Link>

            <nav aria-label="상단 메뉴" style={navStyle}>
              <Link href="/" style={linkStyle}>
                홈
              </Link>

              <Link href="/guide" style={linkStyle}>
                이용 가이드
              </Link>

              <Link href="/dashboard/book" style={linkStyle}>
                인생책 만들기
              </Link>

              <Link href="/pricing" style={linkStyle}>
                상품안내
              </Link>

              <Link href="/process" style={linkStyle}>
                제작 과정
              </Link>

              <Link href="/trial" style={linkStyle}>
                제작 사례
              </Link>

              <Link href="/dashboard/book" style={linkStyle}>
                신청하기
              </Link>

              {isLoggedIn ? (
                <>
                  {isAdmin ? (
                    <Link href="/admin" style={buttonStyle}>
                      관리자
                    </Link>
                  ) : null}

                  <Link href="/dashboard/library" style={buttonStyle}>
                    내 책장
                  </Link>

                  <form
                    action={async () => {
                      'use server';
                      await signOut({ redirectTo: '/' });
                    }}
                    style={{
                      margin: 0,
                      padding: 0,
                      display: 'inline-flex',
                      flexShrink: 0,
                    }}
                  >
                    <button type="submit" style={buttonStyle}>
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" style={darkButtonStyle}>
                  로그인
                </Link>
              )}
            </nav>
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}