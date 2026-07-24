import Image from "next/image";
import Link from "next/link";

type StepIconName = "photo" | "story" | "book" | "order";

const steps: {
  number: string;
  icon: StepIconName;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  tone: string;
}[] = [
  {
    number: "01",
    icon: "photo",
    title: "사진 올리기",
    description: "기억하고 싶은 사진을 골라 내 공간에 담아보세요.",
    href: "/dashboard/timeline",
    buttonLabel: "사진 올리기",
    tone: "coral",
  },
  {
    number: "02",
    icon: "story",
    title: "이야기 쓰기",
    description: "사진을 보며 떠오르는 이야기를 짧게 남겨보세요.",
    href: "/dashboard/interview",
    buttonLabel: "이야기 쓰기",
    tone: "apricot",
  },
  {
    number: "03",
    icon: "book",
    title: "책 만들기",
    description: "모은 사진과 이야기를 한 권의 원고로 정리하세요.",
    href: "/dashboard/book",
    buttonLabel: "책 만들기",
    tone: "sage",
  },
  {
    number: "04",
    icon: "order",
    title: "검토 후 주문",
    description: "관리자 검토와 상담을 거친 뒤 안전하게 결제합니다.",
    href: "/dashboard/library",
    buttonLabel: "내 책장 보기",
    tone: "sky",
  },
];

const memoryCards = [
  {
    image: "/home/storybook/memory-v4/everyday.webp",
    label: "나의 평범한 하루",
    detail: "오늘의 작은 장면부터",
  },
  {
    image: "/home/storybook/memory-v4/people.webp",
    label: "함께한 사람들",
    detail: "가족·친구·연인의 시간",
  },
  {
    image: "/home/storybook/memory-v4/child.webp",
    label: "아이의 성장 기록",
    detail: "잊고 싶지 않은 변화",
  },
  {
    image: "/home/storybook/memory-v4/pet.webp",
    label: "반려동물과의 추억",
    detail: "강아지와 고양이도 주인공",
  },
];

const homeStyles = `
  .bright-home {
    --home-coral: #f46f5d;
    --home-coral-deep: #d95040;
    --home-ink: #3d2d27;
    --home-copy: #6f5f58;
    --home-cream: #fffaf5;
    --home-line: rgba(139, 91, 69, 0.13);
    min-height: 100vh;
    overflow: hidden;
    color: var(--home-ink);
    background:
      radial-gradient(
        circle at 4% 6%,
        rgba(255, 219, 202, 0.55),
        transparent 24rem
      ),
      radial-gradient(
        circle at 96% 30%,
        rgba(215, 241, 229, 0.5),
        transparent 26rem
      ),
      #fffdfb;
    font-family:
      var(--font-daldongne-sans),
      Arial,
      sans-serif;
  }

  .bright-home *,
  .bright-home *::before,
  .bright-home *::after {
    box-sizing: border-box;
  }

  .bright-home a {
    transition:
      transform 180ms ease,
      box-shadow 180ms ease,
      border-color 180ms ease,
      background 180ms ease;
  }

  .bright-home a:hover {
    transform: translateY(-2px);
  }

  .bright-home-shell {
    width: min(1240px, calc(100% - 48px));
    margin: 0 auto;
  }

  .bright-home-hero {
    padding: 58px 0 48px;
  }

  .bright-home-hero-grid {
    display: grid;
    grid-template-columns:
      minmax(390px, 0.82fr)
      minmax(520px, 1.18fr);
    align-items: center;
    gap: clamp(38px, 5vw, 72px);
  }

  .bright-home-kicker {
    width: fit-content;
    margin: 0 0 18px;
    padding: 9px 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border:
      1px solid
      rgba(238, 119, 91, 0.18);
    border-radius: 999px;
    background: rgba(255, 246, 240, 0.92);
    color: #bd5544;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.015em;
  }

  .bright-home-kicker::before {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f58a72;
    box-shadow:
      0 0 0 5px
      rgba(245, 138, 114, 0.13);
    content: '';
  }

  .bright-home-title {
    margin: 0;
    font-family:
      var(--font-daldongne-serif),
      Batang,
      serif;
    font-size: clamp(46px, 4.35vw, 68px);
    font-weight: 600;
    line-height: 1.18;
    letter-spacing: -0.055em;
    word-break: keep-all;
  }

  .bright-home-title span {
    position: relative;
    color: var(--home-coral-deep);
  }

  .bright-home-title span::after {
    position: absolute;
    right: -2px;
    bottom: 3px;
    left: -2px;
    z-index: -1;
    height: 12px;
    border-radius: 999px;
    background:
      rgba(255, 210, 113, 0.38);
    content: '';
  }

  .bright-home-description {
    max-width: 550px;
    margin: 24px 0 0;
    color: var(--home-copy);
    font-size: 18px;
    line-height: 1.85;
    word-break: keep-all;
  }

  .bright-home-actions {
    margin-top: 30px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 11px;
  }

  .bright-home-primary,
  .bright-home-secondary,
  .bright-home-step-link {
    text-decoration: none;
  }

  .bright-home-primary {
    min-height: 58px;
    padding: 0 27px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border:
      1px solid
      rgba(214, 71, 53, 0.15);
    border-radius: 17px;
    background:
      linear-gradient(
        135deg,
        #ff8b76,
        #ef6653
      );
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
    box-shadow:
      0 15px 30px
      rgba(226, 91, 70, 0.22);
  }

  .bright-home-secondary {
    min-height: 58px;
    padding: 0 23px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid
      rgba(138, 96, 76, 0.18);
    border-radius: 17px;
    background:
      rgba(255, 255, 255, 0.88);
    color: #60483d;
    font-size: 15px;
    font-weight: 800;
    box-shadow:
      0 10px 24px
      rgba(102, 69, 53, 0.06);
  }

  .bright-home-primary:hover {
    box-shadow:
      0 19px 34px
      rgba(226, 91, 70, 0.28);
  }

  .bright-home-primary svg {
    width: 23px;
    height: 23px;
    flex: 0 0 auto;
  }

  .bright-home-primary:focus-visible,
  .bright-home-secondary:focus-visible,
  .bright-home-step-link:focus-visible,
  .bright-home-final-link:focus-visible {
    outline:
      4px solid
      rgba(244, 111, 93, 0.25);
    outline-offset: 3px;
  }

  .bright-home-trust {
    margin: 19px 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    color: #806d64;
    font-size: 13px;
    line-height: 1.55;
    list-style: none;
  }

  .bright-home-trust li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .bright-home-trust li::before {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #e8f6ee;
    color: #3f8065;
    content: '✓';
    font-size: 11px;
    font-weight: 900;
  }

  .bright-home-visual {
    position: relative;
    min-height: 485px;
  }

  .bright-home-visual-frame {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border:
      1px solid
      rgba(202, 142, 111, 0.17);
    border-radius: 38px;
    background: #fff2e9;
    box-shadow:
      0 28px 70px
      rgba(121, 80, 58, 0.13);
  }

  .bright-home-visual-frame::after {
    position: absolute;
    inset: 0;
    content: '';
    pointer-events: none;
    background:
      linear-gradient(
        90deg,
        rgba(255, 250, 245, 0.22),
        transparent 25%
      );
  }

  .bright-home-visual-frame img {
    object-fit: cover;
    object-position: center;
  }

  .bright-home-visual-note {
    position: absolute;
    right: 19px;
    bottom: 19px;
    z-index: 2;
    max-width: 310px;
    padding: 15px 17px;
    display: flex;
    align-items: center;
    gap: 11px;
    border:
      1px solid
      rgba(255, 255, 255, 0.72);
    border-radius: 19px;
    background:
      rgba(255, 255, 255, 0.91);
    color: #513d34;
    font-size: 13px;
    font-weight: 750;
    line-height: 1.55;
    box-shadow:
      0 12px 30px
      rgba(91, 61, 47, 0.12);
    backdrop-filter: blur(12px);
  }

  .bright-home-visual-note span {
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: #fff0e7;
    color: #e36853;
  }

  .bright-home-section {
    padding: 74px 0;
  }

  .bright-home-section-heading {
    margin: 0;
    font-family:
      var(--font-daldongne-serif),
      Batang,
      serif;
    font-size: clamp(32px, 3vw, 44px);
    font-weight: 600;
    line-height: 1.35;
    text-align: center;
    letter-spacing: -0.045em;
    word-break: keep-all;
  }

  .bright-home-section-copy {
    margin: 13px auto 0;
    color: var(--home-copy);
    font-size: 16px;
    line-height: 1.75;
    text-align: center;
    word-break: keep-all;
  }

  .bright-home-steps {
    position: relative;
    margin-top: 35px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .bright-home-step {
    position: relative;
    min-width: 0;
    min-height: 330px;
    padding: 24px 22px 22px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border:
      1px solid
      var(--home-line);
    border-radius: 27px;
    background:
      rgba(255, 255, 255, 0.93);
    box-shadow:
      0 16px 40px
      rgba(102, 69, 52, 0.06);
  }

  .bright-home-step::after {
    position: absolute;
    right: -35px;
    bottom: -45px;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    content: '';
    opacity: 0.5;
  }

  .bright-home-step[data-tone='coral']::after {
    background: #ffe3da;
  }

  .bright-home-step[data-tone='apricot']::after {
    background: #ffedc7;
  }

  .bright-home-step[data-tone='sage']::after {
    background: #dff3e7;
  }

  .bright-home-step[data-tone='sky']::after {
    background: #deedf8;
  }

  .bright-home-step-top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .bright-home-step-icon {
    width: 68px;
    height: 68px;
    display: grid;
    place-items: center;
    border-radius: 21px;
    color: #c95444;
  }

  .bright-home-step[data-tone='coral']
  .bright-home-step-icon {
    background:
      linear-gradient(145deg, #fff1eb, #ffd9ce);
    color: #cf5947;
  }

  .bright-home-step[data-tone='apricot']
  .bright-home-step-icon {
    background:
      linear-gradient(145deg, #fff8e8, #ffe8ba);
    color: #b97a1d;
  }

  .bright-home-step[data-tone='sage']
  .bright-home-step-icon {
    background:
      linear-gradient(145deg, #effaf4, #d9f0e3);
    color: #448065;
  }

  .bright-home-step[data-tone='sky']
  .bright-home-step-icon {
    background:
      linear-gradient(145deg, #f1f8fd, #d9ebf7);
    color: #477793;
  }

  .bright-home-step-icon svg {
    width: 34px;
    height: 34px;
  }

  .bright-home-step-number {
    color: rgba(99, 70, 57, 0.32);
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .bright-home-step h3 {
    position: relative;
    z-index: 1;
    margin: 21px 0 0;
    font-size: 22px;
    line-height: 1.4;
    letter-spacing: -0.025em;
  }

  .bright-home-step p {
    position: relative;
    z-index: 1;
    margin: 10px 0 21px;
    color: var(--home-copy);
    font-size: 14px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .bright-home-step-link {
    position: relative;
    z-index: 1;
    min-height: 47px;
    margin-top: auto;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    border:
      1px solid
      rgba(174, 113, 86, 0.16);
    border-radius: 15px;
    background: #fffdfb;
    color: #60463b;
    font-size: 14px;
    font-weight: 850;
  }

  .bright-home-step-link span {
    color: var(--home-coral-deep);
    font-size: 19px;
  }

  .bright-home-flow-note {
    width: fit-content;
    margin: 20px auto 0;
    padding: 11px 17px;
    border-radius: 999px;
    background: #fff4ea;
    color: #85624f;
    font-size: 13px;
    font-weight: 750;
    text-align: center;
  }

  .bright-home-memories {
    border-top:
      1px solid
      var(--home-line);
    border-bottom:
      1px solid
      var(--home-line);
    background:
      linear-gradient(
        180deg,
        rgba(240, 250, 245, 0.86),
        rgba(255, 250, 245, 0.9)
      );
  }

  .bright-home-audience {
    margin-top: 25px;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 9px;
  }

  .bright-home-audience span {
    min-height: 40px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid
      rgba(75, 131, 105, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    color: #4d6e60;
    font-size: 13px;
    font-weight: 750;
    box-shadow:
      0 8px 18px
      rgba(67, 107, 91, 0.045);
  }

  .bright-home-memory-grid {
    margin-top: 30px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .bright-home-memory-card {
    min-width: 0;
    overflow: hidden;
    border:
      1px solid
      rgba(82, 130, 110, 0.13);
    border-radius: 24px;
    background: #ffffff;
    box-shadow:
      0 15px 34px
      rgba(64, 100, 86, 0.07);
  }

  .bright-home-memory-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1.25 / 1;
    overflow: hidden;
    background: #edf7f2;
  }

  .bright-home-memory-image img {
    object-fit: cover;
    transition: transform 360ms ease;
  }

  .bright-home-memory-card:hover img {
    transform: scale(1.035);
  }

  .bright-home-memory-copy {
    padding: 17px 17px 19px;
  }

  .bright-home-memory-copy strong {
    display: block;
    color: #405a4f;
    font-size: 15px;
    line-height: 1.5;
  }

  .bright-home-memory-copy span {
    display: block;
    margin-top: 4px;
    color: #7c9188;
    font-size: 12px;
    line-height: 1.5;
  }

  .bright-home-final {
    padding: 72px 0 82px;
  }

  .bright-home-final-card {
    position: relative;
    max-width: 1040px;
    margin: 0 auto;
    padding: 48px;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr) auto;
    align-items: center;
    gap: 28px;
    overflow: hidden;
    border:
      1px solid
      rgba(234, 158, 112, 0.18);
    border-radius: 32px;
    background:
      radial-gradient(
        circle at 92% 10%,
        rgba(255, 216, 122, 0.42),
        transparent 20rem
      ),
      linear-gradient(
        135deg,
        #fff9ef,
        #fff1e8
      );
    box-shadow:
      0 20px 50px
      rgba(119, 79, 56, 0.08);
  }

  .bright-home-final-label {
    margin: 0;
    color: #c46049;
    font-size: 13px;
    font-weight: 850;
    letter-spacing: 0.04em;
  }

  .bright-home-final h2 {
    margin: 11px 0 0;
    font-family:
      var(--font-daldongne-serif),
      Batang,
      serif;
    font-size: clamp(30px, 3vw, 43px);
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.04em;
    word-break: keep-all;
  }

  .bright-home-final p {
    max-width: 680px;
    margin: 12px 0 0;
    color: #765e52;
    font-size: 15px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .bright-home-final-link {
    min-width: 176px;
    min-height: 56px;
    padding: 0 23px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 17px;
    background: #4a372e;
    color: #ffffff;
    font-size: 15px;
    font-weight: 850;
    text-decoration: none;
    box-shadow:
      0 13px 28px
      rgba(73, 52, 43, 0.18);
  }

  @media (max-width: 1040px) {
    .bright-home-hero-grid {
      grid-template-columns: 1fr;
      gap: 35px;
    }

    .bright-home-visual {
      min-height: 450px;
    }

    .bright-home-steps,
    .bright-home-memory-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .bright-home-shell {
      width: min(100% - 28px, 560px);
    }

    .bright-home-hero {
      padding: 32px 0 35px;
    }

    .bright-home-title {
      font-size: 39px;
      line-height: 1.23;
    }

    .bright-home-description {
      margin-top: 18px;
      font-size: 16px;
      line-height: 1.75;
    }

    .bright-home-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .bright-home-primary,
    .bright-home-secondary {
      width: 100%;
      min-height: 58px;
    }

    .bright-home-trust {
      display: grid;
      grid-template-columns: 1fr;
    }

    .bright-home-visual {
      min-height: 320px;
    }

    .bright-home-visual-frame {
      border-radius: 26px;
    }

    .bright-home-visual-frame img {
      object-position: 59% center;
    }

    .bright-home-visual-note {
      right: 12px;
      bottom: 12px;
      left: 12px;
      max-width: none;
      padding: 12px 14px;
    }

    .bright-home-section,
    .bright-home-final {
      padding: 50px 0;
    }

    .bright-home-section-heading {
      font-size: 30px;
    }

    .bright-home-section-copy br {
      display: none;
    }

    .bright-home-steps {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .bright-home-step {
      min-height: 0;
      padding: 20px;
    }

    .bright-home-step-link {
      min-height: 51px;
    }

    .bright-home-memory-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .bright-home-memory-copy {
      padding: 13px 12px 15px;
    }

    .bright-home-memory-copy strong {
      font-size: 13px;
    }

    .bright-home-memory-copy span {
      font-size: 11px;
    }

    .bright-home-final-card {
      padding: 28px 20px;
      grid-template-columns: 1fr;
      border-radius: 25px;
    }

    .bright-home-final-link {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bright-home *,
    .bright-home *::before,
    .bright-home *::after {
      scroll-behavior: auto !important;
      transition: none !important;
      animation: none !important;
    }
  }
`;

export default function HomePage() {
  return (
    <>
      <style>{homeStyles}</style>

      <main className="bright-home">
        <section className="bright-home-hero">
          <div className="bright-home-shell bright-home-hero-grid">
            <div>
              <p className="bright-home-kicker">
                사진과 이야기로 만드는 나의 책
              </p>

              <h1 className="bright-home-title">
                오늘의 사진 한 장이
                <br />
                <span>한 권의 책이 됩니다</span>
              </h1>

              <p className="bright-home-description">
                어렵게 시작하지 않아도 됩니다. 사진을 올리고 짧은 이야기를
                남기면, 달동네가 읽기 좋은 책 원고로 차근차근 정리해 드립니다.
              </p>

              <div className="bright-home-actions">
                <Link
                  href="/dashboard/timeline"
                  className="bright-home-primary"
                >
                  <StepIcon name="photo" />
                  사진 한 장 올리기
                </Link>

                <Link href="/guide" className="bright-home-secondary">
                  이용 방법 먼저 보기
                </Link>
              </div>

              <ul className="bright-home-trust">
                <li>사진부터 간단하게</li>
                <li>AI는 글 정리만 도움</li>
                <li>주문 전 관리자 검토</li>
              </ul>
            </div>

            <div className="bright-home-visual">
              <div className="bright-home-visual-frame">
                <Image
                  src="/home/storybook/home-hero-bright-v4.webp"
                  alt="여러 세대의 사람들과 반려동물이 밝은 공간에서 사진과 책을 함께 보는 모습"
                  fill
                  priority
                  sizes="(max-width: 1040px) 100vw, 56vw"
                />
              </div>

              <div className="bright-home-visual-note">
                <span aria-hidden="true">
                  <HeartIcon />
                </span>
                나·가족·친구·반려동물과 함께한 모든 시간이 기록의 주인공입니다.
              </div>
            </div>
          </div>
        </section>

        <section className="bright-home-section">
          <div className="bright-home-shell">
            <h2 className="bright-home-section-heading">
              책 만들기, 네 단계면 충분합니다
            </h2>

            <p className="bright-home-section-copy">
              복잡한 메뉴를 찾지 않아도 됩니다. 왼쪽부터 한 단계씩 진행하세요.
            </p>

            <div className="bright-home-steps">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="bright-home-step"
                  data-tone={step.tone}
                >
                  <div className="bright-home-step-top">
                    <div className="bright-home-step-icon">
                      <StepIcon name={step.icon} />
                    </div>

                    <span className="bright-home-step-number">
                      STEP {step.number}
                    </span>
                  </div>

                  <h3>{step.title}</h3>
                  <p>{step.description}</p>

                  <Link href={step.href} className="bright-home-step-link">
                    {step.buttonLabel}
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>

            <p className="bright-home-flow-note">
              사진 → 이야기 → 책 원고 → 검토·주문
            </p>
          </div>
        </section>

        <section className="bright-home-section bright-home-memories">
          <div className="bright-home-shell">
            <h2 className="bright-home-section-heading">
              누구의 이야기든 소중한 기록입니다
            </h2>

            <p className="bright-home-section-copy">
              부모님 이야기뿐 아니라 나의 하루, 소중한 사람, 반려동물과의 시간도
              책으로 남길 수 있습니다.
            </p>

            <div
              className="bright-home-audience"
              aria-label="기록할 수 있는 대상"
            >
              {["나", "부모님", "아이", "친구", "연인", "강아지", "고양이"].map(
                (label) => (
                  <span key={label}>{label}</span>
                ),
              )}
            </div>

            <div className="bright-home-memory-grid">
              {memoryCards.map((card) => (
                <article key={card.label} className="bright-home-memory-card">
                  <div className="bright-home-memory-image">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      sizes="(max-width: 700px) 48vw, 25vw"
                    />
                  </div>

                  <div className="bright-home-memory-copy">
                    <strong>{card.label}</strong>
                    <span>{card.detail}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bright-home-final">
          <div className="bright-home-shell">
            <div className="bright-home-final-card">
              <div>
                <p className="bright-home-final-label">
                  오늘부터 가볍게 시작하세요
                </p>

                <h2>사진 한 장이면 충분합니다</h2>

                <p>
                  완벽한 글을 준비할 필요가 없습니다. 먼저 사진을 담고, 생각나는
                  만큼만 이야기를 적어보세요.
                </p>
              </div>

              <Link
                href="/dashboard/timeline"
                className="bright-home-final-link"
              >
                사진 올리기
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function StepIcon({ name }: { name: StepIconName }) {
  if (name === "photo") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M6 9.5h4.2l1.8-2.7h8l1.8 2.7H26a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle
          cx="16"
          cy="17.5"
          r="5"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path
          d="M25 13h.01"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "story") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M7 5h14a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Z"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path
          d="m12 21 1.1-4.1L21 9l2 2-7.9 7.9L12 21Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 24.5h10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "book") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M4 7.5c4.8-1 8.8.1 12 3.2v16C12.8 23.6 8.8 22.5 4 23.5v-16Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M28 7.5c-4.8-1-8.8.1-12 3.2v16c3.2-3.1 7.2-4.2 12-3.2v-16Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M16 10.7v16" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M6 8h20v16H6V8Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M10 5v6M22 5v6M6 13h20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="m11.5 19 3 3 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20.8 5.8a5.2 5.2 0 0 0-7.4 0L12 7.2l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 22l8.8-8.8a5.2 5.2 0 0 0 0-7.4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
