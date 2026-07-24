import Image from 'next/image';
import Link from 'next/link';

const steps = [
  {
    number: '1',
    icon: '📷',
    title: '사진 올리기',
    description:
      '휴대전화에 있는 사진을 바로 올려보세요.',
    href: '/dashboard/timeline',
    buttonLabel: '사진 올리기',
  },
  {
    number: '2',
    icon: '✍️',
    title: '이야기 쓰기',
    description:
      '사진을 보며 떠오른 이야기를 짧게 남겨보세요.',
    href: '/dashboard/interview',
    buttonLabel: '이야기 쓰기',
  },
  {
    number: '3',
    icon: '📖',
    title: '책 만들기',
    description:
      '모은 사진과 이야기를 한 권의 원고로 엮어보세요.',
    href: '/dashboard/book',
    buttonLabel: '책 만들기',
  },
  {
    number: '4',
    icon: '✓',
    title: '검토 후 결제',
    description:
      '관리자가 원고를 확인하고 연락드린 뒤 결제합니다.',
    href: '/dashboard/library',
    buttonLabel: '내 책장 보기',
  },
];

const memoryCards = [
  {
    image: '/home/storybook/example-1.webp',
    label: '나의 하루',
  },
  {
    image: '/home/storybook/example-2.webp',
    label: '가족의 시간',
  },
  {
    image: '/home/storybook/example-3.webp',
    label: '친구와의 추억',
  },
  {
    image: '/home/storybook/example-4.webp',
    label: '반려동물과 산책',
  },
];

const previewStyles = `
  .simple-home-preview {
    --preview-coral: #f56f5c;
    --preview-coral-dark: #d94f3f;
    --preview-ink: #3c2b24;
    --preview-muted: #725f56;
    --preview-line: rgba(142, 92, 68, 0.15);
    color: var(--preview-ink);
    background:
      radial-gradient(
        circle at 8% 7%,
        rgba(255, 221, 204, 0.55),
        transparent 26rem
      ),
      linear-gradient(
        180deg,
        #fffdf9 0%,
        #fff8f2 48%,
        #fffdf9 100%
      );
    font-family:
      var(--font-daldongne-sans),
      Arial,
      sans-serif;
  }

  .simple-home-preview *,
  .simple-home-preview *::before,
  .simple-home-preview *::after {
    box-sizing: border-box;
  }

  .simple-home-container {
    width: min(1180px, calc(100% - 40px));
    margin: 0 auto;
  }

  .simple-home-hero {
    padding: 56px 0 44px;
  }

  .simple-home-hero-grid {
    display: grid;
    grid-template-columns:
      minmax(0, 0.92fr)
      minmax(430px, 1.08fr);
    align-items: center;
    gap: 52px;
  }

  .simple-home-eyebrow {
    margin: 0 0 13px;
    color: var(--preview-coral-dark);
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.03em;
  }

  .simple-home-title {
    margin: 0;
    font-family:
      var(--font-daldongne-serif),
      Batang,
      serif;
    font-size: clamp(42px, 4.5vw, 66px);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.045em;
    word-break: keep-all;
  }

  .simple-home-title span {
    color: var(--preview-coral);
  }

  .simple-home-description {
    max-width: 570px;
    margin: 22px 0 0;
    color: var(--preview-muted);
    font-size: 18px;
    line-height: 1.8;
    word-break: keep-all;
  }

  .simple-home-primary {
    min-height: 58px;
    margin-top: 27px;
    padding: 0 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: 18px;
    background:
      linear-gradient(
        135deg,
        #ff806d,
        #f25f4d
      );
    color: #ffffff;
    font-size: 17px;
    font-weight: 800;
    text-decoration: none;
    box-shadow:
      0 14px 28px
      rgba(224, 89, 67, 0.22);
  }

  .simple-home-primary:focus-visible,
  .simple-home-step-link:focus-visible,
  .simple-home-secondary:focus-visible {
    outline:
      4px solid
      rgba(245, 111, 92, 0.25);
    outline-offset: 3px;
  }

  .simple-home-note {
    margin: 13px 0 0;
    color: #806c61;
    font-size: 13px;
    line-height: 1.65;
  }

  .simple-home-hero-image {
    position: relative;
    min-height: 460px;
    overflow: hidden;
    border:
      1px solid
      rgba(210, 139, 108, 0.18);
    border-radius: 34px;
    background: #f8eadf;
    box-shadow:
      0 24px 60px
      rgba(111, 71, 49, 0.12);
  }

  .simple-home-hero-image img {
    object-fit: cover;
    object-position: center;
  }

  .simple-home-hero-badge {
    position: absolute;
    right: 20px;
    bottom: 20px;
    z-index: 2;
    max-width: 270px;
    padding: 14px 17px;
    border:
      1px solid
      rgba(255, 255, 255, 0.7);
    border-radius: 18px;
    background:
      rgba(255, 255, 255, 0.9);
    color: #4f392f;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.55;
    backdrop-filter: blur(12px);
  }

  .simple-home-steps-section {
    padding: 30px 0 64px;
  }

  .simple-home-section-heading {
    margin: 0;
    font-family:
      var(--font-daldongne-serif),
      Batang,
      serif;
    font-size: clamp(30px, 3vw, 42px);
    font-weight: 600;
    line-height: 1.35;
    text-align: center;
    letter-spacing: -0.04em;
    word-break: keep-all;
  }

  .simple-home-section-copy {
    margin: 12px auto 0;
    color: var(--preview-muted);
    font-size: 16px;
    line-height: 1.75;
    text-align: center;
    word-break: keep-all;
  }

  .simple-home-steps {
    margin-top: 30px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .simple-home-step {
    position: relative;
    min-width: 0;
    min-height: 310px;
    padding: 24px 22px 22px;
    display: flex;
    flex-direction: column;
    border:
      1px solid
      var(--preview-line);
    border-radius: 24px;
    background:
      rgba(255, 255, 255, 0.9);
    box-shadow:
      0 12px 30px
      rgba(107, 69, 49, 0.055);
  }

  .simple-home-step-number {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #fff0e9;
    color: var(--preview-coral-dark);
    font-size: 13px;
    font-weight: 800;
  }

  .simple-home-step-icon {
    width: 62px;
    height: 62px;
    display: grid;
    place-items: center;
    border-radius: 19px;
    background:
      linear-gradient(
        145deg,
        #fff3ed,
        #ffe1d5
      );
    font-size: 29px;
  }

  .simple-home-step h3 {
    margin: 19px 0 0;
    font-size: 21px;
    line-height: 1.4;
  }

  .simple-home-step p {
    margin: 10px 0 22px;
    color: var(--preview-muted);
    font-size: 14px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .simple-home-step-link {
    min-height: 46px;
    margin-top: auto;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid
      rgba(212, 92, 71, 0.25);
    border-radius: 14px;
    background: #fff8f4;
    color: #b74636;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
  }

  .simple-home-people-section {
    padding: 62px 0;
    border-top:
      1px solid
      var(--preview-line);
    border-bottom:
      1px solid
      var(--preview-line);
    background:
      linear-gradient(
        180deg,
        rgba(238, 250, 246, 0.72),
        rgba(255, 250, 244, 0.86)
      );
  }

  .simple-home-chips {
    margin-top: 24px;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 9px;
  }

  .simple-home-chip {
    min-height: 42px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid
      rgba(96, 143, 126, 0.18);
    border-radius: 999px;
    background: #ffffff;
    color: #4c645b;
    font-size: 14px;
    font-weight: 700;
  }

  .simple-home-memory-grid {
    margin-top: 28px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 15px;
  }

  .simple-home-memory-card {
    overflow: hidden;
    border:
      1px solid
      rgba(105, 148, 132, 0.15);
    border-radius: 20px;
    background: #ffffff;
    box-shadow:
      0 12px 25px
      rgba(66, 102, 89, 0.07);
  }

  .simple-home-memory-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1.25 / 1;
    overflow: hidden;
    background: #eff7f3;
  }

  .simple-home-memory-image img {
    object-fit: cover;
  }

  .simple-home-memory-card p {
    margin: 0;
    padding: 15px 14px 17px;
    color: #43564f;
    font-size: 15px;
    font-weight: 800;
    text-align: center;
  }

  .simple-home-daily {
    padding: 64px 0 76px;
  }

  .simple-home-daily-card {
    max-width: 900px;
    margin: 0 auto;
    padding: 42px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
    border:
      1px solid
      rgba(224, 168, 74, 0.22);
    border-radius: 30px;
    background:
      radial-gradient(
        circle at 94% 8%,
        rgba(255, 223, 104, 0.4),
        transparent 19rem
      ),
      linear-gradient(
        135deg,
        #fffdf6,
        #fff5d9
      );
  }

  .simple-home-daily-label {
    margin: 0;
    color: #a46d10;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .simple-home-daily h2 {
    margin: 12px 0 0;
    font-family:
      var(--font-daldongne-serif),
      Batang,
      serif;
    font-size: clamp(30px, 3vw, 43px);
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.04em;
  }

  .simple-home-daily p {
    max-width: 650px;
    margin: 14px 0 0;
    color: #725f47;
    font-size: 15px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .simple-home-secondary {
    min-height: 50px;
    margin-top: 22px;
    padding: 0 21px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid
      rgba(168, 110, 20, 0.28);
    border-radius: 15px;
    background: #ffffff;
    color: #8b5d12;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
  }

  .simple-home-mobile-bar {
    display: none;
  }

  @media (max-width: 980px) {
    .simple-home-hero-grid {
      grid-template-columns: 1fr;
      gap: 30px;
    }

    .simple-home-hero-image {
      min-height: 420px;
    }

    .simple-home-steps {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .simple-home-memory-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .simple-home-container {
      width: min(100% - 28px, 560px);
    }

    .simple-home-hero {
      padding: 30px 0 28px;
    }

    .simple-home-title {
      font-size: 38px;
      line-height: 1.25;
    }

    .simple-home-description {
      margin-top: 16px;
      font-size: 16px;
      line-height: 1.75;
    }

    .simple-home-primary {
      width: 100%;
      min-height: 60px;
      font-size: 17px;
    }

    .simple-home-hero-image {
      min-height: 300px;
      border-radius: 24px;
    }

    .simple-home-hero-badge {
      right: 12px;
      bottom: 12px;
      left: 12px;
      max-width: none;
    }

    .simple-home-steps-section,
    .simple-home-people-section,
    .simple-home-daily {
      padding: 46px 0;
    }

    .simple-home-section-heading {
      font-size: 30px;
    }

    .simple-home-steps {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .simple-home-step {
      min-height: 0;
      padding: 20px;
    }

    .simple-home-step-link {
      min-height: 52px;
    }

    .simple-home-memory-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .simple-home-memory-card p {
      padding: 12px 8px 14px;
      font-size: 13px;
    }

    .simple-home-daily-card {
      padding: 25px 18px;
      border-radius: 24px;
    }

    .simple-home-daily h2 {
      font-size: 30px;
    }

    .simple-home-secondary {
      width: 100%;
      min-height: 54px;
    }

    .simple-home-mobile-bar {
      position: sticky;
      bottom: 12px;
      z-index: 20;
      width: min(100% - 28px, 560px);
      margin: -2px auto 12px;
      padding: 8px;
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 6px;
      border:
        1px solid
        rgba(205, 126, 92, 0.19);
      border-radius: 20px;
      background:
        rgba(255, 255, 255, 0.94);
      box-shadow:
        0 14px 35px
        rgba(91, 56, 39, 0.17);
      backdrop-filter: blur(14px);
    }

    .simple-home-mobile-bar a {
      min-height: 52px;
      padding: 6px 4px;
      display: grid;
      place-items: center;
      border-radius: 14px;
      color: #60483c;
      font-size: 11px;
      font-weight: 800;
      line-height: 1.3;
      text-align: center;
      text-decoration: none;
    }

    .simple-home-mobile-bar a:first-child {
      background: var(--preview-coral);
      color: #ffffff;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .simple-home-preview *,
    .simple-home-preview *::before,
    .simple-home-preview *::after {
      scroll-behavior: auto !important;
      transition: none !important;
      animation: none !important;
    }
  }
`;

export default function HomePreviewPage() {
  return (
    <>
      <style>{previewStyles}</style>

      <main className="simple-home-preview">
        <section className="simple-home-hero">
          <div className="simple-home-container simple-home-hero-grid">
            <div>
              <p className="simple-home-eyebrow">
                사진과 이야기를 모아 만드는 나의 책
              </p>

              <h1 className="simple-home-title">
                오늘의 사진 한 장이
                <br />
                <span>한 권의 책이 됩니다</span>
              </h1>

              <p className="simple-home-description">
                어렵게 생각하지 마세요. 사진을 올리고,
                짧은 이야기를 쓰면 달동네가 책 원고로
                차근차근 정리해 드립니다.
              </p>

              <Link
                href="/dashboard/timeline"
                className="simple-home-primary"
              >
                <span aria-hidden="true">📷</span>
                사진 한 장 올리기
              </Link>

              <p className="simple-home-note">
                로그인 후 내 기억 공간에 안전하게
                보관됩니다.
              </p>
            </div>

            <div className="simple-home-hero-image">
              <Image
                src="/home/storybook/home-hero-family-story-v3.webp"
                alt="사진과 이야기로 소중한 시간을 기록하는 모습"
                fill
                priority
                sizes="(max-width: 700px) 100vw, 52vw"
              />

              <div className="simple-home-hero-badge">
                나·가족·친구·반려동물과 함께한
                모든 시간이 기록의 주인공입니다.
              </div>
            </div>
          </div>
        </section>

        <section className="simple-home-steps-section">
          <div className="simple-home-container">
            <h2 className="simple-home-section-heading">
              책 만들기, 네 단계면 충분합니다
            </h2>

            <p className="simple-home-section-copy">
              한 번에 하나씩 천천히 진행하세요.
            </p>

            <div className="simple-home-steps">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="simple-home-step"
                >
                  <span className="simple-home-step-number">
                    {step.number}
                  </span>

                  <div
                    className="simple-home-step-icon"
                    aria-hidden="true"
                  >
                    {step.icon}
                  </div>

                  <h3>{step.title}</h3>
                  <p>{step.description}</p>

                  <Link
                    href={step.href}
                    className="simple-home-step-link"
                  >
                    {step.buttonLabel}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="simple-home-people-section">
          <div className="simple-home-container">
            <h2 className="simple-home-section-heading">
              누구의 이야기든 소중한 기록입니다
            </h2>

            <p className="simple-home-section-copy">
              가족이라는 한 가지 모습에만 한정하지
              않습니다.
            </p>

            <div
              className="simple-home-chips"
              aria-label="기록할 수 있는 대상"
            >
              {[
                '나',
                '가족',
                '친구',
                '연인',
                '강아지',
                '고양이',
              ].map((label) => (
                <span
                  key={label}
                  className="simple-home-chip"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="simple-home-memory-grid">
              {memoryCards.map((card) => (
                <article
                  key={card.label}
                  className="simple-home-memory-card"
                >
                  <div className="simple-home-memory-image">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      sizes="(max-width: 700px) 46vw, 25vw"
                    />
                  </div>
                  <p>{card.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="simple-home-daily">
          <div className="simple-home-container">
            <div className="simple-home-daily-card">
              <div>
                <p className="simple-home-daily-label">
                  매일 한 번, 부담 없는 기록
                </p>

                <h2>
                  오늘 하루는
                  <br />
                  어땠나요?
                </h2>

                <p>
                  사진이나 짧은 글로 오늘의 기억을
                  남겨보세요. 모인 기록은 나중에 책
                  원고에 담을 수 있습니다.
                </p>

                <Link
                  href="/dashboard/interview"
                  className="simple-home-secondary"
                >
                  오늘 이야기 남기기
                </Link>
              </div>
            </div>
          </div>
        </section>

        <nav
          className="simple-home-mobile-bar"
          aria-label="휴대전화 빠른 메뉴"
        >
          <Link href="/dashboard/timeline">
            📷
            <br />
            사진 올리기
          </Link>
          <Link href="/dashboard/interview">
            ✍️
            <br />
            이야기
          </Link>
          <Link href="/dashboard/library">
            📚
            <br />
            내 책
          </Link>
        </nav>
      </main>
    </>
  );
}
