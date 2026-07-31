import Link from 'next/link';
import { signOut } from '@/auth';

export type StorybookNavKey =
  | 'home'
  | 'about'
  | 'pricing'
  | 'process'
  | 'trial'
  | 'reviews'
  | 'guide'
  | 'contact';

type StorybookPublicHeaderProps = {
  activeKey?: StorybookNavKey;
  ctaHref: string;
};

const NAV_ITEMS: ReadonlyArray<{
  key: StorybookNavKey;
  href: string;
  label: string;
}> = [
  {
    key: 'home',
    href: '/',
    label: '홈',
  },
  {
    key: 'process',
    href: '/process',
    label: '제작과정',
  },
  {
    key: 'guide',
    href: '/guide',
    label: '이용안내',
  },
  {
    key: 'reviews',
    href: '/reviews',
    label: '이용후기',
  },
  {
    key: 'contact',
    href: '/guide#contact',
    label: '문의하기',
  },
  {
    key: 'pricing',
    href: '/pricing',
    label: '상품안내',
  },
];
const styles = `
  body:has(.storybook-public-page) > [role='banner'],
  body:has(.storybook-public-page) > footer {
    display: none !important;
  }

  .storybook-public-header,
  .storybook-public-header * {
    box-sizing: border-box;
  }

  .storybook-public-header {
    position: sticky;
    top: 0;
    z-index: 10000;
    width: 100%;
    border-bottom: 1px solid rgba(111, 76, 56, 0.1);
    background: rgba(255, 253, 249, 0.96);
    box-shadow: 0 5px 18px rgba(91, 59, 40, 0.04);
    backdrop-filter: blur(16px) saturate(135%);
    -webkit-backdrop-filter: blur(16px) saturate(135%);
  }

  .storybook-public-header-inner {
    width: min(1480px, 100%);
    min-height: 74px;
    margin: 0 auto;
    padding: 10px clamp(22px, 3.2vw, 48px);
    display: grid;
    grid-template-columns:
      minmax(245px, 0.75fr)
      minmax(620px, 1.65fr)
      minmax(170px, 0.45fr);
    align-items: center;
    gap: 24px;
  }

  .storybook-public-brand {
    display: inline-flex;
    width: max-content;
    align-items: center;
    gap: 10px;
    color: #4a3024 !important;
    text-decoration: none;
  }

  .storybook-public-brand-mark {
    width: 33px;
    height: 37px;
    flex: 0 0 auto;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.75;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .storybook-public-brand-name {
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-size: 31px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: 0.015em;
    white-space: nowrap;
  }

  .storybook-public-brand-heart {
    margin-left: 1px;
    color: #ee806a;
    font-family: Arial, sans-serif;
    font-size: 27px;
    line-height: 1;
  }

  .storybook-public-nav {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(21px, 2.1vw, 38px);
    white-space: nowrap;
  }

  .storybook-public-nav-link {
    position: relative;
    display: inline-flex;
    min-height: 43px;
    align-items: center;
    justify-content: center;
    padding: 0 1px;
    color: #49352b !important;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
  }

  .storybook-public-nav-link::after {
    position: absolute;
    right: 0;
    bottom: 3px;
    left: 0;
    height: 2px;
    border-radius: 999px;
    content: '';
    background: #e97962;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 170ms ease;
  }

  .storybook-public-nav-link:hover::after,
  .storybook-public-nav-link:focus-visible::after,
  .storybook-public-nav-link.is-active::after {
    transform: scaleX(1);
  }

  .storybook-public-nav-link.is-active {
    color: #d96852 !important;
  }

  .storybook-public-cta {
    display: inline-flex;
    min-height: 47px;
    align-items: center;
    justify-content: center;
    justify-self: end;
    padding: 0 25px;
    border: 1px solid #e97760;
    border-radius: 999px;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ef8b71,
        #e56f57
      );
    box-shadow:
      0 10px 24px
      rgba(214, 101, 77, 0.18);
    font-size: 14px;
    font-weight: 900;
    text-decoration: none;
    white-space: nowrap;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease;
  }

  .storybook-public-cta:hover,
  .storybook-public-cta:focus-visible {
    transform: translateY(-2px);
    box-shadow:
      0 14px 29px
      rgba(214, 101, 77, 0.24);
  }

  .storybook-public-mobile-nav {
    display: none;
  }

  @media (max-width: 1180px) {
    .storybook-public-header-inner {
      grid-template-columns:
        minmax(220px, 0.65fr)
        minmax(530px, 1.35fr)
        minmax(150px, 0.4fr);
      gap: 16px;
      padding-right: 24px;
      padding-left: 24px;
    }

    .storybook-public-nav {
      gap: 20px;
    }

    .storybook-public-nav-link {
      font-size: 13px;
    }

    .storybook-public-cta {
      min-height: 44px;
      padding-right: 20px;
      padding-left: 20px;
      font-size: 13px;
    }
  }

  @media (max-width: 1240px) {
    .storybook-public-header-inner {
      min-height: 66px;
      padding: 9px 17px;
      display: flex;
      justify-content: space-between;
      gap: 14px;
    }

    .storybook-public-brand-name {
      font-size: 27px;
    }

    .storybook-public-brand-mark {
      width: 29px;
      height: 32px;
    }

    .storybook-public-brand-heart {
      font-size: 23px;
    }

    .storybook-public-nav {
      display: none;
    }

    .storybook-public-cta {
      min-height: 42px;
      padding: 0 18px;
    }

    .storybook-public-mobile-nav {
      display: flex;
      width: 100%;
      min-height: 44px;
      align-items: center;
      gap: 23px;
      padding: 0 17px;
      overflow-x: auto;
      border-top:
        1px solid
        rgba(111, 76, 56, 0.08);
      scrollbar-width: none;
    }

    .storybook-public-mobile-nav::-webkit-scrollbar {
      display: none;
    }

    .storybook-public-mobile-nav
      .storybook-public-nav-link {
      min-height: 43px;
      flex: 0 0 auto;
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    .storybook-public-header-inner {
      min-height: 62px;
    }

    .storybook-public-brand {
      gap: 7px;
    }

    .storybook-public-brand-name {
      font-size: 23px;
    }

    .storybook-public-brand-mark {
      width: 26px;
      height: 29px;
    }

    .storybook-public-brand-heart {
      font-size: 20px;
    }

    .storybook-public-cta {
      min-height: 39px;
      padding: 0 14px;
      font-size: 12px;
    }
  }
  /* 로그인·스토리 만들기 버튼 영역 */
  .storybook-public-header-actions {
    min-width: max-content;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    justify-self: end;
    gap: 10px;
  }

  .storybook-public-login {
    display: inline-flex;
    min-height: 45px;
    padding: 0 20px;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(217, 104, 82, 0.48);
    border-radius: 999px;
    color: #c85f49 !important;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 7px 18px rgba(137, 79, 58, 0.08);
    font-size: 13px;
    font-weight: 800;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
    transition:
      transform 160ms ease,
      background 160ms ease,
      box-shadow 160ms ease;
  }

  .storybook-public-login:hover,
  .storybook-public-login:focus-visible {
    transform: translateY(-2px);
    background: #fff6f2;
    box-shadow: 0 10px 22px rgba(137, 79, 58, 0.13);
  }

  /* 오른쪽 버튼 두 개가 들어갈 공간 확보 */
  @media (min-width: 1241px) {
    .storybook-public-header-inner {
      grid-template-columns:
        minmax(245px, 0.75fr)
        minmax(560px, 1.5fr)
        minmax(315px, 0.65fr);
      gap: 20px;
    }
  }

  @media (max-width: 1240px) {
    .storybook-public-header-actions {
      margin-left: auto;
      gap: 8px;
    }

    .storybook-public-login {
      min-height: 42px;
      padding: 0 17px;
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .storybook-public-header-inner {
      padding-right: 10px;
      padding-left: 10px;
      gap: 8px;
    }

    .storybook-public-brand-name {
      font-size: 20px;
    }

    .storybook-public-brand-heart {
      display: none;
    }

    .storybook-public-header-actions {
      gap: 6px;
    }

    .storybook-public-login {
      min-height: 37px;
      padding: 0 12px;
      font-size: 11px;
    }

    .storybook-public-cta {
      min-height: 37px;
      padding: 0 11px;
      font-size: 11px;
    }
  }


  /* UNIFIED_PUBLIC_HEADER_20260801 */

  .storybook-public-nav {
    gap: 8px;
  }

  .storybook-public-nav-link {
    min-height: 38px;
    padding: 0 14px;
    border: 1px solid #ead8cd;
    border-radius: 999px;
    background: #fffaf5;
    box-shadow: none;
    color: #4a352a !important;
    font-size: 14px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
    text-decoration: none;
    transition:
      border-color 160ms ease,
      background-color 160ms ease,
      color 160ms ease,
      transform 160ms ease;
  }

  .storybook-public-nav-link::after {
    display: none;
    content: none;
  }

  .storybook-public-nav-link:hover,
  .storybook-public-nav-link:focus-visible {
    border-color: #e5b6a7;
    background: #fff3ee;
    color: #c45e49 !important;
    transform: translateY(-1px);
  }

  .storybook-public-nav-link.is-active {
    border-color: #e7b3a4;
    background: #fff0ea;
    color: #df654f !important;
  }

  .storybook-public-header-actions {
    gap: 8px;
  }

  .storybook-public-logout-form {
    margin: 0;
    padding: 0;
    display: inline-flex;
  }

  .storybook-public-login,
  .storybook-public-logout {
    min-height: 42px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e7b3a4;
    border-radius: 999px;
    background: #fffaf5;
    box-shadow: none;
    color: #b75b47 !important;
    font-family: inherit;
    font-size: 14px;
    font-weight: 800;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
  }

  .storybook-public-logout {
    cursor: pointer;
  }

  .storybook-public-login:hover,
  .storybook-public-login:focus-visible,
  .storybook-public-logout:hover,
  .storybook-public-logout:focus-visible {
    background: #fff0ea;
  }

  @media (max-width: 930px) {
    .storybook-public-mobile-nav {
      gap: 8px;
    }

    .storybook-public-mobile-nav
      .storybook-public-nav-link {
      min-height: 36px;
      padding: 0 12px;
      font-size: 13px;
    }

    .storybook-public-login,
    .storybook-public-logout,
    .storybook-public-cta {
      min-height: 39px;
      padding-right: 12px;
      padding-left: 12px;
      font-size: 12px;
    }
  }

  /* PUBLIC_HEADER_ACTION_OVERLAP_FIX_20260801
     상품안내와 내 작업실 버튼 겹침 방지 */

  .storybook-public-header-inner {
    min-width: 0;
  }

  .storybook-public-nav {
    min-width: 0;
  }

  .storybook-public-header-actions {
    min-width: max-content;
    width: max-content;
    justify-self: end;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  .storybook-public-nav-link,
  .storybook-public-login,
  .storybook-public-logout,
  .storybook-public-cta {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  /*
   * 데스크톱:
   * 브랜드 / 메뉴 / 로그인 버튼 영역을 서로 침범하지 않도록 분리
   */
  @media (min-width: 1241px) {
    .storybook-public-header-inner {
      width: min(1600px, 100%);
      padding-right: clamp(18px, 2vw, 32px);
      padding-left: clamp(18px, 2vw, 32px);

      grid-template-columns:
        minmax(235px, 0.62fr)
        minmax(0, 1fr)
        max-content;

      column-gap: clamp(10px, 1.1vw, 18px);
    }

    .storybook-public-nav {
      justify-content: flex-end;
      gap: 6px;
    }

    .storybook-public-nav-link {
      min-height: 38px;
      padding-right: 11px;
      padding-left: 11px;
      font-size: 13px;
    }

    .storybook-public-header-actions {
      gap: 7px;
    }

    .storybook-public-login,
    .storybook-public-logout {
      min-height: 40px;
      padding-right: 13px;
      padding-left: 13px;
      font-size: 13px;
    }

    .storybook-public-cta {
      min-height: 42px;
      padding-right: 18px;
      padding-left: 18px;
      font-size: 13px;
    }
  }

  /*
   * 화면이 조금 좁은 데스크톱:
   * 글자와 버튼 여백을 한 단계 더 줄여 겹침 방지
   */
  @media (min-width: 1241px) and (max-width: 1450px) {
    .storybook-public-header-inner {
      grid-template-columns:
        minmax(205px, 0.52fr)
        minmax(0, 1fr)
        max-content;

      column-gap: 9px;
      padding-right: 15px;
      padding-left: 15px;
    }

    .storybook-public-brand {
      gap: 7px;
    }

    .storybook-public-brand-name {
      font-size: 25px;
    }

    .storybook-public-brand-mark {
      width: 30px;
      height: 34px;
    }

    .storybook-public-brand-heart {
      display: none;
    }

    .storybook-public-nav {
      gap: 4px;
    }

    .storybook-public-nav-link {
      padding-right: 9px;
      padding-left: 9px;
      font-size: 12px;
    }

    .storybook-public-header-actions {
      gap: 5px;
    }

    .storybook-public-login,
    .storybook-public-logout {
      padding-right: 10px;
      padding-left: 10px;
      font-size: 12px;
    }

    .storybook-public-cta {
      padding-right: 14px;
      padding-left: 14px;
      font-size: 12px;
    }
  }
`;

function HeaderNavigation({
  activeKey,
}: {
  activeKey?: StorybookNavKey;
}) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={[
            'storybook-public-nav-link',
            activeKey === item.key
              ? 'is-active'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-current={
            activeKey === item.key
              ? 'page'
              : undefined
          }
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export default function StorybookPublicHeader({
  activeKey,
  ctaHref,
}: StorybookPublicHeaderProps) {
  const isLoggedIn =
    !ctaHref.startsWith('/login');


  return (
    <header className="storybook-public-header">
      <div className="storybook-public-header-inner">
        <Link
          href="/"
          className="storybook-public-brand"
          aria-label="달동네 스토리 홈페이지"
        >
          <svg
            className="storybook-public-brand-mark"
            viewBox="0 0 48 54"
            aria-hidden="true"
          >
            <path d="M6 25 24 7l18 18" />
            <path d="M10 22v26h28V22" />
            <path d="M20 48V32h8v16" />
            <path d="M15 16V7" />
            <path d="M12 7h6" />
            <path d="M14 28h4M30 28h4" />
          </svg>

          <span className="storybook-public-brand-name">
            달동네 스토리
          </span>

          <span
            className="storybook-public-brand-heart"
            aria-hidden="true"
          >
            ♡
          </span>
        </Link>

        <nav
          className="storybook-public-nav"
          aria-label="달동네 스토리 주요 메뉴"
        >
          <HeaderNavigation
            activeKey={activeKey}
          />
        </nav>

        <div className="storybook-public-header-actions">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="storybook-public-login"
              >
                내 작업실
              </Link>

              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
                className="storybook-public-logout-form"
              >
                <button
                  type="submit"
                  className="storybook-public-logout"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="storybook-public-login"
            >
              로그인
            </Link>
          )}

          <Link
            href={ctaHref}
            className="storybook-public-cta"
          >
            스토리북 만들기&nbsp; ♡
          </Link>
        </div>
      </div>

      <nav
        className="storybook-public-mobile-nav"
        aria-label="모바일 달동네 스토리 메뉴"
      >
        <HeaderNavigation
          activeKey={activeKey}
        />
      </nav>

      <style
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    </header>
  );
}
