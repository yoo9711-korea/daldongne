import { auth } from "@/auth";
import DashboardPrimaryNavigation from "@/components/dashboard/DashboardPrimaryNavigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

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

        <DashboardPrimaryNavigation />

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

  .easy-dashboard-primary-link[data-active='true'] {
    border-color: #eaa38b;
    color: #3f2a22;
    background:
      linear-gradient(
        135deg,
        #fff0e8,
        #fff8f3
      );
    box-shadow:
      0 8px 20px
      rgba(191, 91, 62, 0.11);
  }

  .easy-dashboard-primary-link[data-active='true']
  .easy-dashboard-menu-icon {
    color: #ffffff;
    background: #e27055;
    box-shadow:
      0 5px 12px
      rgba(196, 89, 62, 0.2);
  }

  .easy-dashboard-primary-link[data-active='true']
  .easy-dashboard-menu-label small {
    color: #b7543f;
  }

  .easy-dashboard-primary-link[data-active='true']
  .easy-dashboard-menu-arrow {
    color: #d6634b;
    font-size: 9px;
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
