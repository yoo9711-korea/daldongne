import {
  PRODUCT_ADDONS,
  formatProductPrice,
  type ProductPlan,
} from '@/lib/products/catalog';
import Link from 'next/link';
import {
  bookTypes,
  serviceSteps,
  subscriptionComparison,
} from '../pricing-data';
import styles from '../pricing.module.css';
import ProductCard from './ProductCard';

type PricingContentProps = {
  lifeBookPlans: readonly ProductPlan[];
  monthlyPlans: readonly ProductPlan[];
  isLoggedIn: boolean;
};

function createProductHref(
  product: ProductPlan,
  isLoggedIn: boolean,
) {
  const destination =
    product.category === 'LIFE_BOOK'
      ? `/dashboard/library?product=${encodeURIComponent(
          product.code,
        )}`
      : `/apply?product=${encodeURIComponent(
          product.code,
        )}`;

  if (isLoggedIn) {
    return destination;
  }

  return `/login?callbackUrl=${encodeURIComponent(
    destination,
  )}`;
}

export default function PricingContent({
  lifeBookPlans,
  monthlyPlans,
  isLoggedIn,
}: PricingContentProps) {
  const visibleAddons =
    PRODUCT_ADDONS.filter((addon) =>
      addon.availableFor.some(
        (category) =>
          category === 'LIFE_BOOK' ||
          category === 'MONTHLY_RECORD',
      ),
    );

  return (
    <div className={styles.pricingContainer}>
      <section className={styles.pricingHero}>
        <p className={styles.pricingEyebrow}>
          달동네 출판사 상품 안내
        </p>

        <h1>
          지금 한 권으로 만들거나,
          <br />
          매달 조금씩 기록하세요
        </h1>

        <p
          className={
            styles.pricingHeroDescription
          }
        >
          사진과 이야기를 한 번에 정리해
          인생책으로 만들거나, 매달 기록을
          차곡차곡 모아 1년에 한 번 책으로
          완성할 수 있습니다.
        </p>

        <div className={styles.startGrid}>
          <Link
            href="#life-book"
            className={styles.startCard}
          >
            <span
              className={
                styles.startCardLabel
              }
            >
              지금 바로 만들기
            </span>

            <strong>
              인생책 제작 · 99,000원부터
            </strong>

            <span>
              사진 50장 이하와 이야기를
              바탕으로 50~80페이지 기본 책을
              제작합니다.
            </span>
          </Link>

          <Link
            href="#monthly-record"
            className={styles.startCard}
          >
            <span
              className={
                styles.startCardLabel
              }
            >
              매달 조금씩 기록하기
            </span>

            <strong>
              월간기록 구독 · 월 9,900원부터
            </strong>

            <span>
              매달 기록을 저장하고 정리해
              12개월 후 기본 인생책 한 권으로
              완성합니다.
            </span>
          </Link>
        </div>
      </section>

      <section
        id="life-book"
        className={styles.section}
      >
        <div className={styles.sectionPanel}>
          <p className={styles.sectionLabel}>
            한 번에 제작
          </p>

          <h2 className={styles.sectionTitle}>
            지금 바로 한 권의 인생책으로
          </h2>

          <p
            className={
              styles.sectionDescription
            }
          >
            이미 모아둔 사진과 이야기가
            있다면 한 번의 제작 과정으로 원고
            정리부터 기본 인쇄와 배송까지
            진행합니다.
          </p>

          <div className={styles.lifePlanGrid}>
            <div>
              {lifeBookPlans.map(
                (product) => (
                  <ProductCard
                    key={product.code}
                    product={product}
                    href={createProductHref(
                      product,
                      isLoggedIn,
                    )}
                  />
                ),
              )}
            </div>

            <aside className={styles.lifeSummary}>
              <h3>
                기본 제작 기준
              </h3>

              <ul>
                <li>사진 50장 이하</li>
                <li>
                  50~80페이지 기본 분량
                </li>
                <li>
                  AI 사진 분석과 글 다듬기
                </li>
                <li>
                  목차 추천과 원고 생성
                </li>
                <li>
                  기본 소프트커버 1권
                </li>
                <li>
                  기본 인쇄·출판·택배비 포함
                </li>
              </ul>

              <div
                className={styles.conditionBox}
              >
                <p>
                  사진 50장 또는 80페이지를
                  초과하면 추가 견적이 발생할
                  수 있습니다.
                </p>

                <p>
                  하드커버, 사람 검수, 추가
                  인쇄는 선택 옵션입니다.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section
        id="monthly-record"
        className={styles.section}
      >
        <div className={styles.sectionPanel}>
          <p className={styles.sectionLabel}>
            매월 기록
          </p>

          <h2 className={styles.sectionTitle}>
            월간기록 구독 4가지 선택
          </h2>

          <p
            className={
              styles.sectionDescription
            }
          >
            디지털 기록만 차곡차곡 모으는
            기본형부터, 분기 엽서·매달
            엽서·사람 검수를 포함한
            프리미엄까지 필요한 방식으로
            선택합니다.
          </p>

          <div
            className={styles.monthlyPlanGrid}
          >
            {monthlyPlans.map(
              (product) => (
                <ProductCard
                  key={product.code}
                  product={product}
                  href={createProductHref(
                    product,
                    isLoggedIn,
                  )}
                  compact
                />
              ),
            )}
          </div>

          <div className={styles.comparisonWrap}>
            <table
              className={
                styles.comparisonTable
              }
            >
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
                      <tr
                        key={
                          comparison.code
                        }
                      >
                        <td>
                          <strong>
                            {
                              product.shortName
                            }
                          </strong>
                        </td>

                        <td>
                          {formatProductPrice(
                            product.price,
                            product.priceSuffix,
                          )}
                        </td>

                        <td>
                          {
                            comparison.postcard
                          }
                        </td>

                        <td>
                          {comparison.review}
                        </td>

                        <td>
                          기본 인생책 1권
                        </td>

                        <td>
                          {
                            comparison.recommendation
                          }
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

      <section className={styles.section}>
        <div className={styles.sectionPanel}>
          <p className={styles.sectionLabel}>
            선택 옵션
          </p>

          <h2 className={styles.sectionTitle}>
            필요한 제작 항목만 추가하세요
          </h2>

          <p
            className={
              styles.sectionDescription
            }
          >
            기본 상품 범위를 초과하거나
            추가로 필요한 제작 항목은 상담
            후 별도 견적으로 선택합니다.
          </p>

          <div className={styles.addonGrid}>
            {visibleAddons.map((addon) => (
              <article
                key={addon.code}
                className={styles.addonCard}
              >
                <strong>
                  {addon.name}
                </strong>

                <p>
                  {addon.description}
                </p>

                <span
                  className={
                    styles.addonPrice
                  }
                >
                  {addon.priceLabel}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionPanel}>
          <p className={styles.sectionLabel}>
            책의 종류
          </p>

          <h2 className={styles.sectionTitle}>
            어떤 이야기를 담을 수 있나요?
          </h2>

          <p
            className={
              styles.sectionDescription
            }
          >
            아래 항목은 별도의 결제 상품이
            아니라, 인생책 안에 어떤 이야기를
            담을지 정하는 책의 주제입니다.
          </p>

          <div
            className={styles.bookTypeGrid}
          >
            {bookTypes.map((bookType) => (
              <article
                key={bookType.title}
                className={
                  styles.bookTypeCard
                }
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

      <section className={styles.section}>
        <div className={styles.sectionPanel}>
          <p className={styles.sectionLabel}>
            제작 과정
          </p>

          <h2 className={styles.sectionTitle}>
            기록부터 한 권의 책까지
          </h2>

          <p
            className={
              styles.sectionDescription
            }
          >
            기록을 모으고 원고를 만든 다음
            제작 사양과 금액을 확인한 뒤
            인쇄를 진행합니다.
          </p>

          <div className={styles.stepGrid}>
            {serviceSteps.map((step) => (
              <article
                key={step.number}
                className={styles.stepCard}
              >
                <span
                  className={
                    styles.stepNumber
                  }
                >
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

      <div className={styles.noticeBox}>
        <strong>
          상품 이용 전 확인해 주세요
        </strong>

        <p>
          월간기록 구독의 기본 책 제작은
          12개월 유지 고객을 기준으로 합니다.
          사진 50장 초과, 80페이지 초과,
          하드커버, 추가 인쇄, 사람 검수와
          대량 수정은 상담 후 별도 금액이
          안내됩니다.
        </p>

        <p>
          현재 월간기록 구독 상품은 신청
          내용을 확인한 뒤 이용 방법을
          안내하는 방식으로 운영하며,
          정기결제 기능은 최종 검증 후 별도로
          연결됩니다.
        </p>
      </div>
    </div>
  );
}
