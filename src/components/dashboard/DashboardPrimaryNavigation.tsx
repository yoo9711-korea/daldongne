"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuIconName = "home" | "photo" | "story" | "book" | "library";

const menuItems: {
  href: string;
  label: string;
  step?: string;
  icon: MenuIconName;
}[] = [
  {
    href: "/dashboard",
    label: "처음 화면",
    icon: "home",
  },
  {
    href: "/dashboard/timeline",
    label: "사진 올리기",
    step: "1",
    icon: "photo",
  },
  {
    href: "/dashboard/interview",
    label: "이야기 쓰기",
    step: "2",
    icon: "story",
  },
  {
    href: "/dashboard/book",
    label: "책 만들기",
    step: "3",
    icon: "book",
  },
  {
    href: "/dashboard/library",
    label: "내 책장·주문",
    step: "4",
    icon: "library",
  },
];

export default function DashboardPrimaryNavigation() {
  const pathname = usePathname() || "/dashboard";

  return (
    <nav
      className="easy-dashboard-primary-menu"
      aria-label="책 만들기 주요 메뉴"
    >
      {menuItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="easy-dashboard-primary-link"
            data-active={isActive ? "true" : "false"}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="easy-dashboard-menu-icon" aria-hidden="true">
              <MenuIcon name={item.icon} />
            </span>

            <span className="easy-dashboard-menu-label">
              {item.step ? <small>{item.step}단계</small> : null}
              <strong>{item.label}</strong>
            </span>

            <span className="easy-dashboard-menu-arrow" aria-hidden="true">
              {isActive ? "●" : "→"}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function MenuIcon({ name }: { name: MenuIconName }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 28 28" fill="none">
        <path
          d="m4 12 10-8 10 8v11H4V12Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M11 23v-7h6v7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "photo") {
    return (
      <svg viewBox="0 0 28 28" fill="none">
        <rect
          x="3.5"
          y="6"
          width="21"
          height="17"
          rx="3"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="10" cy="12" r="2.3" stroke="currentColor" strokeWidth="2" />
        <path
          d="m5.5 20 5-4 3.2 2.5 4.2-4 4.6 5.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "story") {
    return (
      <svg viewBox="0 0 28 28" fill="none">
        <path
          d="M6 4h13a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="m10 18 .8-3.2 6.7-6.7 2.4 2.4-6.7 6.7L10 18Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M7 21h9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "book") {
    return (
      <svg viewBox="0 0 28 28" fill="none">
        <path
          d="M3.5 6.5c4-.8 7.6.2 10.5 3v14c-2.9-2.8-6.5-3.8-10.5-3V6.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M24.5 6.5c-4-.8-7.6.2-10.5 3v14c2.9-2.8 6.5-3.8 10.5-3V6.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 28 28" fill="none">
      <path
        d="M4 5.5h7.5A2.5 2.5 0 0 1 14 8v15H6.5A2.5 2.5 0 0 1 4 20.5v-15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M24 5.5h-7.5A2.5 2.5 0 0 0 14 8v15h7.5a2.5 2.5 0 0 0 2.5-2.5v-15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 10h3M17 10h3M8 14h3M17 14h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
