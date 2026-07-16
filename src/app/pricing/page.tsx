import { auth } from '@/auth';
import {
  PRODUCT_ADDONS,
  PRODUCT_BILLING_LABELS,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_PLANS,
  formatProductPrice,
  type ProductCategory,
  type ProductPlan,
} from '@/lib/products/catalog';
import Link from 'next/link';

const bookTypes = [
  {
    title: '인생 기록책',
    text: '한 사람의 성장 과정과 중요한 삶의 순간을 한 권에 기록합니다.',
  },
  {
    title: '가족 이야기책',
    text: '가족이 함께 보낸 시간과 서로의 이야기를 한 권에 담습니다.',
  },
  {
    title: '부부 이야기책',
    text: '만남부터 현재까지 부부가 함께 걸어온 시간을 기록합니다.',
  },
  {
    title: '성장 기록책',
    text: '아이의 출생과 성장 과정, 가족의 기억을 정리합니다.',
  },
  {
    title: '여행 기록책',
    text: '여행 사진과 그날의 경험을 한 권의 기록으로 남깁니다.',
  },
];

const serviceSteps = [
  {
    number: '01',
    title: '사진과 이야기 기록',
    text: '사진을 모으고 그 사진에 얽힌 이야기를 차근차근 남깁니다.',
  },
  {
    number: '02',
    title: 'AI 기록 정리',
    text: 'AI가 사진과 글을 분석하고 문장을 다듬어 기록을 정리합니다.',
  },
  {
    number: '03',
    title: '목차와 원고 제작',
    text: '기록을 시간과 주제에 따라 묶어 한 권의 책 원고로 만듭니다.',
  },
  {
    number: '04',
    title: '사양과 금액 확정',
    text: '페이지, 제본, 수량과 선택 옵션을 확인해 최종 견적을 안내합니다.',
  },
  {
    number: '05',
    title: '인쇄와 배송',
    text: '결제 후 최종 확인을 거쳐 책을 제작하고 안전하게 배송합니다.',
  },
];

const subscriptionComparison = [
  {
    code: 'MONTHLY_RECORD_BASIC',
    postcard: '없음',
    review: 'AI 정리',
    recommendation: '기록부터 시작하고 싶은 분',
  },
  {
    code: 'MONTHLY_RECORD_QUARTERLY_POSTCARD',
    postcard: '분기별 1회',
    review: 'AI 정리',
    recommendation: '가끔 실물 기록을 받고 싶은 분',
  },
  {
    code: 'MONTHLY_RECORD_MONTHLY_POSTCARD',
    postcard: '매월 1회',
    review: 'AI 정리',
    recommendation: '매달 추억을 받아보고 싶은 분',
  },
  {
    code: 'MONTHLY_RECORD_PREMIUM',
    postcard: '매월 1회',
    review: '사람 검수 포함',
    recommendation: '완성도를 중요하게 생각하는 분',
  },
] as const;

export default async function PricingPage() {
  const session = await auth();

  const lifeBookPlans = PRODUCT_PLANS.filter(
    (product) => product.category === 'LIFE_BOOK',
  );

    const monthlyPlans = PRODUCT_PLANS.filter(
    (product) => product.category === 'MONTHLY_RECORD',
  );

  const publishingPlans = PRODUCT_PLANS.filter(
    (product) =>
      product.category === 'BOOK_PUBLISHING',
  );

  const createProductHref = (
    product: ProductPlan,
  ) => {
    const destination =
      product.category === 'LIFE_BOOK'
        ? `/dashboard/library?product=${encodeURIComponent(
            product.code,
          )}`
        : `/apply?product=${encodeURIComponent(
            product.code,
          )}`;

    if (session?.user) {
      return destination;
    }

    return `/login?callbackUrl=${encodeURIComponent(
      destination,
    )}`;
  };

  return (
    <main className="pricing-page">
      <style>{`
        .pricing-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(229, 190, 120, 0.22), transparent 34%),
            #f7eddc;
          color: #271a12;
        }

        .pricing-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 70px 24px 90px;
          box-sizing: border-box;
        }

        .pricing-hero {
          padding: 50px 44px;
          border-radius: 36px;
          background:
            linear-gradient(135deg, #2d1d15 0%, #543721 58%, #6e4928 100%);
          color: #fffaf0;
          box-shadow: 0 28px 70px rgba(57, 35, 20, 0.2);
        }

        .pricing-eyebrow {
          margin: 0;
          color: #f0c36a;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .pricing-hero h1 {
          margin: 14px 0 0;
          max-width: 900px;
          font-family: Noto Serif KR, serif;
          font-size: clamp(38px, 6vw, 66px);
          line-height: 1.16;
          letter-spacing: -0.055em;
          word-break: keep-all;
        }

        .pricing-hero-description {
          margin: 24px 0 0;
          max-width: 850px;
          color: rgba(255, 250, 240, 0.85);
          font-size: 18px;
          line-height: 1.85;
          word-break: keep-all;
        }

                .start-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-top: 26px;
        }

        .start-card {
          padding: 23px;
          border-radius: 22px;
          border: 1px solid rgba(255, 250, 240, 0.22);
          background: rgba(255, 250, 240, 0.08);
          text-decoration: none;
          color: #fffaf0;
        }

        .start-card-label {
          display: block;
          color: #f0c36a;
          font-size: 12px;
          font-weight: 900;
        }

        .start-card strong {
          display: block;
          margin-top: 8px;
          font-family: Noto Serif KR, serif;
          font-size: 23px;
          line-height: 1.4;
        }

        .start-card span:last-child {
          display: block;
          margin-top: 7px;
          color: rgba(255, 250, 240, 0.76);
          font-size: 14px;
          line-height: 1.65;
        }

        .section {
          margin-top: 48px;
        }

        .section-panel {
          padding: 34px;
          border-radius: 30px;
          border: 1px solid #dfc9a4;
          background: #fffdf7;
          box-shadow: 0 14px 36px rgba(75, 48, 27, 0.07);
        }

        .section-label {
          margin: 0;
          color: #8a5a2c;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .section-title {
          margin: 9px 0 0;
          font-family: Noto Serif KR, serif;
          font-size: clamp(29px, 4vw, 38px);
          line-height: 1.35;
          letter-spacing: -0.045em;
          word-break: keep-all;
        }

        .section-description {
          margin: 13px 0 0;
          max-width: 850px;
          color: #6c5847;
          font-size: 15px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .life-plan-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
          gap: 18px;
          margin-top: 24px;
        }

                .monthly-plan-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-top: 24px;
        }

        .publishing-plan-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
          gap: 16px;
          margin-top: 24px;
        }

        .product-card {
          position: relative;
          display: flex;
          flex-direction: column;
          min-width: 0;
          padding: 26px;
          border-radius: 26px;
          border: 1px solid #dfc9a4;
          background: #fffdf7;
          box-shadow: 0 12px 30px rgba(75, 48, 27, 0.07);
        }

        .product-card.recommended {
          border: 2px solid #a86c2d;
          background: #fff8e9;
          box-shadow: 0 18px 45px rgba(117, 73, 28, 0.15);
        }

        .product-badge {
          align-self: flex-start;
          margin-bottom: 13px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #6e421d;
          color: #fffaf0;
          font-size: 11px;
          font-weight: 900;
        }

        .product-category {
          margin: 0;
          color: #95642e;
          font-size: 12px;
          font-weight: 900;
        }

        .product-title {
          margin: 9px 0 0;
          font-family: Noto Serif KR, serif;
          font-size: 27px;
          line-height: 1.35;
          letter-spacing: -0.04em;
          word-break: keep-all;
        }

        .product-price {
          display: block;
          margin-top: 13px;
          color: #6f421b;
          font-size: 25px;
          line-height: 1.3;
        }

        .product-billing {
          display: block;
          margin-top: 5px;
          color: #92785f;
          font-size: 12px;
          font-weight: 800;
        }

        .product-description {
          margin: 16px 0 0;
          color: #675445;
          font-size: 14px;
          line-height: 1.75;
          word-break: keep-all;
        }

        .feature-title {
          margin: 22px 0 0;
          color: #4d3928;
          font-size: 13px;
          font-weight: 900;
        }

        .feature-list {
          margin: 11px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 9px;
        }

        .feature-list li {
          padding-bottom: 9px;
          border-bottom: 1px solid #eadcc6;
          color: #44362b;
          font-size: 13px;
          line-height: 1.6;
        }

        .excluded-list li {
          color: #836c58;
        }

        .condition-box {
          margin-top: 19px;
          padding: 14px;
          border-radius: 15px;
          background: #f6ead6;
          color: #76583d;
          font-size: 12px;
          line-height: 1.65;
        }

        .condition-box p {
          margin: 0;
        }

        .condition-box p + p {
          margin-top: 5px;
        }

        .product-button {
          margin-top: auto;
          padding: 24px 16px 0;
          text-decoration: none;
        }

        .product-button span {
          display: flex;
          min-height: 50px;
          justify-content: center;
          align-items: center;
          padding: 0 14px;
          border-radius: 14px;
          background: #2d2119;
          color: #fffaf0;
          font-size: 14px;
          font-weight: 900;
          text-align: center;
        }

        .recommended .product-button span {
          background: #6e421d;
        }

        .life-summary {
          padding: 28px;
          border-radius: 26px;
          border: 1px solid #e2c99c;
          background: #f7eddc;
        }

        .life-summary h3 {
          margin: 0;
          font-family: Noto Serif KR, serif;
          font-size: 24px;
          line-height: 1.4;
        }

        .life-summary ul {
          margin: 18px 0 0;
          padding-left: 20px;
          color: #604b39;
          font-size: 14px;
          line-height: 1.85;
        }

        .comparison-wrap {
          margin-top: 26px;
          overflow-x: auto;
          border-radius: 20px;
          border: 1px solid #e0c9a4;
        }

        .comparison-table {
          width: 100%;
          min-width: 840px;
          border-collapse: collapse;
          background: #fffdf7;
        }

        .comparison-table th,
        .comparison-table td {
          padding: 16px 15px;
          border-bottom: 1px solid #eadcc6;
          border-right: 1px solid #eadcc6;
          text-align: left;
          vertical-align: top;
          font-size: 13px;
          line-height: 1.6;
        }

        .comparison-table th {
          background: #f3e5cf;
          color: #4f3927;
          font-weight: 900;
          white-space: nowrap;
        }

        .comparison-table td {
          color: #675445;
        }

        .comparison-table tr:last-child td {
          border-bottom: 0;
        }

        .comparison-table th:last-child,
        .comparison-table td:last-child {
          border-right: 0;
        }

        .addon-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 23px;
        }

        .addon-card {
          padding: 21px;
          border-radius: 20px;
          border: 1px solid #dfc9a4;
          background: #fff8e9;
        }

        .addon-card strong {
          display: block;
          font-size: 17px;
          line-height: 1.4;
        }

        .addon-card p {
          margin: 9px 0 0;
          color: #6d5846;
          font-size: 13px;
          line-height: 1.7;
        }

        .addon-price {
          display: block;
          margin-top: 13px;
          color: #8a5a2c;
          font-size: 12px;
          font-weight: 900;
        }

        .book-type-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 13px;
          margin-top: 22px;
        }

        .book-type-card {
          padding: 19px;
          border-radius: 19px;
          background: #f7eddd;
          border: 1px solid #e6d2b2;
        }

        .book-type-card strong {
          display: block;
          font-size: 16px;
          line-height: 1.4;
        }

        .book-type-card p {
          margin: 8px 0 0;
          color: #6d5846;
          font-size: 13px;
          line-height: 1.7;
        }

        .step-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 13px;
          margin-top: 23px;
        }

        .step-card {
          padding: 20px;
          border-radius: 20px;
          background: #2d2119;
          color: #fffaf0;
        }

        .step-number {
          color: #f0c36a;
          font-size: 12px;
          font-weight: 900;
        }

        .step-card strong {
          display: block;
          margin-top: 9px;
          font-size: 16px;
          line-height: 1.45;
        }

        .step-card p {
          margin: 9px 0 0;
          color: rgba(255, 250, 240, 0.75);
          font-size: 13px;
          line-height: 1.7;
        }

        .notice-box {
          margin-top: 34px;
          padding: 25px 28px;
          border-radius: 24px;
          background: #3b291e;
          color: #fffaf0;
        }

        .notice-box strong {
          display: block;
          color: #f0c36a;
          font-size: 15px;
        }

        .notice-box p {
          margin: 10px 0 0;
          color: rgba(255, 250, 240, 0.82);
          font-size: 13px;
          line-height: 1.8;
        }

        @media (max-width: 1040px) {
          .monthly-plan-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .book-type-grid,
          .step-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .pricing-container {
            padding: 32px 15px 64px;
          }

          .pricing-hero {
            padding: 34px 24px;
            border-radius: 28px;
          }

                    .start-grid,
          .life-plan-grid,
          .monthly-plan-grid,
          .publishing-plan-grid,
          .addon-grid,
          .book-type-grid,
          .step-grid {
            grid-template-columns: 1fr;
          }

          .section-panel {
            padding: 25px 19px;
            border-radius: 24px;
          }

          .product-card {
            padding: 23px 20px;
          }
        }
      `}</style>

      <div className="pricing-container">
        <section className="pricing-hero">
          <p className="pricing-eyebrow">
            달동네 출판사 상품 안내
          </p>

                    <h1>
            기록을 책으로 만들고,
            <br />
            완성된 원고를 출간하세요
          </h1>

          <p className="pricing-hero-description">
            사진과 이야기를 인생책으로 만들거나, 매달 기록을
            차곡차곡 모을 수 있습니다. 이미 완성된 원고가 있다면
            편집·디자인·ISBN 등록과 인쇄까지 단행본 출간을
            신청할 수 있습니다.
          </p>

          <div className="start-grid">
            <Link
              href="#life-book"
              className="start-card"
            >
              <span className="start-card-label">
                지금 바로 만들기
              </span>
              <strong>
                인생책 제작 · 99,000원부터
              </strong>
              <span>
                사진 50장 이하와 이야기를 바탕으로
                50~80페이지 기본 책을 제작합니다.
              </span>
            </Link>

                 <Link
              href="#book-publishing"
              className="start-card"
            >
              <span className="start-card-label">
                완성된 원고 출간하기
              </span>

              <strong>
                단행본 출간 · 490,000원부터
              </strong>

              <span>
                원고 편집, 표지와 내지 디자인, ISBN 등록,
                인쇄와 온라인 서점 등록을 지원합니다.
              </span>
            </Link>

            <Link
              href="#monthly-record"
              className="start-card"
            >
              <span className="start-card-label">
                매달 조금씩 기록하기
              </span>
              <strong>
                월간기록 구독 · 월 9,900원부터
              </strong>
              <span>
                매달 기록을 저장하고 정리해 12개월 후
                기본 인생책 한 권으로 완성합니다.
              </span>
            </Link>
          </div>
        </section>

        <section
          id="life-book"
          className="section"
        >
          <div className="section-panel">
            <p className="section-label">
              한 번에 제작
            </p>

            <h2 className="section-title">
              지금 바로 한 권의 인생책으로
            </h2>

            <p className="section-description">
              이미 모아둔 사진과 이야기가 있다면 한 번의 제작
              과정으로 원고 정리부터 기본 인쇄와 배송까지
              진행합니다.
            </p>

            <div className="life-plan-grid">
              <div>
                {lifeBookPlans.map((product) => (
                  <ProductCard
                    key={product.code}
                    product={product}
                    href={createProductHref(product)}
                  />
                ))}
              </div>

              <aside className="life-summary">
                <h3>
                  기본 제작 기준
                </h3>

                <ul>
                  <li>사진 50장 이하</li>
                  <li>50~80페이지 기본 분량</li>
                  <li>AI 사진 분석과 글 다듬기</li>
                  <li>목차 추천과 원고 생성</li>
                  <li>기본 소프트커버 1권</li>
                  <li>기본 인쇄·출판·택배비 포함</li>
                </ul>

                <div className="condition-box">
                  <p>
                    사진 50장 또는 80페이지를 초과하면
                    추가 견적이 발생할 수 있습니다.
                  </p>
                  <p>
                    하드커버, 사람 검수, 추가 인쇄는
                    선택 옵션입니다.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

                <section
          id="book-publishing"
          className="section"
        >
          <div className="section-panel">
            <p className="section-label">
              완성된 원고 출간
            </p>

            <h2 className="section-title">
              단행본 출간 3가지 선택
            </h2>

            <p className="section-description">
              이미 작성한 소설, 에세이, 시집, 자기계발서,
              전문 원고를 실제 판매 가능한 책으로 제작합니다.
              원고 분량과 필요한 편집 범위에 맞춰 기본,
              스탠다드, 프리미엄 가운데 선택할 수 있습니다.
            </p>

            <div className="publishing-plan-grid">
              {publishingPlans.map((product) => (
                <ProductCard
                  key={product.code}
                  product={product}
                  href={createProductHref(product)}
                />
              ))}
            </div>

            <div className="notice-box">
              <strong>
                단행본 출간 신청 전 확인
              </strong>

              <p>
                표시된 금액은 완성된 원고를 제출하는 경우의
                기본 시작 가격입니다. 원고 분량, 교정 난이도,
                페이지 수, 컬러 인쇄, 종이, 제본 방식과 인쇄
                부수에 따라 최종 견적이 달라질 수 있습니다.
              </p>

              <p>
                단행본 출간 신청 후 원고 상태와 제작 사양을
                확인하고, 관리자 상담을 통해 최종 제작 범위와
                금액을 확정합니다.
              </p>
            </div>
          </div>
        </section>


        <section
          id="monthly-record"
          className="section"
        >
          <div className="section-panel">
            <p className="section-label">
              매월 기록
            </p>

            <h2 className="section-title">
              월간기록 구독 4가지 선택
            </h2>

            <p className="section-description">
              디지털 기록만 차곡차곡 모으는 기본형부터,
              분기 엽서·매달 엽서·사람 검수를 포함한
              프리미엄까지 필요한 방식으로 선택합니다.
            </p>

            <div className="monthly-plan-grid">
              {monthlyPlans.map((product) => (
                <ProductCard
                  key={product.code}
                  product={product}
                  href={createProductHref(product)}
                  compact
                />
              ))}
            </div>

            <div className="comparison-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>구독 상품</th>
                    <th>월 구독료</th>
                    <th>실물 엽서</th>
                    <th>기록 검수</th>
                    <th>연간 책</th>
                    <th>추천 대상</th>
                  </tr>
                </thead>

                <tbody>
                  {subscriptionComparison.map(
                    (comparison) => {
                      const product =
                        monthlyPlans.find(
                          (item) =>
                            item.code ===
                            comparison.code,
                        );

                      if (!product) {
                        return null;
                      }

                      return (
                        <tr key={comparison.code}>
                          <td>
                            <strong>
                              {product.shortName}
                            </strong>
                          </td>
                          <td>
                            {formatProductPrice(
                              product.price,
                              product.priceSuffix,
                            )}
                          </td>
                          <td>
                            {comparison.postcard}
                          </td>
                          <td>
                            {comparison.review}
                          </td>
                          <td>
                            12개월 유지 후 기본 책 1권
                          </td>
                          <td>
                            {comparison.recommendation}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-panel">
            <p className="section-label">
              선택 옵션
            </p>

            <h2 className="section-title">
              필요한 서비스만 추가하세요
            </h2>

            <p className="section-description">
              기본 상품에 모든 비용을 강제로 포함하지 않고,
              하드커버·사람 검수·추가 사진·추가 인쇄처럼
              필요한 항목만 별도 견적으로 선택합니다.
            </p>

            <div className="addon-grid">
              {PRODUCT_ADDONS.map((addon) => (
                <article
                  key={addon.code}
                  className="addon-card"
                >
                  <strong>
                    {addon.name}
                  </strong>

                  <p>
                    {addon.description}
                  </p>

                  <span className="addon-price">
                    {addon.priceLabel}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-panel">
            <p className="section-label">
              책 내용 종류
            </p>

            <h2 className="section-title">
              상품과 책의 이야기는 다릅니다
            </h2>

            <p className="section-description">
              아래 항목은 별도의 결제 상품이 아니라,
              인생책 안에 어떤 이야기를 담을지 정하는
              책의 주제입니다.
            </p>

            <div className="book-type-grid">
              {bookTypes.map((bookType) => (
                <article
                  key={bookType.title}
                  className="book-type-card"
                >
                  <strong>
                    {bookType.title}
                  </strong>

                  <p>
                    {bookType.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-panel">
            <p className="section-label">
              제작 과정
            </p>

            <h2 className="section-title">
              기록부터 배송까지
            </h2>

            <p className="section-description">
              먼저 기록과 원고를 준비하고, 최종 제작 사양과
              금액을 확인한 뒤 인쇄를 진행합니다.
            </p>

            <div className="step-grid">
              {serviceSteps.map((step) => (
                <article
                  key={step.number}
                  className="step-card"
                >
                  <span className="step-number">
                    {step.number}
                  </span>

                  <strong>
                    {step.title}
                  </strong>

                  <p>
                    {step.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="notice-box">
          <strong>
            상품 이용 전 확인해 주세요
          </strong>

                    <p>
            월간기록 구독의 기본 책 제작은 12개월 유지 고객을
            기준으로 합니다. 인생책과 단행본 출간은 사진 수,
            원고 분량, 페이지, 제본, 종이, 컬러 여부와 인쇄
            부수에 따라 추가 견적이 발생할 수 있습니다.
          </p>

          <p>
            현재 월간기록 구독 상품은 신청 내용을 확인한 뒤
            이용 방법을 안내하는 방식으로 운영하며, 정기결제
            기능은 최종 검증 후 별도로 연결됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}

function ProductCard({
  product,
  href,
  compact = false,
}: {
  product: ProductPlan;
  href: string;
  compact?: boolean;
}) {
  const categoryLabel =
    PRODUCT_CATEGORY_LABELS[
      product.category as ProductCategory
    ];

  return (
    <article
      className={`product-card${
        product.recommended
          ? ' recommended'
          : ''
      }`}
    >
      {product.badge ? (
        <span className="product-badge">
          {product.badge}
        </span>
      ) : null}

      <p className="product-category">
        {categoryLabel}
      </p>

      <h3 className="product-title">
        {product.name}
      </h3>

      <strong className="product-price">
        {formatProductPrice(
          product.price,
          product.priceSuffix,
        )}
      </strong>

      <span className="product-billing">
        {
          PRODUCT_BILLING_LABELS[
            product.billingType
          ]
        }
      </span>

      <p className="product-description">
        {product.description}
      </p>

      <p className="feature-title">
        포함 내용
      </p>

      <ul className="feature-list">
        {product.included
          .slice(
            0,
            compact
              ? 6
              : product.included.length,
          )
          .map((feature) => (
            <li key={feature}>
              ✓ {feature}
            </li>
          ))}
      </ul>

      {!compact &&
      product.excluded.length > 0 ? (
        <>
          <p className="feature-title">
            기본 상품에 포함되지 않음
          </p>

          <ul className="feature-list excluded-list">
            {product.excluded.map(
              (feature) => (
                <li key={feature}>
                  · {feature}
                </li>
              ),
            )}
          </ul>
        </>
      ) : null}

      <div className="condition-box">
        {product.conditions.map(
          (condition) => (
            <p key={condition}>
              ※ {condition}
            </p>
          ),
        )}
      </div>

      <Link
        href={href}
        className="product-button"
      >
        <span>
          {product.ctaLabel}
        </span>
      </Link>
    </article>
  );
}