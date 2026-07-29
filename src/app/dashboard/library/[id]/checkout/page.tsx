import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import CheckoutPaymentGate from "./CheckoutPaymentGate";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookCheckoutPage({
  params,
}: PageProps) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const [book, productionRequest, coverMemory] =
    await Promise.all([
      prisma.book.findFirst({
        where: {
          id,
          authorId: userId,
        },
        select: {
          id: true,
          title: true,
          subtitle: true,
          summary: true,
          type: true,
          status: true,
          pageCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.bookProductionRequest.findFirst({
        where: {
          bookId: id,
          authorId: userId,
        },
        orderBy: [
          {
            updatedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          message: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          bookOrder: {
            select: {
              productType: true,
              productName: true,
              specification: true,
              quantity: true,
              productAmount: true,
              shippingFee: true,
              totalAmount: true,
              status: true,
              orderId: true,
            },
          },
        },
      }),

      prisma.bookMemory.findFirst({
        where: {
          bookId: id,
          memory: {
            authorId: userId,
            type: "PHOTO",
            fileUrl: {
              not: null,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
        select: {
          memory: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

  if (!book) {
    notFound();
  }

  const order =
    productionRequest?.bookOrder || null;

  const paymentAvailable =
    Boolean(order) &&
    ["READY", "FAILED"].includes(
      String(order?.status),
    );

  const paymentCompleted =
    Boolean(order) &&
    [
      "PAID",
      "IN_PRODUCTION",
      "COMPLETED",
    ].includes(
      String(order?.status),
    );

  return (
    <main className="checkout-reference-page">
      <style>{checkoutReferenceStyles}</style>

      <div className="checkout-reference-shell">
        <nav
          className="checkout-reference-progress"
          aria-label="제작·결제 진행 단계"
        >
          <ProgressStep
            number={1}
            label="스토리 작성"
            complete
          />

          <ProgressLine />

          <ProgressStep
            number={2}
            label="내용 검토"
            complete
          />

          <ProgressLine />

          <ProgressStep
            number={3}
            label="디자인 확인"
            complete
          />

          <ProgressLine />

          <ProgressStep
            number={4}
            label="결제하기"
            active
          />
        </nav>

        <header className="checkout-reference-heading">
          <p>스토리북 제작 결제 단계</p>

          <h1>
            확정된 견적을 확인하고
            결제해요
          </h1>

          <span>
            견적과 연락 정보를 확인한 뒤
            안전한 결제창에서 결제를
            완료합니다.
          </span>
        </header>

        {order ? (
          <section
            className="checkout-reference-review-banner"
            data-status={
              paymentCompleted
                ? "paid"
                : paymentAvailable
                  ? "ready"
                  : "waiting"
            }
          >
            <span aria-hidden="true">
              {paymentCompleted
                ? "✓"
                : paymentAvailable
                  ? "✓"
                  : "i"}
            </span>

            <div>
              <strong>
                {paymentCompleted
                  ? "결제가 완료된 제작 주문입니다."
                  : paymentAvailable
                    ? "관리자 검토가 끝나고 제작 견적이 준비되었습니다."
                    : "관리자 검토가 진행 중입니다."}
              </strong>

              <p>
                {paymentCompleted
                  ? "현재 제작 진행 상태는 내 책장에서 확인할 수 있습니다."
                  : paymentAvailable
                    ? "아래 제작 주문 내용과 최종 금액을 확인한 뒤 결제를 진행해 주세요."
                    : "견적이 확정되면 이 화면에 결제 버튼이 표시됩니다."}
              </p>
            </div>
          </section>
        ) : (
          <section
            className="checkout-reference-review-banner"
            data-status="waiting"
          >
            <span aria-hidden="true">i</span>

            <div>
              <strong>
                아직 제작 신청 또는 견적이
                없습니다.
              </strong>

              <p>
                원고 상세 화면에서 제작 신청을
                먼저 접수해 주세요.
              </p>
            </div>
          </section>
        )}

        <section className="checkout-reference-main-grid">
          <article className="checkout-reference-contact-card">
            <div className="checkout-reference-card-heading">
              <p>배송·연락 정보</p>
              <h2>제작 신청 정보를 확인해 주세요</h2>
            </div>

            <ContactField
              label="받는 분"
              value={
                productionRequest?.name ||
                session.user.name ||
                "이름 미입력"
              }
            />

            <ContactField
              label="연락처"
              value={
                productionRequest?.phone ||
                "연락처 미입력"
              }
            />

            <ContactField
              label="이메일"
              value={
                productionRequest?.email ||
                session.user.email ||
                "이메일 미입력"
              }
            />

            <div className="checkout-reference-message-field">
              <strong>제작 요청사항</strong>

              <p>
                {productionRequest?.message?.trim() ||
                  "별도로 작성한 제작 요청사항이 없습니다."}
              </p>
            </div>

            <div className="checkout-reference-address-note">
              <span aria-hidden="true">i</span>

              <p>
                배송 주소는 결제 완료 후
                제작 상담 과정에서 최종
                확인합니다. 현재 시스템에 없는
                주소를 임의로 저장하지 않습니다.
              </p>
            </div>

            <Link
              href={`/dashboard/library/${book.id}`}
            >
              신청 정보와 원고 다시 확인
            </Link>
          </article>

          <aside className="checkout-reference-order-card">
            <div className="checkout-reference-card-heading">
              <p>제작 주문 요약</p>
              <h2>제작할 스토리북</h2>
            </div>

            <div className="checkout-reference-book-summary">
              <div className="checkout-reference-cover">
                {coverMemory?.memory ? (
                  <Image
                    src={`/api/blob/${coverMemory.memory.id}`}
                    alt={
                      coverMemory.memory.title ||
                      book.title
                    }
                    fill
                    unoptimized
                    sizes="150px"
                  />
                ) : (
                  <Image
                    src="/dashboard/checkout-reference-v1/sample-checkout-cover.webp"
                    alt="스토리북 표지 예시"
                    fill
                    sizes="150px"
                  />
                )}

                <span>
                  달동네
                  <br />
                  스토리북
                </span>
              </div>

              <div>
                <strong>
                  {order?.productName ||
                    getBookTypeLabel(
                      String(book.type),
                    )}
                </strong>

                <h3>{book.title}</h3>

                <p>
                  {book.subtitle ||
                    book.summary ||
                    "사진과 이야기로 만든 나의 스토리북"}
                </p>

                <small>
                  {order
                    ? `${order.quantity.toLocaleString()}권 · ${getBookOrderStatusLabel(
                        String(order.status),
                      )}`
                    : "제작 견적 준비 전"}
                </small>
              </div>
            </div>

            <div className="checkout-reference-price-list">
              <PriceRow
                label="제작비"
                value={
                  order?.productAmount || 0
                }
              />

              <PriceRow
                label="배송비"
                value={
                  order?.shippingFee || 0
                }
              />

              <PriceRow
                label="총 결제금액"
                value={
                  order?.totalAmount || 0
                }
                total
              />
            </div>

            {order?.specification ? (
              <div className="checkout-reference-specification">
                <strong>제작 사양</strong>

                <p>{order.specification}</p>
              </div>
            ) : null}

            {order ? (
              <div className="checkout-reference-order-number">
                <span>주문번호</span>
                <strong>{order.orderId}</strong>
              </div>
            ) : null}
          </aside>
        </section>

        <section className="checkout-reference-methods">
          <div className="checkout-reference-card-heading">
            <p>결제 방법</p>
            <h2>
              결제창에서 원하는 방법을
              선택합니다
            </h2>
          </div>

          <div className="checkout-reference-method-grid">
            <PaymentMethodCard
              icon="card"
              title="카드"
              description="신용카드·체크카드"
            />

            <PaymentMethodCard
              icon="bank"
              title="계좌이체"
              description="은행 계좌로 직접 이체"
            />

            <PaymentMethodCard
              icon="phone"
              title="간편결제"
              description="결제창에서 지원 수단 확인"
            />
          </div>

          <p>
            실제 지원되는 결제 수단은
            토스 결제창에 표시되는 항목을
            기준으로 합니다.
          </p>
        </section>

        {paymentAvailable && order ? (
          <CheckoutPaymentGate
            bookId={book.id}
            orderId={order.orderId}
            orderName={order.productName}
            amount={order.totalAmount}
            customerKey={userId}
            customerName={
              productionRequest?.name ||
              session.user.name ||
              ""
            }
            customerEmail={
              productionRequest?.email ||
              session.user.email ||
              ""
            }
            customerMobilePhone={
              productionRequest?.phone || ""
            }
          />
        ) : (
          <section className="checkout-reference-unavailable">
            <strong>
              {paymentCompleted
                ? "결제가 이미 완료되었습니다."
                : order
                  ? "현재는 결제 대기 상태가 아닙니다."
                  : "제작 견적이 준비된 후 결제할 수 있습니다."}
            </strong>

            <p>
              제작 진행 상태와 관리자 안내는
              원고 상세 화면에서 확인해 주세요.
            </p>

            <Link
              href={`/dashboard/library/${book.id}`}
            >
              원고 상세 화면으로
            </Link>
          </section>
        )}

        <footer className="checkout-reference-footer">
          <Link
            href={`/dashboard/library/${book.id}`}
          >
            ← 이전 단계로
          </Link>

          <Link href="/dashboard/library">
            내 책장 보기
          </Link>
        </footer>
      </div>
    </main>
  );
}

function ProgressStep({
  number,
  label,
  complete = false,
  active = false,
}: {
  number: number;
  label: string;
  complete?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className="checkout-reference-progress-step"
      data-complete={
        complete ? "true" : "false"
      }
      data-active={
        active ? "true" : "false"
      }
    >
      <span aria-hidden="true">
        {complete ? "✓" : number}
      </span>

      <strong>
        {number} {label}
      </strong>
    </div>
  );
}

function ProgressLine() {
  return (
    <span
      className="checkout-reference-progress-line"
      aria-hidden="true"
    />
  );
}

function ContactField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="checkout-reference-contact-field">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

function PriceRow({
  label,
  value,
  total = false,
}: {
  label: string;
  value: number;
  total?: boolean;
}) {
  return (
    <div
      className="checkout-reference-price-row"
      data-total={
        total ? "true" : "false"
      }
    >
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}원
      </strong>
    </div>
  );
}

function PaymentMethodCard({
  icon,
  title,
  description,
}: {
  icon: "card" | "bank" | "phone";
  title: string;
  description: string;
}) {
  return (
    <article>
      <span aria-hidden="true">
        <PaymentMethodIcon name={icon} />
      </span>

      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </article>
  );
}

function PaymentMethodIcon({
  name,
}: {
  name: "card" | "bank" | "phone";
}) {
  if (name === "bank") {
    return (
      <svg viewBox="0 0 48 48" fill="none">
        <path
          d="M6 18 24 7l18 11H6Z"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M10 21v16M19 21v16M29 21v16M38 21v16M6 41h36"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "phone") {
    return (
      <svg viewBox="0 0 48 48" fill="none">
        <rect
          x="13"
          y="5"
          width="22"
          height="38"
          rx="5"
          stroke="currentColor"
          strokeWidth="2.6"
        />
        <path
          d="M20 10h8M21 37h6"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M19 20h10v9H19z"
          stroke="currentColor"
          strokeWidth="2.6"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" fill="none">
      <rect
        x="5"
        y="10"
        width="38"
        height="28"
        rx="5"
        stroke="currentColor"
        strokeWidth="2.6"
      />
      <path
        d="M5 18h38M11 29h10"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getBookTypeLabel(type: string) {
  const labels: Record<string, string> = {
    LIFE_BOOK: "인생 기록책",
    FAMILY_BOOK: "가족 이야기책",
    COUPLE_BOOK: "부부 이야기책",
    BABY_BOOK: "성장 기록책",
    TRAVEL_BOOK: "여행 기록책",
    AI_MOVIE: "AI 영상",
  };

  return labels[type] || "스토리북";
}

function getBookOrderStatusLabel(
  status: string,
) {
  const labels: Record<string, string> = {
    READY: "결제 준비",
    FAILED: "결제 재시도",
    PAID: "결제 완료",
    IN_PRODUCTION: "제작 진행 중",
    COMPLETED: "제작 완료",
    CANCELED: "주문 취소",
  };

  return (
    labels[status] ||
    "주문 상태 확인 필요"
  );
}

const checkoutReferenceStyles = `
  .checkout-reference-page,
  .checkout-reference-page * {
    box-sizing: border-box;
  }

  .checkout-reference-page {
    min-height: 100vh;
    padding: 28px 24px 54px;
    color: #432d24;
    background:
      radial-gradient(
        circle at 7% 10%,
        rgba(255, 234, 214, 0.58),
        transparent 29rem
      ),
      radial-gradient(
        circle at 93% 12%,
        rgba(233, 244, 224, 0.58),
        transparent 25rem
      ),
      linear-gradient(
        180deg,
        #fffdf9,
        #fff9f3
      );
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .checkout-reference-page a {
    color: inherit;
    text-decoration: none;
  }

  .checkout-reference-page a,
  .checkout-reference-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .checkout-reference-page a:hover,
  .checkout-reference-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .checkout-reference-page a:focus-visible,
  .checkout-reference-page button:focus-visible,
  .checkout-reference-page input:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .checkout-reference-shell {
    width: min(1210px, 100%);
    margin: 0 auto;
  }

  .checkout-reference-progress {
    display: grid;
    grid-template-columns:
      auto minmax(40px, 1fr)
      auto minmax(40px, 1fr)
      auto minmax(40px, 1fr)
      auto;
    align-items: center;
    gap: 14px;
    padding: 0 12px;
  }

  .checkout-reference-progress-step {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #6f584d;
  }

  .checkout-reference-progress-step > span {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border:
      1px solid #ead0a0;
    border-radius: 50%;
    background: #fff0d4;
    color: #5c4438;
    font-size: 18px;
    font-weight: 900;
  }

  .checkout-reference-progress-step > strong {
    font-size: 13px;
    white-space: nowrap;
  }

  .checkout-reference-progress-step[data-active="true"] {
    color: #ee604d;
  }

  .checkout-reference-progress-step[data-active="true"] > span {
    border-color: #ef6b55;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5e4f
      );
  }

  .checkout-reference-progress-line {
    height: 2px;
    border-radius: 999px;
    background:
      linear-gradient(
        90deg,
        #dfc9a5,
        #ef9a78
      );
  }

  .checkout-reference-heading {
    margin-top: 26px;
    text-align: center;
  }

  .checkout-reference-heading > p {
    margin: 0;
    color: #ed6b54;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .checkout-reference-heading h1 {
    margin: 9px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(39px, 5vw, 58px);
    line-height: 1.2;
    letter-spacing: -0.06em;
  }

  .checkout-reference-heading > span {
    display: block;
    margin-top: 11px;
    color: #7b675e;
    font-size: 14px;
    line-height: 1.7;
  }

  .checkout-reference-review-banner {
    margin-top: 20px;
    padding: 17px 23px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 13px;
    border:
      1px solid #a9c47a;
    border-radius: 16px;
    background:
      linear-gradient(
        135deg,
        #f1f7e7,
        #fbfdf7
      );
    text-align: left;
  }

  .checkout-reference-review-banner[data-status="waiting"] {
    border-color: #e0bf82;
    background:
      linear-gradient(
        135deg,
        #fff7e5,
        #fffdf8
      );
  }

  .checkout-reference-review-banner[data-status="paid"] {
    border-color: #9ac6b1;
    background:
      linear-gradient(
        135deg,
        #eaf7f0,
        #fbfdfb
      );
  }

  .checkout-reference-review-banner > span {
    width: 35px;
    height: 35px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border:
      2px solid currentColor;
    border-radius: 50%;
    color: #577d3c;
    font-size: 18px;
    font-weight: 900;
  }

  .checkout-reference-review-banner strong {
    display: block;
    color: #426033;
    font-size: 17px;
  }

  .checkout-reference-review-banner p {
    margin: 3px 0 0;
    color: #68775d;
    font-size: 11px;
    line-height: 1.6;
  }

  .checkout-reference-main-grid {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.28fr)
      minmax(330px, 0.72fr);
    gap: 17px;
  }

  .checkout-reference-contact-card,
  .checkout-reference-order-card,
  .checkout-reference-methods,
  .checkout-reference-unavailable,
  .checkout-payment-gate {
    min-width: 0;
    padding: 25px;
    border:
      1px solid
      rgba(139, 97, 75, 0.15);
    border-radius: 21px;
    background:
      rgba(255, 255, 255, 0.92);
    box-shadow:
      0 14px 36px
      rgba(88, 57, 44, 0.055);
  }

  .checkout-reference-card-heading > p {
    margin: 0;
    color: #e56b54;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.06em;
  }

  .checkout-reference-card-heading h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 24px;
    line-height: 1.4;
    letter-spacing: -0.045em;
  }

  .checkout-reference-contact-field {
    margin-top: 13px;
    min-height: 52px;
    padding: 0 15px;
    display: grid;
    grid-template-columns:
      110px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    border:
      1px solid
      rgba(139, 98, 77, 0.2);
    border-radius: 12px;
    background: #fffdfb;
  }

  .checkout-reference-contact-field strong {
    font-size: 12px;
  }

  .checkout-reference-contact-field span {
    color: #715d54;
    font-size: 13px;
    word-break: break-all;
  }

  .checkout-reference-message-field {
    margin-top: 13px;
    padding: 15px;
    border:
      1px solid
      rgba(139, 98, 77, 0.2);
    border-radius: 12px;
    background: #fffdfb;
  }

  .checkout-reference-message-field strong {
    font-size: 12px;
  }

  .checkout-reference-message-field p {
    margin: 7px 0 0;
    color: #715d54;
    font-size: 12px;
    line-height: 1.7;
    white-space: pre-line;
  }

  .checkout-reference-address-note {
    margin-top: 14px;
    padding: 13px 14px;
    display: flex;
    align-items: flex-start;
    gap: 9px;
    border-radius: 12px;
    color: #785d46;
    background: #fff5e5;
  }

  .checkout-reference-address-note > span {
    width: 20px;
    height: 20px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border:
      1px solid currentColor;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 900;
  }

  .checkout-reference-address-note p {
    margin: 0;
    font-size: 10px;
    line-height: 1.7;
  }

  .checkout-reference-contact-card > a {
    min-height: 43px;
    margin-top: 15px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid #d7b4a3;
    border-radius: 12px;
    color: #805446;
    background: #ffffff;
    font-size: 11px;
    font-weight: 900;
  }

  .checkout-reference-book-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      128px minmax(0, 1fr);
    gap: 17px;
    align-items: center;
  }

  .checkout-reference-cover {
    position: relative;
    width: 128px;
    aspect-ratio: 0.72 / 1;
    overflow: hidden;
    border:
      5px solid #ffffff;
    border-radius: 5px;
    background: #e9dfd4;
    box-shadow:
      0 9px 21px
      rgba(64, 43, 34, 0.18);
  }

  .checkout-reference-cover img {
    object-fit: cover;
  }

  .checkout-reference-cover > span {
    position: absolute;
    inset: 0;
    z-index: 2;
    padding: 22px 13px;
    display: flex;
    justify-content: flex-end;
    flex-direction: column;
    color: #ffffff;
    background:
      linear-gradient(
        180deg,
        rgba(22, 15, 11, 0.04),
        rgba(22, 15, 11, 0.52)
      );
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.5;
    text-align: center;
    text-shadow:
      0 2px 8px
      rgba(0, 0, 0, 0.45);
  }

  .checkout-reference-book-summary > div:last-child > strong {
    color: #e15f4a;
    font-size: 10px;
    font-weight: 900;
  }

  .checkout-reference-book-summary h3 {
    margin: 7px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 19px;
    line-height: 1.45;
    letter-spacing: -0.04em;
  }

  .checkout-reference-book-summary p {
    margin: 6px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #715e55;
    font-size: 10px;
    line-height: 1.6;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .checkout-reference-book-summary small {
    display: block;
    margin-top: 8px;
    color: #8f796e;
    font-size: 9px;
  }

  .checkout-reference-price-list {
    margin-top: 18px;
    padding-top: 13px;
    border-top:
      1px solid
      rgba(133, 92, 71, 0.16);
  }

  .checkout-reference-price-row {
    padding: 8px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
  }

  .checkout-reference-price-row span {
    color: #725f56;
    font-size: 12px;
  }

  .checkout-reference-price-row strong {
    font-size: 13px;
  }

  .checkout-reference-price-row[data-total="true"] {
    margin-top: 5px;
    padding-top: 13px;
    border-top:
      1px dashed
      rgba(133, 92, 71, 0.23);
  }

  .checkout-reference-price-row[data-total="true"] span {
    color: #4c382f;
    font-size: 14px;
    font-weight: 900;
  }

  .checkout-reference-price-row[data-total="true"] strong {
    color: #ed624d;
    font-size: 24px;
  }

  .checkout-reference-specification {
    margin-top: 13px;
    padding: 13px;
    border-radius: 12px;
    background: #fff8e9;
  }

  .checkout-reference-specification strong {
    font-size: 10px;
  }

  .checkout-reference-specification p {
    margin: 6px 0 0;
    color: #715e55;
    font-size: 10px;
    line-height: 1.65;
    white-space: pre-line;
  }

  .checkout-reference-order-number {
    margin-top: 13px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-radius: 12px;
    color: #ffffff;
    background: #3b2b24;
  }

  .checkout-reference-order-number span {
    color: rgba(255, 255, 255, 0.72);
    font-size: 9px;
  }

  .checkout-reference-order-number strong {
    overflow: hidden;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .checkout-reference-methods {
    margin-top: 17px;
  }

  .checkout-reference-method-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .checkout-reference-method-grid article {
    min-height: 96px;
    padding: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    border:
      1px solid
      rgba(139, 98, 77, 0.23);
    border-radius: 14px;
    background: #fffdfb;
  }

  .checkout-reference-method-grid article > span {
    width: 48px;
    height: 48px;
    color: #705849;
  }

  .checkout-reference-method-grid svg {
    width: 100%;
    height: 100%;
  }

  .checkout-reference-method-grid strong {
    font-size: 16px;
  }

  .checkout-reference-method-grid p {
    margin: 4px 0 0;
    color: #7d685e;
    font-size: 10px;
    line-height: 1.5;
  }

  .checkout-reference-methods > p {
    margin: 12px 0 0;
    color: #8a7469;
    font-size: 10px;
  }

  .checkout-reference-unavailable {
    margin-top: 17px;
    text-align: center;
  }

  .checkout-reference-unavailable strong {
    display: block;
    font-size: 18px;
  }

  .checkout-reference-unavailable p {
    margin: 7px 0 0;
    color: #78645b;
    font-size: 12px;
  }

  .checkout-reference-unavailable a {
    min-height: 44px;
    margin-top: 14px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    border-radius: 12px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5e4f
      );
    font-size: 11px;
    font-weight: 900;
  }

  .checkout-reference-footer {
    margin-top: 17px;
    padding: 15px 2px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .checkout-reference-footer a {
    min-height: 42px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    color: #76574a;
    font-size: 12px;
    font-weight: 900;
  }

  @media (max-width: 850px) {
    .checkout-reference-progress {
      overflow-x: auto;
      grid-template-columns:
        auto 45px auto 45px auto 45px auto;
      padding-bottom: 8px;
    }

    .checkout-reference-main-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .checkout-reference-page {
      padding: 20px 12px 38px;
    }

    .checkout-reference-progress {
      gap: 8px;
    }

    .checkout-reference-progress-step {
      gap: 7px;
    }

    .checkout-reference-progress-step > span {
      width: 34px;
      height: 34px;
      font-size: 14px;
    }

    .checkout-reference-progress-step > strong {
      font-size: 10px;
    }

    .checkout-reference-heading h1 {
      font-size: 36px;
    }

    .checkout-reference-review-banner {
      align-items: flex-start;
      padding: 14px;
    }

    .checkout-reference-contact-card,
    .checkout-reference-order-card,
    .checkout-reference-methods,
    .checkout-reference-unavailable,
    .checkout-payment-gate {
      padding: 18px;
      border-radius: 18px;
    }

    .checkout-reference-contact-field {
      min-height: 0;
      padding: 12px;
      grid-template-columns: 1fr;
      gap: 4px;
    }

    .checkout-reference-book-summary {
      grid-template-columns:
        100px minmax(0, 1fr);
    }

    .checkout-reference-cover {
      width: 100px;
    }

    .checkout-reference-method-grid {
      grid-template-columns: 1fr;
    }

    .checkout-reference-method-grid article {
      min-height: 78px;
      justify-content: flex-start;
    }

    .checkout-reference-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .checkout-reference-footer a {
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .checkout-reference-page a,
    .checkout-reference-page button {
      transition: none;
    }
  }
`;



