import StorybookPublicHeader from '@/components/storybook/StorybookPublicHeader';
import { auth } from '@/auth';
import HomeGuidePopup from '@/components/home/HomeGuidePopup';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

const processSteps = [
  {
    image: '/home/storybook/process-1.webp',
    title: '사진 보내기',
    description: '핸드폰 속 사진을 보내주세요.',
  },
  {
    image: '/home/storybook/process-2.webp',
    title: '이야기 나누기',
    description: '간단한 인터뷰로 이야기를 들려주세요.',
  },
  {
    image: '/home/storybook/process-3.webp',
    title: '스토리 구성',
    description: '이야기를 예쁘게 엮어 스토리를 만듭니다.',
  },
  {
    image: '/home/storybook/process-4.webp',
    title: '스토리북 완성',
    description: '세상에 하나뿐인 책이 완성됩니다.',
  },
];

const storybookExamples = [
  {
    image:
      '/home/storybook/anime/anime-mother-baby.webp',
    label: '엄마와 아기의 사랑',
  },
  {
    image:
      '/home/storybook/anime/anime-boy-cat.webp',
    label: '나의 반려와 함께한 추억',
  },
  {
    image:
      '/home/storybook/anime/anime-elderly-couple.webp',
    label: '부모님의 인생 이야기',
  },
  {
    image:
      '/home/storybook/anime/anime-family-spring.webp',
    label: '우리 가족의 봄날',
  },
];

const recommendationItems = [
  {
    image:
      '/home/storybook/recommend-parents.webp',
    text: '부모님의 인생 이야기를\n선물하고 싶을 때',
  },
  {
    image:
      '/home/storybook/recommend-couple.webp',
    text: '연인과의 추억을\n오래 간직하고 싶을 때',
  },
  {
    image:
      '/home/storybook/recommend-child.webp',
    text: '아이의 성장 과정을\n기록하고 싶을 때',
  },
  {
    image:
      '/home/storybook/recommend-pet.webp',
    text: '반려동물과 함께한 시간을\n남기고 싶을 때',
  },
  {
    image:
      '/home/storybook/recommend-friend.webp',
    text: '친구와의 우정을\n특별한 선물로 만들 때',
  },
];

function maskCustomerReviewName(
  displayName: string,
) {
  const characters = Array.from(
    displayName.trim(),
  );

  if (characters.length === 0) {
    return '고객님';
  }

  return `${characters[0]}○○ 고객님`;
}

async function getApprovedCustomerReviews() {
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
      take: 4,
      select: {
        id: true,
        displayName: true,
        title: true,
        content: true,
        rating: true,
        isFeatured: true,
      },
    });
  } catch (error) {
    console.error(
      '홈페이지 고객 후기 조회 오류',
      error,
    );

    return [];
  }
}

const homeStyles = `
  body:has(.storybook-home) > [role='banner'] {
    display: none !important;
  }

  .storybook-home,
  .storybook-home * {
    box-sizing: border-box;
  }

  .storybook-home {
    --storybook-ink: #4b3024;
    --storybook-soft-ink: #6f5b51;
    --storybook-coral: #ed8568;
    --storybook-coral-dark: #d96f55;
    --storybook-cream: #fbf5ee;
    --storybook-paper: #fffdf9;
    --storybook-line: rgba(133, 91, 69, 0.16);
    width: 100%;
    overflow-x: clip;
    color: var(--storybook-ink);
    background: #fbf6f0;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .storybook-home a {
    color: inherit;
  }

  .storybook-site-header {
    position: sticky;
    top: 0;
    z-index: 1000;
    width: 100%;
    border-bottom: 1px solid rgba(139, 98, 75, 0.1);
    background: rgba(255, 253, 249, 0.96);
    box-shadow: 0 4px 18px rgba(83, 53, 38, 0.04);
    backdrop-filter: blur(14px);
  }

  .storybook-site-header-inner {
    width: min(1390px, 100%);
    min-height: 80px;
    margin: 0 auto;
    padding: 12px 34px;
    display: grid;
    grid-template-columns: minmax(210px, 0.8fr) minmax(540px, 1.6fr) minmax(190px, 0.55fr);
    align-items: center;
    gap: 22px;
  }

  .storybook-logo {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: max-content;
    text-decoration: none;
    font-family: 'Gowun Batang', serif;
    font-size: clamp(23px, 2vw, 31px);
    font-weight: 700;
    letter-spacing: -0.055em;
    white-space: nowrap;
  }

  .storybook-logo-heart {
    color: var(--storybook-coral);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 27px;
    font-weight: 500;
    transform: translateY(-1px) rotate(-8deg);
  }

  .storybook-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(18px, 2.4vw, 38px);
    white-space: nowrap;
  }

  .storybook-nav a {
    position: relative;
    padding: 10px 0;
    color: #4d382e;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
  }

  .storybook-nav a::after {
    position: absolute;
    right: 0;
    bottom: 3px;
    left: 0;
    height: 2px;
    content: '';
    border-radius: 999px;
    background: var(--storybook-coral);
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 160ms ease;
  }

  .storybook-nav a:hover::after,
  .storybook-nav a:focus-visible::after {
    transform: scaleX(1);
  }

  .storybook-header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .storybook-admin-link {
    color: #8a6d60;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
  }

  .storybook-header-cta,
  .storybook-primary-button,
  .storybook-outline-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 900;
    transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

.storybook-header-actions {
  gap: 6px;
}

.storybook-login-link {
  min-height: 40px;
  padding: 0 11px;
  font-size: 12px;
}

  .storybook-header-cta {
    min-height: 46px;
    padding: 0 24px;
    border: 1px solid #e98569;
    background: linear-gradient(135deg, #f39b80, #ea7c63);
    color: #ffffff;
    font-size: 14px;
    box-shadow: 0 10px 22px rgba(211, 102, 77, 0.2);
    white-space: nowrap;
  }

  .storybook-header-cta:hover,
  .storybook-primary-button:hover,
  .storybook-outline-button:hover {
    transform: translateY(-2px);
  }

  .storybook-mobile-nav {
    display: none;
  }

  .storybook-hero {
    position: relative;
    min-height: 522px;
    overflow: hidden;
    border-bottom: 1px solid rgba(133, 91, 69, 0.11);
    background:
      radial-gradient(circle at 33% 18%, rgba(255, 255, 255, 0.92), transparent 25rem),
      linear-gradient(90deg, #fbf3e9 0%, #fbf7f0 46%, #f4eadc 100%);
  }

  .storybook-hero::after {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    opacity: 0.25;
    background-image:
      repeating-linear-gradient(
        0deg,
        rgba(99, 71, 55, 0.03) 0,
        rgba(99, 71, 55, 0.03) 1px,
        transparent 1px,
        transparent 4px
      );
  }

  .storybook-hero-inner {
    position: relative;
    z-index: 1;
    width: min(1536px, 100%);
    min-height: 522px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(420px, 0.83fr) minmax(640px, 1.37fr);
  }

  .storybook-hero-copy {
    position: relative;
    z-index: 2;
    padding: 68px 34px 52px max(44px, calc((100vw - 1390px) / 2 + 34px));
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .storybook-hero-left-decoration {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 235px;
    overflow: hidden;
    pointer-events: none;
    opacity: 0.95;
  }

  .storybook-hero-left-decoration img {
    object-fit: cover;
    object-position: left center;
  }

  .storybook-hero-copy-content {
    position: relative;
    z-index: 2;
    width: min(570px, 100%);
    margin-left: clamp(80px, 11vw, 180px);
    animation: storybookFadeUp 700ms ease both;
  }

  .storybook-title {
    margin: 0;
    font-family:
  'Gamja Flower',
  'MapoFlowerIsland',
  cursive;
  font-weight: 400;
   font-synthesis: none;
    font-size: clamp(42px, 4.25vw, 62px);
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: -0.065em;
    word-break: keep-all;
  }

  .storybook-title-heart {
    display: inline-block;
    margin-left: 7px;
    color: var(--storybook-coral);
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 0.66em;
    font-weight: 500;
    transform: translateY(-3px) rotate(-9deg);
  }

  .storybook-description {
    margin: 25px 0 0;
    color: #5f4d44;
    font-size: clamp(16px, 1.32vw, 19px);
    line-height: 1.8;
    word-break: keep-all;
  }

  .storybook-highlight {
    margin: 16px 0 0;
    color: #df7861;
    font-family: 'Gowun Batang', serif;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.6;
  }

  .storybook-primary-button {
    width: max-content;
    min-height: 49px;
    margin-top: 24px;
    padding: 0 24px;
    border: 1px solid #e98569;
    background: linear-gradient(135deg, #f29a7e, #e97860);
    color: #ffffff;
    font-size: 14px;
    box-shadow: 0 10px 23px rgba(205, 97, 73, 0.2);
  }

  .storybook-primary-button:hover {
    background: linear-gradient(135deg, #ed8d72, #dc6f57);
    box-shadow: 0 14px 27px rgba(205, 97, 73, 0.27);
  }

  .storybook-quick-steps {
    margin-top: 30px;
    display: flex;
    align-items: flex-start;
    gap: 26px;
  }

  .storybook-quick-step {
    position: relative;
    min-width: 96px;
    text-align: center;
  }

  .storybook-quick-step:not(:last-child)::after {
    position: absolute;
    top: 17px;
    right: -19px;
    content: '→';
    color: #c48769;
    font-size: 18px;
  }

  .storybook-quick-icon {
    width: 42px;
    height: 42px;
    margin: 0 auto 7px;
    display: grid;
    place-items: center;
    border: 1px solid #a77a64;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.55);
    color: #6c4b3d;
    font-size: 20px;
  }

  .storybook-quick-step:nth-child(2) .storybook-quick-icon {
    border-radius: 50%;
  }

  .storybook-quick-step p {
    margin: 0;
    color: #6b574e;
    font-size: 11px;
    line-height: 1.55;
    white-space: nowrap;
  }

  .storybook-hero-art {
    position: relative;
    min-width: 0;
    min-height: 522px;
    overflow: hidden;
  }

  .storybook-hero-art img {
    object-fit: cover;
    object-position: center center;
  }


  .storybook-hero-art::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    width: 100px;
    content: '';
    background: linear-gradient(90deg, #fbf6ef, rgba(251, 246, 239, 0));
    pointer-events: none;
  }

    .storybook-product-choice {
    border-bottom: 1px solid rgba(133, 91, 69, 0.12);
    background:
      radial-gradient(
        circle at 12% 15%,
        rgba(255, 255, 255, 0.82),
        transparent 20rem
      ),
      linear-gradient(180deg, #fffaf5 0%, #fff5ec 100%);
  }

  .storybook-product-choice-inner {
    width: min(1240px, 100%);
    margin: 0 auto;
    padding: 32px 34px 34px;
  }

  .storybook-product-choice-heading {
    margin-bottom: 22px;
    text-align: center;
  }

  .storybook-product-choice-kicker {
    margin: 0;
    color: #dc735b;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .storybook-product-choice-title {
    margin: 7px 0 0;
    color: #4f382e;
    font-family: 'Gowun Batang', serif;
    font-size: clamp(28px, 2.4vw, 36px);
    font-weight: 700;
    line-height: 1.35;
    word-break: keep-all;
  }

  .storybook-product-choice-description {
    margin: 8px 0 0;
    color: #766158;
    font-size: 13px;
    line-height: 1.7;
    word-break: keep-all;
  }

  .storybook-product-choice-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .storybook-product-choice-card {
    min-width: 0;
    min-height: 190px;
    display: grid;
    grid-template-columns: minmax(170px, 38%) minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid rgba(177, 122, 89, 0.16);
    border-radius: 20px;
    color: #4f392f !important;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 12px 28px rgba(91, 58, 42, 0.07);
    text-decoration: none;
    transition:
      transform 170ms ease,
      border-color 170ms ease,
      box-shadow 170ms ease;
  }

  .storybook-product-choice-card:hover,
  .storybook-product-choice-card:focus-visible {
    transform: translateY(-3px);
    border-color: #e59a82;
    box-shadow: 0 17px 34px rgba(181, 93, 65, 0.12);
    outline: none;
  }

  .storybook-product-choice-image {
    position: relative;
    min-width: 0;
    min-height: 190px;
    overflow: hidden;
    background: #f4e9de;
  }

  .storybook-product-choice-image img {
    object-fit: cover;
    object-position: center center;
  }

  .storybook-product-choice-copy {
    min-width: 0;
    padding: 22px 22px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .storybook-product-choice-badge {
    width: max-content;
    padding: 5px 10px;
    border-radius: 999px;
    color: #c7654f;
    background: #fff0e9;
    font-size: 11px;
    font-weight: 900;
  }

  .storybook-product-choice-copy h3 {
    margin: 10px 0 0;
    font-family: 'Gowun Batang', serif;
    font-size: 24px;
    line-height: 1.35;
  }

  .storybook-product-choice-copy p {
    margin: 8px 0 0;
    color: #756057;
    font-size: 12px;
    line-height: 1.7;
    word-break: keep-all;
  }

  .storybook-product-choice-action {
    margin-top: 13px;
    color: #c75f49;
    font-size: 12px;
    font-weight: 900;
  }

  @media (max-width: 930px) {
    .storybook-product-choice-inner {
      padding: 28px 20px 30px;
    }

    .storybook-product-choice-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .storybook-product-choice-inner {
      padding: 25px 16px 27px;
    }

    .storybook-product-choice-card {
      grid-template-columns: 120px minmax(0, 1fr);
      min-height: 160px;
    }

    .storybook-product-choice-image {
      min-height: 160px;
    }

    .storybook-product-choice-copy {
      padding: 17px 15px;
    }

    .storybook-product-choice-copy h3 {
      font-size: 20px;
    }
  }


  .storybook-main-grid {
    width: min(1536px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-bottom: 1px solid rgba(133, 91, 69, 0.12);
    background: #fffdf9;
  }

  .storybook-column {
    min-width: 0;
    padding: 28px 24px 24px;
  }

  .storybook-column + .storybook-column {
    border-left: 1px solid rgba(133, 91, 69, 0.12);
  }

 .storybook-section-title {
  margin: 0 0 18px;
  font-family: 'Gowun Batang', serif;
  font-size: clamp(29px, 2.73vw, 36px);
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  letter-spacing: -0.04em;
  word-break: keep-all;
}

  .storybook-section-title span {
    color: var(--storybook-coral);
  }

  .storybook-process-list {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 7px;
  }

  .storybook-process-card {
    position: relative;
    min-width: 0;
    text-align: center;
  }

  .storybook-process-card:not(:last-child)::after {
    position: absolute;
    top: 62px;
    right: -8px;
    z-index: 2;
    content: '→';
    color: #a9694f;
    font-size: 18px;
  }

  .storybook-process-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1.04;
    margin: 0 auto 12px;
    overflow: hidden;
    border-radius: 50%;
    background: #f8efe3;
  }

  .storybook-process-image img {
    object-fit: cover;
  }

  .storybook-process-card h3 {
    margin: 0;
    color: #4f392f;
    font-size: 13px;
    line-height: 1.45;
    word-break: keep-all;
  }

  .storybook-process-card p {
    margin: 7px 0 0;
    color: #78655b;
    font-size: 11px;
    line-height: 1.65;
    word-break: keep-all;
  }

  .storybook-outline-button {
    min-height: 38px;
    margin: 20px auto 0;
    padding: 0 20px;
    border: 1px solid rgba(112, 78, 62, 0.35);
    background: rgba(255, 255, 255, 0.72);
    color: #5d453a;
    font-size: 12px;
  }

  .storybook-example-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .storybook-example-card {
    min-width: 0;
  }

  .storybook-example-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1.44 / 1;
    overflow: hidden;
    border-radius: 13px;
    background: #eee4d8;
    box-shadow: 0 9px 22px rgba(91, 58, 42, 0.13);
  }

  .storybook-example-image img {
    object-fit: cover;
  }

  .storybook-example-label {
    margin: 8px 0 0;
    color: #654e43;
    font-size: 12px;
    font-weight: 700;
    text-align: center;
  }

  .storybook-review-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .storybook-review-card {
    position: relative;
    min-height: 140px;
    padding: 25px 18px 17px;
    border: 1px solid rgba(133, 91, 69, 0.09);
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 8px 20px rgba(83, 53, 38, 0.05);
  }

  .storybook-review-card::before {
    position: absolute;
    top: 7px;
    left: 15px;
    content: '“';
    color: #f5b2a1;
    font-size: 40px;
    font-weight: 900;
    line-height: 1;
  }

  .storybook-review-card p {
    margin: 0;
    color: #5a473e;
    font-size: 12px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .storybook-review-card small {
    display: block;
    margin-top: 12px;
    color: #76645a;
    font-size: 11px;
    text-align: right;
  }
 
  .storybook-side-cta {
    min-height: 120px;
    padding: 14px 16px;
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    align-items: center;
    gap: 14px;
    overflow: hidden;
    border: 1px solid rgba(133, 91, 69, 0.09);
    border-radius: 18px;
    background: linear-gradient(135deg, #fffefa, #fbf1e7);
    box-shadow: 0 8px 20px rgba(83, 53, 38, 0.05);
  }

  .storybook-side-cta-image {
    position: relative;
    width: 120px;
    height: 94px;
  }
  .storybook-side-cta-image img {
  border-radius: 12px;
  object-fit: cover;
  object-position: center center;
}

  .storybook-side-cta-copy h3 {
    margin: 0;
    font-family: 'Gowun Batang', serif;
    font-size: 18px;
    line-height: 1.5;
    word-break: keep-all;
  }

  .storybook-side-cta-copy .storybook-primary-button {
    min-height: 38px;
    margin-top: 12px;
    padding: 0 21px;
    font-size: 12px;
  }

  .storybook-recommend {
    border-bottom: 1px solid rgba(133, 91, 69, 0.12);
    background:
      radial-gradient(circle at 8% 50%, rgba(255, 255, 255, 0.65), transparent 22rem),
      linear-gradient(180deg, #fbf8f3, #f8eee4);
  }

  .storybook-recommend-inner {
    width: min(1390px, 100%);
    margin: 0 auto;
    padding: 22px 28px;
    display: grid;
    grid-template-columns: minmax(180px, 0.54fr) minmax(0, 2.46fr) minmax(290px, 0.95fr);
    align-items: center;
    gap: 20px;
  }

  .storybook-recommend-title {
    margin: 0;
    font-family: 'Gowun Batang', serif;
    font-size: clamp(24px, 2.2vw, 31px);
    font-weight: 700;
    line-height: 1.45;
    letter-spacing: -0.04em;
  }

  .storybook-recommend-title span {
    color: var(--storybook-coral);
  }

  .storybook-recommend-list {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
  }

  .storybook-recommend-card {
    min-width: 0;
    padding: 4px 9px;
    text-align: center;
  }

  .storybook-recommend-card + .storybook-recommend-card {
    border-left: 1px solid rgba(133, 91, 69, 0.12);
  }

  .storybook-recommend-image {
  position: relative;
  width: 86px;
  height: 68px;
  margin: 10px auto 5px;
}

  .storybook-recommend-image img {
  border-radius: 10px;
  object-fit: cover;
  object-position: center center;
}

  .storybook-recommend-card p {
    margin: 0;
    color: #5c473d;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.55;
    white-space: pre-line;
    word-break: keep-all;
  }

  .storybook-bottom-cta {
    min-height: 106px;
    padding: 14px 18px;
    display: grid;
    grid-template-columns: 82px minmax(0, 1fr);
    align-items: center;
    gap: 13px;
    border: 1px solid rgba(133, 91, 69, 0.1);
    border-radius: 17px;
    background: rgba(255, 253, 249, 0.78);
    box-shadow: 0 9px 21px rgba(83, 53, 38, 0.05);
  }

  .storybook-bottom-cta-image {
    position: relative;
    width: 82px;
    height: 68px;
  }

  .storybook-bottom-cta-image img {
  border-radius: 10px;
  object-fit: cover;
  object-position: center center;
}

  .storybook-bottom-cta h3 {
    margin: 0;
    font-family: 'Gowun Batang', serif;
    font-size: 17px;
    line-height: 1.5;
    word-break: keep-all;
  }

  .storybook-bottom-cta .storybook-primary-button {
    min-height: 38px;
    margin-top: 10px;
    padding: 0 20px;
    font-size: 12px;
  }

  @keyframes storybookFadeUp {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 1180px) {
    .storybook-site-header-inner {
      grid-template-columns: auto 1fr auto;
      padding-right: 22px;
      padding-left: 22px;
    }

    .storybook-nav {
      gap: 17px;
    }

    .storybook-nav a {
      font-size: 13px;
    }

    .storybook-hero-inner {
      grid-template-columns: minmax(390px, 0.85fr) minmax(560px, 1.15fr);
    }

    .storybook-hero-copy {
      padding-left: 30px;
    }

    .storybook-hero-copy-content {
      margin-left: 105px;
    }

    .storybook-main-grid {
      grid-template-columns: 1fr 1fr;
    }

    .storybook-column:last-child {
      grid-column: 1 / -1;
      border-top: 1px solid rgba(133, 91, 69, 0.12);
      border-left: 0;
    }

    .storybook-review-list {
      width: min(760px, 100%);
      margin: 0 auto;
    }

    .storybook-side-cta {
      width: min(760px, 100%);
      margin: 0 auto;
    }

    .storybook-recommend-inner {
      grid-template-columns: 1fr;
    }

    .storybook-recommend-title {
      text-align: center;
    }

    .storybook-bottom-cta {
      width: min(520px, 100%);
      margin: 0 auto;
    }
  }

  @media (max-width: 930px) {
    .storybook-site-header-inner {
      min-height: 72px;
      display: flex;
      justify-content: space-between;
    }

    .storybook-nav,
    .storybook-admin-link {
  color: #8a6d60;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.storybook-login-link {
  min-height: 42px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e6b49d;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #8b5847;
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
  white-space: nowrap;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
}

.storybook-login-link:hover {
  transform: translateY(-2px);
  border-color: #df9278;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(137, 84, 64, 0.12);
}

    .storybook-logo {
      font-size: 25px;
    }

    .storybook-header-cta {
      min-height: 42px;
      padding: 0 18px;
      font-size: 13px;
    }

    .storybook-mobile-nav {
      display: flex;
      width: 100%;
      padding: 0 14px 11px;
      gap: 8px;
      overflow-x: auto;
      background: rgba(255, 253, 249, 0.96);
    }

    .storybook-mobile-nav a {
      flex: 0 0 auto;
      padding: 8px 12px;
      border: 1px solid rgba(133, 91, 69, 0.12);
      border-radius: 999px;
      background: #fffaf5;
      color: #5f493e;
      font-size: 12px;
      font-weight: 800;
      text-decoration: none;
    }

    .storybook-hero-inner {
      grid-template-columns: 1fr;
    }

    .storybook-hero-copy {
      min-height: 470px;
      padding: 52px 24px 40px;
      text-align: center;
    }

    .storybook-hero-left-decoration {
      width: 180px;
      opacity: 0.5;
    }

    .storybook-hero-copy-content {
      width: min(610px, 100%);
      margin: 0 auto;
    }

    .storybook-primary-button {
      margin-right: auto;
      margin-left: auto;
    }

    .storybook-quick-steps {
      justify-content: center;
    }

    .storybook-hero-art {
      min-height: 430px;
    }

    .storybook-hero-art::before {
      top: 0;
      right: 0;
      bottom: auto;
      width: auto;
      height: 70px;
      background: linear-gradient(180deg, #fbf6ef, rgba(251, 246, 239, 0));
    }

    .storybook-main-grid {
      grid-template-columns: 1fr;
    }

    .storybook-column + .storybook-column,
    .storybook-column:last-child {
      border-top: 1px solid rgba(133, 91, 69, 0.12);
      border-left: 0;
    }

    .storybook-process-list {
      width: min(620px, 100%);
      margin: 0 auto;
    }

    .storybook-example-grid {
      width: min(720px, 100%);
      margin: 0 auto;
    }
  }

  @media (max-width: 680px) {
    .storybook-site-header-inner {
      padding: 10px 14px;
    }

    .storybook-logo {
      font-size: 21px;
    }

    .storybook-logo-heart {
      font-size: 21px;
    }

    .storybook-header-cta {
      min-height: 40px;
      padding: 0 14px;
      font-size: 12px;
    }

    .storybook-hero-copy {
      min-height: 430px;
      padding: 40px 16px 34px;
    }

    .storybook-hero-left-decoration {
      width: 135px;
      opacity: 0.33;
    }

    .storybook-title {
      font-size: clamp(34px, 10vw, 46px);
    }

    .storybook-description {
      font-size: 16px;
    }

    .storybook-highlight {
      font-size: 15px;
    }

    .storybook-quick-steps {
      gap: 13px;
    }

    .storybook-quick-step {
      min-width: 86px;
    }

    .storybook-quick-step:not(:last-child)::after {
      right: -10px;
    }

    .storybook-quick-step p {
      font-size: 10px;
    }

    .storybook-hero-art {
      min-height: 290px;
    }

    .storybook-column {
      padding: 30px 16px;
    }

    .storybook-process-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px 12px;
    }

    .storybook-process-card:not(:last-child)::after {
      display: none;
    }

    .storybook-process-image {
      width: min(130px, 100%);
    }

    .storybook-example-grid {
      gap: 10px;
    }

    .storybook-review-list {
      grid-template-columns: 1fr;
    }

      .storybook-review-stars {
    display: flex;
    gap: 2px;
    margin: 0 0 9px;
    color: #ded4cf;
    font-size: 14px;
    line-height: 1;
  }

  .storybook-review-stars span {
    display: inline-block;
  }

  .storybook-review-stars span.is-active {
    color: #f19a69;
  }

  .storybook-review-card
    .storybook-review-title {
    margin: 0 0 7px;
    color: #4b3024;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.55;
  }

  .storybook-review-empty {
    grid-column: 1 / -1;
    display: flex;
    min-height: 150px;
    align-items: center;
    justify-content: center;
    padding: 25px;
    border:
      1px dashed
      rgba(133, 91, 69, 0.2);
    border-radius: 16px;
    color: #7a675d;
    background:
      rgba(255, 255, 255, 0.72);
    font-size: 13px;
    line-height: 1.75;
    text-align: center;
    word-break: keep-all;
  }

  .storybook-review-actions {
    display: flex;
    justify-content: center;
    margin: 15px 0 17px;
  }

  .storybook-review-write-button {
    display: inline-flex;
    min-height: 42px;
    align-items: center;
    justify-content: center;
    padding: 0 22px;
    border: 1px solid #efa58f;
    border-radius: 999px;
    color: #c85f49 !important;
    background: #fffaf6;
    box-shadow:
      0 7px 18px
      rgba(120, 72, 52, 0.07);
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .storybook-review-write-button:hover {
    transform: translateY(-2px);
    background: #ffffff;
    box-shadow:
      0 11px 22px
      rgba(120, 72, 52, 0.12);
  }

    .storybook-side-cta {
      grid-template-columns: 98px minmax(0, 1fr);
      padding: 15px;
    }

    .storybook-side-cta-image {
      width: 98px;
      height: 82px;
    }

    .storybook-side-cta-copy h3 {
      font-size: 16px;
    }

    .storybook-recommend-inner {
      padding: 27px 16px;
    }

    .storybook-recommend-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .storybook-recommend-card {
      padding: 12px 7px;
      border: 1px solid rgba(133, 91, 69, 0.1) !important;
      border-radius: 15px;
      background: rgba(255, 255, 255, 0.55);
    }

    .storybook-recommend-card:last-child {
      grid-column: 1 / -1;
    }

    .storybook-bottom-cta {
      grid-template-columns: 82px minmax(0, 1fr);
      padding: 16px;
    }
  }
 
   /* 데스크톱 첫 화면 정렬 보정 */
  @media (min-width: 931px) {
    .storybook-hero,
    .storybook-hero-inner {
      height: 490px;
      min-height: 490px;
    }

    .storybook-hero-inner {
      width: min(1536px, 100%);
      grid-template-columns:
        minmax(0, 44.5%)
        minmax(0, 55.5%);
    }

    .storybook-hero-copy {
      min-width: 0;
      overflow: hidden;
      padding:
        42px
        22px
        36px
        clamp(220px, 17vw, 270px);
      justify-content: center;
    }

    .storybook-hero-left-decoration {
      width: 230px;
    }

    .storybook-hero-copy-content {
      width: min(430px, 100%);
      margin: 0;
    }

    .storybook-title {
  font-size: clamp(46px, 3vw, 52px);
  line-height: 1.27;
  letter-spacing: 0.005em;
}

    .storybook-description {
      margin-top: 20px;
      font-size: 16px;
      line-height: 1.75;
    }

    .storybook-highlight {
      margin-top: 13px;
      font-size: 16px;
    }

    .storybook-primary-button {
      margin-top: 20px;
    }

    .storybook-quick-steps {
      margin-top: 25px;
      gap: 20px;
    }

    .storybook-quick-step {
      min-width: 90px;
    }

    .storybook-quick-step:not(:last-child)::after {
      right: -15px;
    }

    .storybook-hero-art {
      height: 490px;
      min-height: 490px;
    }

    .storybook-hero-art img {
      object-fit: cover;
      object-position: center center;
    }
  }
  @media (min-width: 931px) and (max-width: 1180px) {
    .storybook-hero-inner {
      grid-template-columns:
        minmax(0, 48%)
        minmax(0, 52%);
    }

    .storybook-hero-copy {
      padding-left: 190px;
      padding-right: 18px;
    }

    .storybook-hero-left-decoration {
      width: 180px;
    }

    .storybook-hero-copy-content {
  width: min(445px, 100%);
  margin: 0;
}

    .storybook-title {
      font-size: 40px;
    }

    .storybook-quick-steps {
      gap: 11px;
    }

    .storybook-quick-step {
      min-width: 80px;
    }

    .storybook-quick-step p {
      white-space: normal;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .storybook-home *,
    .storybook-home *::before,
    .storybook-home *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
/* 새 메인 이미지에 맞춘 히어로 최종 배치 */
@media (min-width: 1241px) {
  .storybook-hero {
    width: min(1590px, 100%);
    min-height: 538px;
    margin: 0 auto;
    overflow: hidden;
    background: #fffaf5;
  }

  .storybook-hero-inner {
    width: 100%;
    min-height: 538px;
    display: grid;
    grid-template-columns: 42% 58%;
  }

  .storybook-hero-copy {
    min-width: 0;
    min-height: 538px;
    padding: 44px 36px 40px 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(
        circle at 78% 20%,
        rgba(255, 255, 255, 0.92),
        transparent 22rem
      ),
      linear-gradient(
        90deg,
        #fffdf9 0%,
        #fffaf5 100%
      );
  }

  .storybook-hero-left-decoration {
    display: none;
  }

  .storybook-hero-copy-content {
    width: min(500px, 100%);
    margin: 0;
  }

  .storybook-hero-art {
    position: relative;
    min-width: 0;
    min-height: 538px;
    overflow: hidden;
  }

  .storybook-hero-art::before {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 2;
    width: 135px;
    content: '';
    pointer-events: none;
    background: linear-gradient(
      90deg,
      #fffaf5 0%,
      rgba(255, 250, 245, 0.72) 38%,
      rgba(255, 250, 245, 0) 100%
    );
  }

  .storybook-hero-art img {
    object-fit: cover !important;
    object-position: center center !important;
  }

  .storybook-title {
    font-size: clamp(48px, 3vw, 58px);
    line-height: 1.2;
  }

  .storybook-description {
    font-size: 16px;
    line-height: 1.8;
  }

  .storybook-quick-steps {
    margin-top: 24px;
  }
}

@media (min-width: 1025px) and (max-width: 1240px) {
  .storybook-hero {
    min-height: 480px;
  }

  .storybook-hero-inner {
    min-height: 480px;
    display: grid;
    grid-template-columns: 48% 52%;
  }

  .storybook-hero-copy {
    min-height: 480px;
    padding: 40px 26px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .storybook-hero-left-decoration {
    display: none;
  }

  .storybook-hero-copy-content {
    width: min(450px, 100%);
    margin: 0;
  }

  .storybook-hero-art {
    min-height: 480px;
  }

  .storybook-title {
    font-size: 42px;
  }
}
`;

export default async function HomePage() {
  const [session, customerReviews] =
    await Promise.all([
      auth(),
      getApprovedCustomerReviews(),
    ]);

  const isAdmin =
    (
      session?.user as
        | { role?: string }
        | undefined
    )?.role === 'ADMIN';

  const startHref = session?.user
    ? '/dashboard'
    : '/login?callbackUrl=/dashboard';

     const createHomeProductHref = (
    productCode: string,
  ) => {
    const destination =
      `/apply?product=${encodeURIComponent(productCode)}`;

    if (session?.user) {
      return destination;
    }

    return `/login?callbackUrl=${encodeURIComponent(
      destination,
    )}`;
  };

  return (
    <>
      <style>{homeStyles}</style>
      <HomeGuidePopup />

      <div className="storybook-home storybook-public-page">
        <StorybookPublicHeader ctaHref={startHref} />

        <main>
          <section className="storybook-hero">
            <div className="storybook-hero-inner">
              <div className="storybook-hero-copy">
                <div className="storybook-hero-left-decoration" aria-hidden="true">
                  <Image
                    src="/home/storybook/hero-left.webp"
                    alt=""
                    fill
                    priority
                    sizes="235px"
                  />
                </div>

                <div className="storybook-hero-copy-content">
                  <h1 className="storybook-title">
                    오늘의 추억이
                    <br />
                    내일의 이야기가 됩니다
                    <span className="storybook-title-heart">♡</span>
                  </h1>

                  <p className="storybook-description">
                    사진 몇 장과 당신의 이야기를 모아
                    <br />
                    세상에 하나뿐인 스토리북을 만들어 드려요.
                  </p>

                  <p className="storybook-highlight">
                    당신의 삶은, 그 자체로 아름다운 이야기입니다.
                  </p>

                  <Link href={startHref} className="storybook-primary-button">
                    나만의 스토리북 만들기 →
                  </Link>

                  <div className="storybook-quick-steps" aria-label="간단한 제작 흐름">
                    <div className="storybook-quick-step">
                      <span className="storybook-quick-icon" aria-hidden="true">▣</span>
                      <p>사진만 준비해주세요</p>
                    </div>
                    <div className="storybook-quick-step">
                      <span className="storybook-quick-icon" aria-hidden="true">♡</span>
                      <p>당신의 이야기를 들려주세요</p>
                    </div>
                    <div className="storybook-quick-step">
                      <span className="storybook-quick-icon" aria-hidden="true">▤</span>
                      <p>세상에 하나뿐인 책 완성</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="storybook-hero-art">
                <Image
  src="/home/storybook/home-hero-family-story-v3.webp"
  alt="밝은 햇살 아래 사진과 스토리북이 놓인 달동네 메인 이미지"
  fill
  priority
  sizes="(max-width: 1024px) 100vw, 58vw"
  style={{ objectFit: 'cover', objectPosition: 'center center' }}
/>
              </div>
            </div>
          </section>

           <section
            className="storybook-product-choice"
            aria-labelledby="product-choice-title"
          >
            <div className="storybook-product-choice-inner">
              <div className="storybook-product-choice-heading">
                <p className="storybook-product-choice-kicker">
                  나에게 맞는 기록 방법
                </p>

                <h2
                  id="product-choice-title"
                  className="storybook-product-choice-title"
                >
                  어떤 방식으로 이야기를 남기고 싶으신가요?
                </h2>

                <p className="storybook-product-choice-description">
                  한 번에 책으로 완성하거나, 매달 천천히 기록할 수 있습니다.
                </p>
              </div>

              <div className="storybook-product-choice-grid">
                <Link
                  href={createHomeProductHref('LIFE_BOOK_BASIC')}
                  className="storybook-product-choice-card"
                >
                  <div className="storybook-product-choice-image">
                    <Image
                      src="/home/storybook/detail-hero-bright-v2.webp"
                      alt="사진과 이야기를 한 권의 인생책으로 만드는 서비스"
                      fill
                      sizes="(max-width: 680px) 120px, 240px"
                    />
                  </div>

                  <div className="storybook-product-choice-copy">
                    <span className="storybook-product-choice-badge">
                      한 번 제작
                    </span>

                    <h3>인생책 제작</h3>

                    <p>
                      사진과 이야기를 정리해 50~80페이지의 한 권의
                      스토리북으로 완성합니다.
                    </p>

                    <span className="storybook-product-choice-action">
                      인생책 상품 보기 →
                    </span>
                  </div>
                </Link>

                <Link
                  href={createHomeProductHref('MONTHLY_RECORD_BASIC')}
                  className="storybook-product-choice-card"
                >
                  <div className="storybook-product-choice-image">
                    <Image
                      src="/home/storybook/process-hero-bright-v2.webp"
                      alt="사진과 이야기를 매달 기록하는 월간기록 서비스"
                      fill
                      sizes="(max-width: 680px) 120px, 240px"
                    />
                  </div>

                  <div className="storybook-product-choice-copy">
                    <span className="storybook-product-choice-badge">
                      매월 기록
                    </span>

                    <h3>월간기록 구독</h3>

                    <p>
                      매달 사진과 이야기를 차곡차곡 기록하고,
                      12개월 후 한 권의 책으로 이어갑니다.
                    </p>

                    <span className="storybook-product-choice-action">
                      월간기록 상품 보기 →
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </section>
          <section className="storybook-main-grid">
            <div className="storybook-column" id="process">
              <h2 className="storybook-section-title">
                어떻게 만들어지나요?
              </h2>

              <div className="storybook-process-list">
                {processSteps.map((step, index) => (
                  <article key={step.title} className="storybook-process-card">
                    <div className="storybook-process-image">
                      <Image
                        src={step.image}
                        alt=""
                        fill
                        sizes="120px"
                      />
                    </div>

                    <h3>{index + 1}. {step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                ))}
              </div>

              <Link href="/process" className="storybook-outline-button">
                제작과정 자세히 보기 →
              </Link>
            </div>

            <div className="storybook-column" id="works">
              <h2 className="storybook-section-title">
                우리의 이야기, 이렇게 담겼어요 <span>♡</span>
              </h2>

              <div className="storybook-example-grid">
                {storybookExamples.map((example) => (
                  <article key={example.label} className="storybook-example-card">
                    <div className="storybook-example-image">
                      <Image
                        src={example.image}
                        alt={`${example.label} 스토리북 예시`}
                        fill
                        sizes="(max-width: 680px) 50vw, 16vw"
                      />
                    </div>
                    <p className="storybook-example-label">{example.label}</p>
                  </article>
                ))}
              </div>

              <Link href="/trial" className="storybook-outline-button">
                작품 더 보기 →
              </Link>
            </div>

            <div className="storybook-column" id="reviews">
              <h2 className="storybook-section-title">
                고객님들의 따뜻한 이야기 <span>♡</span>
              </h2>

              <div className="storybook-review-list">
  {customerReviews.length > 0 ? (
    customerReviews.map((review) => (
      <article
        key={review.id}
        className="storybook-review-card"
      >
        <div
          className="storybook-review-stars"
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
          <p className="storybook-review-title">
            {review.title}
          </p>
        ) : null}

        <p>{review.content}</p>

        <small>
          –{' '}
          {maskCustomerReviewName(
            review.displayName,
          )}
        </small>
      </article>
    ))
  ) : (
    <div className="storybook-review-empty">
      아직 공개된 고객 후기가 없습니다.
      <br />
      첫 번째 따뜻한 후기를 남겨주세요.
    </div>
  )}
</div>

<div className="storybook-review-actions">
  <Link
    href="/reviews"
    className="storybook-review-write-button"
  >
    고객 후기 작성하기 →
  </Link>
</div>

              <div className="storybook-side-cta">
                <div className="storybook-side-cta-image">
      <Image
          src="/home/storybook/new/home-side-cta.webp"
          alt="반려묘와 함께 추억 사진을 바라보는 모습"
          fill
          sizes="132px"
        />
                </div>

                <div className="storybook-side-cta-copy">
                  <h3>지금, 당신의 이야기를 들려주세요.</h3>
                  <Link href={startHref} className="storybook-primary-button">
                    스토리북 만들기 →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="storybook-recommend">
            <div className="storybook-recommend-inner">
              <h2 className="storybook-recommend-title">
                이런 분들께
                <br />
                추천드려요 <span>♡</span>
              </h2>

              <div className="storybook-recommend-list">
                {recommendationItems.map((item) => (
                  <article key={item.text} className="storybook-recommend-card">
                    <div className="storybook-recommend-image">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="86px"
                      />
                    </div>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>

              <div className="storybook-bottom-cta">
                <div className="storybook-bottom-cta-image">
                  <Image
  src="/home/storybook/new/home-bottom-cta.webp"
  alt="어머니와 딸이 함께 추억 앨범을 보는 모습"
  fill
  sizes="90px"
/>
                </div>

                <div>
                  <h3>지금, 당신의 이야기를 들려주세요.</h3>
                  <Link href={startHref} className="storybook-primary-button">
                    스토리북 만들기
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
