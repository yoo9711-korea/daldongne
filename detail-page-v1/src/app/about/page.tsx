import { auth } from '@/auth';
import Image from 'next/image';
import Link from 'next/link';

const FEATURES = [
  {
    icon: 'camera',
    title: '사진과 이야기를 담아',
    description:
      '오래된 사진과 소중한 이야기를 책으로 엮어드립니다.',
  },
  {
    icon: 'heart',
    title: '정성 가득한 맞춤 제작',
    description:
      '한 분, 한 가족을 위한 맞춤 구성으로 정성껏 제작합니다.',
  },
  {
    icon: 'book',
    title: 'AI와 편집 전문가의 협업',
    description:
      'AI가 원고를 정리하고, 전문가가 감동을 더합니다.',
  },
  {
    icon: 'gift',
    title: '선물로도 좋은 인생책',
    description:
      '세상에 단 하나뿐인 책, 가장 특별한 선물이 됩니다.',
  },
] as const;

const EXAMPLES = [
  {
    image: '/home/storybook/example-1.webp',
    title: '부모님의 인생 이야기',
  },
  {
    image: '/home/storybook/example-2.webp',
    title: '우리 가족의 추억',
  },
  {
    image: '/home/storybook/example-3.webp',
    title: '아이의 성장 기록',
  },
  {
    image: '/home/storybook/example-4.webp',
    title: '여행과 함께한 시간들',
  },
] as const;

type FeatureIconName =
  (typeof FEATURES)[number]['icon'];

function FeatureIcon({
  name,
}: {
  name: FeatureIconName;
}) {
  if (name === 'camera') {
    return (
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path d="M20 18h7l3-5h10l4 5h7a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H13a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6h7Z" />
        <circle cx="32" cy="36" r="10" />
        <circle cx="49" cy="27" r="2" />
      </svg>
    );
  }

  if (name === 'heart') {
    return (
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path d="M32 25c-5-10-20-7-20 5 0 10 20 22 20 22s20-12 20-22c0-12-15-15-20-5Z" />
        <path d="M7 40c7-4 13-3 18 2l3 3c2 2 5 2 7 0l4-4c5-5 11-6 18-2" />
        <path d="m7 40 7 12M57 39l-7 13" />
      </svg>
    );
  }

  if (name === 'book') {
    return (
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path d="M7 14c10-3 18-1 25 5v34c-7-6-15-8-25-5V14Z" />
        <path d="M57 14c-10-3-18-1-25 5v34c7-6 15-8 25-5V14Z" />
        <path d="M32 19v34" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <path d="M10 25h44v29H10z" />
      <path d="M7 17h50v12H7z" />
      <path d="M32 17v37" />
      <path d="M32 17c-8 0-15-2-15-8 0-4 4-6 8-4 5 2 7 12 7 12Z" />
      <path d="M32 17c8 0 15-2 15-8 0-4-4-6-8-4-5 2-7 12-7 12Z" />
    </svg>
  );
}

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap');

  body:has(.life-detail-page) > [role='banner'],
  body:has(.life-detail-page) > footer {
    display: none !important;
  }

  .life-detail-page,
  .life-detail-page * {
    box-sizing: border-box;
  }

  .life-detail-page {
    --detail-ink: #4b3327;
    --detail-soft: #756257;
    --detail-accent: #a8784e;
    --detail-accent-dark: #8d623e;
    --detail-cream: #fbf7f0;
    --detail-line: rgba(114, 82, 63, 0.16);
    width: 100%;
    min-height: 100vh;
    overflow-x: clip;
    color: var(--detail-ink);
    background: #fffdf9;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .life-detail-page a {
    color: inherit;
  }

  .detail-header {
    position: absolute;
    inset: 0 0 auto;
    z-index: 30;
    width: 100%;
  }

  .detail-header-inner {
    width: min(1480px, 100%);
    min-height: 108px;
    margin: 0 auto;
    padding: 24px 52px;
    display: grid;
    grid-template-columns: minmax(260px, 0.9fr) minmax(560px, 1.6fr);
    align-items: start;
    gap: 34px;
  }

  .detail-brand {
    display: inline-grid;
    grid-template-columns: 34px auto;
    gap: 10px;
    width: max-content;
    color: var(--detail-ink);
    text-decoration: none;
  }

  .detail-brand svg {
    width: 32px;
    height: 32px;
    margin-top: 2px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .detail-brand-copy {
    display: grid;
    gap: 2px;
  }

  .detail-brand-name {
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-size: 29px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: 0.025em;
  }

  .detail-brand-tagline {
    color: #6f5b4e;
    font-size: 13px;
    line-height: 1.4;
    white-space: nowrap;
  }

  .detail-nav {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: clamp(22px, 2.8vw, 44px);
    padding-top: 8px;
    white-space: nowrap;
  }

  .detail-nav a {
    position: relative;
    padding: 8px 0;
    color: #3f2c22;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
  }

  .detail-nav a::after {
    position: absolute;
    right: 0;
    bottom: 2px;
    left: 0;
    height: 1px;
    content: '';
    background: currentColor;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 160ms ease;
  }

  .detail-nav a:hover::after,
  .detail-nav a:focus-visible::after {
    transform: scaleX(1);
  }

  .detail-hero {
    position: relative;
    min-height: 675px;
    overflow: hidden;
    background:
      linear-gradient(
        90deg,
        rgba(255, 253, 249, 0.98) 0%,
        rgba(255, 253, 249, 0.95) 35%,
        rgba(255, 253, 249, 0.45) 53%,
        rgba(255, 253, 249, 0) 72%
      ),
      #f7f0e5;
  }

  .detail-hero-image {
    position: absolute;
    inset: 0 0 0 42%;
  }

  .detail-hero-image img {
    object-fit: cover;
    object-position: center center;
    filter: saturate(0.88) brightness(1.04);
  }

  .detail-hero::after {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    background:
      linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.18),
        transparent 28%,
        transparent 78%,
        rgba(66, 43, 28, 0.07)
      );
  }

  .detail-hero-inner {
    position: relative;
    z-index: 2;
    width: min(1480px, 100%);
    min-height: 675px;
    margin: 0 auto;
    padding: 170px 52px 70px;
    display: flex;
    align-items: center;
  }

  .detail-hero-copy {
    width: min(500px, 44vw);
  }

  .detail-hero-title {
    margin: 0;
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-size: clamp(54px, 5vw, 72px);
    font-weight: 400;
    line-height: 1.18;
    letter-spacing: 0.015em;
    word-break: keep-all;
    text-wrap: balance;
  }

  .detail-hero-description {
    margin: 29px 0 0;
    color: #382b25;
    font-size: 20px;
    line-height: 1.85;
    word-break: keep-all;
  }

  .detail-primary-button,
  .detail-outline-button,
  .detail-contact-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 800;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .detail-primary-button {
    min-height: 58px;
    margin-top: 30px;
    padding: 0 36px;
    border: 1px solid #a87950;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ad7d54,
        #996943
      );
    box-shadow:
      0 14px 30px
      rgba(116, 77, 45, 0.22);
    font-size: 16px;
  }

  .detail-primary-button:hover,
  .detail-outline-button:hover,
  .detail-contact-button:hover {
    transform: translateY(-2px);
  }

  .detail-service {
    padding: 48px 24px 58px;
    background:
      radial-gradient(
        circle at 50% 0,
        rgba(237, 224, 201, 0.35),
        transparent 34rem
      ),
      #fffdf8;
  }

  .detail-section-heading {
    text-align: center;
  }

  .detail-section-kicker {
    margin: 0;
    color: #5f4d43;
    font-size: 15px;
    line-height: 1.5;
  }

  .detail-section-heading h2,
  .detail-examples-heading h2,
  .detail-contact-copy h2 {
    margin: 8px 0 0;
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-weight: 400;
    letter-spacing: 0.025em;
  }

  .detail-section-heading h2 {
    font-size: clamp(34px, 3.4vw, 43px);
  }

  .detail-flourish {
    width: 58px;
    height: 20px;
    margin: 10px auto 0;
    position: relative;
  }

  .detail-flourish::before,
  .detail-flourish::after {
    position: absolute;
    top: 9px;
    width: 26px;
    height: 1px;
    content: '';
    background: #b28a62;
  }

  .detail-flourish::before {
    left: 0;
    transform: rotate(12deg);
  }

  .detail-flourish::after {
    right: 0;
    transform: rotate(-12deg);
  }

  .detail-flourish span {
    position: absolute;
    top: 4px;
    left: 50%;
    color: #b28a62;
    font-size: 15px;
    transform: translateX(-50%);
  }

  .detail-feature-grid {
    width: min(1180px, 100%);
    margin: 28px auto 0;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
  }

  .detail-feature {
    min-width: 0;
    padding: 0 28px;
    text-align: center;
  }

  .detail-feature + .detail-feature {
    border-left: 1px solid var(--detail-line);
  }

  .detail-feature-icon {
    display: grid;
    width: 82px;
    height: 82px;
    margin: 0 auto 15px;
    place-items: center;
    border-radius: 50%;
    background:
      linear-gradient(
        145deg,
        #f8f1e5,
        #fffdf8
      );
  }

  .detail-feature-icon svg {
    width: 48px;
    height: 48px;
    fill: none;
    stroke: #4f382b;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .detail-feature h3 {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
    word-break: keep-all;
  }

  .detail-feature p {
    margin: 11px auto 0;
    color: #66564d;
    font-size: 13px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .detail-examples {
    padding: 38px 24px 42px;
    background: #ffffff;
  }

  .detail-examples-inner {
    width: min(1240px, 100%);
    margin: 0 auto;
  }

  .detail-examples-top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
  }

  .detail-examples-heading h2 {
    font-size: clamp(32px, 3vw, 41px);
  }

  .detail-examples-heading p {
    margin: 5px 0 0;
    color: #705c51;
    font-size: 15px;
  }

  .detail-outline-button {
    min-height: 43px;
    padding: 0 24px;
    border: 1px solid #c7a981;
    color: #76563a !important;
    background: #fffdf8;
    font-size: 13px;
  }

  .detail-example-grid {
    margin-top: 26px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 18px;
  }

  .detail-example-card {
    min-width: 0;
  }

  .detail-example-image {
    position: relative;
    aspect-ratio: 1.28 / 1;
    overflow: hidden;
    border-radius: 8px;
    background: #f3eee8;
    box-shadow:
      0 10px 26px
      rgba(89, 61, 43, 0.08);
  }

  .detail-example-image img {
    object-fit: cover;
    transition: transform 260ms ease;
  }

  .detail-example-card:hover
    .detail-example-image img {
    transform: scale(1.035);
  }

  .detail-example-card h3 {
    margin: 13px 0 0;
    color: #47362d;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
  }

  .detail-contact {
    padding: 8px 24px 54px;
    background: #ffffff;
  }

  .detail-contact-inner {
    width: min(1240px, 100%);
    min-height: 162px;
    margin: 0 auto;
    padding: 23px 42px;
    display: grid;
    grid-template-columns:
      minmax(230px, 0.8fr)
      minmax(0, 1.2fr)
      minmax(180px, 0.45fr);
    align-items: center;
    gap: 28px;
    overflow: hidden;
    border-radius: 17px;
    background:
      radial-gradient(
        circle at 22% 20%,
        rgba(255, 247, 221, 0.9),
        transparent 18rem
      ),
      linear-gradient(
        135deg,
        #fff8e8,
        #f7eddc
      );
  }

  .detail-contact-image {
    position: relative;
    width: 230px;
    height: 128px;
    justify-self: center;
  }

  .detail-contact-image img {
    object-fit: contain;
  }

  .detail-contact-copy h2 {
    font-size: clamp(31px, 3vw, 40px);
  }

  .detail-contact-copy p {
    margin: 10px 0 0;
    color: #5f5047;
    font-size: 14px;
    line-height: 1.7;
    word-break: keep-all;
  }

  .detail-contact-button {
    width: 100%;
    min-height: 54px;
    padding: 0 28px;
    border: 0;
    color: #5a3e27 !important;
    background:
      linear-gradient(
        135deg,
        #f7dfaa,
        #f0cf8f
      );
    box-shadow:
      0 10px 22px
      rgba(157, 117, 56, 0.12);
    font-size: 16px;
  }

  @media (max-width: 1080px) {
    .detail-header-inner {
      padding-right: 30px;
      padding-left: 30px;
      grid-template-columns:
        minmax(230px, 0.7fr)
        minmax(490px, 1.3fr);
    }

    .detail-nav {
      gap: 21px;
    }

    .detail-hero-copy {
      width: min(470px, 48vw);
    }

    .detail-hero-title {
      font-size: clamp(50px, 5.3vw, 64px);
    }

    .detail-feature {
      padding-right: 20px;
      padding-left: 20px;
    }
  }

  @media (max-width: 860px) {
    .detail-header {
      position: relative;
      border-bottom:
        1px solid
        rgba(114, 82, 63, 0.12);
      background:
        rgba(255, 253, 249, 0.98);
    }

    .detail-header-inner {
      min-height: auto;
      padding: 18px 20px 13px;
      display: flex;
      flex-direction: column;
      gap: 11px;
    }

    .detail-brand {
      margin: 0 auto;
    }

    .detail-nav {
      width: 100%;
      justify-content: flex-start;
      gap: 22px;
      padding: 0 0 3px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .detail-nav::-webkit-scrollbar {
      display: none;
    }

    .detail-nav a {
      flex: 0 0 auto;
    }

    .detail-hero {
      min-height: auto;
      display: grid;
      background: #fbf5ed;
    }

    .detail-hero-image {
      position: relative;
      inset: auto;
      order: 2;
      width: 100%;
      aspect-ratio: 1.25 / 1;
    }

    .detail-hero::after {
      display: none;
    }

    .detail-hero-inner {
      min-height: auto;
      padding: 54px 24px 44px;
      order: 1;
      align-items: flex-start;
    }

    .detail-hero-copy {
      width: min(620px, 100%);
      margin: 0 auto;
      text-align: center;
    }

    .detail-hero-title {
      font-size: clamp(46px, 11vw, 61px);
    }

    .detail-hero-description {
      font-size: 18px;
    }

    .detail-feature-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 32px 0;
    }

    .detail-feature:nth-child(3) {
      border-left: 0;
    }

    .detail-example-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .detail-contact-inner {
      grid-template-columns:
        180px minmax(0, 1fr);
    }

    .detail-contact-image {
      width: 180px;
      height: 110px;
    }

    .detail-contact-button {
      grid-column: 1 / -1;
      width: min(260px, 100%);
      justify-self: center;
    }
  }

  @media (max-width: 560px) {
    .detail-brand-name {
      font-size: 25px;
    }

    .detail-brand-tagline {
      font-size: 12px;
    }

    .detail-nav {
      gap: 18px;
    }

    .detail-nav a {
      font-size: 13px;
    }

    .detail-hero-inner {
      padding:
        42px 18px
        36px;
    }

    .detail-hero-title {
      font-size: 43px;
    }

    .detail-hero-description {
      margin-top: 21px;
      font-size: 16px;
      line-height: 1.8;
    }

    .detail-primary-button {
      min-height: 53px;
      padding: 0 29px;
    }

    .detail-service {
      padding:
        39px 16px
        46px;
    }

    .detail-feature-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .detail-feature {
      padding: 24px 10px;
    }

    .detail-feature + .detail-feature {
      border-top:
        1px solid
        var(--detail-line);
      border-left: 0;
    }

    .detail-feature-icon {
      width: 74px;
      height: 74px;
    }

    .detail-examples {
      padding:
        34px 16px
        40px;
    }

    .detail-examples-top {
      align-items: flex-start;
      flex-direction: column;
      gap: 15px;
    }

    .detail-example-grid {
      grid-template-columns: 1fr;
      gap: 22px;
    }

    .detail-example-card h3 {
      font-size: 15px;
    }

    .detail-contact {
      padding:
        0 16px
        38px;
    }

    .detail-contact-inner {
      padding:
        26px 20px
        28px;
      grid-template-columns: 1fr;
      text-align: center;
    }

    .detail-contact-image {
      width: 210px;
      height: 118px;
    }

    .detail-contact-copy h2 {
      font-size: 35px;
    }
  }
`;

export default async function AboutPage() {
  const session = await auth();

  const startHref = session?.user
    ? '/dashboard'
    : '/login?callbackUrl=/dashboard';

  return (
    <div className="life-detail-page">
      <header className="detail-header">
        <div className="detail-header-inner">
          <Link
            href="/"
            className="detail-brand"
          >
            <svg
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path d="M7 23 24 8l17 15" />
              <path d="M11 21v20h26V21" />
              <path d="M20 41V27h8v14" />
              <path d="M14 18V9" />
              <path d="M11 9h6" />
            </svg>

            <span className="detail-brand-copy">
              <strong className="detail-brand-name">
                달동네 이야기
              </strong>
              <span className="detail-brand-tagline">
                평범한 삶을 한 권의 이야기로
              </span>
            </span>
          </Link>

          <nav
            className="detail-nav"
            aria-label="상세페이지 메뉴"
          >
            <Link href="#service">
              서비스 안내
            </Link>
            <Link href="#examples">
              인생책 예시
            </Link>
            <Link href="/process">
              제작 과정
            </Link>
            <Link href="/pricing">
              요금 안내
            </Link>
            <Link href="/#reviews">
              후기
            </Link>
            <Link href="/apply">
              문의하기
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="detail-hero">
          <div className="detail-hero-image">
            <Image
              src="/home/storybook/detail-hero.webp"
              alt="오래된 가족사진과 꽃, 인생책이 놓인 따뜻한 테이블"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 60vw"
            />
          </div>

          <div className="detail-hero-inner">
            <div className="detail-hero-copy">
              <h1 className="detail-hero-title">
                평범한 하루가
                <br />
                한 권의 이야기가 됩니다.
              </h1>

              <p className="detail-hero-description">
                부모님의 삶, 우리 가족의 추억,
                <br />
                아이의 성장까지
                <br />
                오래 간직하고 싶은 시간을
                <br />
                책으로 만들어 드립니다.
              </p>

              <Link
                href={startHref}
                className="detail-primary-button"
              >
                내 이야기 시작하기&nbsp; →
              </Link>
            </div>
          </div>
        </section>

        <section
          id="service"
          className="detail-service"
        >
          <div className="detail-section-heading">
            <p className="detail-section-kicker">
              달동네 이야기의 인생책
            </p>
            <h2>이런 점이 특별합니다.</h2>
            <div
              className="detail-flourish"
              aria-hidden="true"
            >
              <span>❧</span>
            </div>
          </div>

          <div className="detail-feature-grid">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="detail-feature"
              >
                <div className="detail-feature-icon">
                  <FeatureIcon
                    name={feature.icon}
                  />
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="examples"
          className="detail-examples"
        >
          <div className="detail-examples-inner">
            <div className="detail-examples-top">
              <div className="detail-examples-heading">
                <h2>인생책 예시</h2>
                <p>
                  다양한 인생의 이야기가 한 권의
                  책으로 완성됩니다.
                </p>
              </div>

              <Link
                href="/trial"
                className="detail-outline-button"
              >
                더 많은 예시 보기&nbsp; →
              </Link>
            </div>

            <div className="detail-example-grid">
              {EXAMPLES.map((example) => (
                <article
                  key={example.title}
                  className="detail-example-card"
                >
                  <div className="detail-example-image">
                    <Image
                      src={example.image}
                      alt={example.title}
                      fill
                      sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, 25vw"
                    />
                  </div>

                  <h3>{example.title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-contact">
          <div className="detail-contact-inner">
            <div className="detail-contact-image">
              <Image
                src="/home/storybook/house.webp"
                alt="달빛 아래 따뜻한 집 그림"
                fill
                sizes="230px"
              />
            </div>

            <div className="detail-contact-copy">
              <h2>
                당신의 이야기를 기다립니다.
              </h2>
              <p>
                지금, 당신의 이야기를 들려주세요.
                <br />
                달동네 이야기가 따뜻한 책으로
                만들어 드리겠습니다.
              </p>
            </div>

            <Link
              href="/apply"
              className="detail-contact-button"
            >
              문의하기
            </Link>
          </div>
        </section>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: pageStyles,
        }}
      />
    </div>
  );
}
