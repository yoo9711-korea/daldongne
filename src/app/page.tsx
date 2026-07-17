import { auth } from '@/auth';
import HomeGuidePopup from '@/components/home/HomeGuidePopup';
import Image from 'next/image';
import Link from 'next/link';

const processSteps = [
  {
    icon: '📷',
    title: '사진 보내기',
    description: '핸드폰 속 소중한 사진을 한곳에 모아 주세요.',
  },
  {
    icon: '💬',
    title: '이야기 나누기',
    description: '사진 속 기억을 간단한 질문에 따라 들려주세요.',
  },
  {
    icon: '📝',
    title: '스토리 구성',
    description: 'AI가 이야기를 읽기 좋게 다듬고 목차를 구성합니다.',
  },
  {
    icon: '📖',
    title: '인생책 완성',
    description: '세상에 하나뿐인 당신의 인생책 원고가 완성됩니다.',
  },
];

const storybookExamples = [
  {
    label: '엄마의 이야기',
    title: '엄마의 봄날',
    accent: '#f4b5a6',
    position: '42% center',
  },
  {
    label: '우리 가족의 기록',
    title: '함께여서 좋았던 날들',
    accent: '#b9ddca',
    position: '58% center',
  },
  {
    label: '아이의 성장 일기',
    title: '작은 발자국의 계절',
    accent: '#f3d494',
    position: '50% 42%',
  },
  {
    label: '아빠의 인생 이야기',
    title: '아버지의 오래된 노트',
    accent: '#b9d5eb',
    position: '62% center',
  },
];

const reviews = [
  {
    text: '엄마의 삶을 책으로 만든 선물이 되었어요. 평생 잊지 못할 것 같아요.',
    name: '김○○ 고객님',
  },
  {
    text: '아이의 성장 과정을 이렇게 예쁜 기록으로 남길 수 있어 정말 행복합니다.',
    name: '박○○ 고객님',
  },
  {
    text: '결혼기념일에 남편과 함께 읽었는데, 둘이 한참 동안 웃고 울었어요.',
    name: '이○○ 고객님',
  },
];

const bookTypes = [
  ['👵', '부모님께 선물하고 싶을 때'],
  ['💍', '결혼기념일을 특별하게 남길 때'],
  ['🧒', '아이의 성장 과정을 기록하고 싶을 때'],
  ['🎂', '은퇴·회갑·칠순을 기념하고 싶을 때'],
  ['✈️', '여행의 추억을 오래 간직하고 싶을 때'],
];

const homeStyles = `
  @keyframes daldongneFadeUp {
    from {
      opacity: 0;
      transform: translateY(22px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes daldongneBookFloat {
    0%,
    100% {
      transform: translateY(0) rotate(-0.7deg);
    }

    50% {
      transform: translateY(-8px) rotate(0.3deg);
    }
  }

  .storybook-home,
  .storybook-home * {
    box-sizing: border-box;
  }

  .storybook-home {
    --storybook-ink: #4f342a;
    --storybook-soft-ink: #756158;
    --storybook-coral: #ef8268;
    --storybook-coral-dark: #db6d57;
    --storybook-cream: #fffaf2;
    --storybook-paper: #fffdf8;
    --storybook-border: rgba(180, 117, 91, 0.19);
    --storybook-shadow: 0 18px 52px rgba(119, 78, 60, 0.13);

    width: 100%;
    overflow: hidden;
    background:
      radial-gradient(circle at 8% 8%, rgba(255, 226, 212, 0.58), transparent 24rem),
      radial-gradient(circle at 92% 13%, rgba(224, 239, 219, 0.5), transparent 24rem),
      #fffaf3;
    color: var(--storybook-ink);
  }

  .storybook-home a {
    color: inherit;
  }

  .storybook-hero {
    position: relative;
    isolation: isolate;
    min-height: 610px;
    overflow: hidden;
    border-bottom: 1px solid rgba(220, 176, 150, 0.28);
    background:
      linear-gradient(rgba(255, 252, 246, 0.91), rgba(255, 248, 238, 0.91)),
      repeating-linear-gradient(
        0deg,
        rgba(143, 98, 75, 0.025) 0,
        rgba(143, 98, 75, 0.025) 1px,
        transparent 1px,
        transparent 5px
      );
  }

  .storybook-hero::before,
  .storybook-hero::after {
    position: absolute;
    z-index: -1;
    content: '';
    border-radius: 999px;
    filter: blur(1px);
  }

  .storybook-hero::before {
    top: -110px;
    left: -130px;
    width: 390px;
    height: 390px;
    background: rgba(255, 220, 194, 0.52);
  }

  .storybook-hero::after {
    right: -90px;
    bottom: -130px;
    width: 410px;
    height: 410px;
    background: rgba(217, 235, 208, 0.56);
  }

  .storybook-hero-inner {
    position: relative;
    width: min(1440px, 100%);
    min-height: 610px;
    margin: 0 auto;
    padding: 74px 44px 64px;
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(580px, 1.2fr);
    align-items: center;
    gap: 42px;
  }

  .storybook-hero-copy {
    position: relative;
    z-index: 3;
    min-width: 0;
    animation: daldongneFadeUp 0.75s ease-out both;
  }

  .storybook-eyebrow {
    margin: 0 0 17px;
    color: #df7763;
    font-size: 18px;
    font-weight: 900;
    letter-spacing: 0.02em;
  }

  .storybook-title {
    max-width: 670px;
    margin: 0;
    font-family: 'Noto Serif KR', serif;
    font-size: clamp(43px, 4.5vw, 66px);
    line-height: 1.22;
    letter-spacing: -0.055em;
    word-break: keep-all;
  }

  .storybook-title-accent {
    display: inline-block;
    color: var(--storybook-coral);
    transform: translateY(-2px) rotate(-7deg);
  }

  .storybook-description {
    max-width: 610px;
    margin: 25px 0 0;
    color: var(--storybook-soft-ink);
    font-size: clamp(17px, 1.45vw, 21px);
    line-height: 1.85;
    word-break: keep-all;
  }

  .storybook-highlight {
    margin: 14px 0 0;
    color: #de735e;
    font-size: 17px;
    font-weight: 800;
  }

  .storybook-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 28px;
  }

  .storybook-button {
    min-height: 54px;
    padding: 14px 25px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    text-decoration: none;
    font-size: 16px;
    font-weight: 900;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .storybook-button:hover {
    transform: translateY(-2px);
  }

  .storybook-button-primary {
    border: 1px solid #ea7d64;
    background: linear-gradient(135deg, #f39a7e, #eb765f);
    color: #ffffff;
    box-shadow: 0 12px 26px rgba(217, 105, 82, 0.25);
  }

  .storybook-button-primary:hover {
    background: linear-gradient(135deg, #ed8c71, #df6e59);
    box-shadow: 0 16px 32px rgba(217, 105, 82, 0.31);
  }

  .storybook-button-secondary {
    border: 1px solid rgba(202, 153, 127, 0.42);
    background: rgba(255, 255, 255, 0.76);
    color: #67483e;
    box-shadow: 0 8px 22px rgba(118, 77, 58, 0.08);
  }

  .storybook-button-admin {
    border: 1px solid rgba(120, 175, 145, 0.43);
    background: rgba(221, 242, 229, 0.88);
    color: #416557;
  }

  .storybook-hero-art {
    position: relative;
    min-width: 0;
    padding: 35px 0 25px;
    animation: daldongneBookFloat 7s ease-in-out infinite;
  }

  .storybook-book {
    position: relative;
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    min-height: 420px;
    overflow: hidden;
    border: 1px solid rgba(129, 94, 76, 0.2);
    border-radius: 9px 16px 16px 9px;
    background: #fffdf9;
    box-shadow:
      0 28px 62px rgba(86, 58, 45, 0.22),
      inset 0 0 0 1px rgba(255, 255, 255, 0.8);
    transform: perspective(1300px) rotateY(-4deg) rotateZ(0.5deg);
  }

  .storybook-book::after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 45%;
    width: 34px;
    content: '';
    transform: translateX(-50%);
    background:
      linear-gradient(
        90deg,
        rgba(72, 45, 31, 0.11),
        rgba(255, 255, 255, 0.72) 48%,
        rgba(72, 45, 31, 0.1)
      );
    pointer-events: none;
  }

  .storybook-book-page {
    position: relative;
    min-height: 420px;
    overflow: hidden;
  }

  .storybook-book-page-left {
    padding: 54px 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background:
      radial-gradient(circle at 25% 85%, rgba(248, 219, 138, 0.28), transparent 9rem),
      repeating-linear-gradient(
        0deg,
        rgba(119, 78, 60, 0.025) 0,
        rgba(119, 78, 60, 0.025) 1px,
        transparent 1px,
        transparent 6px
      ),
      #fffdf8;
  }

  .storybook-book-note {
    position: relative;
    z-index: 2;
    margin: 0;
    font-family: 'Noto Serif KR', serif;
    color: #543b31;
    font-size: clamp(24px, 2.2vw, 35px);
    font-weight: 800;
    line-height: 1.55;
    text-align: center;
    word-break: keep-all;
  }

  .storybook-book-note strong {
    display: block;
    color: #e37a63;
    font-size: 16px;
    margin-top: 14px;
  }

  .storybook-book-flower {
    position: absolute;
    left: 24px;
    bottom: 18px;
    font-size: 62px;
    opacity: 0.78;
    transform: rotate(-12deg);
  }

  .storybook-book-photo {
    position: absolute;
    inset: 0;
  }

  .storybook-book-photo-image {
    object-fit: cover;
    filter: brightness(1.08) saturate(0.92);
  }

  .storybook-polaroid {
    position: absolute;
    right: 12px;
    bottom: -24px;
    width: 142px;
    padding: 10px 10px 24px;
    border: 1px solid rgba(111, 77, 60, 0.16);
    background: #fffefa;
    box-shadow: 0 13px 30px rgba(87, 56, 42, 0.17);
    transform: rotate(7deg);
  }

  .storybook-polaroid-photo {
    position: relative;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    background: #f4e8d8;
  }

  .storybook-polaroid-image {
    object-fit: cover;
    object-position: 70% center;
  }

  .storybook-deco {
    position: absolute;
    user-select: none;
    pointer-events: none;
  }

  .storybook-deco-left {
    left: 8px;
    bottom: 12px;
    font-size: 105px;
    opacity: 0.54;
    transform: rotate(-7deg);
  }

  .storybook-deco-right {
    right: 25px;
    top: 18px;
    font-size: 74px;
    opacity: 0.5;
    transform: rotate(12deg);
  }

  .storybook-process {
    border-bottom: 1px solid rgba(220, 176, 150, 0.25);
    background: rgba(255, 253, 248, 0.9);
  }

  .storybook-process-inner {
    width: min(1380px, 100%);
    margin: 0 auto;
    padding: 34px 34px 38px;
    display: grid;
    grid-template-columns: minmax(190px, 0.65fr) minmax(0, 2.35fr);
    gap: 35px;
    align-items: center;
  }

  .storybook-process-title {
    margin: 0;
    font-family: 'Noto Serif KR', serif;
    font-size: clamp(25px, 2.6vw, 36px);
    line-height: 1.5;
    letter-spacing: -0.04em;
  }

  .storybook-process-title span {
    color: var(--storybook-coral);
  }

  .storybook-step-list {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .storybook-step {
    position: relative;
    min-width: 0;
    padding: 10px 9px;
    text-align: center;
  }

  .storybook-step:not(:last-child)::after {
    position: absolute;
    top: 42px;
    right: -14px;
    content: '→';
    color: #b57d62;
    font-size: 28px;
  }

  .storybook-step-icon {
    width: 76px;
    height: 76px;
    margin: 0 auto 12px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(209, 158, 126, 0.26);
    border-radius: 50%;
    background: linear-gradient(135deg, #fff9ed, #f8e8d7);
    box-shadow: 0 9px 23px rgba(118, 77, 58, 0.09);
    font-size: 34px;
  }

  .storybook-step h3 {
    margin: 0;
    font-size: 17px;
    line-height: 1.4;
  }

  .storybook-step p {
    margin: 7px 0 0;
    color: var(--storybook-soft-ink);
    font-size: 13px;
    line-height: 1.6;
    word-break: keep-all;
  }

  .storybook-content {
    width: min(1420px, 100%);
    margin: 0 auto;
    padding: 36px 34px;
    display: grid;
    grid-template-columns: minmax(0, 1.22fr) minmax(0, 0.9fr) minmax(280px, 0.72fr);
    gap: 27px;
  }

  .storybook-panel {
    min-width: 0;
  }

  .storybook-panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
  }

  .storybook-panel-title {
    margin: 0;
    font-family: 'Noto Serif KR', serif;
    font-size: 24px;
    letter-spacing: -0.035em;
  }

  .storybook-panel-title span {
    color: var(--storybook-coral);
  }

  .storybook-more {
    color: #a16c55;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
  }

  .storybook-example-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .storybook-example-card {
    min-width: 0;
  }

  .storybook-example-visual {
    position: relative;
    aspect-ratio: 0.94 / 1;
    overflow: hidden;
    border: 1px solid rgba(173, 125, 101, 0.18);
    border-radius: 15px;
    background: #f3e9dc;
    box-shadow: 0 10px 25px rgba(103, 68, 51, 0.12);
  }

  .storybook-example-image {
    object-fit: cover;
    filter: brightness(1.07) saturate(0.9);
    transform: scale(1.12);
  }

  .storybook-example-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, transparent 55%, rgba(66, 43, 31, 0.48)),
      linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent);
  }

  .storybook-example-bookmark {
    position: absolute;
    top: 12px;
    left: 12px;
    width: 8px;
    height: 45px;
    border-radius: 999px;
  }

  .storybook-example-title {
    position: absolute;
    right: 10px;
    bottom: 9px;
    left: 10px;
    margin: 0;
    color: #ffffff;
    font-family: 'Noto Serif KR', serif;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.4;
    text-shadow: 0 2px 9px rgba(50, 30, 20, 0.42);
  }

  .storybook-example-label {
    margin: 9px 0 0;
    color: #5e473e;
    font-size: 13px;
    font-weight: 800;
    text-align: center;
    word-break: keep-all;
  }

  .storybook-review-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .storybook-review {
    position: relative;
    min-height: 122px;
    padding: 23px 20px 18px;
    border: 1px solid rgba(183, 137, 113, 0.16);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 10px 26px rgba(119, 78, 60, 0.08);
  }

  .storybook-review::before {
    position: absolute;
    top: 7px;
    left: 16px;
    content: '“';
    color: #f1a28d;
    font-size: 39px;
    font-weight: 900;
    line-height: 1;
  }

  .storybook-review p {
    margin: 16px 0 0;
    color: #59443b;
    font-size: 14px;
    line-height: 1.65;
    word-break: keep-all;
  }

  .storybook-review small {
    display: block;
    margin-top: 11px;
    color: #9a877e;
    font-size: 12px;
    text-align: right;
  }

  .storybook-side-cta {
    height: 100%;
    min-height: 370px;
    padding: 34px 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px dashed rgba(211, 145, 112, 0.44);
    border-radius: 22px;
    background:
      radial-gradient(circle at 50% 0, rgba(255, 232, 200, 0.72), transparent 13rem),
      rgba(255, 253, 248, 0.86);
    box-shadow: 0 14px 34px rgba(119, 78, 60, 0.08);
    text-align: center;
  }

  .storybook-side-cta-icon {
    font-size: 62px;
    line-height: 1;
  }

  .storybook-side-cta h2 {
    margin: 18px 0 0;
    font-family: 'Noto Serif KR', serif;
    font-size: 26px;
    line-height: 1.45;
    letter-spacing: -0.04em;
    word-break: keep-all;
  }

  .storybook-side-cta p {
    margin: 14px 0 0;
    color: var(--storybook-soft-ink);
    font-size: 15px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .storybook-side-cta .storybook-button {
    margin-top: 20px;
  }

  .storybook-recommend {
    border-top: 1px solid rgba(220, 176, 150, 0.25);
    background:
      linear-gradient(180deg, rgba(255, 252, 247, 0.88), rgba(250, 240, 228, 0.9));
  }

  .storybook-recommend-inner {
    width: min(1420px, 100%);
    margin: 0 auto;
    padding: 30px 34px;
    display: grid;
    grid-template-columns: minmax(180px, 0.55fr) minmax(0, 2.45fr);
    gap: 27px;
    align-items: center;
  }

  .storybook-recommend-title {
    margin: 0;
    font-family: 'Noto Serif KR', serif;
    font-size: 29px;
    line-height: 1.45;
    letter-spacing: -0.045em;
  }

  .storybook-recommend-title span {
    color: var(--storybook-coral);
  }

  .storybook-recommend-list {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 11px;
  }

  .storybook-recommend-item {
    min-width: 0;
    padding: 17px 12px;
    border-left: 1px solid rgba(192, 145, 119, 0.17);
    text-align: center;
  }

  .storybook-recommend-icon {
    display: block;
    margin-bottom: 8px;
    font-size: 34px;
  }

  .storybook-recommend-text {
    color: #5f473d;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.55;
    word-break: keep-all;
  }

  .storybook-final {
    width: min(1420px, calc(100% - 44px));
    margin: 20px auto 42px;
    padding: 30px 34px;
    display: grid;
    grid-template-columns: 0.75fr 1.5fr 0.75fr;
    align-items: center;
    gap: 20px;
    overflow: hidden;
    border: 1px solid rgba(205, 151, 121, 0.2);
    border-radius: 28px;
    background:
      radial-gradient(circle at 0 100%, rgba(205, 229, 201, 0.75), transparent 17rem),
      radial-gradient(circle at 100% 0, rgba(255, 223, 202, 0.75), transparent 17rem),
      #fffdf8;
    box-shadow: var(--storybook-shadow);
    text-align: center;
  }

  .storybook-final-deco {
    font-size: 75px;
    line-height: 1;
  }

  .storybook-final h2 {
    margin: 0;
    font-family: 'Noto Serif KR', serif;
    font-size: clamp(28px, 3.2vw, 43px);
    line-height: 1.4;
    letter-spacing: -0.045em;
    word-break: keep-all;
  }

  .storybook-final h2 span {
    color: var(--storybook-coral);
  }

  .storybook-final p {
    margin: 10px 0 0;
    color: var(--storybook-soft-ink);
    font-size: 15px;
  }

  @media (max-width: 1180px) {
    .storybook-hero-inner {
      grid-template-columns: minmax(0, 0.85fr) minmax(500px, 1.15fr);
      padding-right: 26px;
      padding-left: 26px;
    }

    .storybook-title {
      font-size: clamp(40px, 5.3vw, 57px);
    }

    .storybook-process-inner {
      grid-template-columns: 1fr;
      gap: 22px;
    }

    .storybook-process-title {
      text-align: center;
    }

    .storybook-content {
      grid-template-columns: 1fr 1fr;
    }

    .storybook-side-cta {
      grid-column: 1 / -1;
      min-height: auto;
      padding: 30px;
    }

    .storybook-recommend-inner {
      grid-template-columns: 1fr;
    }

    .storybook-recommend-title {
      text-align: center;
    }
  }

  @media (max-width: 900px) {
    .storybook-hero-inner {
      grid-template-columns: 1fr;
      min-height: auto;
      padding-top: 48px;
    }

    .storybook-hero-copy {
      text-align: center;
    }

    .storybook-title,
    .storybook-description {
      margin-right: auto;
      margin-left: auto;
    }

    .storybook-actions {
      justify-content: center;
    }

    .storybook-book {
      min-height: 390px;
    }

    .storybook-book-page {
      min-height: 390px;
    }

    .storybook-step-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .storybook-step:nth-child(2)::after {
      display: none;
    }

    .storybook-content {
      grid-template-columns: 1fr;
    }

    .storybook-example-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .storybook-review-list {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .storybook-side-cta {
      grid-column: auto;
    }

    .storybook-final {
      grid-template-columns: 1fr;
    }

    .storybook-final-deco {
      display: none;
    }
  }

  @media (max-width: 680px) {
    .storybook-hero-inner {
      padding: 36px 16px 42px;
    }

    .storybook-eyebrow {
      font-size: 15px;
    }

    .storybook-title {
      font-size: clamp(35px, 10vw, 47px);
    }

    .storybook-description {
      font-size: 17px;
      line-height: 1.75;
    }

    .storybook-highlight {
      font-size: 15px;
    }

    .storybook-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .storybook-button {
      width: 100%;
    }

    .storybook-hero-art {
      padding-top: 15px;
    }

    .storybook-book {
      grid-template-columns: 0.8fr 1.2fr;
      min-height: 310px;
    }

    .storybook-book-page {
      min-height: 310px;
    }

    .storybook-book-page-left {
      padding: 30px 16px;
    }

    .storybook-book-note {
      font-size: 18px;
    }

    .storybook-book-note strong {
      font-size: 12px;
    }

    .storybook-book-flower {
      font-size: 40px;
    }

    .storybook-polaroid {
      display: none;
    }

    .storybook-process-inner {
      padding: 30px 16px;
    }

    .storybook-step-list {
      gap: 8px;
    }

    .storybook-step:not(:last-child)::after {
      display: none;
    }

    .storybook-step-icon {
      width: 64px;
      height: 64px;
      font-size: 28px;
    }

    .storybook-step h3 {
      font-size: 15px;
    }

    .storybook-step p {
      font-size: 12px;
    }

    .storybook-content {
      padding: 30px 16px;
    }

    .storybook-panel-title {
      font-size: 21px;
    }

    .storybook-example-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .storybook-review-list {
      grid-template-columns: 1fr;
    }

    .storybook-recommend-inner {
      padding: 30px 16px;
    }

    .storybook-recommend-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .storybook-recommend-item {
      border: 1px solid rgba(192, 145, 119, 0.15);
      border-radius: 15px;
      background: rgba(255, 255, 255, 0.55);
    }

    .storybook-recommend-item:last-child {
      grid-column: 1 / -1;
    }

    .storybook-final {
      width: calc(100% - 28px);
      margin-bottom: 28px;
      padding: 27px 20px;
      border-radius: 22px;
    }
  }

  @media (max-width: 390px) {
    .storybook-title {
      font-size: 33px;
    }

    .storybook-book-note {
      font-size: 16px;
    }

    .storybook-process-title {
      font-size: 25px;
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
`;

export default async function HomePage() {
  const session = await auth();

  const isAdmin =
    (
      session?.user as
        | { role?: string }
        | undefined
    )?.role === 'ADMIN';

  const startHref = session?.user
    ? '/dashboard'
    : '/login?callbackUrl=/dashboard';

  return (
    <>
      <style>{homeStyles}</style>

      <HomeGuidePopup />

      <main className="storybook-home">
        <section className="storybook-hero">
          <div className="storybook-hero-inner">
            <div className="storybook-hero-copy">
              <p className="storybook-eyebrow">
                달동네 출판사 · 나의 이야기를 책으로
              </p>

              <h1 className="storybook-title">
                오늘의 추억이
                <br />
                내일의 이야기가 됩니다{' '}
                <span className="storybook-title-accent">
                  ♡
                </span>
              </h1>

              <p className="storybook-description">
                사진 몇 장과 당신의 이야기를 모아
                세상에 하나뿐인 인생책을 만들어 드립니다.
                부모님의 삶, 우리 가족의 시간, 아이의 성장
                기록을 따뜻한 글과 책으로 남겨보세요.
              </p>

              <p className="storybook-highlight">
                당신의 삶은, 그 자체로 아름다운 이야기입니다.
              </p>

              <div className="storybook-actions">
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className={[
                      'storybook-button',
                      'storybook-button-admin',
                    ].join(' ')}
                  >
                    관리자 홈
                  </Link>
                ) : null}

                <Link
                  href={startHref}
                  className={[
                    'storybook-button',
                    'storybook-button-primary',
                  ].join(' ')}
                >
                  {session?.user
                    ? '내 기록 이어가기 →'
                    : '무료로 시작하기 →'}
                </Link>

                <Link
                  href="/pricing"
                  className={[
                    'storybook-button',
                    'storybook-button-secondary',
                  ].join(' ')}
                >
                  상품 안내 보기
                </Link>
              </div>
            </div>

            <div className="storybook-hero-art">
              <span
                className={[
                  'storybook-deco',
                  'storybook-deco-left',
                ].join(' ')}
                aria-hidden="true"
              >
                🌼
              </span>

              <span
                className={[
                  'storybook-deco',
                  'storybook-deco-right',
                ].join(' ')}
                aria-hidden="true"
              >
                🌿
              </span>

              <div className="storybook-book">
                <div
                  className={[
                    'storybook-book-page',
                    'storybook-book-page-left',
                  ].join(' ')}
                >
                  <p className="storybook-book-note">
                    함께여서
                    <br />
                    더 빛났던 우리 날들
                    <strong>우리 가족의 소중한 하루들 ♡</strong>
                  </p>

                  <span
                    className="storybook-book-flower"
                    aria-hidden="true"
                  >
                    🌼
                  </span>
                </div>

                <div className="storybook-book-page">
                  <div className="storybook-book-photo">
                    <Image
                      src="/home/memory-book-sample.jpg"
                      alt="가족의 추억을 담은 인생책 예시"
                      fill
                      priority
                      sizes="(max-width: 900px) 100vw, 55vw"
                      className="storybook-book-photo-image"
                    />
                  </div>
                </div>
              </div>

              <div className="storybook-polaroid">
                <div className="storybook-polaroid-photo">
                  <Image
                    src="/home/memory-book-sample.jpg"
                    alt=""
                    fill
                    sizes="142px"
                    className="storybook-polaroid-image"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="storybook-process">
          <div className="storybook-process-inner">
            <h2 className="storybook-process-title">
              인생책은 이렇게
              <br />
              만들어져요 <span>♡</span>
            </h2>

            <div className="storybook-step-list">
              {processSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="storybook-step"
                >
                  <div
                    className="storybook-step-icon"
                    aria-hidden="true"
                  >
                    {step.icon}
                  </div>

                  <h3>
                    {index + 1}. {step.title}
                  </h3>

                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="storybook-content">
          <div className="storybook-panel">
            <div className="storybook-panel-heading">
              <h2 className="storybook-panel-title">
                🌼 완성된 인생책 예시 <span>♡</span>
              </h2>

              <Link
                href={startHref}
                className="storybook-more"
              >
                더보기 →
              </Link>
            </div>

            <div className="storybook-example-grid">
              {storybookExamples.map((example) => (
                <article
                  key={example.label}
                  className="storybook-example-card"
                >
                  <div className="storybook-example-visual">
                    <Image
                      src="/home/memory-book-sample.jpg"
                      alt={`${example.label} 예시`}
                      fill
                      sizes="(max-width: 680px) 50vw, 16vw"
                      className="storybook-example-image"
                      style={{
                        objectPosition: example.position,
                      }}
                    />

                    <div className="storybook-example-overlay" />

                    <span
                      className="storybook-example-bookmark"
                      style={{
                        background: example.accent,
                      }}
                    />

                    <p className="storybook-example-title">
                      {example.title}
                    </p>
                  </div>

                  <p className="storybook-example-label">
                    {example.label}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="storybook-panel">
            <div className="storybook-panel-heading">
              <h2 className="storybook-panel-title">
                🌼 고객님의 따뜻한 이야기 <span>♡</span>
              </h2>
            </div>

            <div className="storybook-review-list">
              {reviews.map((review) => (
                <article
                  key={review.name}
                  className="storybook-review"
                >
                  <p>{review.text}</p>
                  <small>– {review.name}</small>
                </article>
              ))}
            </div>
          </div>

          <aside className="storybook-side-cta">
            <span
              className="storybook-side-cta-icon"
              aria-hidden="true"
            >
              💌
            </span>

            <h2>
              당신의 이야기가
              <br />
              누군가의 선물이 됩니다
            </h2>

            <p>
              지금, 우리 가족의 이야기를
              따뜻한 인생책으로 남겨보세요.
            </p>

            <Link
              href={startHref}
              className={[
                'storybook-button',
                'storybook-button-primary',
              ].join(' ')}
            >
              인생책 만들기 →
            </Link>
          </aside>
        </section>

        <section className="storybook-recommend">
          <div className="storybook-recommend-inner">
            <h2 className="storybook-recommend-title">
              이런 분들께
              <br />
              추천드려요 <span>♡</span>
            </h2>

            <div className="storybook-recommend-list">
              {bookTypes.map(([icon, text]) => (
                <div
                  key={text}
                  className="storybook-recommend-item"
                >
                  <span
                    className="storybook-recommend-icon"
                    aria-hidden="true"
                  >
                    {icon}
                  </span>

                  <span className="storybook-recommend-text">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="storybook-final">
          <div
            className="storybook-final-deco"
            aria-hidden="true"
          >
            🏡🌿
          </div>

          <div>
            <h2>
              소중한 순간을,
              <br />
              오래도록 간직하세요 <span>♡</span>
            </h2>

            <p>
              달동네 출판사가 당신의 이야기를
              따뜻한 한 권의 책으로 만들어 드립니다.
            </p>
          </div>

          <div
            className="storybook-final-deco"
            aria-hidden="true"
          >
            ☕💌
          </div>
        </section>
      </main>
    </>
  );
}