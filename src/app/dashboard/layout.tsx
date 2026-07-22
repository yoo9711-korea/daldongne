import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const menuItems = [
  { href: '/process', label: '제작과정', icon: '✦' },
  { href: '/trial', label: '작품소개', icon: '▣' },
  { href: '/#reviews', label: '이용후기', icon: '♡' },
  { href: '/guide#faq', label: 'FAQ', icon: '?' },
  { href: '/guide#contact', label: '문의하기', icon: '✉' },
  { href: '/pricing', label: '상품안내', icon: '▤' },
  { href: '/dashboard/library', label: '내 책장', icon: '▥' },
];

const styles = `
  .dashboard-shell,
  .dashboard-shell * {
    box-sizing: border-box;
  }

 .dashboard-shell {
  min-height: 100vh;
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
    color: #4a342a;
    background:
      radial-gradient(circle at 88% 8%, rgba(255, 226, 211, 0.46), transparent 27rem),
      radial-gradient(circle at 9% 92%, rgba(255, 241, 205, 0.55), transparent 24rem),
      linear-gradient(180deg, #fffdf9 0%, #fffaf4 48%, #fffdf9 100%);
  }

  .dashboard-sidebar {
    min-height: 100vh;
    padding: 27px 18px 22px;
    position: sticky;
    top: 0;
    align-self: start;
    overflow-y: auto;
    border-right: 1px solid rgba(176, 125, 91, 0.15);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(255, 249, 242, 0.94));
    box-shadow: 10px 0 35px rgba(115, 75, 48, 0.045);
    backdrop-filter: blur(16px);
  }

  .dashboard-brand {
    display: block;
    padding: 6px 8px 20px;
    text-decoration: none;
  }

  .dashboard-brand-eyebrow {
    margin: 0;
    color: #e17b61;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.12em;
  }

  .dashboard-brand-title {
    margin: 7px 0 0;
    color: #4a3329;
    font-family: 'Gamja Flower', 'MapoFlowerIsland', cursive;
    font-size: 28px;
    font-weight: 400;
    line-height: 1.12;
    letter-spacing: -0.035em;
  }

  .dashboard-brand-subtitle {
    display: block;
    margin-top: 8px;
    color: #96786a;
    font-size: 11px;
    font-weight: 700;
  }

  .dashboard-menu {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-top: 8px;
  }

  .dashboard-menu-link {
    min-height: 48px;
    padding: 0 14px;
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    border: 1px solid rgba(192, 145, 116, 0.2);
    border-radius: 15px;
    color: #5b4338;
    background: linear-gradient(145deg, #ffffff, #fffaf6);
    box-shadow: 0 8px 20px rgba(104, 66, 43, 0.045);
    font-size: 14px;
    font-weight: 850;
    letter-spacing: -0.02em;
    text-decoration: none;
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
  }

  .dashboard-menu-link:hover,
  .dashboard-menu-link:focus-visible {
    transform: translateY(-2px);
    border-color: #e7a58e;
    background: linear-gradient(145deg, #fffdfb, #fff2eb);
    box-shadow: 0 12px 26px rgba(204, 107, 78, 0.1);
    outline: none;
  }

  .dashboard-menu-icon {
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border-radius: 11px;
    color: #c86e55;
    background: #fff0e9;
    font-family: Arial, sans-serif;
    font-size: 15px;
    line-height: 1;
  }

  .dashboard-help-card {
    margin-top: 24px;
    padding: 17px 16px;
    border: 1px solid rgba(213, 164, 126, 0.22);
    border-radius: 18px;
    background:
      radial-gradient(circle at 85% 8%, rgba(255, 255, 255, 0.78), transparent 8rem),
      linear-gradient(145deg, #fff5e9, #fffaf4);
  }

  .dashboard-help-title {
    margin: 0;
    color: #c96b53;
    font-size: 13px;
    font-weight: 900;
  }

  .dashboard-help-text {
    margin: 7px 0 0;
    color: #715b50;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.72;
  }

  .dashboard-home-link {
    min-height: 41px;
    margin-top: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    border: 1px solid #e4b79f;
    border-radius: 999px;
    color: #a45f47;
    background: rgba(255, 255, 255, 0.68);
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
  }

  .dashboard-content {
    min-width: 0;
    min-height: 100vh;
    background: transparent;
  }

  .dashboard-content > * {
  .dashboard-shell button,
.dashboard-shell input,
.dashboard-shell textarea,
.dashboard-shell select {
  font-family: inherit;
}

.dashboard-content h1,
.dashboard-content h2,
.dashboard-content h3,
.dashboard-content h4,
.dashboard-content [style*='Noto Serif KR'],
.dashboard-content [style*='--font-display'] {
  font-family: 'Gamja Flower', 'MapoFlowerIsland', cursive !important;
  font-weight: 400;
  letter-spacing: 0.015em;
}
    min-width: 0;
  }

  @media (max-width: 980px) {
    .dashboard-shell {
      grid-template-columns: 210px minmax(0, 1fr);
    }

    .dashboard-sidebar {
      padding-right: 13px;
      padding-left: 13px;
    }

    .dashboard-brand-title {
      font-size: 25px;
    }

    .dashboard-menu-link {
      padding-right: 10px;
      padding-left: 10px;
      font-size: 13px;
    }
  }

  @media (max-width: 760px) {
    .dashboard-shell {
      display: block;
    }

    .dashboard-sidebar {
      min-height: auto;
      padding: 14px 14px 13px;
      position: relative;
      top: auto;
      overflow: visible;
      border-right: 0;
      border-bottom: 1px solid rgba(176, 125, 91, 0.15);
      box-shadow: 0 9px 24px rgba(115, 75, 48, 0.05);
    }

    .dashboard-brand {
      padding: 2px 3px 12px;
      display: flex;
      align-items: baseline;
      gap: 9px;
    }

    .dashboard-brand-eyebrow {
      display: none;
    }

    .dashboard-brand-title {
      margin: 0;
      font-size: 24px;
      line-height: 1;
    }

    .dashboard-brand-title br {
      display: none;
    }

    .dashboard-brand-subtitle {
      margin-top: 0;
      font-size: 10px;
    }

    .dashboard-menu {
      margin-top: 0;
      padding-bottom: 3px;
      flex-direction: row;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .dashboard-menu::-webkit-scrollbar {
      display: none;
    }

    .dashboard-menu-link {
      min-width: max-content;
      min-height: 41px;
      padding: 0 13px;
      grid-template-columns: 25px auto;
      gap: 6px;
      flex: 0 0 auto;
      border-radius: 13px;
      font-size: 12px;
    }

    .dashboard-menu-icon {
      width: 25px;
      height: 25px;
      border-radius: 8px;
      font-size: 12px;
    }

    .dashboard-help-card {
      display: none;
    }

    .dashboard-content {
      min-height: calc(100vh - 118px);
    }
  }
`;

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
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href="/dashboard" className="dashboard-brand">
          <p className="dashboard-brand-eyebrow">
            DALDONGNE
          </p>

          <h1 className="dashboard-brand-title">
         달동네
         <br />
         스토리북
        </h1>

          <span className="dashboard-brand-subtitle">
            나의 기억 작업실
          </span>
        </Link>

        <nav className="dashboard-menu" aria-label="대시보드 메뉴">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="dashboard-menu-link"
            >
              <span className="dashboard-menu-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="dashboard-help-card">
          <p className="dashboard-help-title">
            오늘의 기록을 남겨보세요 ♡
          </p>

          <p className="dashboard-help-text">
            사진과 이야기를 차곡차곡 모아
            <br />
            소중한 삶의 기록을 한 권의 책으로
            만들어 보세요.
          </p>

          <Link href="/" className="dashboard-home-link">
            홈페이지로 돌아가기 →
          </Link>
        </div>
      </aside>

      <div className="dashboard-content">
        {children}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    </div>
  );
}
