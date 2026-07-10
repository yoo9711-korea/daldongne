import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import { auth, signOut } from '@/auth';
import './globals.css';

export const metadata: Metadata = {
  title: '달동네 출판사 — 삶의 인생책 제작 서비스',
  description: '사진과 글을 모아, 가족의 삶을 한 권의 책으로 만들어드립니다.',
};

const navLinkStyle: CSSProperties = {
  color: '#3a2414',
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '-0.04em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all',
};

const headerButtonStyle: CSSProperties = {
  minWidth: 76,
  height: 40,
  padding: '0 14px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #cdbb9c',
  borderRadius: 4,
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
              minHeight: 72,
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
            }}
          >
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: session?.user ? 230 : 300,
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
                width={40}
                height={40}
                style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                }}
              />

              <span
                style={{
                  fontSize: 21,
                  fontWeight: 900,
                  lineHeight: 1.05,
                  letterSpacing: '-0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                달동네 출판사
              </span>

              {!session?.user ? (
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
              ) : null}
            </Link>

            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: session?.user ? 14 : 18,
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
                  gap: session?.user ? 18 : 22,
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

                {!session?.user ? (
                  <>
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
                  </>
                ) : null}
              </div>

              {session?.user ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isAdmin ? (
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