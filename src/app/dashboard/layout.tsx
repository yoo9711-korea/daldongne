import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

type MenuIconName = "home" | "photo" | "story" | "book" | "library";

const primaryMenuItems: {
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

const secondaryMenuItems = [
  {
    href: "/dashboard/applications",
    label: "상품 신청 내역",
  },
  {
    href: "/dashboard/family",
    label: "함께 쓰는 공간",
  },
  {
    href: "/dashboard/account",
    label: "내 정보",
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="easy-dashboard-shell">
      <aside className="easy-dashboard-sidebar">
        <Link href="/dashboard" className="easy-dashboard-brand">
          <span className="easy-dashboard-brand-mark" aria-hidden="true">
            <BrandIcon />
          </span>

          <span>
            <strong>달동네</strong>
            <small>사진에서 책까지</small>
          </span>
        </Link>

        <div className="easy-dashboard-guide">
          <strong>어디서 시작할까요?</strong>
          <span>1번부터 차례대로 누르면 됩니다.</span>
        </div>

        <nav
          className="easy-dashboard-primary-menu"
          aria-label="책 만들기 주요 메뉴"
        >
          {primaryMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="easy-dashboard-primary-link"
            >
              <span className="easy-dashboard-menu-icon" aria-hidden="true">
                <MenuIcon name={item.icon} />
              </span>

              <span className="easy-dashboard-menu-label">
                {item.step ? <small>{item.step}단계</small> : null}
                <strong>{item.label}</strong>
              </span>

              <span className="easy-dashboard-menu-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </nav>

        <div className="easy-dashboard-divider" />

        <nav className="easy-dashboard-secondary-menu" aria-label="기타 메뉴">
          {secondaryMenuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
              <span aria-hidden="true">→</span>
            </Link>
          ))}

          <Link href="/">
            홈페이지
            <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </aside>

      <div className="easy-dashboard-content">{children}</div>

      <style
        dangerouslySetInnerHTML={{
          __html: dashboardLayoutStyles,
        }}
      />
    </div>
  );
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none">
      <path
        d="M8 17.5 20 7l12 10.5V33H8V17.5Z"
        fill="currentColor"
        opacity=".16"
      />
      <path
        d="M8 17.5 20 7l12 10.5M11 15v18h18V15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 33V23h8v10M15 19h.01M25 19h.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

const dashboardLayoutStyles = `
  .easy-dashboard-shell,
  .easy-dashboard-shell * {
    box-sizing: border-box;
  }

  .easy-dashboard-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 224px minmax(0, 1fr);
    color: #47362e;
    background:
      radial-gradient(circle at 90% 5%, rgba(255, 224, 209, 0.36), transparent 25rem),
      linear-gradient(180deg, #fffdfb 0%, #fff9f4 100%);
    font-family: var(--font-body, "NanumSquareNeo"), "Noto Sans KR", sans-serif;
  }

  .easy-dashboard-sidebar {
    min-height: 100vh;
    padding: 22px 16px 20px;
    position: sticky;
    top: 0;
    align-self: start;
    overflow-y: auto;
    border-right: 1px solid #f0ddd3;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 8px 0 30px rgba(116, 75, 54, 0.045);
  }

  .easy-dashboard-brand {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 4px 5px 18px;
    color: #4a342b;
    text-decoration: none;
  }

  .easy-dashboard-brand-mark {
    width: 42px;
    height: 42px;
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 14px;
    color: #dc7258;
    background: #fff0e9;
  }

  .easy-dashboard-brand-mark svg {
    width: 30px;
    height: 30px;
  }

  .easy-dashboard-brand strong,
  .easy-dashboard-brand small {
    display: block;
  }

  .easy-dashboard-brand strong {
    font-family: var(--font-display, "MaruBuri"), "Noto Serif KR", serif;
    font-size: 22px;
    line-height: 1.15;
    letter-spacing: -0.04em;
  }

  .easy-dashboard-brand small {
    margin-top: 4px;
    color: #9a7a6c;
    font-size: 11px;
    font-weight: 700;
  }

  .easy-dashboard-guide {
    margin-bottom: 12px;
    padding: 13px 14px;
    border-radius: 15px;
    color: #765a4d;
    background: #fff8f3;
  }

  .easy-dashboard-guide strong,
  .easy-dashboard-guide span {
    display: block;
  }

  .easy-dashboard-guide strong {
    font-size: 12px;
    font-weight: 900;
  }

  .easy-dashboard-guide span {
    margin-top: 4px;
    font-size: 10px;
    line-height: 1.5;
  }

  .easy-dashboard-primary-menu {
    display: grid;
    gap: 7px;
  }

  .easy-dashboard-primary-link {
    min-height: 54px;
    padding: 7px 10px;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) 16px;
    align-items: center;
    gap: 9px;
    border: 1px solid transparent;
    border-radius: 15px;
    color: #553f35;
    background: transparent;
    text-decoration: none;
    transition:
      transform 150ms ease,
      border-color 150ms ease,
      background 150ms ease;
  }

  .easy-dashboard-primary-link:hover,
  .easy-dashboard-primary-link:focus-visible {
    transform: translateX(3px);
    border-color: #f0c4b3;
    background: #fff4ee;
    outline: none;
  }

  .easy-dashboard-menu-icon {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    color: #d56f56;
    background: #fff0e9;
  }

  .easy-dashboard-menu-icon svg {
    width: 22px;
    height: 22px;
  }

  .easy-dashboard-menu-label small,
  .easy-dashboard-menu-label strong {
    display: block;
  }

  .easy-dashboard-menu-label small {
    margin-bottom: 2px;
    color: #d1785f;
    font-size: 9px;
    font-weight: 900;
  }

  .easy-dashboard-menu-label strong {
    font-size: 13px;
    line-height: 1.25;
    letter-spacing: -0.025em;
  }

  .easy-dashboard-menu-arrow {
    color: #c9aa9c;
    font-size: 13px;
  }

  .easy-dashboard-divider {
    height: 1px;
    margin: 17px 6px 12px;
    background: #f1e3dc;
  }

  .easy-dashboard-secondary-menu {
    display: grid;
  }

  .easy-dashboard-secondary-menu a {
    min-height: 38px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-radius: 11px;
    color: #81695d;
    font-size: 11px;
    font-weight: 800;
    text-decoration: none;
  }

  .easy-dashboard-secondary-menu a:hover,
  .easy-dashboard-secondary-menu a:focus-visible {
    color: #b95f48;
    background: #fff7f2;
    outline: none;
  }

  .easy-dashboard-secondary-menu a span {
    color: #cdb5a9;
  }

  .easy-dashboard-content {
    min-width: 0;
    min-height: 100vh;
  }

  .easy-dashboard-content button,
  .easy-dashboard-content input,
  .easy-dashboard-content textarea,
  .easy-dashboard-content select {
    font-family: inherit;
  }

  @media (max-width: 980px) {
    .easy-dashboard-shell {
      grid-template-columns: 202px minmax(0, 1fr);
    }

    .easy-dashboard-sidebar {
      padding-right: 12px;
      padding-left: 12px;
    }
  }

  @media (max-width: 760px) {
    .easy-dashboard-shell {
      display: block;
    }

    .easy-dashboard-sidebar {
      min-height: auto;
      padding: 12px 14px;
      position: relative;
      overflow: visible;
      border-right: 0;
      border-bottom: 1px solid #f0ddd3;
      box-shadow: 0 8px 22px rgba(116, 75, 54, 0.05);
    }

    .easy-dashboard-brand {
      padding: 0 2px 11px;
    }

    .easy-dashboard-brand-mark {
      width: 36px;
      height: 36px;
      border-radius: 12px;
    }

    .easy-dashboard-brand-mark svg {
      width: 25px;
      height: 25px;
    }

    .easy-dashboard-brand strong {
      font-size: 19px;
    }

    .easy-dashboard-guide,
    .easy-dashboard-divider,
    .easy-dashboard-secondary-menu {
      display: none;
    }

    .easy-dashboard-primary-menu {
      display: flex;
      gap: 7px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .easy-dashboard-primary-menu::-webkit-scrollbar {
      display: none;
    }

    .easy-dashboard-primary-link {
      min-width: max-content;
      min-height: 43px;
      padding: 5px 11px 5px 7px;
      grid-template-columns: 29px auto;
      gap: 7px;
      flex: 0 0 auto;
      border-color: #f2ddd3;
      background: #ffffff;
    }

    .easy-dashboard-primary-link:hover,
    .easy-dashboard-primary-link:focus-visible {
      transform: translateY(-2px);
    }

    .easy-dashboard-menu-icon {
      width: 29px;
      height: 29px;
      border-radius: 9px;
    }

    .easy-dashboard-menu-icon svg {
      width: 19px;
      height: 19px;
    }

    .easy-dashboard-menu-label small {
      display: none;
    }

    .easy-dashboard-menu-label strong {
      font-size: 11px;
    }

    .easy-dashboard-menu-arrow {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .easy-dashboard-primary-link {
      transition: none;
    }
  }
`;
