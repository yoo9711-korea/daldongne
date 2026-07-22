import { auth } from '@/auth';
import StorybookPublicHeader from '@/components/storybook/StorybookPublicHeader';
import {
  PRODUCT_BILLING_LABELS,
  PRODUCT_PLANS,
  formatProductPrice,
  type ProductPlan,
  type ProductPlanCode,
} from '@/lib/products/catalog';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
const RECOMMENDATIONS = [
  {
    image: '/home/storybook/recommend-1.webp',
    title: '부모님 인생 이야기',
  },
  {
    image: '/home/storybook/recommend-2.webp',
    title: '우리 가족 추억 기록',
  },
  {
    image: '/home/storybook/recommend-3.webp',
    title: '아이 성장 기록',
  },
  {
    image: '/home/storybook/recommend-4.webp',
    title: '결혼·기념일 선물',
  },
  {
    image: '/home/storybook/recommend-5.webp',
    title: '퇴직·은퇴 기념',
  },
  {
    image: '/home/storybook/house.webp',
    title: '친구·스승님 감사 선물',
  },
] as const;

type ComparisonRow = {
  label: string;
  values: Record<ProductPlanCode, string>;
};

const COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    label: '결제 방식',
    values: {
      LIFE_BOOK_BASIC: '한 번 결제',
      MONTHLY_RECORD_BASIC: '매월 결제',
      MONTHLY_RECORD_QUARTERLY_POSTCARD: '매월 결제',
      MONTHLY_RECORD_MONTHLY_POSTCARD: '매월 결제',
      MONTHLY_RECORD_PREMIUM: '매월 결제',
      BOOK_PUBLISHING_BASIC: '한 번 결제',
      BOOK_PUBLISHING_STANDARD: '한 번 결제',
      BOOK_PUBLISHING_PREMIUM: '한 번 결제',
    },
  },
  {
    label: '기록 방식',
    values: {
      LIFE_BOOK_BASIC: '사진·이야기 정리',
      MONTHLY_RECORD_BASIC: '매달 기록',
      MONTHLY_RECORD_QUARTERLY_POSTCARD: '매달 기록',
      MONTHLY_RECORD_MONTHLY_POSTCARD: '매달 기록',
      MONTHLY_RECORD_PREMIUM: '매달 기록',
      BOOK_PUBLISHING_BASIC: '준비된 원고 제작',
      BOOK_PUBLISHING_STANDARD: '준비된 원고 제작',
      BOOK_PUBLISHING_PREMIUM: '준비된 원고 제작',
    },
  },
  {
    label: '실물 엽서',
    values: {
      LIFE_BOOK_BASIC: '없음',
      MONTHLY_RECORD_BASIC: '없음',
      MONTHLY_RECORD_QUARTERLY_POSTCARD: '분기별 1회',
      MONTHLY_RECORD_MONTHLY_POSTCARD: '매월 1회',
      MONTHLY_RECORD_PREMIUM: '매월 1회',
      BOOK_PUBLISHING_BASIC: '없음',
      BOOK_PUBLISHING_STANDARD: '없음',
      BOOK_PUBLISHING_PREMIUM: '없음',
    },
  },
  {
    label: '내지 인쇄',
    values: {
      LIFE_BOOK_BASIC: '기본 사양',
      MONTHLY_RECORD_BASIC: '기본 사양',
      MONTHLY_RECORD_QUARTERLY_POSTCARD: '기본 사양',
      MONTHLY_RECORD_MONTHLY_POSTCARD: '기본 사양',
      MONTHLY_RECORD_PREMIUM: '기본 사양',
      BOOK_PUBLISHING_BASIC: '흑백',
      BOOK_PUBLISHING_STANDARD: '컬러',
      BOOK_PUBLISHING_PREMIUM: '컬러',
    },
  },
  {
    label: '기본 규격',
    values: {
      LIFE_BOOK_BASIC: '기본 규격',
      MONTHLY_RECORD_BASIC: '기본 규격',
      MONTHLY_RECORD_QUARTERLY_POSTCARD: '기본 규격',
      MONTHLY_RECORD_MONTHLY_POSTCARD: '기본 규격',
      MONTHLY_RECORD_PREMIUM: '기본 규격',
      BOOK_PUBLISHING_BASIC: 'A5',
      BOOK_PUBLISHING_STANDARD: 'A5',
      BOOK_PUBLISHING_PREMIUM: 'A5',
    },
  },
  {
    label: '페이지',
    values: {
      LIFE_BOOK_BASIC: '50~80페이지',
      MONTHLY_RECORD_BASIC: '12개월 후 제작',
      MONTHLY_RECORD_QUARTERLY_POSTCARD: '12개월 후 제작',
      MONTHLY_RECORD_MONTHLY_POSTCARD: '12개월 후 제작',
      MONTHLY_RECORD_PREMIUM: '12개월 후 제작',
      BOOK_PUBLISHING_BASIC: '50페이지 이하',
      BOOK_PUBLISHING_STANDARD: '50페이지 이하',
      BOOK_PUBLISHING_PREMIUM: '100페이지 이하',
    },
  },
  {
    label: '표지',
    values: {
      LIFE_BOOK_BASIC: '소프트커버',
      MONTHLY_RECORD_BASIC: '기본 표지',
      MONTHLY_RECORD_QUARTERLY_POSTCARD: '기본 표지',
      MONTHLY_RECORD_MONTHLY_POSTCARD: '기본 표지',
      MONTHLY_RECORD_PREMIUM: '기본 표지',
      BOOK_PUBLISHING_BASIC: '소프트커버',
      BOOK_PUBLISHING_STANDARD: '소프트커버',
      BOOK_PUBLISHING_PREMIUM: '하드커버',
    },
  },
  {
    label: 'PDF',
    values: {
      LIFE_BOOK_BASIC: '포함',
      MONTHLY_RECORD_BASIC: '책 제작 시 포함',
      MONTHLY_RECORD_QUARTERLY_POSTCARD: '책 제작 시 포함',
      MONTHLY_RECORD_MONTHLY_POSTCARD: '책 제작 시 포함',
      MONTHLY_RECORD_PREMIUM: '책 제작 시 포함',
      BOOK_PUBLISHING_BASIC: '포함',
      BOOK_PUBLISHING_STANDARD: '포함',
      BOOK_PUBLISHING_PREMIUM: '포함',
    },
  },
];

function createProductHref(
  product: ProductPlan,
  isLoggedIn: boolean,
) {
  const destination = `/apply?product=${encodeURIComponent(
    product.code,
  )}`;

  if (isLoggedIn) {
    return destination;
  }

  return `/login?callbackUrl=${encodeURIComponent(
    destination,
  )}`;
}

function ProductCard({
  product,
  index,
  isLoggedIn,
}: {
  product: ProductPlan;
  index: number;
  isLoggedIn: boolean;
}) {
  const isRecommended =
    'recommended' in product &&
    product.recommended === true;

  return (
    <article
      className={[
        'pricing-plan-card',
        isRecommended
          ? 'is-recommended'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="pricing-plan-topline">
        <span className="pricing-plan-number">
          {String(index + 1).padStart(
            2,
            '0',
          )}
        </span>

        <h3>{product.shortName}</h3>

        {product.badge ? (
          <span className="pricing-plan-badge">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="pricing-plan-body">
        <p className="pricing-plan-description">
          {product.description}
        </p>

        <p className="pricing-plan-feature">
          {product.included
            .slice(0, 2)
            .join(' · ')}
        </p>
      </div>

      <strong className="pricing-plan-price">
        {formatProductPrice(
          product.price,
          product.priceSuffix,
        )}
      </strong>

      <span className="pricing-plan-billing">
        {
          PRODUCT_BILLING_LABELS[
            product.billingType
          ]
        }
      </span>

      <Link
        href={createProductHref(
          product,
          isLoggedIn,
        )}
        className="pricing-card-button"
      >
        {product.ctaLabel}&nbsp; →
      </Link>
    </article>
  );
}

const styles = `
  .pricing-storybook-page,
  .pricing-storybook-page * {
    box-sizing: border-box;
  }

  .pricing-storybook-page {
    --pricing-ink: #4a3125;
    --pricing-soft: #725e52;
    --pricing-coral: #e97861;
    width: 100%;
    min-height: 100vh;
    overflow-x: clip;
    color: var(--pricing-ink);
    background: #fffdf9;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .pricing-storybook-page a {
    color: inherit;
  }

  .pricing-hero {
    position: relative;
    min-height: 310px;
    overflow: hidden;
    background:
      linear-gradient(
        90deg,
        rgba(255, 253, 249, 0.99) 0%,
        rgba(255, 253, 249, 0.96) 41%,
        rgba(255, 253, 249, 0.42) 61%,
        rgba(255, 253, 249, 0.03) 78%
      ),
      #f8f0e5;
  }

  .pricing-hero-decoration {
    position: absolute;
    inset: 0 auto 0 0;
    width: 175px;
    opacity: 0.92;
  }

  .pricing-hero-decoration img {
    object-fit: cover;
    object-position: left center;
  }

  .pricing-hero-image {
    position: absolute;
    inset: 0 0 0 48%;
  }

  .pricing-hero-image img {
    object-fit: cover;
    object-position: center 58%;
  }

  .pricing-hero-inner {
    position: relative;
    z-index: 2;
    width: min(1480px, 100%);
    min-height: 310px;
    margin: 0 auto;
    padding: 42px clamp(24px, 4vw, 62px) 39px
      clamp(185px, 14vw, 220px);
    display: flex;
    align-items: center;
  }

    .pricing-hero {
    position: relative;
    width: min(1590px, 100%);
    min-height: 538px;
    margin: 0 auto;
    overflow: hidden;
    border-bottom: 1px solid rgba(133, 91, 69, 0.11);
    background:
      radial-gradient(
        circle at 33% 18%,
        rgba(255, 255, 255, 0.94),
        transparent 25rem
      ),
      linear-gradient(
        90deg,
        #fffdf9 0%,
        #fffaf5 44.4%,
        #f5f6ef 100%
      );
  }

  .pricing-hero-inner {
    position: relative;
    z-index: 1;
    width: 100%;
    min-height: 538px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 44.4% 55.6%;
  }

  .pricing-hero-copy {
    position: relative;
    z-index: 2;
    min-width: 0;
    min-height: 538px;
    padding: 58px 34px 52px;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .pricing-hero-decoration {
    position: absolute;
    inset: 0 auto 0 0;
    width: 238px;
    overflow: hidden;
    pointer-events: none;
    opacity: 0.95;
  }

  .pricing-hero-decoration img {
    object-fit: cover;
    object-position: left center;
  }

  .pricing-hero-copy-content {
    position: relative;
    z-index: 2;
    width: min(430px, 100%);
    margin-left: 230px;
  }

  .pricing-hero-image {
    position: relative;
    min-width: 0;
    min-height: 538px;
    overflow: hidden;
  }

  .pricing-hero-image img {
    object-fit: cover;
    object-position: center 58%;
  }

  .pricing-hero-image::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    width: 105px;
    content: '';
    pointer-events: none;
    background:
      linear-gradient(
        90deg,
        #fffaf5,
        rgba(255, 250, 245, 0)
      );
  }

  .pricing-hand-title,
  .pricing-section-title,
  .pricing-cta-title {
    font-family: 'Gamja Flower', 'MapoFlowerIsland', cursive;
    font-weight: 400;
    letter-spacing: 0.015em;
  }

  .pricing-hand-title {
    margin: 0;
    font-size: clamp(44px, 4vw, 58px);
    line-height: 1.2;
    word-break: keep-all;
  }

  .pricing-heart {
    margin-left: 7px;
    color: #ef806b;
    font-family: Arial, sans-serif;
    font-size: 0.82em;
  }

  .pricing-hero-description {
    margin: 17px 0 0;
    color: #56453b;
    font-size: 15px;
    line-height: 1.72;
    word-break: keep-all;
  }

  .pricing-primary-button,
  .pricing-secondary-button,
  .pricing-card-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-weight: 900;
    text-decoration: none;
    transition: transform 160ms ease, box-shadow 160ms ease;
  }

  .pricing-primary-button {
    min-height: 46px;
    margin-top: 19px;
    padding: 0 26px;
    border: 1px solid #e4735c;
    color: #ffffff !important;
    background: linear-gradient(135deg, #ee8b70, #e56d55);
    box-shadow: 0 11px 25px rgba(210, 97, 73, 0.2);
    font-size: 13px;
  }

  .pricing-primary-button:hover,
  .pricing-secondary-button:hover,
  .pricing-card-button:hover {
    transform: translateY(-2px);
  }

  .pricing-content {
    padding: 30px 24px 36px;
  }

  .pricing-content-inner {
    width: min(1400px, 100%);
    margin: 0 auto;
  }

  .pricing-product-group {
    padding: 25px;
    overflow: hidden;
    border: 1px solid rgba(138, 96, 70, 0.16);
    border-radius: 22px;
    box-shadow: 0 13px 34px rgba(91, 60, 43, 0.06);
  }

  .pricing-product-group + .pricing-product-group {
    margin-top: 30px;
  }

  .pricing-product-group.is-subscription {
    border-color: rgba(190, 147, 91, 0.3);
    background: linear-gradient(145deg, #fffdf8 0%, #fff8ea 100%);
  }

  .pricing-product-group.is-single-book {
    border-color: rgba(225, 126, 99, 0.3);
    background: linear-gradient(145deg, #fffdfb 0%, #fff1eb 100%);
  }

  .pricing-group-heading {
    margin-bottom: 20px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 25px;
  }

  .pricing-group-heading > div {
    min-width: 0;
  }

  .pricing-group-tag {
  display: inline-flex;
  min-height: 36px;
  padding: 0 16px;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcad73;
  border-radius: 999px;
  color: #8a5a28;
  background: rgba(255, 255, 255, 0.72);
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
}

  .is-single-book .pricing-group-tag {
    border-color: #ed9e87;
    color: #c45f49;
  }

  .pricing-group-title {
    margin: 10px 0 0;
    color: #3d2a20;
    font-family: 'Noto Serif KR', serif;
    font-size: 27px;
    line-height: 1.35;
    letter-spacing: -0.04em;
  }

  .pricing-group-description {
    max-width: 720px;
    margin: 8px 0 0;
    color: #715e52;
    font-size: 13px;
    line-height: 1.7;
    word-break: keep-all;
  }

  .pricing-group-count {
    flex: 0 0 auto;
    padding-bottom: 3px;
    color: #9b7a62;
    font-size: 12px;
    white-space: nowrap;
  }

  .pricing-plan-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .is-single-book .pricing-plan-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .pricing-plan-card {
    position: relative;
    min-width: 0;
    min-height: 272px;
    padding: 17px 16px 15px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(138, 96, 70, 0.18);
    border-radius: 15px;
    background: linear-gradient(155deg, #fffefd, #fff8f0);
    box-shadow: 0 9px 25px rgba(91, 60, 43, 0.06);
  }

  .pricing-plan-card.is-recommended {
    border-color: #e5a886;
    background: linear-gradient(155deg, #fffdf8, #fff1e7);
    box-shadow: 0 13px 29px rgba(211, 104, 78, 0.12);
  }

  .pricing-plan-topline {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pricing-plan-number {
    display: inline-grid;
    width: 27px;
    height: 27px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background: #d5a778;
    font-size: 11px;
    font-weight: 900;
  }

  .is-single-book .pricing-plan-number {
    background: #e48369;
  }

  .pricing-plan-card h3 {
    min-width: 0;
    margin: 0;
    color: #4a352c;
    font-size: 15px;
    line-height: 1.35;
  }

  .pricing-plan-badge {
    padding: 3px 8px;
    border: 1px solid #eda98c;
    border-radius: 999px;
    color: #dd6d55;
    background: #fffaf6;
    font-size: 9px;
    font-weight: 900;
    white-space: nowrap;
  }

  .pricing-plan-body {
  min-height: 112px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
}

  .pricing-plan-description {
  margin: 0;
  color: #665248;
  font-size: 13px;
  line-height: 1.7;
  word-break: keep-all;
}

  .pricing-plan-feature {
  margin: 14px 0 0;
  color: #8a6d5d;
  font-size: 11px;
  line-height: 1.65;
  word-break: keep-all;
}

  .pricing-plan-price {
    margin-top: auto;
    padding-top: 10px;
    color: #33241d;
    font-size: 20px;
    line-height: 1.25;
  }

  .pricing-plan-billing {
    display: block;
    margin-top: 3px;
    color: #927d70;
    font-size: 9px;
    font-weight: 800;
  }

  .pricing-card-button {
    min-height: 35px;
    margin-top: 10px;
    padding: 0 13px;
    border: 1px solid #e2b19a;
    color: #bd654f !important;
    background: rgba(255, 255, 255, 0.75);
    font-size: 10px;
  }

  .pricing-lower-grid {
  margin-top: 32px;
  display: grid;
  grid-template-columns:
    minmax(0, 1.7fr)
    minmax(372px, 0.8fr);
  gap: 34px;
}

  .pricing-section-title {
    margin: 0;
    font-size: 31px;
    line-height: 1.25;
  }

  .pricing-comparison-wrap {
    margin-top: 12px;
    overflow-x: auto;
    border: 1px solid rgba(139, 96, 69, 0.13);
    border-radius: 13px;
    background: #fffdf9;
  }

  .pricing-comparison-table {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
  }

  .pricing-comparison-table th,
  .pricing-comparison-table td {
    padding: 12px 10px;
    border-right: 1px solid rgba(139, 96, 69, 0.11);
    border-bottom: 1px solid rgba(139, 96, 69, 0.11);
    color: #5f4d43;
    font-size: 11.5px;
    line-height: 1.5;
    text-align: center;
  }

  .pricing-comparison-table th:first-child,
  .pricing-comparison-table td:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    width: 150px;
    padding-left: 16px;
    color: #49362d;
    background: #fffdf9;
    font-weight: 900;
    text-align: left;
  }

  .pricing-comparison-table th {
    color: #4b382e;
    background: #fff8ef;
    font-weight: 900;
  }

  .pricing-comparison-table th:first-child {
    background: #fff8ef;
  }

  .pricing-comparison-table th:last-child,
  .pricing-comparison-table td:last-child {
    border-right: 0;
  }

  .pricing-comparison-table tr:last-child td {
    border-bottom: 0;
  }

  .pricing-comparison-table .is-highlight {
    color: #d9644f;
    background: #fff6f0;
  }

  .pricing-recommend-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.pricing-recommend-card {
  min-width: 0;
  min-height: 148px;
  padding: 14px 10px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(137, 94, 68, 0.12);
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 8px 22px rgba(87, 56, 39, 0.07);
}

.pricing-recommend-image {
  position: relative;
  width: 74px;
  height: 74px;
}

.pricing-recommend-image img {
  object-fit: contain;
}

.pricing-recommend-card strong {
  color: #4d3a31;
  font-size: 12px;
  line-height: 1.45;
  word-break: keep-all;
}

  .pricing-notice {
    margin-top: 22px;
    padding: 20px 22px;
    border: 1px solid rgba(146, 99, 70, 0.14);
    border-radius: 14px;
    color: #756157;
    background: #fffaf5;
    font-size: 12.5px;
    line-height: 1.7;
  }

  .pricing-cta {
    padding: 0 24px 40px;
  }

  .pricing-cta-inner {
    width: min(1400px, 100%);
    min-height: 132px;
    margin: 0 auto;
    padding: 18px 34px;
    display: grid;
    grid-template-columns: minmax(300px, 0.75fr) minmax(0, 1.25fr) minmax(230px, 0.5fr);
    align-items: center;
    gap: 28px;
    overflow: hidden;
    border: 1px solid rgba(171, 119, 83, 0.2);
    border-radius: 17px;
    background:
      radial-gradient(
        circle at 17% 30%,
        rgba(255, 255, 255, 0.86),
        transparent 18rem
      ),
      linear-gradient(135deg, #fff4e8, #f8ead8);
  }

  .pricing-cta-image {
    position: relative;
    width: 310px;
    height: 108px;
  }

  .pricing-cta-image img {
    object-fit: contain;
  }

  .pricing-cta-title {
    margin: 0;
    font-size: 29px;
    line-height: 1.25;
  }

  .pricing-cta-copy p {
    margin: 7px 0 0;
    color: #78645a;
    font-size: 12px;
    line-height: 1.65;
  }

  .pricing-cta-actions {
    display: grid;
    gap: 8px;
  }

  .pricing-cta-actions .pricing-primary-button {
    width: 100%;
    margin-top: 0;
  }

  .pricing-secondary-button {
    min-height: 39px;
    padding: 0 18px;
    border: 1px solid #d8ab91;
    color: #9d6446 !important;
    background: rgba(255, 255, 255, 0.62);
    font-size: 11px;
  }

  .pricing-disclaimer {
    margin: 12px 0 0;
    color: #9a877c;
    font-size: 10px;
    line-height: 1.55;
    text-align: center;
  }

    @media (max-width: 1240px) {
    .pricing-hero {
      min-height: 460px;
    }

    .pricing-hero-inner {
      min-height: 460px;
      grid-template-columns: 56% 44%;
    }

    .pricing-hero-copy {
      min-height: 460px;
      padding: 48px 24px 43px;
    }

    .pricing-hero-decoration {
      width: 155px;
    }

    .pricing-hero-copy-content {
      width: min(430px, 100%);
      margin-left: 145px;
    }

    .pricing-hero-image {
      min-height: 460px;
    }

    .pricing-hand-title {
      font-size: clamp(42px, 4.3vw, 50px);
    }

    .pricing-plan-grid,
    .is-single-book .pricing-plan-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .pricing-lower-grid {
      grid-template-columns: 1fr;
    }

    .pricing-cta-inner {
      grid-template-columns: 230px minmax(0, 1fr) 220px;
    }

    .pricing-cta-image {
      width: 230px;
    }
  }

  @media (max-width: 860px) {
    .pricing-hero {
      display: grid;
      min-height: auto;
      background: #fff8f0;
    }

    .pricing-hero-decoration {
      display: none;
    }

    .pricing-hero-image {
      position: relative;
      inset: auto;
      order: 2;
      aspect-ratio: 1.55 / 1;
    }

    .pricing-hero-inner {
      min-height: auto;
      padding: 45px 22px 38px;
      order: 1;
    }

    .pricing-hero-copy {
      width: min(650px, 100%);
      margin: 0 auto;
      text-align: center;
    }

        .pricing-hero {
      display: block;
      width: 100%;
      min-height: auto;
      background: #fff8f0;
    }

    .pricing-hero-inner {
      min-height: auto;
      padding: 0;
      display: grid;
      grid-template-columns: 1fr;
    }

    .pricing-hero-copy {
      order: 1;
      min-height: auto;
      padding: 45px 22px 38px;
    }

    .pricing-hero-decoration {
      display: none;
    }

    .pricing-hero-copy-content {
      width: min(650px, 100%);
      margin: 0 auto;
      text-align: center;
    }

    .pricing-hero-image {
      position: relative;
      inset: auto;
      order: 2;
      min-height: 0;
      aspect-ratio: 1.55 / 1;
    }

    .pricing-hero-image::before {
      top: 0;
      right: 0;
      bottom: auto;
      left: 0;
      width: auto;
      height: 70px;
      background:
        linear-gradient(
          180deg,
          #fff8f0,
          rgba(255, 248, 240, 0)
        );
    }

    .pricing-hand-title {
      font-size: clamp(42px, 10vw, 55px);
    }

    .pricing-plan-grid,
    .is-single-book .pricing-plan-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pricing-group-heading {
      align-items: flex-start;
    }

    .pricing-cta-inner {
      grid-template-columns: 170px minmax(0, 1fr);
    }

    .pricing-cta-image {
      width: 170px;
      height: 96px;
    }

    .pricing-cta-actions {
      grid-column: 1 / -1;
      width: min(320px, 100%);
      justify-self: center;
    }
  }

  @media (max-width: 560px) {
    .pricing-content,
    .pricing-cta {
      padding-right: 16px;
      padding-left: 16px;
    }

       .pricing-hero-copy {
      padding: 37px 17px 32px;
    }

    .pricing-hand-title {
      font-size: 41px;
    }

    .pricing-product-group {
      padding: 20px 14px;
      border-radius: 18px;
    }

    .pricing-group-heading {
      margin-bottom: 17px;
      display: block;
      text-align: center;
    }

    .pricing-group-title {
      font-size: 25px;
    }

    .pricing-group-description {
      font-size: 12px;
    }

    .pricing-group-count {
      display: block;
      margin-top: 9px;
    }

    .pricing-plan-grid,
    .is-single-book .pricing-plan-grid {
      grid-template-columns: 1fr;
    }

    .pricing-plan-card {
      min-height: 0;
    }

    .pricing-lower-grid {
      gap: 27px;
    }

    .pricing-section-title {
      font-size: 29px;
      text-align: center;
    }

    .pricing-recommend-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pricing-cta-inner {
      padding: 24px 18px 27px;
      grid-template-columns: 1fr;
      text-align: center;
    }

    .pricing-cta-image {
      width: 220px;
      height: 105px;
      justify-self: center;
    }

    .pricing-cta-title {
      font-size: 28px;
    }
  }
`;

export default async function PricingPage() {
  const session = await auth();

  const subscriptionPlans: readonly ProductPlan[] =
    PRODUCT_PLANS.filter(
      (product) => product.category === 'MONTHLY_RECORD',
    );

  const singleBookPlans: readonly ProductPlan[] =
    PRODUCT_PLANS.filter(
      (product) => product.category === 'BOOK_PUBLISHING',
    );

  const plans: readonly ProductPlan[] = [
    ...subscriptionPlans,
    ...singleBookPlans,
  ];

  const isLoggedIn = Boolean(session?.user);

  return (
    <div className="storybook-public-page pricing-storybook-page">
      <StorybookPublicHeader
        activeKey="pricing"
        ctaHref={
          isLoggedIn
            ? '/dashboard'
            : '/login?callbackUrl=/dashboard'
        }
      />

      <main>
               <section className="pricing-hero">
          <div className="pricing-hero-inner">
            <div className="pricing-hero-copy">
              <div
                className="pricing-hero-decoration"
                aria-hidden="true"
              >
                <Image
                  src="/home/storybook/hero-left.webp"
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1240px) 155px, 238px"
                />
              </div>

              <div className="pricing-hero-copy-content">
                <h1 className="pricing-hand-title">
                  당신의 이야기에 맞는
                  <br />
                  스토리북을 선택하세요
                  <span className="pricing-heart">
                    ♡
                  </span>
                </h1>

                <p className="pricing-hero-description">
                  삶의 순간을 담아 세상에 하나뿐인 책으로
                  제작해 드립니다.
                  <br />
                  기록을 이어가는 구독형과 한 권을 만드는
                  단행본 중에서 선택하세요.
                </p>

                <Link
                  href="/guide#contact"
                  className="pricing-primary-button"
                >
                  상담 받고 맞춤 제안 받기&nbsp; →
                </Link>
              </div>
            </div>

            <div className="pricing-hero-image">
              <Image
                src="/home/storybook/detail-hero-bright-v2.webp"
                alt="가족사진을 담은 밝은 아이보리 스토리북"
                fill
                priority
                sizes="(max-width: 860px) 100vw, 56vw"
              />
            </div>
          </div>
        </section>

        <section className="pricing-content">
          <div className="pricing-content-inner">
            <section className="pricing-product-group is-subscription">
              <div className="pricing-group-heading">
                <div>
                  <span className="pricing-group-tag">
                    정기 구독
                  </span>

                  <h2 className="pricing-group-title">
                    매달 기록하는 구독형
                  </h2>

                  <p className="pricing-group-description">
                    매달 사진과 이야기를 차곡차곡 남기고,
                    기록 정리와 실물 엽서 서비스를 함께
                    이용하는 상품입니다.
                  </p>
                </div>

                <strong className="pricing-group-count">
                  {subscriptionPlans.length}가지 구독 상품
                </strong>
              </div>

              <div className="pricing-plan-grid">
                {subscriptionPlans.map((product, index) => (
                  <ProductCard
                    key={product.code}
                    product={product}
                    index={index}
                    isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
            </section>

            <section className="pricing-product-group is-single-book">
              <div className="pricing-group-heading">
                <div>
                  <span className="pricing-group-tag">
                    단행본 1권 제작
                  </span>

                  <h2 className="pricing-group-title">
                    한 권으로 제작하는 단행본
                  </h2>

                  <p className="pricing-group-description">
                    준비된 사진과 이야기를 표지와 본문으로
                    편집하여 실제 책 1권과 PDF로 제작하는
                    상품입니다.
                  </p>
                </div>

                <strong className="pricing-group-count">
                  {singleBookPlans.length}가지 제작 상품
                </strong>
              </div>

              <div className="pricing-plan-grid">
                {singleBookPlans.map((product, index) => (
                  <ProductCard
                    key={product.code}
                    product={product}
                    index={index}
                    isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
            </section>

            <div className="pricing-lower-grid">
              <section>
                <h2 className="pricing-section-title">
                  포함 서비스 비교
                  <span className="pricing-heart">♡</span>
                </h2>

                <div className="pricing-comparison-wrap">
                  <table className="pricing-comparison-table">
                    <thead>
                      <tr>
                        <th>서비스 항목</th>
                        {plans.map((product) => (
                          <th
                            key={product.code}
                            className={
                              product.recommended
                                ? 'is-highlight'
                                : ''
                            }
                          >
                            {product.shortName}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {COMPARISON_ROWS.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>

                          {plans.map((product) => (
                            <td
                              key={product.code}
                              className={
                                product.recommended
                                  ? 'is-highlight'
                                  : ''
                              }
                            >
                              {row.values[product.code]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="pricing-section-title">
                  이런 순간에 추천드려요
                  <span className="pricing-heart">♡</span>
                </h2>

                <div className="pricing-recommend-grid">
                  {RECOMMENDATIONS.map((recommendation) => (
                    <article
                      key={recommendation.title}
                      className="pricing-recommend-card"
                    >
                      <div className="pricing-recommend-image">
                        <Image
                          src={recommendation.image}
                          alt=""
                          fill
                          sizes="62px"
                        />
                      </div>

                      <strong>{recommendation.title}</strong>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="pricing-notice">
              <strong>상품 이용 전 확인해 주세요.</strong>{' '}
              구독형 책 제작은 12개월 유지 고객을 기준으로
              하며, 페이지 추가·규격 변경·추가 인쇄·사람
              검수 등의 선택 옵션에 따라 추가 견적이 안내될
              수 있습니다. 단행본 가격은 기본 사양의 책 1권
              기준입니다.
            </div>
          </div>
        </section>

        <section className="pricing-cta">
          <div className="pricing-cta-inner">
            <div className="pricing-cta-image">
              <Image
                src="/home/storybook/hero-left.webp"
                alt="꽃과 사진이 놓인 따뜻한 책상"
                fill
                sizes="310px"
              />
            </div>

            <div className="pricing-cta-copy">
              <h2 className="pricing-cta-title">
                원하는 구성대로, 세상에 하나뿐인 책을
                만들어 드립니다.
                <span className="pricing-heart">♡</span>
              </h2>

              <p>
                페이지 수 조정, 추가 옵션 등 궁금한 점을
                편하게 문의해주세요.
              </p>
            </div>

            <div className="pricing-cta-actions">
              <Link
                href="/guide#contact"
                className="pricing-primary-button"
              >
                상담 문의하기&nbsp; →
              </Link>

              <Link
                href="/apply"
                className="pricing-secondary-button"
              >
                상품 신청하기
              </Link>
            </div>
          </div>

          <p className="pricing-disclaimer">
            ※ 표시된 가격은 기본 구성 기준이며, 페이지 수와
            선택 옵션에 따라 달라질 수 있습니다.
          </p>
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
