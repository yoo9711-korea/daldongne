import { auth } from '@/auth';
import {
  PRODUCT_PLANS,
  formatProductPrice,
  getProductAddonsByCategory,
} from '@/lib/products/catalog';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProductApplicationForm from './ProductApplicationForm';

type ApplyPageProps = {
  searchParams: Promise<{
    product?: string | string[];
  }>;
};

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
    <main className="apply-page">
      <style>{`
        .apply-page {
          min-height: 100vh;
          padding: 60px 22px 90px;
          box-sizing: border-box;
          background:
            radial-gradient(
              circle at top right,
              rgba(229, 190, 120, 0.24),
              transparent 34%
            ),
            #f7eddc;
          color: #271a12;
        }

        .apply-container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .apply-navigation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 22px;
        }

        .apply-back-link {
          color: #6e421d;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
        }

        .apply-selected-price {
          color: #8a5a2c;
          font-size: 13px;
          font-weight: 900;
        }

        .apply-hero {
          margin-bottom: 26px;
          padding: 38px 36px;
          border-radius: 30px;
          background:
            linear-gradient(
              135deg,
              #2d1d15 0%,
              #543721 65%,
              #6e4928 100%
            );
          color: #fffaf0;
          box-shadow:
            0 24px 60px
            rgba(57, 35, 20, 0.18);
        }

        .apply-hero-label {
          margin: 0;
          color: #f0c36a;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .apply-hero h1 {
          margin: 12px 0 0;
          max-width: 800px;
          font-family:
            Noto Serif KR, serif;
          font-size:
            clamp(32px, 5vw, 52px);
          line-height: 1.25;
          letter-spacing: -0.05em;
          word-break: keep-all;
        }

        .apply-hero p:last-child {
          margin: 18px 0 0;
          max-width: 780px;
          color:
            rgba(255, 250, 240, 0.82);
          font-size: 16px;
          line-height: 1.8;
          word-break: keep-all;
        }

        .apply-notice {
          margin-top: 24px;
          padding: 18px 20px;
          border-radius: 18px;
          border: 1px solid #dfc9a4;
          background: #fff8e9;
          color: #6c5847;
          font-size: 13px;
          line-height: 1.75;
        }

        .apply-notice strong {
          color: #6e421d;
        }

        @media (max-width: 700px) {
          .apply-page {
            padding:
              32px 14px 64px;
          }

          .apply-navigation {
            align-items: flex-start;
            flex-direction: column;
          }

          .apply-hero {
            padding: 30px 22px;
            border-radius: 25px;
          }
        }
      `}</style>

      <div className="apply-container">
        <div className="apply-navigation">
          <Link
            href="/pricing"
            className="apply-back-link"
          >
            ← 상품 안내로 돌아가기
          </Link>

          <span className="apply-selected-price">
            선택 상품{' '}
            {formatProductPrice(
              product.price,
              product.priceSuffix,
            )}
          </span>
        </div>

        <section className="apply-hero">
          <p className="apply-hero-label">
            달동네 상품 신청
          </p>

          <h1>
            {product.name}
            <br />
            신청 내용을 확인해 주세요
          </h1>

          <p>
            선택한 상품과 추가 옵션을 확인하고
            연락받을 정보를 남겨 주세요. 신청
            단계에서는 비용이 결제되지 않습니다.
          </p>
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

        <div className="apply-notice">
          <strong>
            신청 후 진행 방식
          </strong>
          <br />
          담당자가 신청 상품, 추가 옵션과 요청사항을
          확인한 뒤 전화 또는 이메일로 연락드립니다.
          월간기록 구독은 정기결제 기능의 최종 검증
          전까지 상담 접수 방식으로 운영합니다.
        </div>
      </div>
    </main>
  );
}