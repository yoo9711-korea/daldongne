import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { auth, signOut } from '@/auth';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import './globals.css';

export const metadata: Metadata = {
  title: '달동네 스토리 — 삶의 인생책 제작 서비스',
  description: '사진과 글을 모아, 가족의 삶을 한 권의 책으로 만들어드립니다.',
  applicationName: '달동네',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: '달동네',
    statusBarStyle: 'default',
  },
  icons: {
  icon: [
    {
      url: '/brand/favicon-32.png',
      sizes: '32x32',
      type: 'image/png',
    },
    {
      url: '/app/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
  ],
  apple: [
    {
      url: '/brand/favicon-180.png',
      sizes: '180x180',
      type: 'image/png',
    },
  ],
},
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ff8f7d',
};

const headerStyle: CSSProperties = {
  width: '100%',
  position: 'sticky',
  top: 0,
  zIndex: 9999,
  background: 'rgba(255, 252, 247, 0.96)',
  borderBottom: '1px solid #f3c5b8',
  boxShadow: '0 7px 24px rgba(137, 91, 72, 0.08)',
  backdropFilter: 'blur(16px) saturate(135%)',
  WebkitBackdropFilter: 'blur(16px) saturate(135%)',
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
  color: '#553a31',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const brandNameStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  color: '#553a31',
  fontSize: 22,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: '-0.06em',
  whiteSpace: 'nowrap',
};

const brandDescStyle: CSSProperties = {
  display: 'inline-block',
  width: 170,
  color: '#df786b',
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
  height: 44,
  padding: '0 11px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: '#553a31',
  fontSize: 16,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: '-0.03em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all',
  textShadow: '0 1px 0 rgba(255,255,255,0.7)',
};

const buttonStyle: CSSProperties = {
  minWidth: 90,
  height: 46,
  padding: '0 20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  border: '1px solid #9f7952',
  borderRadius: 999,
  background: '#fffaf0',
  color: '#24150a',
  fontSize: 16,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: '-0.03em',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  wordBreak: 'keep-all',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(70, 38, 12, 0.12)',
};

const darkButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: '#2d1a0b',
  color: '#ffffff',
  borderColor: '#2d1a0b',
  boxShadow: '0 5px 14px rgba(45, 26, 11, 0.24)',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';
  const bookHref = isLoggedIn
  ? '/dashboard/book'
  : '/login?callbackUrl=/dashboard/book';

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
        />
      </head>

      <body>
        <ServiceWorkerRegister />
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

              <div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 0,
    lineHeight: 1.15,
  }}
>
  <span style={brandNameStyle}>
    달동네 스토리북
  </span>

  <small
    style={{
      ...brandDescStyle,
      display: 'block',
      marginLeft: 0,
      marginTop: 4,
    }}
  >
    가치있는 삶의 인생책
  </small>
</div>
            </Link>

            <nav aria-label="상단 메뉴" style={navStyle}>
              <Link href="/" style={linkStyle}>
                홈
              </Link>

              <Link href="/guide" style={linkStyle}>
                이용 가이드
              </Link>

              <Link href={bookHref} style={linkStyle}>
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

              <Link href={bookHref} style={linkStyle}>
                인생책 만들기
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

        <footer
          style={{
  padding: '38px 20px 46px',
  borderTop: '1px solid #f3c5b8',
  background:
    'linear-gradient(180deg, #fffaf5 0%, #fff0e8 100%)',
  color: '#755d54',
}}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 1500,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            <p style={{ margin: 0 }}>
              © 달동네 스토리. 사진과 이야기를 모아 삶의 기록을 만듭니다.
            </p>

            <nav
              aria-label="하단 정책 메뉴"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
                           <Link
                href="/terms"
                style={{
                  color: '#d76359',
                  fontWeight: 900,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                이용약관
              </Link>

              <span style={{ color: '#e2a99b' }}>|</span>

              <Link
                href="/privacy"
                style={{
                  color: '#d76359',
                  fontWeight: 900,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                개인정보처리방침
              </Link>

              <span style={{ color: '#e2a99b' }}>|</span>

              <Link
                href="/data-deletion"
                style={{
                  color: '#d76359',
                  fontWeight: 900,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                데이터 삭제 요청
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}