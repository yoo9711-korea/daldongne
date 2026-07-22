import Link from 'next/link';

export type StorybookNavKey =
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
    key: 'process',
    href: '/process',
    label: '제작과정',
  },
  {
    key: 'trial',
    href: '/trial',
    label: '작품소개',
  },
  {
    key: 'reviews',
    href: '/#reviews',
    label: '이용후기',
  },
  {
    key: 'guide',
    href: '/guide#faq',
    label: 'FAQ',
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
  /* 로그인·스토리북 만들기 버튼 영역 */
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

  const accountHref = isLoggedIn
    ? '/dashboard'
    : '/login';

  const accountLabel = isLoggedIn
    ? '내 작업실'
    : '로그인';

  return (
    <header className="storybook-public-header">
      <div className="storybook-public-header-inner">
        <Link
          href="/"
          className="storybook-public-brand"
          aria-label="달동네 스토리북 홈페이지"
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
            달동네 스토리북
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
          aria-label="달동네 스토리북 주요 메뉴"
        >
          <HeaderNavigation
            activeKey={activeKey}
          />
        </nav>

        <div className="storybook-public-header-actions">
  <Link
    href={accountHref}
    className="storybook-public-login"
  >
    {accountLabel}
  </Link>

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
        aria-label="모바일 달동네 스토리북 메뉴"
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
