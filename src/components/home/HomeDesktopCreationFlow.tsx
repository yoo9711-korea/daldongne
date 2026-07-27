import Image from 'next/image';

const desktopFlowItems = [
  {
    image: '/home/desktop-flow/01-overview.webp',
    alt: '사진 올리기, 이야기 쓰기, 책 만들기, 결제하기로 이어지는 달동네 스토리북 전체 제작 과정',
    label: '전체 과정',
    title: '사진과 이야기로 나의 책을 만드는 흐름',
    width: 1672,
    height: 941,
  },
  {
    image: '/home/desktop-flow/02-photo-upload.webp',
    alt: '달동네 스토리 사진 올리기 화면',
    label: '1단계',
    title: '사진 올리기',
    width: 1536,
    height: 1024,
  },
  {
    image: '/home/desktop-flow/03-story-writing.webp',
    alt: '사진을 보며 촬영 시기, 함께한 사람, 기억을 작성하는 이야기 쓰기 화면',
    label: '2단계',
    title: '이야기 쓰기',
    width: 1672,
    height: 941,
  },
  {
    image: '/home/desktop-flow/04-book-making.webp',
    alt: '모은 사진과 이야기로 책의 챕터와 원고를 만드는 화면',
    label: '3단계',
    title: '책 만들기',
    width: 1536,
    height: 1024,
  },
  {
    image: '/home/desktop-flow/05-payment.webp',
    alt: '관리자 검토가 완료된 책의 배송 정보와 결제 방법을 확인하는 화면',
    label: '4단계',
    title: '결제하기',
    width: 1536,
    height: 1024,
  },
] as const;

const desktopFlowStyles = `
  .storybook-desktop-flow {
    border-top: 1px solid rgba(133, 91, 69, 0.1);
    border-bottom: 1px solid rgba(133, 91, 69, 0.12);
    background:
      radial-gradient(circle at 8% 8%, rgba(255, 255, 255, 0.92), transparent 26rem),
      radial-gradient(circle at 92% 18%, rgba(255, 225, 214, 0.52), transparent 24rem),
      linear-gradient(180deg, #fffdf9 0%, #fff8f1 100%);
  }

  .storybook-desktop-flow-inner {
    width: min(1390px, 100%);
    margin: 0 auto;
    padding: clamp(52px, 6vw, 82px) 34px;
  }

  .storybook-desktop-flow-heading {
    max-width: 820px;
    margin: 0 auto 32px;
    text-align: center;
  }

  .storybook-desktop-flow-eyebrow {
    margin: 0;
    color: #ea765d;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .storybook-desktop-flow-title {
    margin: 12px 0 0;
    color: #4d3429;
    font-family: 'Gowun Batang', 'Noto Serif KR', serif;
    font-size: clamp(30px, 4vw, 46px);
    font-weight: 800;
    line-height: 1.35;
    letter-spacing: -0.045em;
    word-break: keep-all;
  }

  .storybook-desktop-flow-description {
    margin: 15px 0 0;
    color: #80685d;
    font-size: clamp(15px, 1.7vw, 18px);
    line-height: 1.75;
    word-break: keep-all;
  }

  .storybook-desktop-flow-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }

  .storybook-desktop-flow-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid rgba(158, 107, 82, 0.16);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 16px 42px rgba(111, 72, 53, 0.1);
    transition:
      transform 180ms ease,
      box-shadow 180ms ease;
  }

  .storybook-desktop-flow-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 22px 52px rgba(111, 72, 53, 0.16);
  }

  .storybook-desktop-flow-card-featured {
    grid-column: 1 / -1;
  }

  .storybook-desktop-flow-image {
    display: block;
    width: 100%;
    height: auto;
    background: #fffaf4;
  }

  .storybook-desktop-flow-caption {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 70px;
    padding: 16px 20px;
    border-top: 1px solid rgba(158, 107, 82, 0.12);
  }

  .storybook-desktop-flow-step {
    flex: 0 0 auto;
    padding: 7px 11px;
    border-radius: 999px;
    background: #fff0e9;
    color: #eb7059;
    font-size: 13px;
    font-weight: 900;
  }

  .storybook-desktop-flow-caption h3 {
    margin: 0;
    color: #53392d;
    font-size: clamp(17px, 1.8vw, 22px);
    line-height: 1.45;
    letter-spacing: -0.03em;
    word-break: keep-all;
  }

  @media (max-width: 930px) {
    .storybook-desktop-flow-inner {
      padding-right: 22px;
      padding-left: 22px;
    }

    .storybook-desktop-flow-grid {
      gap: 18px;
    }
  }

  @media (max-width: 700px) {
    .storybook-desktop-flow-inner {
      padding: 46px 16px;
    }

    .storybook-desktop-flow-heading {
      margin-bottom: 24px;
    }

    .storybook-desktop-flow-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .storybook-desktop-flow-card-featured {
      grid-column: auto;
    }

    .storybook-desktop-flow-card {
      border-radius: 18px;
    }

    .storybook-desktop-flow-caption {
      min-height: 62px;
      padding: 13px 15px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .storybook-desktop-flow-card {
      transition: none;
    }

    .storybook-desktop-flow-card:hover {
      transform: none;
    }
  }
`;

export default function HomeDesktopCreationFlow() {
  return (
    <>
      <style>{desktopFlowStyles}</style>

      <section
        className="storybook-desktop-flow"
        aria-labelledby="storybook-desktop-flow-title"
      >
        <div className="storybook-desktop-flow-inner">
          <header className="storybook-desktop-flow-heading">
            <p className="storybook-desktop-flow-eyebrow">
              달동네 스토리북 제작 과정
            </p>

            <h2
              id="storybook-desktop-flow-title"
              className="storybook-desktop-flow-title"
            >
              사진을 올리고 이야기를 남기면
              <br />
              한 권의 책으로 이어집니다
            </h2>

            <p className="storybook-desktop-flow-description">
              사진 올리기부터 관리자 검토 후 결제까지,
              실제 이용 흐름을 한눈에 확인해 보세요.
            </p>
          </header>

          <div className="storybook-desktop-flow-grid">
            {desktopFlowItems.map((item, index) => (
              <article
                key={item.image}
                className={[
                  'storybook-desktop-flow-card',
                  index === 0
                    ? 'storybook-desktop-flow-card-featured'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes={
                    index === 0
                      ? '(max-width: 700px) 100vw, 1390px'
                      : '(max-width: 700px) 100vw, 680px'
                  }
                  className="storybook-desktop-flow-image"
                />

                <div className="storybook-desktop-flow-caption">
                  <span className="storybook-desktop-flow-step">
                    {item.label}
                  </span>
                  <h3>{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
