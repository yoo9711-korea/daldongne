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
              <img src="/brand/icon-mark.png" alt="" className="brand__icon" width={32} height={32} />
              달동네 출판사<small>DAL-DONG-NE PUBLISHING</small>
            </Link>
            <nav className="site-nav">
              <div className="site-nav__links">
                <Link href="/about">소개</Link>
                <Link href="/products">작품</Link>
                <Link href="/process">출판 과정</Link>
                <Link href="/compare">다른 점</Link>
                <Link href="/trial">체험하기</Link>
                <Link href="/pricing">가격</Link>
              </div>
             {session?.user ? (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    {session.user.email === process.env.ADMIN_EMAIL && (
      <Link href="/admin" className="btn btn--ghost-light" style={{ padding: '9px 16px', fontSize: 13.5 }}>
        관리자
      </Link>
    )}
    <Link href="/dashboard" className="btn btn--ghost-light" style={{ padding: '9px 16px', fontSize: 13.5 }}>
      내 서재
    </Link>
    <form action={async () => {
      'use server';
      await signOut({ redirectTo: '/' });
    }}>
      <button type="submit" className="btn btn--ghost-light" style={{ padding: '9px 16px', fontSize: 13.5 }}>
        로그아웃
      </button>
    </form>
  </div>
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

