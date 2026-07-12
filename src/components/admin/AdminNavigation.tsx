'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/admin',
    label: '대시보드',
    exact: true,
  },
  {
    href: '/admin/users',
    label: '회원 관리',
  },
   {
    href: '/admin/families',
    label: '가족 공간 관리',
  },
  {
    href: '/admin/books',
    label: '책 관리',
  },
  {
    href: '/admin/production-requests',
    label: '제작 상담',
 },
];

export default function AdminNavigation() {
  const pathname = usePathname() || '';

  return (
    <nav
      aria-label="관리자 메뉴"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'block',
              padding: '10px 12px',
              borderRadius: 10,
              border: active
                ? '1px solid rgba(123, 55, 48, 0.22)'
                : '1px solid transparent',
              background: active
                ? 'var(--wine)'
                : 'transparent',
              color: active
                ? 'var(--cream)'
                : 'var(--ink-soft)',
              fontSize: 14,
              fontWeight: active ? 900 : 700,
              lineHeight: 1.5,
              textDecoration: 'none',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}