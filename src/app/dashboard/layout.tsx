import { auth } from "@/auth";
import DashboardPrimaryNavigation from "@/components/dashboard/DashboardPrimaryNavigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

const utilityMenuItems = [
  {
    href: "/dashboard/library",
    label: "내 책장",
  },
  {
    href: "/dashboard/orders",
    label: "주문 현황",
  },  {
    href: "/dashboard/applications",
    label: "신청 내역",
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
    <div className="storybook-dashboard-shell">
      <header className="storybook-dashboard-header">
        <div className="storybook-dashboard-header-inner">
          <Link href="/dashboard" className="storybook-dashboard-brand">
            <span className="storybook-dashboard-brand-mark" aria-hidden="true">
              <BrandIcon />
            </span>

            <span className="storybook-dashboard-brand-copy">
              <strong>달동네 스토리</strong>
              <small>사진과 이야기로 만드는 나의 책</small>
            </span>
          </Link>

          <div className="storybook-dashboard-utility">
            {utilityMenuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}

            <Link href="/" className="storybook-dashboard-home-link">
              홈페이지
            </Link>
          </div>
        </div>

        <div className="storybook-dashboard-progress-wrap">
          <div className="storybook-dashboard-progress-inner">
            <DashboardPrimaryNavigation />
          </div>
        </div>
      </header>

      <div className="storybook-dashboard-content">{children}</div>

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
    <svg viewBox="0 0 44 44" fill="none">
      <path
        d="M7.5 18.5 22 6l14.5 12.5V37H7.5V18.5Z"
        fill="currentColor"
        opacity=".14"
      />
      <path
        d="M7.5 18.5 22 6l14.5 12.5M11 16.5V37h22V16.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 37V25h10v12M16 22h.01M28 22h.01"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 38.5c5.8-2.5 11.5-2.5 17 0 5.5-2.5 11.2-2.5 17 0"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

const dashboardLayoutStyles = `
  /* DASHBOARD_MENU_FONT_SCALE_115 */
  .storybook-dashboard-shell,
  .storybook-dashboard-shell * {
    box-sizing: border-box;
  }

  .storybook-dashboard-shell {
    min-height: 100vh;
    color: #4a342b;
    background:
      radial-gradient(
        circle at 5% 5%,
        rgba(255, 224, 209, 0.44),
        transparent 24rem
      ),
      radial-gradient(
        circle at 94% 8%,
        rgba(225, 242, 234, 0.5),
        transparent 25rem
      ),
      linear-gradient(
        180deg,
        #fffdfa 0%,
        #fff9f4 100%
      );
    font-family:
      var(--font-body, "NanumSquareNeo"),
      "Noto Sans KR",
      sans-serif;
  }

  .storybook-dashboard-header {
    position: sticky;
    top: 0;
    z-index: 30;
    border-bottom:
      1px solid
      rgba(141, 96, 73, 0.13);
    background:
      rgba(255, 253, 249, 0.94);
    box-shadow:
      0 10px 30px
      rgba(112, 75, 56, 0.055);
    backdrop-filter: blur(18px);
  }

  .storybook-dashboard-header-inner {
    width:
      min(1480px, calc(100% - 48px));
    min-height: 76px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .storybook-dashboard-brand {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #4a342b;
    text-decoration: none;
  }

  .storybook-dashboard-brand-mark {
    width: 47px;
    height: 47px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 15px;
    color: #e36e56;
    background:
      linear-gradient(
        145deg,
        #fff0e8,
        #ffd9ca
      );
    box-shadow:
      0 9px 20px
      rgba(190, 87, 61, 0.12);
  }

  .storybook-dashboard-brand-mark svg {
    width: 34px;
    height: 34px;
  }

  .storybook-dashboard-brand-copy strong,
  .storybook-dashboard-brand-copy small {
    display: block;
  }

  .storybook-dashboard-brand-copy strong {
    font-family:
      var(--font-display, "MaruBuri"),
      "Noto Serif KR",
      serif;
    font-size: 22px;
    line-height: 1.2;
    letter-spacing: -0.04em;
  }

  .storybook-dashboard-brand-copy small {
    margin-top: 4px;
    color: #a07f70;
    font-size: 10px;
    font-weight: 750;
  }

  .storybook-dashboard-utility {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .storybook-dashboard-utility a {
    min-height: 38px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid
      transparent;
    border-radius: 12px;
    color: #725b50;
    font-size: 13.8px;
    font-weight: 800;
    text-decoration: none;
    transition:
      transform 150ms ease,
      border-color 150ms ease,
      background 150ms ease;
  }

  .storybook-dashboard-utility a:hover,
  .storybook-dashboard-utility a:focus-visible {
    transform: translateY(-2px);
    border-color: #efd4c8;
    background: #fff6f1;
    color: #c75b45;
    outline: none;
  }

  .storybook-dashboard-home-link {
    border-color:
      #e7c6b8 !important;
    background:
      #fffaf7 !important;
  }

  .storybook-dashboard-progress-wrap {
    border-top:
      1px solid
      rgba(141, 96, 73, 0.08);
    background:
      rgba(255, 255, 255, 0.68);
  }

  .storybook-dashboard-progress-inner {
    width:
      min(1320px, calc(100% - 48px));
    margin: 0 auto;
    padding: 10px 0 12px;
  }

  .easy-dashboard-primary-menu {
    position: relative;
    display: grid;
    grid-template-columns:
      150px
      repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .easy-dashboard-primary-link {
    position: relative;
    min-width: 0;
    min-height: 58px;
    padding: 8px 12px;
    display: grid;
    grid-template-columns:
      38px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    border:
      1px solid
      rgba(149, 101, 78, 0.11);
    border-radius: 15px;
    color: #6e594f;
    background:
      rgba(255, 255, 255, 0.78);
    text-decoration: none;
    box-shadow:
      0 6px 17px
      rgba(103, 70, 54, 0.035);
    transition:
      transform 150ms ease,
      border-color 150ms ease,
      background 150ms ease,
      box-shadow 150ms ease;
  }

  .easy-dashboard-primary-link:hover,
  .easy-dashboard-primary-link:focus-visible {
    transform: translateY(-2px);
    border-color: #edb39f;
    background: #fff7f2;
    outline: none;
  }

  .easy-dashboard-primary-link[data-active='true'] {
    border-color: #ee9d83;
    color: #3f2a22;
    background:
      linear-gradient(
        135deg,
        #fff0e8,
        #fff9f5
      );
    box-shadow:
      0 9px 23px
      rgba(191, 91, 62, 0.1);
  }

  .easy-dashboard-menu-icon {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: #d56f56;
    background: #fff0e9;
  }

  .easy-dashboard-primary-link[data-active='true']
  .easy-dashboard-menu-icon {
    color: #ffffff;
    background:
      linear-gradient(
        145deg,
        #f1846d,
        #e4664f
      );
    box-shadow:
      0 7px 15px
      rgba(196, 89, 62, 0.2);
  }

  .easy-dashboard-menu-icon svg {
    width: 23px;
    height: 23px;
  }

  .easy-dashboard-menu-label small,
  .easy-dashboard-menu-label strong {
    display: block;
  }

  .easy-dashboard-menu-label small {
    margin-bottom: 2px;
    color: #d1785f;
    font-size: 10.35px;
    font-weight: 900;
  }

  .easy-dashboard-menu-label strong {
    overflow: hidden;
    font-size: 13.8px;
    line-height: 1.3;
    letter-spacing: -0.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .easy-dashboard-primary-link[data-active='true']
  .easy-dashboard-menu-label small {
    color: #b7543f;
  }

  .easy-dashboard-menu-arrow {
    display: none;
  }

  .storybook-dashboard-content {
    min-width: 0;
    min-height:
      calc(100vh - 156px);
  }

  .storybook-dashboard-content button,
  .storybook-dashboard-content input,
  .storybook-dashboard-content textarea,
  .storybook-dashboard-content select {
    font-family: inherit;
  }

  @media (max-width: 1020px) {
    .storybook-dashboard-header-inner,
    .storybook-dashboard-progress-inner {
      width:
        min(100% - 30px, 960px);
    }

    .storybook-dashboard-utility a {
      padding: 0 10px;
      font-size: 12.65px;
    }

    .easy-dashboard-primary-menu {
      grid-template-columns:
        130px
        repeat(5, minmax(140px, 1fr));
      overflow-x: auto;
      scrollbar-width: none;
    }

    .easy-dashboard-primary-menu::-webkit-scrollbar {
      display: none;
    }

    .easy-dashboard-primary-link {
      min-width: 140px;
    }
  }

  @media (max-width: 760px) {
    .storybook-dashboard-header {
      position: relative;
    }

    .storybook-dashboard-header-inner {
      min-height: 68px;
      gap: 12px;
    }

    .storybook-dashboard-brand-mark {
      width: 40px;
      height: 40px;
      border-radius: 13px;
    }

    .storybook-dashboard-brand-mark svg {
      width: 29px;
      height: 29px;
    }

    .storybook-dashboard-brand-copy strong {
      font-size: 18px;
    }

    .storybook-dashboard-brand-copy small {
      display: none;
    }

    .storybook-dashboard-utility {
      gap: 4px;
    }

    .storybook-dashboard-utility a {
      display: none;
    }

    .storybook-dashboard-utility
    .storybook-dashboard-home-link {
      min-height: 35px;
      padding: 0 10px;
      display: inline-flex;
      font-size: 11.5px;
    }

    .storybook-dashboard-progress-inner {
      width: 100%;
      padding:
        8px 12px 10px;
    }

    .easy-dashboard-primary-menu {
      display: flex;
      gap: 7px;
      overflow-x: auto;
    }

    .easy-dashboard-primary-link {
      min-width: max-content;
      min-height: 45px;
      padding: 5px 10px 5px 7px;
      grid-template-columns: 30px auto;
      gap: 7px;
      flex: 0 0 auto;
      border-color: #f0ddd3;
      background: #ffffff;
    }

    .easy-dashboard-menu-icon {
      width: 30px;
      height: 30px;
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
      font-size: 12.65px;
    }

    .storybook-dashboard-content {
      min-height:
        calc(100vh - 122px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .easy-dashboard-primary-link,
    .storybook-dashboard-utility a {
      transition: none;
    }
  }
`;
