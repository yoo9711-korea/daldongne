import { auth } from '@/auth';
import StorybookPublicHeader from '@/components/storybook/StorybookPublicHeader';
import {
  PRODUCT_PLANS,
  formatProductPrice,
  getProductAddonsByCategory,
  type ProductPlanCode,
} from '@/lib/products/catalog';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProductApplicationForm from './ProductApplicationForm';

export const dynamic = 'force-dynamic';

type ApplyPageProps = {
  searchParams: Promise<{
    product?: string | string[];
  }>;
};

const PRODUCT_IMAGES: Record<
  ProductPlanCode,
  string
> = {
  LIFE_BOOK_BASIC:
    '/home/storybook/detail-hero-bright-v2.webp',
  MONTHLY_RECORD_BASIC:
   '/home/storybook/application-monthly-basic-v2.webp',
  MONTHLY_RECORD_QUARTERLY_POSTCARD:
    '/home/storybook/example-3.webp',
  MONTHLY_RECORD_MONTHLY_POSTCARD:
    '/home/storybook/example-4.webp',
  MONTHLY_RECORD_PREMIUM:
    '/home/storybook/detail-hero-bright-v2.webp',
  BOOK_PUBLISHING_BASIC:
    '/home/storybook/example-1.webp',
  BOOK_PUBLISHING_STANDARD:
    '/home/storybook/example-2.webp',
  BOOK_PUBLISHING_PREMIUM:
    '/home/storybook/example-3.webp',
};

const pageStyles = `
  .apply-storybook-page,
  .apply-storybook-page * {
    box-sizing: border-box;
  }

  .apply-storybook-page {
    --apply-ink: #4a3024;
    --apply-soft: #725e52;
    --apply-coral: #e97861;
    --apply-coral-dark: #d9624c;
    --apply-line: rgba(126, 87, 64, 0.14);
    width: 100%;
    min-height: 100vh;
    overflow-x: clip;
    color: var(--apply-ink);
    background:
      radial-gradient(
        circle at 84% 10%,
        rgba(255, 226, 206, 0.42),
        transparent 28rem
      ),
      #fffdf9;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .apply-storybook-page a {
    color: inherit;
  }

  .apply-storybook-main {
    padding:
      24px
      clamp(16px, 3vw, 38px)
      52px;
  }

  .apply-storybook-container {
    width: min(1240px, 100%);
    margin: 0 auto;
  }

  .apply-storybook-navigation {
    min-height: 45px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 16px;
  }

  .apply-storybook-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #a15f43 !important;
    font-size: 15px;
    font-weight: 900;
    text-decoration: none;
  }

  .apply-storybook-price {
    color: #9b694e;
    font-size: 15px;
    font-weight: 900;
    text-align: right;
  }

  .apply-storybook-hero {
    position: relative;
    min-height: 300px;
    margin-bottom: 24px;
    overflow: hidden;
    border: 1px solid rgba(173, 119, 83, 0.18);
    border-radius: 24px;
    background:
      linear-gradient(
        90deg,
        rgba(255, 252, 247, 0.99) 0%,
        rgba(255, 252, 247, 0.95) 46%,
        rgba(255, 252, 247, 0.28) 66%,
        rgba(255, 252, 247, 0) 82%
      ),
      #f7efe5;
    box-shadow:
      0 18px 44px
      rgba(90, 59, 41, 0.09);
  }

  .apply-storybook-hero-image {
    position: absolute;
    inset: 0 0 0 50%;
  }

  .apply-storybook-hero-image img {
    object-fit: cover;
    object-position: center center;
  }

  .apply-storybook-hero-inner {
    position: relative;
    z-index: 2;
    min-height: 300px;
    padding:
      38px
      clamp(24px, 4vw, 54px);
    display: flex;
    align-items: center;
  }

  .apply-storybook-hero-copy {
    width: min(550px, 48%);
  }

  .apply-storybook-label {
    margin: 0;
    color: #d96b53;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .apply-storybook-title {
    margin: 10px 0 0;
    font-family:
      'Gamja Flower',
      'MapoFlowerIsland',
      cursive;
    font-size: clamp(43px, 4vw, 57px);
    font-weight: 400;
    line-height: 1.15;
    letter-spacing: 0.01em;
    word-break: keep-all;
  }

  .apply-storybook-heart {
    margin-left: 7px;
    color: #ef806b;
    font-family: Arial, sans-serif;
    font-size: 0.8em;
  }

  .apply-storybook-description {
    margin: 16px 0 0;
    color: #604d43;
    font-size: 16px;
    line-height: 1.75;
    word-break: keep-all;
  }

  .apply-storybook-product-chip {
    display: inline-flex;
    min-height: 37px;
    margin-top: 17px;
    align-items: center;
    padding: 0 15px;
    border: 1px solid #e7c2af;
    border-radius: 999px;
    color: #a36045;
    background: rgba(255, 255, 255, 0.75);
    font-size: 13px;
    font-weight: 900;
  }

  .apply-storybook-guide {
    margin-top: 24px;
    padding: 20px 22px;
    border: 1px solid rgba(139, 96, 69, 0.15);
    border-radius: 16px;
    color: #725e52;
    background:
      linear-gradient(
        135deg,
        #fff8ef,
        #fffdf9
      );
    font-size: 14px;
    line-height: 1.75;
  }

  .apply-storybook-guide strong {
    color: #9f6044;
  }

  .apply-storybook-steps {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .apply-storybook-step {
    min-width: 0;
    padding: 13px 14px;
    display: grid;
    grid-template-columns: 31px minmax(0, 1fr);
    align-items: center;
    gap: 9px;
    border: 1px solid rgba(139, 96, 69, 0.12);
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.72);
  }

  .apply-storybook-step-number {
    display: grid;
    width: 31px;
    height: 31px;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ed896e,
        #df654f
      );
    font-size: 11px;
    font-weight: 900;
  }

  .apply-storybook-step strong {
    display: block;
    color: #4f3b31;
    font-size: 13px;
  }

  .apply-storybook-step span {
    display: block;
    margin-top: 3px;
    color: #847066;
    font-size: 11px;
    line-height: 1.45;
  }

  @media (max-width: 860px) {
    .apply-storybook-hero {
      display: grid;
    }

    .apply-storybook-hero-image {
      position: relative;
      inset: auto;
      order: 2;
      aspect-ratio: 1.5 / 1;
    }

    .apply-storybook-hero-inner {
      min-height: auto;
      padding: 40px 24px 34px;
      order: 1;
    }

    .apply-storybook-hero-copy {
      width: 100%;
      text-align: center;
    }

    .apply-storybook-product-chip {
      justify-content: center;
    }

    .apply-storybook-steps {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .apply-storybook-main {
      padding-right: 14px;
      padding-left: 14px;
    }

    .apply-storybook-navigation {
      align-items: flex-start;
      flex-direction: column;
      gap: 7px;
    }

    .apply-storybook-price {
      text-align: left;
    }

    .apply-storybook-hero {
      border-radius: 18px;
    }

    .apply-storybook-hero-inner {
      padding: 34px 18px 29px;
    }

    .apply-storybook-title {
      font-size: 40px;
    }

    .apply-storybook-description {
      font-size: 15px;
    }

    .apply-storybook-guide {
      padding: 17px 16px;
      font-size: 13px;
    }
  }
`;

export default async function ApplyPage({
  searchParams,
}: ApplyPageProps) {
  const params = await searchParams;

  const requestedProductCode =
    Array.isArray(params.product)
      ? params.product[0]
      : params.product;

  const product = PRODUCT_PLANS.find(
    (item) =>
      item.code === requestedProductCode,
  );

  if (!product) {
    redirect('/pricing');
  }

  const session = await auth();

  if (!session?.user) {
    const callbackUrl =
      `/apply?product=${encodeURIComponent(
        product.code,
      )}`;

    redirect(
      `/login?callbackUrl=${encodeURIComponent(
        callbackUrl,
      )}`,
    );
  }

  const addons =
    getProductAddonsByCategory(
      product.category,
    );

  return (
    <div className="storybook-public-page apply-storybook-page">
      <StorybookPublicHeader
        activeKey="pricing"
        ctaHref="/dashboard"
      />

      <main className="apply-storybook-main">
        <div className="apply-storybook-container">
          <div className="apply-storybook-navigation">
            <Link
              href="/pricing"
              className="apply-storybook-back"
            >
              ← 상품안내로 돌아가기
            </Link>

            <span className="apply-storybook-price">
              선택 상품{' '}
              {formatProductPrice(
                product.price,
                product.priceSuffix,
              )}
            </span>
          </div>

          <section className="apply-storybook-hero">
            <div className="apply-storybook-hero-image">
              <Image
                src={PRODUCT_IMAGES[product.code]}
                alt={`${product.name} 스토리북 예시`}
                fill
                priority
                sizes="(max-width: 860px) 100vw, 50vw"
              />
            </div>

            <div className="apply-storybook-hero-inner">
              <div className="apply-storybook-hero-copy">
                <p className="apply-storybook-label">
                  달동네 스토리북 상품 신청
                </p>

                <h1 className="apply-storybook-title">
                  {product.name}
                  <br />
                  신청 내용을 확인해 주세요
                  <span className="apply-storybook-heart">
                    ♡
                  </span>
                </h1>

                <p className="apply-storybook-description">
                  선택한 상품과 추가 옵션을 확인하고
                  연락받을 정보를 남겨 주세요.
                  <br />
                  신청 단계에서는 비용이 결제되지
                  않습니다.
                </p>

                <span className="apply-storybook-product-chip">
                  {formatProductPrice(
                    product.price,
                    product.priceSuffix,
                  )}
                </span>
              </div>
            </div>
          </section>

          <ProductApplicationForm
            product={product}
            addons={addons}
            defaultName={
              session.user.name || ''
            }
            defaultEmail={
              session.user.email || ''
            }
          />

          <section className="apply-storybook-guide">
            <strong>
              신청 후 진행 방식
            </strong>
            <br />
            담당자가 신청 상품, 추가 옵션과
            요청사항을 확인한 뒤 전화 또는
            이메일로 연락드립니다. 월간기록
            구독은 정기결제 기능의 최종 검증
            전까지 상담 접수 방식으로
            운영합니다.

            <div className="apply-storybook-steps">
              <div className="apply-storybook-step">
                <span className="apply-storybook-step-number">
                  01
                </span>
                <div>
                  <strong>신청 접수</strong>
                  <span>
                    선택 상품과 요청사항 확인
                  </span>
                </div>
              </div>

              <div className="apply-storybook-step">
                <span className="apply-storybook-step-number">
                  02
                </span>
                <div>
                  <strong>상담 안내</strong>
                  <span>
                    전화 또는 이메일로 연락
                  </span>
                </div>
              </div>

              <div className="apply-storybook-step">
                <span className="apply-storybook-step-number">
                  03
                </span>
                <div>
                  <strong>제작 시작</strong>
                  <span>
                    구성 확정 후 제작 진행
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: pageStyles,
        }}
      />
    </div>
  );
}
