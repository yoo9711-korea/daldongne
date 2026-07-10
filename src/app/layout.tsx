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

const topbarStyle: CSSProperties = {
  width: '100%',
  position: 'sticky',
  top: 0,
  zIndex: 9999,
  background: '#f7efe0',
  borderBottom: '1px solid #e2d4bb',
};

const topbarInnerStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1420,
  minHeight: 68,
  margin: '0 auto',
  padding: '10px 28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 28,
  boxSizing: 'border-box',
};

const brandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexShrink: 0,
  textDecoration: 'none',
  color: '#2d1a0b',
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
  wordBreak: 'keep-all',
};

const brandDescStyle: CSSProperties = {
  display: 'inline-block',
  maxWidth: 180,
  color: '#a56518',
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.35,
  letterSpacing: '0.08em',
  wordBreak: 'keep-all',
};

const menuStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 18,
  flex: 1,
  minWidth: 0,
  overflowX: 'auto',
  overflowY: 'hidden',
  whiteSpace: 'nowrap',
};

const menuLinkStyle: CSSProperties = {
  height: 40,
  padding: '0 10px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: '#2d1a0b',
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: '-0.04em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all',
};

const menuButtonStyle: CSSProperties = {
  height: 42,
  minWidth: 92,
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
  ...menuButtonStyle,
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
        <div role="banner" style={topbarStyle}>
          <div style={topbarInnerStyle}>
            <Link href={isLoggedIn ? '/dashboard' : '/'} style={brandStyle}>
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

              {!isLoggedIn ? (
                <small style={brandDescStyle}>
                  가치있는 삶의 인생책 제작 서비스
                </small>
              ) : null}
            </Link>

            <nav aria-label="상단 메뉴" style={menuStyle}>
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" style={menuLinkStyle}>
                    내 작업실
                  </Link>

                  <Link href="/dashboard/book" style={menuLinkStyle}>
                    인생책 만들기
                  </Link>

                  <Link href="/dashboard/library" style={menuLinkStyle}>
                    내 책장
                  </Link>

                  {isAdmin ? (
                    <Link href="/admin" style={menuButtonStyle}>
                      관리자
                    </Link>
                  ) : null}

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
                    <button type="submit" style={menuButtonStyle}>
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/" style={menuLinkStyle}>
                    홈
                  </Link>

                  <Link href="/guide" style={menuLinkStyle}>
                    이용 가이드
                  </Link>

                  <Link href="/pricing" style={menuLinkStyle}>
                    상품안내
                  </Link>

                  <Link href="/process" style={menuLinkStyle}>
                    제작 과정
                  </Link>

                  <Link href="/trial" style={menuLinkStyle}>
                    제작 사례
                  </Link>

                  <Link href="/login" style={darkButtonStyle}>
                    로그인
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}