import { auth } from '@/auth';
import StorybookPublicHeader from '@/components/storybook/StorybookPublicHeader';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const PROCESS_ITEMS = [
  {
    number: '01',
    image: '/home/storybook/process-1.webp',
    title: '사진 보내기',
    description:
      '핸드폰 속 사진을 간편하게 보내주세요.',
  },
  {
    number: '02',
    image: '/home/storybook/process-2.webp',
    title: '이야기 나누기',
    description:
      '인터뷰를 통해 소중한 이야기를 들려주세요.',
  },
  {
    number: '03',
    image: '/home/storybook/process-3.webp',
    title: '스토리 구성',
    description:
      '전문 작가가 이야기를 따뜻하게 엮어드려요.',
  },
  {
    number: '04',
    image: '/home/storybook/process-4.webp',
    title: '스토리북 완성',
    description:
      '세상에 하나뿐인 책으로 정성껏 제작해드려요.',
  },
] as const;

const EXAMPLES = [
  {
    image: '/home/storybook/example-1.webp',
    title: '부모님의 인생 이야기',
    description: '삶의 여정과 소중한 순간들',
  },
  {
    image: '/home/storybook/example-2.webp',
    title: '우리 가족의 추억',
    description: '함께한 시간들을 한 권에',
  },
  {
    image: '/home/storybook/example-3.webp',
    title: '아이의 성장 기록',
    description: '반짝이는 지금을 담아',
  },
  {
    image: '/home/storybook/example-4.webp',
    title: '여행과 함께한 시간들',
    description: '설레는 순간들을 기억해요',
  },
] as const;

function maskCustomerName(name: string) {
  const characters = Array.from(name.trim());

  if (characters.length === 0) {
    return '고객님';
  }

  return `${characters[0]}○○ 고객님`;
}

async function getApprovedReviews() {
  try {
    return await prisma.customerReview.findMany({
      where: {
        status: 'APPROVED',
        isVisible: true,
      },
      orderBy: [
        {
          isFeatured: 'desc',
        },
        {
          approvedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      take: 3,
      select: {
        id: true,
        displayName: true,
        title: true,
        content: true,
        rating: true,
      },
    });
  } catch (error) {
    console.error(
      '스토리북 소개 페이지 후기 조회 오류',
      error,
    );

    return [];
  }
}

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap');

  .about-storybook-page,
  .about-storybook-page * {
    box-sizing: border-box;
  }

  .about-storybook-page {
    --about-ink: #4b3024;
    --about-soft: #725d52;
    --about-coral: #e97861;
    --about-coral-dark: #d9614c;
    --about-cream: #fffaf3;
    --about-line: rgba(127, 87, 65, 0.13);
    width: 100%;
    min-height: 100vh;
    overflow-x: clip;
    color: var(--about-ink);
    background: #fffdf9;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .about-storybook-page a {
    color: inherit;
  }

  .about-hero {
    position: relative;
    min-height: 440px;
    overflow: hidden;
    background:
      linear-gradient(
        90deg,
        rgba(255, 253, 249, 0.99) 0%,
        rgba(255, 253, 249, 0.96) 38%,
        rgba(255, 253, 249, 0.35) 58%,
        rgba(255, 253, 249, 0) 76%
      ),
      #f7efe4;
  }

  .about-hero-left-decoration {
    position: absolute;
    inset: 0 auto 0 0;
    width: 205px;
    opacity: 0.9;
  }

  .about-hero-left-decoration img {
    object-fit: cover;
    object-position: left center;
  }

  .about-hero-art {
    position: absolute;
    inset: 0 0 0 43%;
  }

  .about-hero-art img {
    object-fit: cover;
    object-position: center center;
  }

  .about-hero-inner {
    position: relative;
    z-index: 2;
    width: min(1480px, 100%);
    min-height: 440px;
    margin: 0 auto;
    padding:
      48px
      clamp(26px, 4vw, 62px)
      42px
      clamp(195px, 15vw, 235px);
    display: flex;
    align-items: center;
  }

  .about-hero-copy {
    width: min(485px, 39vw);
  }

  .about-hand-title,
  .about-section-title,
  .about-cta-title {
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-weight: 400;
    letter-spacing: 0.015em;
  }

  .about-hand-title {
    margin: 0;
    font-size: clamp(46px, 4.2vw, 62px);
    line-height: 1.2;
    word-break: keep-all;
  }

  .about-heart {
    margin-left: 8px;
    color: #ef806b;
    font-family: Arial, sans-serif;
    font-size: 0.8em;
    vertical-align: 0.08em;
  }

  .about-hero-description {
    margin: 20px 0 0;
    color: #4e3d34;
    font-size: 16px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .about-primary-button,
  .about-outline-button,
  .about-review-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-weight: 900;
    text-decoration: none;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .about-primary-button {
    min-height: 48px;
    margin-top: 20px;
    padding: 0 27px;
    border: 1px solid #e4745d;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ed8b70,
        #e46d55
      );
    box-shadow:
      0 11px 25px
      rgba(210, 97, 73, 0.2);
    font-size: 14px;
  }

  .about-primary-button:hover,
  .about-outline-button:hover,
  .about-review-button:hover {
    transform: translateY(-2px);
  }

  .about-hero-benefits {
    display: flex;
    align-items: flex-start;
    gap: 27px;
    margin-top: 23px;
  }

  .about-hero-benefit {
    min-width: 0;
    display: grid;
    grid-template-columns: 47px auto;
    align-items: center;
    gap: 8px;
  }

  .about-benefit-icon {
    position: relative;
    width: 47px;
    height: 47px;
    overflow: hidden;
    border: 1px solid rgba(154, 105, 77, 0.2);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.72);
  }

  .about-benefit-icon img {
    object-fit: contain;
    padding: 5px;
  }

  .about-hero-benefit span {
    color: #5e493e;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.45;
    white-space: nowrap;
  }

  .about-process {
    padding: 26px 24px 30px;
    border-top: 1px solid rgba(126, 89, 67, 0.08);
    border-bottom: 1px solid rgba(126, 89, 67, 0.08);
    background:
      linear-gradient(
        180deg,
        #fffdf9,
        #fff8f0
      );
  }

  .about-process-inner {
    width: min(1270px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns:
      minmax(220px, 0.7fr)
      minmax(0, 2.3fr)
      minmax(160px, 0.5fr);
    align-items: center;
    gap: 28px;
  }

  .about-process-heading {
    min-width: 0;
  }

  .about-process-heading h2 {
    margin: 0;
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-size: 27px;
    font-weight: 400;
    line-height: 1.25;
  }

  .about-process-underline {
    width: 92px;
    height: 9px;
    margin-top: 7px;
    border-bottom: 3px solid #ef806b;
    border-radius: 50%;
    transform: rotate(-2deg);
  }

  .about-process-list {
    min-width: 0;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .about-process-item {
    position: relative;
    min-width: 0;
    display: grid;
    grid-template-columns: 68px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
  }

  .about-process-item:not(:last-child)::after {
    position: absolute;
    top: 50%;
    right: -9px;
    content: '→';
    color: #c88b67;
    font-size: 20px;
    transform: translateY(-50%);
  }

  .about-process-image {
    position: relative;
    width: 68px;
    height: 68px;
    overflow: hidden;
    border: 1px solid rgba(151, 102, 73, 0.15);
    border-radius: 50%;
    background: #fffaf4;
  }

  .about-process-image img {
    object-fit: contain;
    padding: 4px;
  }

  .about-process-number {
    color: #c4835d;
    font-size: 17px;
    font-weight: 900;
  }

  .about-process-copy strong {
    color: #46362e;
    font-size: 12px;
  }

  .about-process-copy p {
    margin: 4px 0 0;
    color: #746056;
    font-size: 10px;
    line-height: 1.55;
    word-break: keep-all;
  }

  .about-process-house {
    position: relative;
    width: 170px;
    height: 92px;
    justify-self: end;
  }

  .about-process-house img {
    object-fit: contain;
  }

  .about-main-content {
    padding: 30px 24px 26px;
    background: #fffdf9;
  }

  .about-main-grid {
    width: min(1400px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns:
      minmax(0, 1.35fr)
      minmax(430px, 0.95fr);
    gap: 38px;
  }

  .about-section-title {
    margin: 0;
    font-size: 27px;
    line-height: 1.25;
  }

  .about-examples-grid {
    margin-top: 18px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .about-example-card {
    min-width: 0;
  }

  .about-example-image {
    position: relative;
    aspect-ratio: 1.35 / 1;
    overflow: hidden;
    border-radius: 8px;
    background: #f4eee7;
    box-shadow:
      0 8px 22px
      rgba(84, 56, 40, 0.07);
  }

  .about-example-image img {
    object-fit: cover;
    transition: transform 240ms ease;
  }

  .about-example-card:hover
    .about-example-image img {
    transform: scale(1.035);
  }

  .about-example-card h3 {
    margin: 10px 0 0;
    color: #4a372e;
    font-size: 13px;
    text-align: center;
  }

  .about-example-card p {
    margin: 4px 0 0;
    color: #89756a;
    font-size: 10px;
    line-height: 1.45;
    text-align: center;
  }

  .about-example-action {
    display: flex;
    justify-content: center;
    margin-top: 17px;
  }

  .about-outline-button {
    min-height: 38px;
    padding: 0 20px;
    border: 1px solid #e3bda8;
    color: #bf654f !important;
    background: #fffdf9;
    font-size: 12px;
  }

  .about-reviews {
    min-width: 0;
    padding-left: 34px;
    border-left: 1px solid var(--about-line);
  }

  .about-review-list {
    margin-top: 18px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .about-review-card {
    position: relative;
    min-width: 0;
    min-height: 150px;
    padding: 31px 16px 18px;
    border: 1px solid rgba(125, 85, 62, 0.09);
    border-radius: 15px;
    background: #ffffff;
    box-shadow:
      0 8px 22px
      rgba(84, 56, 40, 0.06);
  }

  .about-review-card::before {
    position: absolute;
    top: 6px;
    left: 14px;
    content: '“';
    color: #f3aa98;
    font-size: 38px;
    font-weight: 900;
    line-height: 1;
  }

  .about-review-stars {
    display: flex;
    gap: 1px;
    margin-bottom: 8px;
    color: #e0d6d0;
    font-size: 11px;
  }

  .about-review-stars .is-active {
    color: #f19a69;
  }

  .about-review-card h3 {
    margin: 0 0 7px;
    color: #4b3429;
    font-size: 12px;
    line-height: 1.45;
  }

  .about-review-card p {
    margin: 0;
    color: #5c4a41;
    font-size: 11px;
    line-height: 1.7;
    word-break: keep-all;
  }

  .about-review-card small {
    display: block;
    margin-top: 12px;
    color: #7c685d;
    font-size: 10px;
    text-align: right;
  }

  .about-review-empty {
    grid-column: 1 / -1;
    min-height: 150px;
    padding: 25px;
    display: grid;
    place-items: center;
    border: 1px dashed rgba(130, 90, 67, 0.2);
    border-radius: 15px;
    color: #7d695e;
    background: #fffaf6;
    font-size: 12px;
    line-height: 1.7;
    text-align: center;
  }

  .about-review-action {
    display: flex;
    justify-content: center;
    margin-top: 17px;
  }

  .about-review-button {
    min-height: 38px;
    padding: 0 20px;
    border: 1px solid #efaa95;
    color: #c85f49 !important;
    background: #fff8f4;
    font-size: 12px;
  }

  .about-cta {
    padding: 0 24px 38px;
    background: #fffdf9;
  }

  .about-cta-inner {
    position: relative;
    width: min(1400px, 100%);
    min-height: 126px;
    margin: 0 auto;
    padding: 20px 34px;
    display: grid;
    grid-template-columns:
      minmax(270px, 0.7fr)
      minmax(0, 1.25fr)
      minmax(230px, 0.55fr);
    align-items: center;
    gap: 28px;
    overflow: hidden;
    border: 1px solid rgba(177, 126, 88, 0.2);
    border-radius: 16px;
    background:
      radial-gradient(
        circle at 18% 30%,
        rgba(255, 255, 255, 0.88),
        transparent 18rem
      ),
      linear-gradient(
        135deg,
        #fff4e8,
        #f8ead8
      );
  }

  .about-cta-image {
    position: relative;
    width: 290px;
    height: 104px;
  }

  .about-cta-image img {
    object-fit: contain;
  }

  .about-cta-title {
    margin: 0;
    font-size: 31px;
    line-height: 1.25;
  }

  .about-cta-copy p {
    margin: 7px 0 0;
    color: #79645a;
    font-size: 13px;
  }

  .about-cta-actions {
    display: grid;
    gap: 8px;
  }

  .about-cta-actions .about-primary-button {
    width: 100%;
    margin-top: 0;
  }

  .about-cta-contact {
    display: inline-flex;
    min-height: 40px;
    align-items: center;
    justify-content: center;
    border: 1px solid #d9ae94;
    border-radius: 999px;
    color: #9f6647 !important;
    background: rgba(255, 255, 255, 0.58);
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
  }

  @media (max-width: 1180px) {
    .about-hero-inner {
      padding-left: 180px;
    }

    .about-hero-left-decoration {
      width: 170px;
    }

    .about-hero-copy {
      width: min(450px, 43vw);
    }

    .about-process-inner {
      grid-template-columns:
        minmax(180px, 0.55fr)
        minmax(0, 2.45fr);
    }

    .about-process-house {
      display: none;
    }

    .about-main-grid {
      grid-template-columns: 1fr;
    }

    .about-reviews {
      padding-top: 27px;
      padding-left: 0;
      border-top: 1px solid var(--about-line);
      border-left: 0;
    }

    .about-cta-inner {
      grid-template-columns:
        230px minmax(0, 1fr) 220px;
    }

    .about-cta-image {
      width: 230px;
    }
  }

  @media (max-width: 860px) {
    .about-hero {
      display: grid;
      min-height: auto;
      background: #fff8f0;
    }

    .about-hero-left-decoration {
      display: none;
    }

    .about-hero-art {
      position: relative;
      inset: auto;
      order: 2;
      aspect-ratio: 1.45 / 1;
    }

    .about-hero-inner {
      min-height: auto;
      padding: 46px 22px 38px;
      order: 1;
    }

    .about-hero-copy {
      width: min(650px, 100%);
      margin: 0 auto;
      text-align: center;
    }

    .about-hand-title {
      font-size: clamp(43px, 10vw, 57px);
    }

    .about-hero-benefits {
      justify-content: center;
      flex-wrap: wrap;
    }

    .about-process-inner {
      grid-template-columns: 1fr;
    }

    .about-process-heading {
      text-align: center;
    }

    .about-process-underline {
      margin-right: auto;
      margin-left: auto;
    }

    .about-process-list {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 22px 18px;
    }

    .about-process-item:not(:last-child)::after {
      display: none;
    }

    .about-examples-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .about-review-list {
      grid-template-columns: 1fr;
    }

    .about-cta-inner {
      grid-template-columns:
        170px minmax(0, 1fr);
    }

    .about-cta-image {
      width: 170px;
      height: 95px;
    }

    .about-cta-actions {
      grid-column: 1 / -1;
      width: min(320px, 100%);
      justify-self: center;
    }
  }

  @media (max-width: 560px) {
    .about-hero-inner {
      padding: 38px 17px 32px;
    }

    .about-hand-title {
      font-size: 42px;
    }

    .about-hero-description {
      font-size: 15px;
    }

    .about-hero-benefits {
      display: grid;
      grid-template-columns: 1fr;
      width: max-content;
      margin-right: auto;
      margin-left: auto;
    }

    .about-process {
      padding-right: 16px;
      padding-left: 16px;
    }

    .about-process-list {
      grid-template-columns: 1fr;
    }

    .about-process-item {
      grid-template-columns: 62px minmax(0, 1fr);
      max-width: 340px;
      margin: 0 auto;
    }

    .about-process-image {
      width: 62px;
      height: 62px;
    }

    .about-main-content {
      padding-right: 16px;
      padding-left: 16px;
    }

    .about-examples-grid {
      grid-template-columns: 1fr;
      gap: 22px;
    }

    .about-section-title {
      font-size: 25px;
      text-align: center;
    }

    .about-cta {
      padding-right: 16px;
      padding-left: 16px;
    }

    .about-cta-inner {
      padding: 25px 18px 27px;
      grid-template-columns: 1fr;
      text-align: center;
    }

    .about-cta-image {
      width: 220px;
      height: 105px;
      justify-self: center;
    }

    .about-cta-title {
      font-size: 29px;
    }
  }
`;

export default async function AboutPage() {
  const [session, reviews] =
    await Promise.all([
      auth(),
      getApprovedReviews(),
    ]);

  const startHref = session?.user
    ? '/dashboard'
    : '/login?callbackUrl=/dashboard';

  return (
    <div className="storybook-public-page about-storybook-page">
      <StorybookPublicHeader
        activeKey="about"
        ctaHref={startHref}
      />

      <main>
        <section className="about-hero">
          <div
            className="about-hero-left-decoration"
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

          <div className="about-hero-art">
            <Image
              src="/home/storybook/hero-book.webp"
              alt="가족의 이야기가 담긴 펼쳐진 스토리북"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 60vw"
            />
          </div>

          <div className="about-hero-inner">
            <div className="about-hero-copy">
              <h1 className="about-hand-title">
                오늘의 추억이,
                <br />
                내일의 이야기가 됩니다
                <span className="about-heart">
                  ♡
                </span>
              </h1>

              <p className="about-hero-description">
                사진과 이야기로 담아두는 당신의
                소중한 순간들.
                <br />
                세상에 하나뿐인 스토리북으로
                오래도록 간직하세요.
              </p>

              <Link
                href={startHref}
                className="about-primary-button"
              >
                스토리북 만들기&nbsp; →
              </Link>

              <div className="about-hero-benefits">
                {[
                  {
                    image:
                      '/home/storybook/process-1.webp',
                    text: '사진과 이야기를 담아',
                  },
                  {
                    image:
                      '/home/storybook/process-3.webp',
                    text: '세상에 하나뿐인 책으로',
                  },
                  {
                    image:
                      '/home/storybook/process-4.webp',
                    text: '소중한 사람에게 선물로',
                  },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="about-hero-benefit"
                  >
                    <div className="about-benefit-icon">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="47px"
                      />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="about-process">
          <div className="about-process-inner">
            <div className="about-process-heading">
              <h2>
                이야기가 책이 되는 과정
                <span className="about-heart">
                  ♡
                </span>
              </h2>
              <div
                className="about-process-underline"
                aria-hidden="true"
              />
            </div>

            <div className="about-process-list">
              {PROCESS_ITEMS.map((item) => (
                <article
                  key={item.number}
                  className="about-process-item"
                >
                  <div className="about-process-image">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="68px"
                    />
                  </div>

                  <div className="about-process-copy">
                    <div>
                      <span className="about-process-number">
                        {item.number}
                      </span>{' '}
                      <strong>{item.title}</strong>
                    </div>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div
              className="about-process-house"
              aria-hidden="true"
            >
              <Image
                src="/home/storybook/house.webp"
                alt=""
                fill
                sizes="170px"
              />
            </div>
          </div>
        </section>

        <section className="about-main-content">
          <div className="about-main-grid">
            <div>
              <h2 className="about-section-title">
                따뜻한 이야기, 실제 작품
              </h2>

              <div className="about-examples-grid">
                {EXAMPLES.map((example) => (
                  <article
                    key={example.title}
                    className="about-example-card"
                  >
                    <div className="about-example-image">
                      <Image
                        src={example.image}
                        alt={example.title}
                        fill
                        sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, 25vw"
                      />
                    </div>

                    <h3>{example.title}</h3>
                    <p>{example.description}</p>
                  </article>
                ))}
              </div>

              <div className="about-example-action">
                <Link
                  href="/trial"
                  className="about-outline-button"
                >
                  더 많은 작품 보기&nbsp; →
                </Link>
              </div>
            </div>

            <div className="about-reviews">
              <h2 className="about-section-title">
                고객님들의 진심 어린 이야기
                <span className="about-heart">
                  ♡
                </span>
              </h2>

              <div className="about-review-list">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <article
                      key={review.id}
                      className="about-review-card"
                    >
                      <div
                        className="about-review-stars"
                        aria-label={`별점 ${review.rating}점`}
                      >
                        {[1, 2, 3, 4, 5].map(
                          (score) => (
                            <span
                              key={score}
                              className={
                                score <= review.rating
                                  ? 'is-active'
                                  : ''
                              }
                              aria-hidden="true"
                            >
                              ★
                            </span>
                          ),
                        )}
                      </div>

                      {review.title ? (
                        <h3>{review.title}</h3>
                      ) : null}

                      <p>{review.content}</p>

                      <small>
                        –{' '}
                        {maskCustomerName(
                          review.displayName,
                        )}
                      </small>
                    </article>
                  ))
                ) : (
                  <div className="about-review-empty">
                    아직 공개된 고객 후기가
                    없습니다.
                    <br />
                    첫 번째 따뜻한 후기를
                    들려주세요.
                  </div>
                )}
              </div>

              <div className="about-review-action">
                <Link
                  href="/reviews"
                  className="about-review-button"
                >
                  고객 후기 작성하기&nbsp; →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="about-cta">
          <div className="about-cta-inner">
            <div className="about-cta-image">
              <Image
                src="/home/storybook/house.webp"
                alt="따뜻한 달동네 집 그림"
                fill
                sizes="290px"
              />
            </div>

            <div className="about-cta-copy">
              <h2 className="about-cta-title">
                당신의 이야기도 책이 될 때,
                <br />
                세상에 단 하나뿐인 선물이 됩니다.
                <span className="about-heart">
                  ♡
                </span>
              </h2>
              <p>
                지금, 소중한 순간을 스토리북으로
                남겨보세요.
              </p>
            </div>

            <div className="about-cta-actions">
              <Link
                href={startHref}
                className="about-primary-button"
              >
                스토리북 만들기&nbsp; →
              </Link>

              <Link
                href="/guide#contact"
                className="about-cta-contact"
              >
                상담 문의하기
              </Link>
            </div>
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
