import { auth } from '@/auth';
import StorybookPublicHeader from '@/components/storybook/StorybookPublicHeader';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PROCESS_STEPS = [
  {
    number: '01',
    title: '사진 정리',
    image: '/home/storybook/process-1.webp',
    description:
      '보내주신 사진을 정리하고, 화질 보정과 색감 보정을 통해 더 선명하고 아름답게 준비합니다.',
    duration: '소요기간 1~2일',
  },
  {
    number: '02',
    title: '이야기 나누기',
    image: '/home/storybook/process-2.webp',
    description:
      '인터뷰 양식 또는 전화·문자를 통해 이야기를 나눕니다. 가족의 추억과 감정을 함께 담아드려요.',
    duration: '소요기간 2~4일',
  },
  {
    number: '03',
    title: '원고 구성',
    image: '/home/storybook/process-3.webp',
    description:
      '나눈 이야기를 바탕으로 스토리 구성을 하고, 따뜻한 문장으로 원고를 작성합니다.',
    duration: '소요기간 3~5일',
  },
  {
    number: '04',
    title: '편집 & 디자인',
    image: '/home/storybook/example-2.webp',
    description:
      '전문 디자이너가 감성적인 레이아웃과 일러스트로 책의 디자인을 완성합니다.',
    duration: '소요기간 5~7일',
  },
  {
    number: '05',
    title: '인쇄 & 제작',
    image: '/home/storybook/process-4.webp',
    description:
      '고급 용지와 견고한 제본으로 오래도록 간직할 수 있는 책으로 제작합니다.',
    duration: '소요기간 3~5일',
  },
  {
    number: '06',
    title: '책 배송',
    image: '/home/storybook/house.webp',
    description:
      '정성껏 포장하여 고객님께 안전하게 배송해드립니다. 배송 상황도 확인할 수 있습니다.',
    duration: '소요기간 2~3일',
  },
] as const;

const DIFFERENCES = [
  {
    image: '/home/storybook/recommend-1.webp',
    title: 'AI 정리 + 전문 편집',
    description:
      'AI 기술로 사진을 정리하고, 전문 작가가 이야기를 따뜻하게 풀어냅니다.',
  },
  {
    image: '/home/storybook/recommend-2.webp',
    title: '1:1 맞춤 서비스',
    description:
      '고객님의 이야기에 귀 기울이며 세상에 하나뿐인 책을 제작합니다.',
  },
  {
    image: '/home/storybook/recommend-3.webp',
    title: '감성 디자인',
    description:
      '따뜻한 일러스트와 감성적인 레이아웃으로 마음을 전하는 스토리북을 만듭니다.',
  },
  {
    image: '/home/storybook/recommend-4.webp',
    title: '고급 인쇄 & 제본',
    description:
      '고급 용지와 튼튼한 제본으로 오래도록 간직할 수 있는 책을 만듭니다.',
  },
  {
    image: '/home/storybook/recommend-5.webp',
    title: '안심 포장 & 배송',
    description:
      '안전한 포장과 추적 가능한 배송으로 소중한 책을 책임 있게 전달합니다.',
  },
] as const;

const RECOMMENDED_MOMENTS = [
  {
    image: '/home/storybook/recommend-1.webp',
    title: '부모님께',
    description: '인생책을 선물하고 싶을 때',
  },
  {
    image: '/home/storybook/recommend-2.webp',
    title: '결혼기념일',
    description: '특별한 선물을 찾을 때',
  },
  {
    image: '/home/storybook/recommend-3.webp',
    title: '아이의 성장 과정',
    description: '기록하고 싶을 때',
  },
  {
    image: '/home/storybook/recommend-4.webp',
    title: '은퇴·회갑·칠순',
    description: '기념 선물이 필요할 때',
  },
  {
    image: '/home/storybook/recommend-5.webp',
    title: '여행의 추억',
    description: '오래 간직하고 싶을 때',
  },
] as const;

const styles = `
  .process-storybook-page,
  .process-storybook-page * {
    box-sizing: border-box;
  }

  .process-storybook-page {
    --process-ink: #4a3024;
    --process-soft: #715e52;
    --process-coral: #e97861;
    --process-coral-dark: #d9624c;
    --process-line: rgba(126, 87, 64, 0.14);
    width: 100%;
    min-height: 100vh;
    overflow-x: clip;
    color: var(--process-ink);
    background: #fffdf9;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .process-storybook-page a {
    color: inherit;
  }

  .process-hand-title,
  .process-section-title,
  .process-cta-title,
  .process-strip-title {
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-weight: 400;
    letter-spacing: 0.015em;
  }

  .process-heart {
    margin-left: 7px;
    color: #ef806b;
    font-family: Arial, sans-serif;
    font-size: 0.82em;
  }

  .process-hero {
    position: relative;
    min-height: 325px;
    overflow: hidden;
    background:
      linear-gradient(
        90deg,
        rgba(255, 253, 249, 0.99) 0%,
        rgba(255, 253, 249, 0.96) 40%,
        rgba(255, 253, 249, 0.38) 59%,
        rgba(255, 253, 249, 0) 79%
      ),
      #f7efe4;
  }

  .process-hero-left {
    position: absolute;
    inset: 0 auto 0 0;
    width: 205px;
    opacity: 0.95;
  }

  .process-hero-left img {
    object-fit: cover;
    object-position: left center;
  }

  .process-hero-image {
    position: absolute;
    inset: 0 0 0 45%;
  }

  .process-hero-image img {
  object-fit: contain;
  object-position: center center;
}

.process-hero-image {
  background: #fff8ef;
  overflow: hidden;
}
  .process-hero-inner {
    position: relative;
    z-index: 2;
    width: min(1480px, 100%);
    min-height: 325px;
    margin: 0 auto;
    padding:
      45px
      clamp(24px, 4vw, 62px)
      40px
      clamp(205px, 15vw, 235px);
    display: flex;
    align-items: center;
  }

  .process-hero-copy {
    width: min(520px, 42vw);
  }

  .process-hand-title {
    margin: 0;
    font-size: clamp(46px, 4vw, 60px);
    line-height: 1.18;
    word-break: keep-all;
  }

  .process-hero-description {
    margin: 19px 0 0;
    color: #57453b;
    font-size: 15px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .process-primary-button,
  .process-secondary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-weight: 900;
    text-decoration: none;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease;
  }

  .process-primary-button {
    min-height: 47px;
    padding: 0 27px;
    border: 1px solid #e4745d;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ee8b70,
        #e56d55
      );
    box-shadow:
      0 11px 25px
      rgba(210, 97, 73, 0.2);
    font-size: 13px;
  }

  .process-primary-button:hover,
  .process-secondary-button:hover {
    transform: translateY(-2px);
  }

  .process-main {
    padding: 24px 24px 34px;
    background:
      linear-gradient(
        180deg,
        #fffdf9,
        #fffaf4
      );
  }

  .process-main-inner {
    width: min(1400px, 100%);
    margin: 0 auto;
  }

  .process-section-title {
    margin: 0;
    font-size: 29px;
    line-height: 1.25;
  }

  .process-title-line {
    width: 78px;
    height: 10px;
    margin-top: 5px;
    border-bottom: 3px solid #ef806b;
    border-radius: 50%;
    transform: rotate(-2deg);
  }

  .process-steps-grid {
    margin-top: 19px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 40px;
  }

  .process-step-card {
    position: relative;
    min-width: 0;
    min-height: 278px;
    padding: 19px 14px 15px;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(137, 95, 69, 0.16);
    border-radius: 15px;
    background:
      linear-gradient(
        155deg,
        #fffefd,
        #fff9f2
      );
    box-shadow:
      0 9px 25px
      rgba(88, 58, 40, 0.06);
  }

  .process-step-card:not(:last-child)::after {
    position: absolute;
    top: 49%;
    right: -31px;
    content: '→';
    color: #c58a67;
    font-size: 26px;
    transform: translateY(-50%);
  }

  .process-step-number {
    position: absolute;
    top: 14px;
    left: -1px;
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ee8b70,
        #dd654f
      );
    box-shadow:
      0 7px 15px
      rgba(209, 96, 72, 0.18);
    font-size: 11px;
    font-weight: 900;
  }

  .process-step-card h3 {
    margin: 5px 0 0;
    color: #4a362d;
    font-size: 14px;
    text-align: center;
  }

  .process-step-image {
    position: relative;
    width: 105px;
    height: 85px;
    margin: 12px auto 8px;
  }

  .process-step-image img {
    object-fit: contain;
  }

  .process-step-card p {
    margin: 0;
    color: #69564b;
    font-size: 10px;
    line-height: 1.7;
    text-align: center;
    word-break: keep-all;
  }

  .process-duration {
    min-height: 29px;
    margin-top: auto;
    padding: 6px 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    border: 1px solid #ead5c6;
    border-radius: 999px;
    color: #ae7859;
    background: #fffaf5;
    font-size: 9px;
    font-weight: 800;
  }

  .process-total-duration {
    margin: 13px 0 0;
    color: #8a7569;
    font-size: 11px;
    line-height: 1.6;
    text-align: center;
  }

  .process-total-duration strong {
    color: #ec7961;
  }

  .process-difference {
    margin-top: 19px;
    padding: 12px 17px;
    display: grid;
    grid-template-columns:
      minmax(220px, 0.65fr)
      minmax(0, 2.35fr);
    align-items: center;
    gap: 19px;
    border: 1px solid rgba(137, 95, 69, 0.13);
    border-radius: 15px;
    background:
      linear-gradient(
        135deg,
        #fff9ef,
        #fffdf9
      );
  }

  .process-strip-title {
    margin: 0;
    padding: 8px 22px;
    border-right: 1px solid var(--process-line);
    font-size: 26px;
    line-height: 1.3;
  }

  .process-difference-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
  }

  .process-difference-item {
  min-width: 0;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

  .process-difference-item
    + .process-difference-item {
    border-left: 1px solid var(--process-line);
  }

   .process-difference-item h3 {
  margin: 0;
  color: #4d392f;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 700;
  word-break: keep-all;
}

  .process-difference-item p {
  margin: 8px 0 0;
  color: #7b675c;
  font-size: 13px;
  line-height: 1.6;
  word-break: keep-all;
}

  .process-recommend {
    margin-top: 19px;
    display: grid;
    grid-template-columns:
      minmax(170px, 0.55fr)
      minmax(0, 2.45fr);
    gap: 19px;
    align-items: stretch;
  }

  .process-recommend-heading {
    padding: 17px 14px;
    display: grid;
    align-content: center;
    border-right: 1px solid var(--process-line);
  }

  .process-recommend-heading
    .process-section-title {
    font-size: 26px;
  }

  .process-recommend-grid {
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 11px;
  }

  .process-recommend-card {
    min-width: 0;
    min-height: 132px;
    padding: 12px 8px 10px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(137, 95, 69, 0.12);
    border-radius: 13px;
    background: #ffffff;
    text-align: center;
    box-shadow:
      0 7px 18px
      rgba(87, 56, 39, 0.05);
  }

  .process-recommend-image {
    position: relative;
    width: 68px;
    height: 62px;
  }

  .process-recommend-image img {
    object-fit: contain;
  }

  .process-recommend-card h3 {
    margin: 5px 0 0;
    color: #4e3b31;
    font-size: 10px;
  }

  .process-recommend-card p {
    margin: 3px 0 0;
    color: #7e6b60;
    font-size: 9px;
    line-height: 1.45;
    word-break: keep-all;
  }

  .process-quote-card {
    min-width: 0;
    grid-column: 1 / -1;
    padding: 19px 23px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 145px;
    align-items: center;
    gap: 13px;
    border: 1px solid rgba(137, 95, 69, 0.12);
    border-radius: 14px;
    background:
      linear-gradient(
        135deg,
        #fffdf9,
        #fff7ed
      );
  }

  .process-quote-card blockquote {
    margin: 0;
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    color: #5a3e30;
    font-size: 23px;
    line-height: 1.4;
  }

  .process-quote-house {
    position: relative;
    width: 145px;
    height: 80px;
  }

  .process-quote-house img {
    object-fit: contain;
  }

  .process-cta {
    padding: 0 24px 40px;
    background: #fffaf4;
  }

  .process-cta-inner {
    width: min(1400px, 100%);
    min-height: 126px;
    margin: 0 auto;
    padding: 18px 34px;
    display: grid;
    grid-template-columns:
      minmax(310px, 0.8fr)
      minmax(0, 1.2fr)
      minmax(250px, 0.55fr);
    align-items: center;
    gap: 28px;
    overflow: hidden;
    border: 1px solid rgba(171, 119, 83, 0.2);
    border-radius: 17px;
    background:
      radial-gradient(
        circle at 18% 30%,
        rgba(255, 255, 255, 0.87),
        transparent 18rem
      ),
      linear-gradient(
        135deg,
        #fff4e8,
        #f8ead8
      );
  }

  .process-cta-image {
    position: relative;
    width: 315px;
    height: 105px;
  }

  .process-cta-image img {
    object-fit: contain;
  }

  .process-cta-title {
    margin: 0;
    font-size: 31px;
    line-height: 1.25;
  }

  .process-cta-copy p {
    margin: 7px 0 0;
    color: #79645a;
    font-size: 12px;
  }

  .process-cta-actions {
    display: grid;
    gap: 8px;
  }

  .process-cta-actions
    .process-primary-button {
    width: 100%;
  }

  .process-secondary-button {
    min-height: 39px;
    padding: 0 18px;
    border: 1px solid #d7ac92;
    color: #9f6647 !important;
    background: rgba(255, 255, 255, 0.63);
    font-size: 11px;
  }

  @media (max-width: 1260px) {
    .process-steps-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .process-step-card:not(:last-child)::after {
      display: none;
    }

    .process-difference {
      grid-template-columns: 1fr;
    }

    .process-strip-title {
      border-right: 0;
      border-bottom: 1px solid var(--process-line);
      text-align: center;
    }

    .process-cta-inner {
      grid-template-columns:
        230px minmax(0, 1fr) 220px;
    }

    .process-cta-image {
      width: 230px;
    }
  }

  @media (max-width: 980px) {
    .process-hero-inner {
      padding-left: 175px;
    }

    .process-hero-left {
      width: 155px;
    }

    .process-difference-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 14px 0;
    }

    .process-difference-item
      + .process-difference-item {
      border-left: 0;
    }

    .process-difference-item:nth-child(even) {
      border-left: 1px solid var(--process-line);
    }

    .process-difference-item:last-child {
      grid-column: 1 / -1;
      width: 50%;
      justify-self: center;
    }

    .process-recommend {
      grid-template-columns: 1fr;
    }

    .process-recommend-heading {
      border-right: 0;
      border-bottom: 1px solid var(--process-line);
      text-align: center;
    }
  }

  @media (max-width: 860px) {
    .process-hero {
      display: grid;
      min-height: auto;
      background: #fff8f0;
    }

    .process-hero-left {
      display: none;
    }

    .process-hero-image {
      position: relative;
      inset: auto;
      order: 2;
      aspect-ratio: 1.55 / 1;
    }

    .process-hero-inner {
      min-height: auto;
      padding: 45px 22px 38px;
      order: 1;
    }

    .process-hero-copy {
      width: min(650px, 100%);
      margin: 0 auto;
      text-align: center;
    }

    .process-hand-title {
      font-size: clamp(42px, 10vw, 55px);
    }

    .process-steps-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .process-recommend-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .process-recommend-card:last-child {
      grid-column: 1 / -1;
    }

    .process-cta-inner {
      grid-template-columns:
        170px minmax(0, 1fr);
    }

    .process-cta-image {
      width: 170px;
      height: 95px;
    }

    .process-cta-actions {
      grid-column: 1 / -1;
      width: min(320px, 100%);
      justify-self: center;
    }
  }

  @media (max-width: 560px) {
    .process-main,
    .process-cta {
      padding-right: 16px;
      padding-left: 16px;
    }

    .process-hero-inner {
      padding: 37px 17px 32px;
    }

    .process-hand-title {
      font-size: 41px;
    }

    .process-section-title,
    .process-strip-title {
      font-size: 25px;
      text-align: center;
    }

    .process-title-line {
      margin-right: auto;
      margin-left: auto;
    }

    .process-steps-grid {
      grid-template-columns: 1fr;
    }

    .process-step-card {
      min-height: 250px;
    }

    .process-difference-grid {
      grid-template-columns: 1fr;
    }

    .process-difference-item,
    .process-difference-item:nth-child(even) {
      border-left: 0;
    }

    .process-difference-item
      + .process-difference-item {
      border-top: 1px solid var(--process-line);
    }

    .process-difference-item:last-child {
      grid-column: auto;
      width: 100%;
    }

    .process-recommend-grid {
      grid-template-columns: 1fr;
    }

    .process-recommend-card:last-child {
      grid-column: auto;
    }

    .process-quote-card {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .process-quote-house {
      justify-self: center;
    }

    .process-cta-inner {
      padding: 24px 18px 27px;
      grid-template-columns: 1fr;
      text-align: center;
    }

    .process-cta-image {
  position: relative;
  width: 315px;
  height: 105px;
  overflow: hidden;
  border-radius: 12px;
  background: #f7eadb;
}

.process-cta-image img {
  object-fit: cover;
  object-position: center 58%;
}
  }
`;

export default async function ProcessPage() {
  const session = await auth();

  const consultationHref = session?.user
    ? '/dashboard/book'
    : '/login?callbackUrl=/dashboard/book';

  return (
    <div className="storybook-public-page process-storybook-page">
      <StorybookPublicHeader
        activeKey="process"
        ctaHref={consultationHref}
      />

      <main>
        <section className="process-hero">
          <div
            className="process-hero-left"
            aria-hidden="true"
          >
            <Image
              src="/home/storybook/hero-left.webp"
              alt=""
              fill
              priority
              sizes="205px"
            />
          </div>

        <div className="process-hero-image">
  <Image
    src="/home/storybook/process-hero-bright-v2.webp"
    alt="오래된 사진과 카메라, 추억의 앨범이 놓인 밝고 따뜻한 책상"
    fill
    priority
    sizes="(max-width: 860px) 100vw, 58vw"
  />
</div>

          <div className="process-hero-inner">
            <div className="process-hero-copy">
              <h1 className="process-hand-title">
                한 권의 스토리북이
                <br />
                만들어지는 과정
                <span className="process-heart">
                  ♡
                </span>
              </h1>

              <p className="process-hero-description">
                소중한 기억이 따뜻한 책으로
                완성되기까지,
                <br />
                달동네 스토리북의 정성 어린
                제작 과정을 소개합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="process-main">
          <div className="process-main-inner">
            <h2 className="process-section-title">
              스토리북 제작은 이렇게 진행돼요!
              <span className="process-heart">
                ♡
              </span>
            </h2>

            <div
              className="process-title-line"
              aria-hidden="true"
            />

            <div className="process-steps-grid">
              {PROCESS_STEPS.map((step) => (
                <article
                  key={step.number}
                  className="process-step-card"
                >
                  <span className="process-step-number">
                    {step.number}
                  </span>

                  <h3>{step.title}</h3>

                  <div className="process-step-image">
                    <Image
                      src={step.image}
                      alt=""
                      fill
                      sizes="105px"
                    />
                  </div>

                  <p>{step.description}</p>

                  <span className="process-duration">
                    {step.duration}
                  </span>
                </article>
              ))}
            </div>

            <p className="process-total-duration">
              ♡ 전체 제작 기간은 평균{' '}
              <strong>16~26일</strong> 정도
              소요됩니다. 시즌 및 상황에 따라
              변동될 수 있습니다.
            </p>

            <section className="process-difference">
              <h2 className="process-strip-title">
                달동네 스토리북은
                <br />
                다릅니다.
                <span className="process-heart">
                  ♡
                </span>
              </h2>

              <div className="process-difference-grid">
               {DIFFERENCES.map((item) => (
  <article
    key={item.title}
    className="process-difference-item"
  >
    <div>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  </article>
))}
              </div>
            </section>

            <section className="process-recommend">
              <div className="process-recommend-heading">
                <h2 className="process-section-title">
                  이런 분들께
                  <br />
                  추천드려요
                  <span className="process-heart">
                    ♡
                  </span>
                </h2>
              </div>

              <div className="process-recommend-grid">
                {RECOMMENDED_MOMENTS.map((item) => (
                  <article
                    key={item.title}
                    className="process-recommend-card"
                  >
                    <div className="process-recommend-image">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="68px"
                      />
                    </div>

                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}

                <article className="process-quote-card">
                  <blockquote>
                    “세상에 하나뿐인 선물로
                    마음을 전해보세요.”
                  </blockquote>

                  <div
                    className="process-quote-house"
                    aria-hidden="true"
                  >
                    <Image
                      src="/home/storybook/house.webp"
                      alt=""
                      fill
                      sizes="145px"
                    />
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>

        <section className="process-cta">
  <div className="process-cta-inner">
    <div className="process-cta-image">
      <Image
        src="/home/storybook/process-hero-bright-v2.webp"
        alt="추억의 사진과 앨범, 카메라가 놓인 따뜻한 책상"
        fill
        sizes="(max-width: 560px) 220px, 315px"
      />
    </div>

    <div className="process-cta-copy">
      <h2 className="process-cta-title">
        지금, 당신의 이야기를
        들려주세요.
      </h2>

      <p>
        소중한 기억을 책으로 만들어
        드릴게요.
      </p>
    </div>

    <div className="process-cta-actions">
      <Link
        href={consultationHref}
        className="process-primary-button"
      >
        무료 상담 신청하기&nbsp; →
      </Link>

      <Link
        href="/guide#contact"
        className="process-secondary-button"
      >
        빠르게 문의하기
      </Link>
    </div>
  </div>
</section>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    </div>
  );
}
