// src/app/admin/layout.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/users', label: '회원 관리' },
  { href: '/admin/inquiries', label: '가족 공간 관리' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
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
        gridTemplateColumns: '220px 1fr',
        minHeight: '100vh',
      }}
    >
      <aside
        style={{
          borderRight: '1px solid rgba(34,28,22,.1)',
          padding: '32px 20px',
          background: 'var(--paper-shade)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '.1em',
            color: 'var(--wine)',
            marginBottom: 20,
          }}
        >
          ADMIN
        </p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontSize: 14,
                color: 'var(--ink-soft)',
                padding: '9px 10px',
                borderRadius: 2,
                display: 'block',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: '1px solid rgba(34,28,22,.1)',
          }}
        >
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--ink-faint)' }}>
            ← 내 서재로
          </Link>
        </div>
      </aside>

      <div style={{ padding: 'clamp(32px,4vw,56px)' }}>{children}</div>
    </div>
  );
}