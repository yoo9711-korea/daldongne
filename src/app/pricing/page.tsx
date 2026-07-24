import { auth } from '@/auth';
import StorybookPublicHeader from '@/components/storybook/StorybookPublicHeader';
import {
  PRODUCT_BILLING_LABELS,
  PRODUCT_PLANS,
  formatProductPrice,
  type ProductCategory,
  type ProductPlan,
} from '@/lib/products/catalog';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type ProductGroup = {
  category: ProductCategory;
  anchor: string;
  eyebrow: string;
  title: string;
  description: string;
  recommendation: string;
  tone: 'coral' | 'sage' | 'gold';
};

const PRODUCT_GROUPS: readonly ProductGroup[] = [
  {
    category: 'LIFE_BOOK',
    anchor: 'life-book',
    eyebrow: '처음부터 함께',
    title: '인생책 만들기',
    description:
      '사진과 짧은 이야기를 모으면 AI가 원고의 흐름을 정리하고 실제 책 제작까지 이어드립니다.',
    recommendation:
      '원고가 아직 없고, 사진부터 차근차근 정리하고 싶은 분',
    tone: 'coral',
  },
  {
    category: 'MONTHLY_RECORD',
    anchor: 'monthly-record',
    eyebrow: '조금씩 꾸준하게',
    title: '월간기록',
    description:
      '매달 사진과 이야기를 기록하고 12개월 뒤 한 권의 인생책으로 완성하는 구독 상품입니다.',
    recommendation:
      '아이·가족·반려동물의 일상을 꾸준히 남기고 싶은 분',
    tone: 'sage',
  },
  {
    category: 'BOOK_PUBLISHING',
    anchor: 'book-publishing',
    eyebrow: '준비된 원고로',
    title: '단행본 제작',
    description:
      '이미 준비한 사진과 원고를 원하는 인쇄 사양에 맞춰 실제 책 한 권으로 제작합니다.',
    recommendation:
      '정리된 원고가 있고 인쇄와 제본이 필요한 분',
    tone: 'gold',
  },
] as const;

const ORDER_STEPS = [
  {
    number: '1',
    title: '상품 선택',
    description: '나에게 맞는 상품을 고릅니다.',
  },
  {
    number: '2',
    title: '신청서 작성',
    description: '연락처와 원하는 내용을 남깁니다.',
  },
  {
    number: '3',
    title: '관리자 1차 검토',
    description: '원고와 요청 내용을 확인한 뒤 연락드립니다.',
  },
  {
    number: '4',
    title: '결제 후 제작',
    description: '상담으로 사양을 확정한 다음 결제와 제작을 진행합니다.',
  },
] as const;

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
  isLoggedIn,
}: {
  product: ProductPlan;
  isLoggedIn: boolean;
}) {
  const isRecommended =
    'recommended' in product &&
    product.recommended === true;

  return (
    <article
      className={[
        'simple-pricing-plan',
        isRecommended ? 'is-recommended' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="simple-pricing-plan-heading">
        <div>
          <p className="simple-pricing-plan-name">
            {product.shortName}
          </p>

          {product.badge ? (
            <span className="simple-pricing-plan-badge">
              {product.badge}
            </span>
          ) : null}
        </div>

        {isRecommended ? (
          <span className="simple-pricing-recommended">
            추천
          </span>
        ) : null}
      </div>

      <p className="simple-pricing-plan-description">
        {product.description}
      </p>

      <ul className="simple-pricing-included">
        {product.included
          .slice(0, 4)
          .map((item) => (
            <li key={item}>{item}</li>
          ))}
      </ul>

      <div className="simple-pricing-plan-bottom">
        <div>
          <strong className="simple-pricing-price">
            {formatProductPrice(
              product.price,
              product.priceSuffix,
            )}
          </strong>

          <span className="simple-pricing-billing">
            {
              PRODUCT_BILLING_LABELS[
                product.billingType
              ]
            }
          </span>
        </div>

        <Link
          href={createProductHref(
            product,
            isLoggedIn,
          )}
          className="simple-pricing-plan-link"
        >
          {product.ctaLabel}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

const styles = `
  .simple-pricing,
  .simple-pricing * {
    box-sizing: border-box;
  }

  .simple-pricing {
    --pricing-ink: #35261f;
    --pricing-copy: #59473e;
    --pricing-muted: #78675e;
    --pricing-coral: #e8735d;
    --pricing-line: rgba(111, 77, 59, 0.14);
    min-height: 100vh;
    overflow-x: clip;
    color: var(--pricing-ink);
    background:
      radial-gradient(
        circle at 85% 8%,
        rgba(255, 221, 201, 0.48),
        transparent 29rem
      ),
      linear-gradient(180deg, #fffefa 0%, #fffaf5 100%);
    font-family: var(--font-daldongne-sans), sans-serif;
    font-weight: 700;
  }

  .simple-pricing a {
    color: inherit;
  }

  .simple-pricing-hero {
    width: min(1420px, calc(100% - 48px));
    min-height: 440px;
    margin: 28px auto 0;
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
    overflow: hidden;
    border: 1px solid var(--pricing-line);
    border-radius: 34px;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 22px 60px rgba(105, 67, 47, 0.09);
  }

  .simple-pricing-hero-copy {
    padding: clamp(42px, 6vw, 76px);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .simple-pricing-eyebrow {
    margin: 0;
    color: #cf624e;
    font-family: var(--font-daldongne-hand), cursive;
    font-size: 21px;
    font-weight: 700;
  }

  .simple-pricing-title {
    margin: 13px 0 0;
    font-family: var(--font-daldongne-hand), cursive;
    font-size: clamp(46px, 5vw, 66px);
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.035em;
    word-break: keep-all;
  }

  .simple-pricing-hero-description {
    margin: 22px 0 0;
    color: var(--pricing-copy);
    font-size: 17px;
    font-weight: 700;
    line-height: 1.8;
    word-break: keep-all;
  }

  .simple-pricing-hero-note {
    margin: 19px 0 0;
    display: flex;
    align-items: flex-start;
    gap: 9px;
    color: #725e52;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.65;
  }

  .simple-pricing-hero-note::before {
    flex: 0 0 auto;
    content: '✓';
    color: #d7604a;
  }

  .simple-pricing-hero-image {
    position: relative;
    min-height: 440px;
    overflow: hidden;
    background: #f7eadf;
  }

  .simple-pricing-hero-image::before {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 2;
    width: 90px;
    content: '';
    background:
      linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.94),
        rgba(255, 255, 255, 0)
      );
    pointer-events: none;
  }

  .simple-pricing-hero-image img {
    object-fit: cover;
    object-position: center 55%;
  }

  .simple-pricing-main {
    padding: 70px 24px 82px;
  }

  .simple-pricing-container {
    width: min(1280px, 100%);
    margin: 0 auto;
  }

  .simple-pricing-intro {
    max-width: 720px;
  }

  .simple-pricing-section-label {
    margin: 0;
    color: #cf624e;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .simple-pricing-section-title {
    margin: 10px 0 0;
    font-family: var(--font-daldongne-hand), cursive;
    font-size: clamp(38px, 4vw, 50px);
    font-weight: 700;
    line-height: 1.18;
    letter-spacing: -0.025em;
    word-break: keep-all;
  }

  .simple-pricing-section-copy {
    margin: 13px 0 0;
    color: var(--pricing-copy);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.75;
    word-break: keep-all;
  }

  .simple-pricing-choice-grid {
    margin-top: 28px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .simple-pricing-choice {
    min-width: 0;
    min-height: 224px;
    padding: 26px;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--pricing-line);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 14px 34px rgba(91, 57, 39, 0.06);
    text-decoration: none;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease;
  }

  .simple-pricing-choice:hover,
  .simple-pricing-choice:focus-visible {
    transform: translateY(-4px);
    box-shadow: 0 19px 40px rgba(91, 57, 39, 0.1);
  }

  .simple-pricing-choice.is-coral {
    background: linear-gradient(145deg, #fffefd, #fff0ea);
  }

  .simple-pricing-choice.is-sage {
    background: linear-gradient(145deg, #fffefd, #eff7f1);
  }

  .simple-pricing-choice.is-gold {
    background: linear-gradient(145deg, #fffefd, #fff7e7);
  }

  .simple-pricing-choice-eyebrow {
    color: #a96a51;
    font-size: 12px;
    font-weight: 800;
  }

  .simple-pricing-choice strong {
    margin-top: 8px;
    font-family: var(--font-daldongne-hand), cursive;
    font-size: 29px;
    font-weight: 700;
  }

  .simple-pricing-choice p {
    margin: 12px 0 0;
    color: var(--pricing-copy);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.7;
    word-break: keep-all;
  }

  .simple-pricing-choice-link {
    margin-top: auto;
    padding-top: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #bb604c;
    font-size: 13px;
    font-weight: 800;
  }

  .simple-pricing-groups {
    margin-top: 76px;
    display: grid;
    gap: 68px;
  }

  .simple-pricing-group {
    scroll-margin-top: 105px;
  }

  .simple-pricing-group-heading {
    display: grid;
    grid-template-columns: minmax(0, 0.72fr) minmax(320px, 1.28fr);
    align-items: end;
    gap: 36px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--pricing-line);
  }

  .simple-pricing-group-eyebrow {
    margin: 0;
    color: #c96751;
    font-size: 12px;
    font-weight: 800;
  }

  .simple-pricing-group-title {
    margin: 7px 0 0;
    font-family: var(--font-daldongne-hand), cursive;
    font-size: 38px;
    font-weight: 700;
    line-height: 1.2;
  }

  .simple-pricing-group-copy {
    margin: 0;
    color: var(--pricing-copy);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.75;
    word-break: keep-all;
  }

  .simple-pricing-recommendation {
    display: block;
    margin-top: 8px;
    color: #8d6755;
    font-size: 12px;
    font-weight: 800;
  }

  .simple-pricing-plan-grid {
    margin-top: 22px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .simple-pricing-group:first-child
    .simple-pricing-plan-grid {
    grid-template-columns: 1fr;
  }

  .simple-pricing-plan {
    min-width: 0;
    min-height: 338px;
    padding: 25px;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--pricing-line);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 13px 32px rgba(91, 57, 39, 0.055);
  }

  .simple-pricing-plan.is-recommended {
    border-color: rgba(220, 113, 89, 0.48);
    background:
      linear-gradient(
        145deg,
        #ffffff,
        #fff6f1
      );
    box-shadow: 0 16px 38px rgba(198, 91, 68, 0.1);
  }

  .simple-pricing-plan-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .simple-pricing-plan-name {
    margin: 0;
    color: var(--pricing-ink);
    font-size: 21px;
    font-weight: 800;
  }

  .simple-pricing-plan-badge {
    display: inline-flex;
    margin-top: 7px;
    color: #9d6b55;
    font-size: 11px;
    font-weight: 800;
  }

  .simple-pricing-recommended {
    flex: 0 0 auto;
    padding: 6px 10px;
    border-radius: 999px;
    color: #c35843;
    background: #ffebe3;
    font-size: 10px;
    font-weight: 800;
  }

  .simple-pricing-plan-description {
    margin: 20px 0 0;
    color: var(--pricing-copy);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.75;
    word-break: keep-all;
  }

  .simple-pricing-included {
    margin: 19px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px 14px;
    list-style: none;
  }

  .simple-pricing-included li {
    position: relative;
    padding-left: 18px;
    color: #69564c;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.5;
  }

  .simple-pricing-included li::before {
    position: absolute;
    top: 0;
    left: 0;
    content: '✓';
    color: #d56650;
    font-weight: 800;
  }

  .simple-pricing-plan-bottom {
    margin-top: auto;
    padding-top: 23px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
  }

  .simple-pricing-price {
    display: block;
    color: #2f221c;
    font-size: 22px;
    font-weight: 800;
  }

  .simple-pricing-billing {
    display: block;
    margin-top: 4px;
    color: var(--pricing-muted);
    font-size: 10px;
    font-weight: 700;
  }

  .simple-pricing-plan-link {
    min-height: 42px;
    padding: 0 17px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border: 1px solid #df7962;
    border-radius: 999px;
    color: #ffffff !important;
    background: linear-gradient(135deg, #ee8970, #df6852);
    box-shadow: 0 9px 20px rgba(205, 91, 68, 0.15);
    font-size: 12px;
    font-weight: 800;
    text-align: center;
    text-decoration: none;
    white-space: nowrap;
  }

  .simple-pricing-order {
    margin-top: 78px;
    padding: clamp(30px, 5vw, 54px);
    border: 1px solid var(--pricing-line);
    border-radius: 28px;
    background:
      radial-gradient(
        circle at 88% 10%,
        rgba(255, 218, 193, 0.58),
        transparent 20rem
      ),
      linear-gradient(135deg, #fffdf9, #fff5ed);
  }

  .simple-pricing-order-grid {
    margin-top: 28px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .simple-pricing-order-step {
    position: relative;
    min-width: 0;
    padding: 20px;
    border: 1px solid rgba(111, 77, 59, 0.11);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.78);
  }

  .simple-pricing-order-number {
    display: grid;
    width: 31px;
    height: 31px;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background: #e57a62;
    font-size: 12px;
    font-weight: 800;
  }

  .simple-pricing-order-step strong {
    display: block;
    margin-top: 14px;
    font-size: 15px;
    font-weight: 800;
  }

  .simple-pricing-order-step p {
    margin: 7px 0 0;
    color: var(--pricing-copy);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.65;
    word-break: keep-all;
  }

  .simple-pricing-notice {
    margin: 24px 0 0;
    color: #756258;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.7;
    text-align: center;
  }

  @media (max-width: 980px) {
    .simple-pricing-hero {
      grid-template-columns: 1fr;
    }

    .simple-pricing-hero-image {
      min-height: 330px;
    }

    .simple-pricing-hero-image::before {
      inset: 0 0 auto;
      width: auto;
      height: 70px;
      background:
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.95),
          rgba(255, 255, 255, 0)
        );
    }

    .simple-pricing-choice-grid {
      grid-template-columns: 1fr;
    }

    .simple-pricing-choice {
      min-height: 0;
    }

    .simple-pricing-group-heading {
      grid-template-columns: 1fr;
      align-items: start;
      gap: 13px;
    }

    .simple-pricing-order-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 680px) {
    .simple-pricing-hero {
      width: calc(100% - 28px);
      margin-top: 14px;
      border-radius: 24px;
    }

    .simple-pricing-hero-copy {
      padding: 38px 24px;
    }

    .simple-pricing-title {
      font-size: 44px;
    }

    .simple-pricing-hero-description {
      font-size: 15px;
    }

    .simple-pricing-hero-image {
      min-height: 250px;
    }

    .simple-pricing-main {
      padding: 52px 16px 64px;
    }

    .simple-pricing-section-title {
      font-size: 36px;
    }

    .simple-pricing-plan-grid,
    .simple-pricing-group:first-child
      .simple-pricing-plan-grid {
      grid-template-columns: 1fr;
    }

    .simple-pricing-plan {
      min-height: 0;
      padding: 22px 19px;
    }

    .simple-pricing-included {
      grid-template-columns: 1fr;
    }

    .simple-pricing-plan-bottom {
      align-items: stretch;
      flex-direction: column;
    }

    .simple-pricing-plan-link {
      width: 100%;
    }

    .simple-pricing-order {
      padding: 28px 18px;
    }

    .simple-pricing-order-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .simple-pricing-choice {
      transition: none;
    }
  }
`;

export default async function PricingPage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  return (
    <div className="storybook-public-page simple-pricing">
      <StorybookPublicHeader
        activeKey="pricing"
        ctaHref={
          isLoggedIn
            ? '/dashboard'
            : '/login?callbackUrl=/dashboard'
        }
      />

      <main>
        <section className="simple-pricing-hero">
          <div className="simple-pricing-hero-copy">
            <p className="simple-pricing-eyebrow">
              상품안내
            </p>

            <h1 className="simple-pricing-title">
              기록하는 방법에 맞춰
              <br />
              하나만 고르세요
            </h1>

            <p className="simple-pricing-hero-description">
              사진부터 시작하는 인생책, 매달 쌓는
              월간기록, 준비된 원고로 만드는 단행본이
              있습니다.
            </p>

            <p className="simple-pricing-hero-note">
              신청 즉시 결제되지 않습니다. 관리자가
              먼저 내용을 검토한 뒤 고객님께
              연락드립니다.
            </p>
          </div>

          <div className="simple-pricing-hero-image">
            <Image
              src="/home/storybook/detail-hero-bright-v2.webp"
              alt="가족사진과 이야기를 담아 완성한 인생책"
              fill
              priority
              sizes="(max-width: 980px) 100vw, 56vw"
            />
          </div>
        </section>

        <div className="simple-pricing-main">
          <div className="simple-pricing-container">
            <section aria-labelledby="pricing-choice-title">
              <div className="simple-pricing-intro">
                <p className="simple-pricing-section-label">
                  3가지 선택
                </p>

                <h2
                  id="pricing-choice-title"
                  className="simple-pricing-section-title"
                >
                  어떤 상품이 맞을까요?
                </h2>

                <p className="simple-pricing-section-copy">
                  현재 준비된 자료와 기록하고 싶은
                  방식에 가장 가까운 상품을 선택하면
                  됩니다.
                </p>
              </div>

              <div className="simple-pricing-choice-grid">
                {PRODUCT_GROUPS.map((group) => (
                  <Link
                    key={group.category}
                    href={`#${group.anchor}`}
                    className={`simple-pricing-choice is-${group.tone}`}
                  >
                    <span className="simple-pricing-choice-eyebrow">
                      {group.eyebrow}
                    </span>

                    <strong>{group.title}</strong>

                    <p>{group.recommendation}</p>

                    <span className="simple-pricing-choice-link">
                      상품과 가격 보기
                      <span aria-hidden="true">↓</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <div className="simple-pricing-groups">
              {PRODUCT_GROUPS.map((group) => {
                const products: readonly ProductPlan[] =
                  PRODUCT_PLANS.filter(
                    (product) =>
                      product.category ===
                      group.category,
                  );

                return (
                  <section
                    key={group.category}
                    id={group.anchor}
                    className="simple-pricing-group"
                    aria-labelledby={`${group.anchor}-title`}
                  >
                    <div className="simple-pricing-group-heading">
                      <div>
                        <p className="simple-pricing-group-eyebrow">
                          {group.eyebrow}
                        </p>

                        <h2
                          id={`${group.anchor}-title`}
                          className="simple-pricing-group-title"
                        >
                          {group.title}
                        </h2>
                      </div>

                      <p className="simple-pricing-group-copy">
                        {group.description}
                        <span className="simple-pricing-recommendation">
                          추천: {group.recommendation}
                        </span>
                      </p>
                    </div>

                    <div className="simple-pricing-plan-grid">
                      {products.map((product) => (
                        <ProductCard
                          key={product.code}
                          product={product}
                          isLoggedIn={isLoggedIn}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <section
              className="simple-pricing-order"
              aria-labelledby="pricing-order-title"
            >
              <p className="simple-pricing-section-label">
                안심 주문
              </p>

              <h2
                id="pricing-order-title"
                className="simple-pricing-section-title"
              >
                신청부터 제작까지
              </h2>

              <p className="simple-pricing-section-copy">
                먼저 결제하는 방식이 아닙니다. 담당자가
                자료와 요청 내용을 확인하고 제작 범위와
                금액을 안내합니다.
              </p>

              <div className="simple-pricing-order-grid">
                {ORDER_STEPS.map((step) => (
                  <article
                    key={step.number}
                    className="simple-pricing-order-step"
                  >
                    <span className="simple-pricing-order-number">
                      {step.number}
                    </span>

                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </article>
                ))}
              </div>

              <p className="simple-pricing-notice">
                ※ 표시 가격은 기본 구성 기준입니다.
                페이지 수, 규격 변경, 추가 인쇄와 선택
                옵션에 따라 최종 금액이 달라질 수
                있습니다.
              </p>
            </section>
          </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    </div>
  );
}
