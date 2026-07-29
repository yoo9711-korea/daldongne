import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "사진과 이야기를 모으기",
    description:
      "사진을 올리고 그날의 기억이나 전하고 싶은 말을 짧게 남깁니다.",
    actionLabel: "사진과 이야기 남기기",
    actionKey: "photo",
  },
  {
    number: "02",
    title: "AI가 글을 정리하기",
    description:
      "AI가 주인공이 되지 않고, 사용자의 말투와 감정을 살려 읽기 좋은 글로 정리합니다.",
    actionLabel: "이야기 다듬기",
    actionKey: "story",
  },
  {
    number: "03",
    title: "책 원고 만들기",
    description:
      "모아 둔 사진과 이야기에서 필요한 자료를 고르고 목차와 책 원고 초안을 만듭니다.",
    actionLabel: "내 책 원고 만들기",
    actionKey: "book",
  },
  {
    number: "04",
    title: "제작 상담 신청하기",
    description:
      "완성된 원고를 확인한 뒤 페이지 수, 인쇄 방식과 제작 일정을 상담합니다.",
    actionLabel: "책 제작 상담하기",
    actionKey: "consultation",
  },
  {
    number: "05",
    title: "실제 책으로 제작하기",
    description:
      "관리자 검토, 교정 확인, 인쇄와 배송 과정을 거쳐 세상에 하나뿐인 책을 받습니다.",
    actionLabel: "전체 제작 과정 보기",
    actionKey: "process",
  },
] as const;

export default function HomeServiceJourney() {
  const hrefs = {
    photo: "/dashboard/timeline",
    story: "/dashboard/interview",
    book: "/dashboard/book",
    consultation: "/apply",
    process: "/process",
  } as const;

  return (
    <section
      id="service-journey"
      className="home-service-journey"
      aria-labelledby="home-service-journey-title"
    >
      <style>
        {homeServiceJourneyStyles}
      </style>

      <div className="home-service-journey-shell">
        <div className="home-service-journey-heading">
          <p>달동네 스토리 이용 흐름</p>

          <h2 id="home-service-journey-title">
            사진과 이야기가
            <br />
            한 권의 책이 되는 과정
          </h2>

          <span>
            복잡한 출판 절차를 몰라도 괜찮습니다.
            기록을 모으는 일부터 실제 책 제작까지
            순서대로 이어집니다.
          </span>
        </div>

        <ol className="home-service-journey-list">
          {STEPS.map((step, index) => (
            <li key={step.number}>
              <article>
                <div className="home-service-journey-step-top">
                  <span className="home-service-journey-number">
                    {step.number}
                  </span>

                  {index < STEPS.length - 1 ? (
                    <span
                      className="home-service-journey-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  ) : (
                    <span
                      className="home-service-journey-heart"
                      aria-hidden="true"
                    >
                      ♡
                    </span>
                  )}
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>

                <Link href={hrefs[step.actionKey]}>
                  {step.actionLabel}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            </li>
          ))}
        </ol>

        <div className="home-service-journey-actions">
          <Link href={hrefs.photo} data-primary="true">
            사진과 이야기 남기기
          </Link>

          <Link href={hrefs.book}>
            내 책 원고 만들기
          </Link>

          <Link href="/apply">
            책 제작 상담하기
          </Link>

          <Link href="/pricing">
            상품과 가격 보기
          </Link>
        </div>

        <p className="home-service-journey-note">
          사진 3장부터 기본 원고 만들기를 시작할 수 있으며,
          이야기를 함께 남길수록 더 풍부한 책이 만들어집니다.
        </p>
      </div>
    </section>
  );
}

const homeServiceJourneyStyles = `
  .home-service-journey {
    padding: 74px 24px 78px;
    border-top: 1px solid #edd9cc;
    border-bottom: 1px solid #ead5c7;
    background:
      radial-gradient(
        circle at 12% 12%,
        rgba(255, 231, 214, 0.88),
        transparent 31%
      ),
      linear-gradient(
        180deg,
        #fffdf9 0%,
        #fff7f1 100%
      );
  }

  .home-service-journey-shell {
    width: min(1536px, 100%);
    margin: 0 auto;
  }

  .home-service-journey-heading {
    max-width: 720px;
    margin: 0 auto;
    text-align: center;
  }

  .home-service-journey-heading > p {
    margin: 0;
    color: #df6550;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.12em;
  }

  .home-service-journey-heading h2 {
    margin: 14px 0 0;
    color: #3b281f;
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-size: clamp(38px, 4.2vw, 62px);
    font-weight: 700;
    line-height: 1.13;
    letter-spacing: -0.035em;
  }

  .home-service-journey-heading > span {
    display: block;
    margin-top: 18px;
    color: #715f56;
    font-size: 17px;
    line-height: 1.8;
    word-break: keep-all;
  }

  .home-service-journey-list {
    margin: 44px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 14px;
    list-style: none;
  }

  .home-service-journey-list article {
    height: 100%;
    min-height: 305px;
    padding: 24px 20px 21px;
    display: flex;
    flex-direction: column;
    border: 1px solid #e6cfc1;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow:
      0 16px 38px
      rgba(96, 65, 48, 0.08);
  }

  .home-service-journey-step-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .home-service-journey-number {
    width: 43px;
    height: 43px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #ffffff;
    background: #df6550;
    font-size: 13px;
    font-weight: 900;
  }

  .home-service-journey-arrow,
  .home-service-journey-heart {
    color: #d7a493;
    font-size: 25px;
    font-weight: 900;
  }

  .home-service-journey-heart {
    color: #df6550;
  }

  .home-service-journey-list h3 {
    margin: 22px 0 0;
    color: #3b281f;
    font-size: 21px;
    line-height: 1.35;
    word-break: keep-all;
  }

  .home-service-journey-list p {
    margin: 13px 0 0;
    color: #75635a;
    font-size: 14px;
    line-height: 1.78;
    word-break: keep-all;
  }

  .home-service-journey-list a {
    min-height: 42px;
    margin-top: auto;
    padding: 11px 12px;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border: 1px solid #e0bcae;
    border-radius: 12px;
    color: #754c3e;
    background: #fff9f5;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.35;
    text-decoration: none;
  }

  .home-service-journey-list a:hover {
    border-color: #df6550;
    color: #ffffff;
    background: #df6550;
  }

  .home-service-journey-actions {
    margin-top: 25px;
    padding: 16px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 10px;
    border: 1px solid #e7d0c2;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.86);
  }

  .home-service-journey-actions a {
    min-height: 54px;
    padding: 10px 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d8b9aa;
    border-radius: 14px;
    color: #6d493c;
    background: #ffffff;
    font-size: 15px;
    font-weight: 900;
    text-align: center;
    text-decoration: none;
  }

  .home-service-journey-actions a:hover,
  .home-service-journey-actions a[data-primary="true"] {
    border-color: #df6550;
    color: #ffffff;
    background: #df6550;
  }

  .home-service-journey-note {
    margin: 17px 0 0;
    color: #7d6a60;
    font-size: 13px;
    line-height: 1.7;
    text-align: center;
    word-break: keep-all;
  }

  @media (max-width: 1180px) {
    .home-service-journey-list {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 820px) {
    .home-service-journey {
      padding: 54px 18px 58px;
    }

    .home-service-journey-heading > span {
      font-size: 15px;
    }

    .home-service-journey-list {
      margin-top: 31px;
      grid-template-columns: 1fr;
      gap: 11px;
    }

    .home-service-journey-list article {
      min-height: auto;
      padding: 20px;
    }

    .home-service-journey-arrow {
      transform: rotate(90deg);
    }

    .home-service-journey-list a {
      margin-top: 18px;
    }

    .home-service-journey-actions {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 520px) {
    .home-service-journey {
      padding:
        46px
        max(14px, env(safe-area-inset-right))
        50px
        max(14px, env(safe-area-inset-left));
    }

    .home-service-journey-heading {
      text-align: left;
    }

    .home-service-journey-heading h2 {
      font-size: 39px;
    }

    .home-service-journey-heading > span,
    .home-service-journey-list p {
      font-size: 14px;
    }

    .home-service-journey-list h3 {
      font-size: 20px;
    }

    .home-service-journey-list a {
      min-height: 48px;
      font-size: 14px;
    }

    .home-service-journey-actions {
      padding: 12px;
      grid-template-columns: 1fr;
    }

    .home-service-journey-actions a {
      min-height: 52px;
      font-size: 15px;
    }

    .home-service-journey-note {
      text-align: left;
    }
  }
`;
