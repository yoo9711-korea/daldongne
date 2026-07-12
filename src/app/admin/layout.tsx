import { auth } from '@/auth';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      name: true,
      email: true,
    },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div
      className="admin-shell"
      style={{
        display: 'grid',
        gridTemplateColumns:
          'minmax(210px, 230px) minmax(0, 1fr)',
        minHeight: '100vh',
        background: 'var(--paper)',
      }}
    >
      <aside
        style={{
          position: 'sticky',
          top: 0,
          alignSelf: 'start',
          minHeight: '100vh',
          padding: '28px 18px',
          borderRight:
            '1px solid rgba(34, 28, 22, 0.1)',
          background: 'var(--paper-shade)',
        }}
      >
        <div
          style={{
            padding: '0 8px 20px',
            borderBottom:
              '1px solid rgba(34, 28, 22, 0.1)',
            marginBottom: 18,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              fontWeight: 900,
              letterSpacing: '.1em',
              color: 'var(--wine)',
            }}
          >
            DALDONGNE ADMIN
          </p>

          <h1
            style={{
              margin: '8px 0 0',
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              lineHeight: 1.4,
              color: 'var(--ink)',
            }}
          >
            관리자 페이지
          </h1>
        </div>

        <AdminNavigation />

        <div
          style={{
            marginTop: 28,
            padding: '18px 8px 0',
            borderTop:
              '1px solid rgba(34, 28, 22, 0.1)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--ink-soft)',
              wordBreak: 'break-all',
            }}
          >
            {user.name || user.email || '관리자'}
          </p>

          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              marginTop: 12,
              color: 'var(--ink-faint)',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            사용자 화면으로
          </Link>
        </div>
      </aside>

      <div
        style={{
          minWidth: 0,
          padding: 'clamp(24px, 4vw, 56px)',
        }}
      >
        {children}
      </div>
    </div>
  );
}