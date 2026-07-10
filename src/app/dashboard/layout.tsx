import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const menuItems = [
  { href: '/dashboard', label: '내 작업실' },
  { href: '/dashboard/timeline', label: '사진 모으기' },
  { href: '/dashboard/interview', label: '이야기 남기기' },
  { href: '/dashboard/book', label: '책 원고 만들기' },
  { href: '/dashboard/library', label: '내 책장' },
  { href: '/dashboard/family', label: '가족 공간' },
  { href: '/dashboard/movie', label: '추억 영상' },
  { href: '/dashboard/capsule', label: '미래 편지함' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '210px minmax(0, 1fr)',
        background: '#f7eddc',
        color: '#24170f',
      }}
    >
      <aside
        style={{
          minHeight: '100vh',
          padding: '28px 16px',
          borderRight: '1px solid #e3cfaa',
          background: '#fff5e3',
          position: 'sticky',
          top: 0,
          alignSelf: 'start',
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'block',
            marginBottom: 30,
            textDecoration: 'none',
            color: '#24170f',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 900,
              color: '#b6842c',
              letterSpacing: '0.08em',
            }}
          >
            DALDONGNE
          </p>
          <h1
            style={{
              margin: '6px 0 0',
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 22,
              lineHeight: 1.25,
              letterSpacing: '-0.05em',
            }}
          >
            달동네
            <br />
            출판사
          </h1>
        </Link>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 43,
                padding: '0 14px',
                borderRadius: 14,
                textDecoration: 'none',
                color: '#5a3a18',
                background: '#fffaf0',
                border: '1px solid #ead7b7',
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                boxShadow: '0 6px 14px rgba(80, 55, 20, 0.04)',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          style={{
            marginTop: 28,
            padding: 14,
            borderRadius: 18,
            background: '#f0dfc2',
            border: '1px solid #dec393',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.6,
              color: '#6b5a46',
              fontWeight: 700,
            }}
          >
            사진과 이야기를 모아
            <br />
            가족의 인생책을
            <br />
            만들어 보세요.
          </p>
        </div>
      </aside>

      <div
        style={{
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}