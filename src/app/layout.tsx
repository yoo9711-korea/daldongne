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
  zIndex: 999,
  borderBottom: '1px solid #e6dcc8',
  background: '#f7efe0',
};

const innerStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1180,
  minHeight: 64,
  margin: '0 auto',
  padding: '8px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  boxSizing: 'border-box',
};

const brandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
  color: '#2d1a0b',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const brandNameStyle: CSSProperties = {
  color: '#2d1a0b',
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: '-0.06em',
  whiteSpace: 'nowrap',
};

const menuStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 8,
  flex: 1,
  overflowX: 'auto',
  overflowY: 'hidden',
  whiteSpace: 'nowrap',
};

const linkStyle: CSSProperties = {
  height: 38,
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderRadius: 999,
  color: '#2d1a0b',
  fontSize: 14,
  fontWeight: 850,
  lineHeight: 1,
  letterSpacing: '-0.04em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const buttonStyle: CSSProperties = {
  ...linkStyle,
  border: '1px solid #d6c3a2',
  background: '#fff8eb',
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
        <header className="dd-safe-header" style={headerStyle}>
          <div className="dd-safe-header__inner" style={innerStyle}>
            <Link href={isLoggedIn ? '/dashboard' : '/'} style={brandStyle}>
              <img
                src="/brand/icon-mark.png"
                alt=""
                width={36}
                height={36}
                style={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                }}
              />

              <span style={brandNameStyle}>달동네 출판사</span>
            </Link>

            <div className="dd-safe-menu" style={menuStyle}>
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" style={linkStyle}>
                    내 작업실
                  </Link>

                  <Link href="/dashboard/book" style={linkStyle}>
                    인생책 만들기
                  </Link>

                  <Link href="/dashboard/library" style={linkStyle}>
                    내 책장
                  </Link>

                  {isAdmin ? (
                    <Link href="/admin" style={linkStyle}>
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
                    <button type="submit" style={buttonStyle}>
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/" style={linkStyle}>
                    홈
                  </Link>

                  <Link href="/guide" style={linkStyle}>
                    이용 가이드
                  </Link>

                  <Link href="/pricing" style={linkStyle}>
                    상품안내
                  </Link>

                  <Link href="/login" style={darkButtonStyle}>
                    로그인
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}