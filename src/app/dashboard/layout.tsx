// src/app/dashboard/layout.tsx
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: '내 서재 홈' },
  { href: '/dashboard/timeline', label: 'Memory Timeline' },
  { href: '/dashboard/library', label: 'Life Library' },
  { href: '/dashboard/family', label: 'Family Space' },
  { href: '/dashboard/interview', label: 'AI Interview' },
  { href: '/dashboard/capsule', label: '⏰ Time Capsule' },
  { href: '/dashboard/movie', label: '🎬 AI Movie' },
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
    <div className="dash-shell dash-layout">
      <aside className="dash-sidebar">
        <p className="dash-sidebar__label">대시보드</p>
        <nav className="dash-sidebar__nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="dash-sidebar__link">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="dash-content">{children}</div>
    </div>
  );
}
