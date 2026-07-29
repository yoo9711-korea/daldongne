import Image from "next/image";
import Link from "next/link";
import HomeServiceJourney from "@/components/home/HomeServiceJourney";

const steps = [
  {
    number: "1",
    eyebrow: "사진",
    title: "사진 올리기",
    description: "소중한 사진을 올려주세요",
    href: "/dashboard/timeline",
    image: "/home/reference-home-v1/step-1.webp",
  },
  {
    number: "2",
    eyebrow: "이야기",
    title: "이야기 쓰기",
    description: "나의 이야기를 적어주세요",
    href: "/dashboard/interview",
    image: "/home/reference-home-v1/step-2.webp",
  },
  {
    number: "3",
    eyebrow: "책",
    title: "책 만들기",
    description: "나만의 책을 만들어보세요",
    href: "/dashboard/book",
    image: "/home/reference-home-v1/step-3.webp",
  },
  {
    number: "4",
    eyebrow: "결제",
    title: "관리자 검토 후 결제",
    description: "주문 내용을 확인하고 결제하세요",
    href: "/dashboard/library",
    image: "/home/reference-home-v1/step-4.webp",
  },
] as const;

const memories = [
  { image: "/home/reference-home-v1/memory-1.webp", alt: "차를 들고 환하게 웃는 여성" },
  { image: "/home/reference-home-v1/memory-2.webp", alt: "사진책을 함께 보는 부부" },
  { image: "/home/reference-home-v1/memory-3.webp", alt: "그림을 들고 웃는 아이" },
  { image: "/home/reference-home-v1/memory-4.webp", alt: "함께 웃는 형제" },
  { image: "/home/reference-home-v1/memory-5.webp", alt: "함께 웃는 친구들" },
  { image: "/home/reference-home-v1/memory-6.webp", alt: "차를 들고 웃는 어르신" },
  { image: "/home/reference-home-v1/memory-7.webp", alt: "강아지와 고양이" },
] as const;

const styles = `
  .reference-home,
  .reference-home * {
    box-sizing: border-box;
  }

  .reference-home {
    --ref-coral: #ff6453;
    --ref-coral-deep: #e94f41;
    --ref-ink: #432c22;
    --ref-copy: #76655b;
    --ref-line: rgba(126, 90, 69, 0.14);
    min-height: 100vh;
    overflow: hidden;
    color: var(--ref-ink);
    background:
      radial-gradient(circle at 8% 8%, rgba(255, 233, 217, 0.64), transparent 25rem),
      radial-gradient(circle at 92% 16%, rgba(255, 244, 220, 0.55), transparent 27rem),
      linear-gradient(180deg, #fffdf9 0%, #fff9f2 100%);
    font-family: var(--font-daldongne-sans), "Noto Sans KR", sans-serif;
  }

  .reference-shell {
    width: min(1500px, calc(100% - 70px));
    margin: 0 auto;
  }

  .reference-hero {
    padding: 36px 0 36px;
  }

  .reference-main-image {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 2;
    margin-bottom: 46px;
    overflow: hidden;
    border:
      1px solid
      rgba(126, 90, 69, 0.14);
    border-radius: 32px;
    background: #fffdf9;
    box-shadow:
      0 24px 64px
      rgba(91, 61, 45, 0.13);
  }

  .reference-main-image img {
    object-fit: contain;
  }

  .reference-title {
    margin: 0;
    font-family: var(--font-daldongne-serif), "Gowun Batang", serif;
    font-size: clamp(48px, 5.2vw, 78px);
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    letter-spacing: -0.06em;
    word-break: keep-all;
  }

  .reference-title span {
    color: var(--ref-coral);
  }

  .reference-subtitle {
    margin: 17px 0 0;
    color: var(--ref-copy);
    font-size: 19px;
    font-weight: 600;
    line-height: 1.7;
    text-align: center;
  }

  .reference-process {
    margin-top: 46px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 48px;
  }

  .reference-step {
    position: relative;
    min-width: 0;
    padding: 22px 22px 26px;
    border: 1px solid rgba(219, 171, 141, 0.22);
    border-radius: 30px;
    background: rgba(255, 252, 248, 0.88);
    box-shadow: 0 14px 38px rgba(91, 61, 45, 0.08);
    text-align: center;
  }

  .reference-step:not(:last-child)::after {
    position: absolute;
    top: 48%;
    right: -39px;
    color: #ff7a67;
    content: "→";
    font-size: 50px;
    font-weight: 500;
    line-height: 1;
    transform: translateY(-50%);
  }

  .reference-step-number {
    position: absolute;
    top: 22px;
    left: 23px;
    z-index: 2;
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: linear-gradient(145deg, #ff8b79, #ef5c4b);
    color: #ffffff;
    font-size: 27px;
    font-weight: 900;
    box-shadow: 0 8px 18px rgba(231, 87, 65, 0.2);
  }

  .reference-step-visual {
    position: relative;
    width: 100%;
    aspect-ratio: 1.42 / 1;
    overflow: hidden;
    border-radius: 22px;
  }

  .reference-step-visual img {
    object-fit: cover;
  }

  .reference-step-kicker {
    margin: 7px 0 0;
    color: var(--ref-coral-deep);
    font-size: 14px;
    font-weight: 900;
  }

  .reference-step h2 {
    margin: 7px 0 0;
    font-family: var(--font-daldongne-serif), "Gowun Batang", serif;
    font-size: clamp(24px, 2.3vw, 37px);
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: -0.045em;
  }

  .reference-step p {
    margin: 8px 0 0;
    color: var(--ref-copy);
    font-size: 14px;
    line-height: 1.55;
    word-break: keep-all;
  }

  .reference-step a {
    position: absolute;
    inset: 0;
    z-index: 3;
    border-radius: inherit;
    text-indent: -9999px;
  }

  .reference-step:hover {
    transform: translateY(-4px);
    border-color: rgba(239, 104, 82, 0.32);
    box-shadow: 0 22px 46px rgba(91, 61, 45, 0.13);
  }

  .reference-step {
    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
  }

  .reference-review-note {
    width: fit-content;
    margin: 20px 70px 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #647446;
    font-size: 16px;
    font-weight: 850;
  }

  .reference-review-note::before {
    content: "🌱";
  }

  .reference-cta {
    max-width: 670px;
    min-height: 90px;
    margin: 24px auto 0;
    padding: 0 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 17px;
    border-radius: 22px;
    background: linear-gradient(135deg, #ff745f, #f25345);
    color: #ffffff;
    font-size: clamp(26px, 3vw, 42px);
    font-weight: 900;
    letter-spacing: -0.04em;
    text-decoration: none;
    box-shadow: 0 18px 36px rgba(231, 84, 62, 0.24);
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .reference-cta:hover {
    transform: translateY(-3px);
    box-shadow: 0 23px 44px rgba(231, 84, 62, 0.3);
  }

  .reference-cta-heart {
    font-size: 42px;
  }

  .reference-cta-caption {
    margin: 10px 0 0;
    color: #5f4a40;
    font-size: 18px;
    line-height: 1.6;
    text-align: center;
  }

  .reference-memories {
    padding: 24px 0 58px;
  }

  .reference-memory-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }

  .reference-memory {
    position: relative;
    min-width: 0;
    aspect-ratio: 0.83 / 1;
    overflow: hidden;
    border-radius: 17px;
    background: #f5e9df;
    box-shadow: 0 8px 22px rgba(86, 58, 45, 0.08);
  }

  .reference-memory img {
    object-fit: cover;
    transition: transform 350ms ease;
  }

  .reference-memory:hover img {
    transform: scale(1.035);
  }

  .reference-mobile-actions {
    display: none;
  }

  @media (max-width: 1100px) {
    .reference-shell {
      width: min(100% - 40px, 900px);
    }

    .reference-process {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 22px;
    }

    .reference-step:not(:last-child)::after {
      display: none;
    }

    .reference-memory-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .reference-memory:nth-child(n + 5) {
      display: none;
    }
  }

  @media (max-width: 700px) {
    .reference-shell {
      width: min(100% - 28px, 560px);
    }

    .reference-hero {
      padding: 20px 0 20px;
    }

    .reference-main-image {
      margin-bottom: 28px;
      border-radius: 18px;
      box-shadow:
        0 14px 34px
        rgba(91, 61, 45, 0.11);
    }

    .reference-title {
      font-size: 40px;
      text-align: left;
    }

    .reference-subtitle {
      margin-top: 12px;
      font-size: 15px;
      text-align: left;
    }

    .reference-process {
      margin-top: 26px;
      grid-template-columns: 1fr;
      gap: 9px;
    }

    .reference-step {
      min-height: 88px;
      padding: 10px 42px 10px 94px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      border-radius: 16px;
      text-align: left;
    }

    .reference-step-number {
      top: 12px;
      left: 12px;
      width: 28px;
      height: 28px;
      font-size: 14px;
    }

    .reference-step-visual {
      position: absolute;
      top: 12px;
      left: 42px;
      width: 47px;
      height: 64px;
      border-radius: 11px;
    }

    .reference-step-kicker {
      margin: 0;
      font-size: 11px;
    }

    .reference-step h2 {
      margin: 2px 0 0;
      font-family: var(--font-daldongne-sans), "Noto Sans KR", sans-serif;
      font-size: 18px;
      font-weight: 900;
    }

    .reference-step p {
      display: none;
    }

    .reference-step::before {
      position: absolute;
      right: 17px;
      top: 50%;
      content: "›";
      color: #8e7b72;
      font-size: 30px;
      transform: translateY(-50%);
    }

    .reference-review-note {
      display: none;
    }

    .reference-cta {
      width: 100%;
      min-height: 58px;
      margin-top: 20px;
      border-radius: 14px;
      font-size: 19px;
    }

    .reference-cta-heart {
      font-size: 25px;
    }

    .reference-cta-caption {
      font-size: 13px;
    }

    .reference-memories {
      padding-top: 18px;
      padding-bottom: 92px;
    }

    .reference-memory-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
    }

    .reference-memory:nth-child(n + 4) {
      display: none;
    }

    .reference-memory {
      border-radius: 12px;
    }

    .reference-mobile-actions {
      position: fixed;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 50;
      min-height: 68px;
      padding: 8px 18px max(8px, env(safe-area-inset-bottom));
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid rgba(131, 93, 73, 0.14);
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 -8px 24px rgba(88, 59, 44, 0.08);
      backdrop-filter: blur(14px);
    }

    .reference-mobile-actions a {
      display: grid;
      place-items: center;
      color: #6f5a50;
      font-size: 11px;
      font-weight: 800;
      text-decoration: none;
    }

    .reference-mobile-actions span {
      display: block;
      color: var(--ref-coral);
      font-size: 22px;
      line-height: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .reference-home *,
    .reference-home *::before,
    .reference-home *::after {
      transition: none !important;
    }
  }
`;

export default function HomePage() {
  return (
    <>
      <style>{styles}</style>

      <main className="reference-home">
        <section className="reference-hero">
          <div className="reference-shell">
            <div className="reference-main-image">
              <Image
                src="/home/reference-home-v1/home-main-reference-v2.webp"
                alt="달동네 스토리의 나, 가족, 친구, 연인, 강아지, 고양이 기록 화면과 모바일 화면을 함께 보여주는 메인 이미지"
                fill
                priority
                quality={100}
          unoptimized
          sizes="(max-width: 700px) calc(100vw - 28px), (max-width: 1100px) calc(100vw - 40px), 1500px"
              />
            </div>

            <h1 className="reference-title">
              오늘의 사진 한 장이
              <br />
              <span>한 권의 책이 됩니다</span>
            </h1>

            <p className="reference-subtitle">
              사진과 이야기를 차곡차곡 모아 세상에 하나뿐인 나의 책을 만들어보세요.
            </p>

            <div className="reference-process">
              {steps.map((step) => (
                <article key={step.number} className="reference-step">
                  <span className="reference-step-number">{step.number}</span>

                  <div className="reference-step-visual">
                    <Image
                      src={step.image}
                      alt=""
                      fill
                      sizes="(max-width: 700px) 47px, (max-width: 1100px) 45vw, 25vw"
                    />
                  </div>

                  <p className="reference-step-kicker">
                    {step.number}. {step.eyebrow}
                  </p>
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>

                  <Link href={step.href}>{step.title} 화면으로 이동</Link>
                </article>
              ))}
            </div>

            <p className="reference-review-note">관리자 검토 완료 후 결제</p>

            <Link href="/dashboard/timeline" className="reference-cta">
              <span className="reference-cta-heart" aria-hidden="true">♥</span>
              내 기록 시작하기
            </Link>

            <p className="reference-cta-caption">
              나와 소중한 존재들의 시간을 남겨보세요
            </p>
          </div>
        </section>

        <HomeServiceJourney />

        <section className="reference-memories" aria-label="기록할 수 있는 사람과 반려동물">
          <div className="reference-shell reference-memory-grid">
            {memories.map((memory) => (
              <div key={memory.image} className="reference-memory">
                <Image
                  src={memory.image}
                  alt={memory.alt}
                  fill
                  sizes="(max-width: 700px) 33vw, (max-width: 1100px) 25vw, 14vw"
                />
              </div>
            ))}
          </div>
        </section>

        <nav className="reference-mobile-actions" aria-label="모바일 빠른 메뉴">
          <Link href="/"><span>⌂</span>홈</Link>
          <Link href="/dashboard/library"><span>▢</span>내 책</Link>
          <Link href="/dashboard"><span>♧</span>알림</Link>
          <Link href="/dashboard/account"><span>○</span>마이페이지</Link>
        </nav>
      </main>
    </>
  );
}
