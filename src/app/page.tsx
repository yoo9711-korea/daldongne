import { auth } from '@/auth';
import HomeGuidePopup from '@/components/home/HomeGuidePopup';
import Image from 'next/image';
import Link from 'next/link';

const bookTypes = [
  '부모님 인생책',
  '가족 이야기책',
  '아이 성장 기록책',
  '여행 기록책',
  '부부 이야기책',
  '반려동물 추억책',
];

const steps = [
  '사진을 한곳에 모읍니다',
  '사진 속 이야기를 남깁니다',
  'AI가 글을 읽기 좋게 다듬습니다',
  '목차와 책 원고를 만듭니다',
  '완성된 원고를 내 책장에서 확인합니다',
  '필요하면 제작 상담을 신청합니다',
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

  @keyframes daldongneImageFloat {
    0% {
      opacity: 0;
      transform: translateY(24px) scale(0.96);
    }

    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes daldongneTypeLine {
    from {
      width: 0;
    }

    to {
      width: 100%;
    }
  }

  @keyframes daldongneSoftMove {
    0% {
      transform: scale(1) translateY(0);
    }

    50% {
      transform: scale(1.04) translateY(-8px);
    }

    100% {
      transform: scale(1) translateY(0);
    }
  }

  .daldongne-home {
    width: 100%;
    overflow-x: hidden;
    background: #fffaf3;
    color: #2f241c;
  }

  .daldongne-home,
  .daldongne-home * {
    box-sizing: border-box;
  }

  .daldongne-home-hero {
    display: grid;
    grid-template-columns:
      minmax(0, 1.05fr)
      minmax(0, 0.95fr);
    align-items: center;
    gap: 34px;
    width: 100%;
    max-width: 1180px;
    min-height: 76vh;
    margin: 0 auto;
    padding: 52px 24px;
    animation:
      daldongneFadeUp 0.7s ease-out both;
  }

  .daldongne-home-hero-copy,
  .daldongne-home-hero-visual {
    min-width: 0;
  }

  .daldongne-home-eyebrow {
    margin: 0 0 12px;
    color: #9b6a3d;
    font-size: 18px;
    font-weight: 700;
  }

  .daldongne-home-title {
    max-width: 760px;
    margin: 0;
    font-family:
      "Noto Serif KR",
      serif;
    font-size: clamp(42px, 5vw, 58px);
    line-height: 1.16;
    letter-spacing: -0.04em;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }

  .daldongne-home-description {
    max-width: 660px;
    margin: 18px 0 0;
    color: #5f5146;
    font-size: clamp(17px, 2vw, 21px);
    line-height: 1.75;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }

  .daldongne-home-buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-top: 24px;
  }

  .daldongne-home-button {
    display: inline-flex;
    min-height: 56px;
    justify-content: center;
    align-items: center;
    padding: 15px 27px;
    border-radius: 999px;
    text-decoration: none;
    font-size: 16px;
    font-weight: 800;
    text-align: center;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .daldongne-home-button:hover {
    transform: translateY(-2px);
  }

  .daldongne-home-button-primary {
    border: 1px solid #3a2a1f;
    background: #3a2a1f;
    color: #ffffff;
    box-shadow:
      0 8px 20px rgba(58, 42, 31, 0.18);
  }

  .daldongne-home-button-secondary {
    border: 1px solid #e3d4c2;
    background: #ffffff;
    color: #3a2a1f;
  }

  .daldongne-home-button-admin {
    border: 1px solid #8a4f22;
    background: #8a4f22;
    color: #fffaf0;
    box-shadow:
      0 8px 20px rgba(90, 50, 20, 0.2);
  }

  .daldongne-home-hero-visual {
    padding: 26px;
    border-radius: 36px;
    background: #f3e3cf;
    box-shadow:
      0 24px 70px rgba(83, 55, 31, 0.16);
  }

  .daldongne-home-book-preview {
    position: relative;
    min-height: 360px;
    overflow: hidden;
    border: 1px solid #ead8c3;
    border-radius: 28px;
    background: #fffaf6;
    animation:
      daldongneImageFloat 0.9s ease-out both;
  }

  .daldongne-home-book-image {
    object-fit: cover;
    filter:
      brightness(1.08)
      saturate(1.08);
    animation:
      daldongneSoftMove 7s ease-in-out infinite;
  }

  .daldongne-home-book-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        180deg,
        rgba(255, 250, 246, 0.18),
        rgba(255, 250, 246, 0.52)
      );
  }

  .daldongne-home-book-content {
    position: relative;
    z-index: 1;
    display: flex;
    min-height: 360px;
    flex-direction: column;
    justify-content: space-between;
    padding: 28px;
  }

  .daldongne-home-book-label {
    margin: 0;
    color: #9b6a3d;
    font-weight: 700;
  }

  .daldongne-home-book-title {
    display: grid;
    gap: 2px;
    margin: 20px 0 0;
    font-family:
      "Noto Serif KR",
      serif;
    font-size: clamp(26px, 3vw, 34px);
    line-height: 1.28;
    word-break: keep-all;
  }

  .daldongne-home-type-line {
    display: inline-block;
    max-width: 100%;
    width: 0;
    overflow: hidden;
    white-space: nowrap;
  }

  .daldongne-home-type-line-1 {
    animation:
      daldongneTypeLine
      1.2s steps(8)
      0.4s forwards;
  }

  .daldongne-home-type-line-2 {
    animation:
      daldongneTypeLine
      1.5s steps(10)
      1.6s forwards;
  }

  .daldongne-home-type-line-3 {
    animation:
      daldongneTypeLine
      1.1s steps(7)
      3.1s forwards;
  }

  .daldongne-home-book-text {
    margin: 24px 0 0;
    color: #6b5b4f;
    font-size: 18px;
    line-height: 1.8;
    word-break: keep-all;
  }

  .daldongne-home-section {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 52px 24px;
    animation:
      daldongneFadeUp 0.7s ease-out both;
  }

  .daldongne-home-section-label {
    margin: 0;
    color: #9b6a3d;
    font-weight: 700;
  }

  .daldongne-home-section-title {
    margin: 12px 0 0;
    font-family:
      "Noto Serif KR",
      serif;
    font-size: clamp(32px, 4vw, 42px);
    line-height: 1.3;
    letter-spacing: -0.035em;
    word-break: keep-all;
  }

  .daldongne-home-feature-grid {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-top: 24px;
  }

  .daldongne-home-feature-card {
    min-width: 0;
    padding: 26px;
    border: 1px solid #ead8c3;
    border-radius: 24px;
    background: #ffffff;
  }

  .daldongne-home-feature-card h3 {
    margin: 0;
    font-size: 24px;
    line-height: 1.4;
    word-break: keep-all;
  }

  .daldongne-home-feature-card p {
    margin: 12px 0 0;
    color: #66584e;
    font-size: 17px;
    line-height: 1.7;
    word-break: keep-all;
  }

  .daldongne-home-dark {
    width: 100%;
    background: #3a2a1f;
    color: #ffffff;
  }

  .daldongne-home-dark-inner {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 56px 24px;
    animation:
      daldongneFadeUp 0.7s ease-out both;
  }

  .daldongne-home-dark-label {
    margin: 0;
    color: #e8c69f;
    font-weight: 700;
  }

  .daldongne-home-dark-title {
    margin: 12px 0 0;
    font-family:
      "Noto Serif KR",
      serif;
    font-size: clamp(32px, 4vw, 42px);
    line-height: 1.3;
    letter-spacing: -0.035em;
    word-break: keep-all;
  }

  .daldongne-home-book-type-grid {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 24px;
  }

  .daldongne-home-book-type {
    min-width: 0;
    padding: 22px;
    border:
      1px solid rgba(255, 255, 255, 0.18);
    border-radius: 20px;
    background:
      rgba(255, 255, 255, 0.08);
    font-size: 19px;
    font-weight: 700;
    word-break: keep-all;
  }

  .daldongne-home-step-grid {
    display: grid;
    gap: 14px;
    margin-top: 22px;
  }

  .daldongne-home-step {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 18px;
    padding: 20px;
    border: 1px solid #ead8c3;
    border-radius: 20px;
    background: #ffffff;
  }

  .daldongne-home-step-number {
    display: grid;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    place-items: center;
    border-radius: 50%;
    background: #f3e3cf;
  }

  .daldongne-home-step-text {
    min-width: 0;
    font-size: 19px;
    font-weight: 700;
    line-height: 1.55;
    word-break: keep-all;
  }

  .daldongne-home-cta {
    width: 100%;
    background: #f4e6d5;
  }

  .daldongne-home-cta-inner {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 52px 24px;
    text-align: center;
  }

  .daldongne-home-cta-title {
    margin: 0;
    font-family:
      "Noto Serif KR",
      serif;
    font-size: clamp(34px, 4.5vw, 44px);
    line-height: 1.3;
    letter-spacing: -0.035em;
    word-break: keep-all;
  }

  .daldongne-home-cta-text {
    margin: 22px 0 0;
    color: #66584e;
    font-size: 20px;
    line-height: 1.7;
  }

  .daldongne-home-cta-button {
    margin-top: 20px;
  }

  @media (max-width: 960px) {
    .daldongne-home-hero {
      grid-template-columns: 1fr;
      min-height: auto;
      gap: 32px;
      padding-top: 42px;
      padding-bottom: 42px;
    }

    .daldongne-home-title {
      max-width: 820px;
      font-size: clamp(40px, 7vw, 54px);
    }

    .daldongne-home-description {
      max-width: 780px;
    }

    .daldongne-home-feature-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .daldongne-home-book-type-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .daldongne-home-hero {
      gap: 26px;
      padding: 30px 18px 38px;
    }

    .daldongne-home-eyebrow {
      font-size: 15px;
    }

    .daldongne-home-title {
      font-size: clamp(34px, 10vw, 44px);
      line-height: 1.2;
      letter-spacing: -0.045em;
    }

    .daldongne-home-title br {
      display: none;
    }

    .daldongne-home-description {
      margin-top: 16px;
      font-size: 17px;
      line-height: 1.75;
    }

    .daldongne-home-buttons {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      width: 100%;
      margin-top: 22px;
    }

    .daldongne-home-button {
      width: 100%;
      min-height: 54px;
      padding: 14px 20px;
    }

    .daldongne-home-hero-visual {
      padding: 14px;
      border-radius: 25px;
    }

    .daldongne-home-book-preview {
      min-height: 330px;
      border-radius: 21px;
    }

    .daldongne-home-book-content {
      min-height: 330px;
      padding: 22px;
    }

    .daldongne-home-book-title {
      font-size: clamp(24px, 7vw, 30px);
    }

    .daldongne-home-book-text {
      font-size: 16px;
      line-height: 1.7;
    }

    .daldongne-home-section,
    .daldongne-home-dark-inner {
      padding: 42px 18px;
    }

    .daldongne-home-section-title,
    .daldongne-home-dark-title {
      font-size: 32px;
    }

    .daldongne-home-section-title br,
    .daldongne-home-dark-title br,
    .daldongne-home-cta-title br {
      display: none;
    }

    .daldongne-home-feature-grid,
    .daldongne-home-book-type-grid {
      grid-template-columns: 1fr;
    }

    .daldongne-home-feature-card {
      padding: 22px;
    }

    .daldongne-home-feature-card h3 {
      font-size: 21px;
    }

    .daldongne-home-feature-card p {
      font-size: 16px;
    }

    .daldongne-home-book-type {
      padding: 19px;
      font-size: 17px;
    }

    .daldongne-home-step {
      align-items: flex-start;
      gap: 14px;
      padding: 17px;
    }

    .daldongne-home-step-text {
      padding-top: 6px;
      font-size: 17px;
    }

    .daldongne-home-cta-inner {
      padding: 44px 18px;
    }

    .daldongne-home-cta-title {
      font-size: 33px;
    }

    .daldongne-home-cta-text {
      font-size: 17px;
    }
  }

  @media (max-width: 390px) {
    .daldongne-home-title {
      font-size: 32px;
    }

    .daldongne-home-book-title {
      font-size: 23px;
    }

    .daldongne-home-type-line {
      white-space: normal;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .daldongne-home *,
    .daldongne-home *::before,
    .daldongne-home *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }

    .daldongne-home-type-line {
      width: 100%;
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

      <main className="daldongne-home">
        <section className="daldongne-home-hero">
          <div className="daldongne-home-hero-copy">
            <p className="daldongne-home-eyebrow">
              달동네 출판사
            </p>

            <h1 className="daldongne-home-title">
              사진은 추억을 남기고,
              <br />
              달동네는 그 추억을
              <br />
              한 권의 책으로 엮습니다.
            </h1>

            <p className="daldongne-home-description">
              부모님의 삶, 우리 가족의 시간,
              아이의 성장 기록까지. 흩어진 사진과
              이야기를 AI가 정리해 평생 간직할 수
              있는 인생책 원고로 만들어 드립니다.
            </p>

            <div className="daldongne-home-buttons">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className={[
                    'daldongne-home-button',
                    'daldongne-home-button-admin',
                  ].join(' ')}
                >
                  관리자 홈
                </Link>
              ) : null}

              <Link
                href={startHref}
                className={[
                  'daldongne-home-button',
                  'daldongne-home-button-primary',
                ].join(' ')}
              >
                {session?.user
                  ? '내 기록 이어가기'
                  : '무료로 시작하기'}
              </Link>

              <Link
                href={startHref}
                className={[
                  'daldongne-home-button',
                  'daldongne-home-button-secondary',
                ].join(' ')}
              >
                인생책 만들기
              </Link>
            </div>
          </div>

          <div className="daldongne-home-hero-visual">
            <div className="daldongne-home-book-preview">
              <Image
                src="/home/memory-book-sample.jpg"
                alt="인생책 예시 이미지"
                fill
                priority
                sizes="(max-width: 960px) 100vw, 48vw"
                className="daldongne-home-book-image"
              />

              <div className="daldongne-home-book-overlay" />

              <div className="daldongne-home-book-content">
                <div>
                  <p className="daldongne-home-book-label">
                    AI 인생책 원고 예시
                  </p>

                  <h2 className="daldongne-home-book-title">
                    <span
                      className={[
                        'daldongne-home-type-line',
                        'daldongne-home-type-line-1',
                      ].join(' ')}
                    >
                      어머니의 봄날은
                    </span>

                    <span
                      className={[
                        'daldongne-home-type-line',
                        'daldongne-home-type-line-2',
                      ].join(' ')}
                    >
                      아직도 우리 집에
                    </span>

                    <span
                      className={[
                        'daldongne-home-type-line',
                        'daldongne-home-type-line-3',
                      ].join(' ')}
                    >
                      남아 있습니다.
                    </span>
                  </h2>
                </div>

                <p className="daldongne-home-book-text">
                  오래된 사진 한 장에는 그날의 공기,
                  가족의 목소리, 말하지 못한 마음이
                  함께 담겨 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="daldongne-home-section">
          <p className="daldongne-home-section-label">
            왜 달동네인가요?
          </p>

          <h2 className="daldongne-home-section-title">
            기록하지 않은 이야기는
            <br />
            시간이 지나면 사라집니다.
          </h2>

          <div className="daldongne-home-feature-grid">
            {[
              [
                '사진 모으기',
                '책에 담을 사진을 한곳에 모으고 날짜와 장소를 기록합니다.',
              ],
              [
                '이야기 남기기',
                '사진 속 기억과 가족이 기억하는 이야기를 글로 남깁니다.',
              ],
              [
                '책 원고 만들기',
                '모아 둔 사진과 이야기를 목차와 책 원고로 정리합니다.',
              ],
            ].map(([title, description]) => (
              <article
                key={title}
                className="daldongne-home-feature-card"
              >
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="daldongne-home-dark">
          <div className="daldongne-home-dark-inner">
            <p className="daldongne-home-dark-label">
              이런 책을 만들 수 있습니다
            </p>

            <h2 className="daldongne-home-dark-title">
              한 사람의 삶도,
              <br />
              한 가족의 시간도 책이 됩니다.
            </h2>

            <div className="daldongne-home-book-type-grid">
              {bookTypes.map((type) => (
                <div
                  key={type}
                  className="daldongne-home-book-type"
                >
                  {type}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="daldongne-home-section">
          <p className="daldongne-home-section-label">
            제작 과정
          </p>

          <h2 className="daldongne-home-section-title">
            복잡한 출판 과정을
            <br />
            쉽게 따라갈 수 있게 만들었습니다.
          </h2>

          <div className="daldongne-home-step-grid">
            {steps.map((step, index) => (
              <div
                key={step}
                className="daldongne-home-step"
              >
                <strong className="daldongne-home-step-number">
                  {index + 1}
                </strong>

                <span className="daldongne-home-step-text">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="daldongne-home-cta">
          <div className="daldongne-home-cta-inner">
            <h2 className="daldongne-home-cta-title">
              당신의 추억도
              <br />
              한 권의 책이 될 수 있습니다.
            </h2>

            <p className="daldongne-home-cta-text">
              지금 사진 몇 장으로 시작해 보세요.
            </p>

            <Link
              href={startHref}
              className={[
                'daldongne-home-button',
                'daldongne-home-button-primary',
                'daldongne-home-cta-button',
              ].join(' ')}
            >
              {session?.user
                ? '내 기록 이어가기'
                : '지금 시작하기'}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}