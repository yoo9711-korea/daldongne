import { auth } from "@/auth";
import OrderPublicAuditTimeline from "@/components/orders/OrderPublicAuditTimeline";
import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";
import OrderValueCopyButton from "@/components/orders/OrderValueCopyButton";
import { prisma } from "@/lib/prisma";
import {
  BookOrderStatus,
} from "@prisma/client";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DashboardOrderDetailPage({
  params,
}: PageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(
      "/login?callbackUrl=/dashboard/orders",
    );
  }

  const { id } = await params;

  const order =
    await prisma.bookOrder.findFirst({
      where: {
        id,
        authorId: userId,
      },
      select: {
        id: true,
        orderId: true,
        productType: true,
        productName: true,
        specification: true,
        quantity: true,
        productAmount: true,
        shippingFee: true,
        totalAmount: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        canceledAt: true,
        productionStage: true,
        productionStageUpdatedAt:
          true,
        manuscriptReceivedAt: true,
        reviewStartedAt: true,
        proofFileUrl: true,
        proofSentAt: true,
        proofApprovedAt: true,
        printOrderedAt: true,
        printingCompletedAt: true,
        recipientName: true,
        recipientPhone: true,
        postalCode: true,
        shippingAddress1: true,
        shippingAddress2: true,
        shippingMemo: true,
        shippingCarrier: true,
        trackingNumber: true,
        shippedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        book: {
          select: {
            id: true,
            title: true,
            subtitle: true,
            summary: true,
            status: true,
          },
        },
        productionRequest: {
          select: {
            name: true,
            phone: true,
            email: true,
            message: true,
            status: true,
          },
        },
      },
    });

  if (!order) {
    notFound();
  }

      const paymentRequired =
    order.status === BookOrderStatus.READY ||
    order.status === BookOrderStatus.FAILED;

  const hasShippingInformation =
    Boolean(
      order.recipientName ||
        order.shippingAddress1 ||
        order.trackingNumber,
    );

  return (
    <main className="user-order-detail-page">
      <style>
        {orderDetailStyles}
      </style>

      <div className="user-order-detail-shell">
        <header className="user-order-detail-hero">
          <div>
            <p>
              ORDER DETAIL
            </p>

            <div className="user-order-detail-badges">
              <OrderStatusBadge
                status={String(
                  order.status,
                )}
              />

              <span>
                {getProductionStageLabel(
                  String(
                    order.productionStage,
                  ),
                )}
              </span>
            </div>

            <h1>
              {order.book.title}
            </h1>

            <small>
              주문번호 {order.orderId}
            </small>
          </div>

          <div className="user-order-detail-hero-actions">
            <Link href="/dashboard/orders">
              주문 목록
            </Link>

            <Link
              href={`/dashboard/library/${order.book.id}`}
            >
              책 상세
            </Link>

            {paymentRequired ? (
              <Link
                className="user-order-detail-payment-link"
                href={`/dashboard/library/${order.book.id}/checkout`}
              >
                결제하기
              </Link>
            ) : null}
          </div>
        </header>

        <section className="user-order-detail-overview">
          <OverviewCard
            label="최종 결제금액"
            value={`${order.totalAmount.toLocaleString()}원`}
          />

          <OverviewCard
            label="주문 수량"
            value={`${order.quantity.toLocaleString()}권`}
          />

          <OverviewCard
            label="결제수단"
            value={
              order.paymentMethod ||
              "미등록"
            }
          />

          <OverviewCard
            label="결제일"
            value={formatDateTime(
              order.paidAt,
            )}
          />

          <OverviewCard
            label="최근 진행 변경"
            value={formatDateTime(
              order.productionStageUpdatedAt,
            )}
          />
        </section>

        <section className="user-order-detail-panel">
          <PanelHeading
            eyebrow="PRODUCTION TIMELINE"
            title="책 제작 진행 과정"
            description="관리자가 진행 단계를 변경하면 이 화면에 바로 반영됩니다."
          />

          <OrderStatusTimeline
            stage={String(
              order.productionStage,
            )}
            stageUpdatedAt={
              order.productionStageUpdatedAt
            }
            manuscriptReceivedAt={
              order.manuscriptReceivedAt
            }
            reviewStartedAt={
              order.reviewStartedAt
            }
            proofSentAt={
              order.proofSentAt
            }
            proofApprovedAt={
              order.proofApprovedAt
            }
            printOrderedAt={
              order.printOrderedAt
            }
            printingCompletedAt={
              order.printingCompletedAt
            }
            shippedAt={
              order.shippedAt
            }
            completedAt={
              order.completedAt
            }
          />
        </section>

        <OrderPublicAuditTimeline
          orderRecordId={order.id}
          authorId={userId}
        />

        {order.proofFileUrl ? (
          <section className="user-order-proof-panel">
            <div>
              <p>
                교정본 확인
              </p>

              <h2>
                책 교정본이 준비되었습니다.
              </h2>

              <span>
                내용을 확인한 뒤 수정사항이나
                승인 여부를 담당자에게
                전달해 주세요.
              </span>
            </div>

            <a
              href={
                order.proofFileUrl
              }
              target={
                order.proofFileUrl.startsWith(
                  "http",
                )
                  ? "_blank"
                  : undefined
              }
              rel="noreferrer"
            >
              교정본 열기
              <span aria-hidden="true">
                →
              </span>
            </a>
          </section>
        ) : null}

        <section className="user-order-detail-grid">
          <div className="user-order-detail-main">
            <section className="user-order-detail-panel">
              <PanelHeading
                eyebrow="ORDER INFORMATION"
                title="주문·결제 정보"
              />

              <div className="user-order-data-grid">
                <DataBox
                  label="주문번호"
                  value={order.orderId}
                  copyValue={
                    order.orderId
                  }
                  wide
                />

                <DataBox
                  label="상품명"
                  value={
                    order.productName
                  }
                />

                <DataBox
                  label="상품 종류"
                  value={getProductTypeLabel(
                    String(
                      order.productType,
                    ),
                  )}
                />

                <DataBox
                  label="제작 수량"
                  value={`${order.quantity.toLocaleString()}권`}
                />

                <DataBox
                  label="상품 금액"
                  value={`${order.productAmount.toLocaleString()}원`}
                />

                <DataBox
                  label="배송비"
                  value={`${order.shippingFee.toLocaleString()}원`}
                />

                <DataBox
                  label="결제 상태"
                  value={getOrderStatusLabel(
                    String(
                      order.status,
                    ),
                  )}
                />

                <DataBox
                  label="제작 사양"
                  value={
                    order.specification ||
                    "등록된 제작 사양이 없습니다."
                  }
                  wide
                />

                <DataBox
                  label="주문 신청일"
                  value={formatDateTime(
                    order.createdAt,
                  )}
                />

                <DataBox
                  label="취소·환불일"
                  value={formatDateTime(
                    order.canceledAt,
                  )}
                />
              </div>
            </section>

            <section className="user-order-detail-panel">
              <PanelHeading
                eyebrow="DELIVERY INFORMATION"
                title="배송 정보"
                description={
                  hasShippingInformation
                    ? "담당자가 확인한 최종 배송 정보입니다."
                    : "배송이 준비되면 수령인과 송장 정보가 표시됩니다."
                }
              />

              <div className="user-order-data-grid">
                <DataBox
                  label="받는 분"
                  value={
                    order.recipientName ||
                    "배송 준비 전"
                  }
                />

                <DataBox
                  label="연락처"
                  value={
                    order.recipientPhone ||
                    "배송 준비 전"
                  }
                  copyValue={
                    order.recipientPhone
                  }
                />

                <DataBox
                  label="우편번호"
                  value={
                    order.postalCode ||
                    "미등록"
                  }
                />

                <DataBox
                  label="택배사"
                  value={
                    order.shippingCarrier ||
                    "배송 준비 전"
                  }
                />

                <DataBox
                  label="기본 배송지"
                  value={
                    order.shippingAddress1 ||
                    "배송 준비 전"
                  }
                  wide
                />

                <DataBox
                  label="상세 배송지"
                  value={
                    order.shippingAddress2 ||
                    "미등록"
                  }
                  wide
                />

                <DataBox
                  label="송장번호"
                  value={
                    order.trackingNumber ||
                    "발송 전"
                  }
                  copyValue={
                    order.trackingNumber
                  }
                  wide
                />

                <DataBox
                  label="배송 메모"
                  value={
                    order.shippingMemo ||
                    "배송 메모 없음"
                  }
                  wide
                />

                <DataBox
                  label="발송일"
                  value={formatDateTime(
                    order.shippedAt,
                  )}
                />

                <DataBox
                  label="제작 완료일"
                  value={formatDateTime(
                    order.completedAt,
                  )}
                />
              </div>
            </section>
          </div>

          <aside className="user-order-detail-side">
            <section className="user-order-detail-panel">
              <PanelHeading
                eyebrow="BOOK"
                title="제작하는 책"
              />

              <div className="user-order-book-card">
                <p>
                  {order.productName}
                </p>

                <h2>
                  {order.book.title}
                </h2>

                <span>
                  {order.book.subtitle ||
                    order.book.summary ||
                    "사진과 이야기로 만든 나의 스토리북"}
                </span>

                <Link
                  href={`/dashboard/library/${order.book.id}`}
                >
                  책 원고 확인
                </Link>
              </div>
            </section>

            <section className="user-order-detail-panel">
              <PanelHeading
                eyebrow="CUSTOMER"
                title="신청 정보"
              />

              <div className="user-order-side-list">
                <DataBox
                  label="신청자"
                  value={
                    order.productionRequest
                      .name ||
                    session.user.name ||
                    "이름 미등록"
                  }
                />

                <DataBox
                  label="이메일"
                  value={
                    order.productionRequest
                      .email ||
                    session.user.email ||
                    "이메일 미등록"
                  }
                  copyValue={
                    order.productionRequest
                      .email ||
                    session.user.email
                  }
                />

                <DataBox
                  label="연락처"
                  value={
                    order.productionRequest
                      .phone ||
                    "연락처 미등록"
                  }
                  copyValue={
                    order.productionRequest
                      .phone
                  }
                />

                <DataBox
                  label="제작 요청"
                  value={
                    order.productionRequest
                      .message ||
                    "작성한 제작 요청이 없습니다."
                  }
                />
              </div>
            </section>

            <section className="user-order-help">
              <strong>
                진행 내용이 궁금한가요?
              </strong>

              <p>
                제작 단계나 배송 정보에
                관한 문의는 주문번호를
                함께 알려주시면 더 빠르게
                확인할 수 있습니다.
              </p>

              <OrderValueCopyButton
                value={order.orderId}
                label="주문번호 복사"
              />
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PanelHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="user-order-panel-heading">
      <p>{eyebrow}</p>

      <h2>{title}</h2>

      {description ? (
        <span>
          {description}
        </span>
      ) : null}
    </div>
  );
}

function OverviewCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DataBox({
  label,
  value,
  copyValue,
  wide = false,
}: {
  label: string;
  value: string;
  copyValue?: string | null;
  wide?: boolean;
}) {
  return (
    <div
      className="user-order-data-box"
      data-wide={
        wide
          ? "true"
          : "false"
      }
    >
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      {copyValue ? (
        <OrderValueCopyButton
          value={copyValue}
          label={`${label} 복사`}
        />
      ) : null}
    </div>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="user-order-detail-status"
      data-status={status}
    >
      {getOrderStatusLabel(
        status,
      )}
    </span>
  );
}

function getOrderStatusLabel(
  status: string,
) {
  const labels:
    Record<string, string> = {
      READY: "결제 준비",
      PAYMENT_PENDING:
        "입금 확인 중",
      PAID: "결제 완료",
      PARTIALLY_REFUNDED:
        "부분 환불",
      REFUNDED: "전액 환불",
      CANCELED: "주문 취소",
      FAILED: "결제 재시도",
    };

  return (
    labels[status] ||
    "상태 확인 필요"
  );
}

function getProductionStageLabel(
  stage: string,
) {
  const labels:
    Record<string, string> = {
      PREPARING: "제작 준비",
      MANUSCRIPT_RECEIVED:
        "원고 접수",
      REVIEWING: "원고 검토",
      PROOFING: "교정 작업",
      PROOF_SENT: "교정본 확인",
      PROOF_APPROVED:
        "교정 승인",
      PRINT_ORDERED: "인쇄 발주",
      PRINTING: "인쇄 진행",
      SHIPPING_PREPARATION:
        "배송 준비",
      SHIPPED: "배송 중",
      COMPLETED: "제작 완료",
      ON_HOLD: "제작 보류",
    };

  return (
    labels[stage] ||
    "제작 상태 확인"
  );
}

function getProductTypeLabel(
  type: string,
) {
  const labels:
    Record<string, string> = {
      DIGITAL_MANUSCRIPT:
        "디지털 원고",
      BASIC_SOFTCOVER:
        "기본 소프트커버",
      CUSTOM_BOOK:
        "맞춤 제작 책",
    };

  return (
    labels[type] ||
    "스토리북 제작"
  );
}

function formatDateTime(
  value: Date | null,
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(value);
}

const orderDetailStyles = `
  .user-order-detail-page,
  .user-order-detail-page * {
    box-sizing: border-box;
  }

  .user-order-detail-page {
    min-height: 100vh;
    padding: 32px 24px 65px;
    color: #49342b;
  }

  .user-order-detail-page a {
    color: inherit;
    text-decoration: none;
  }

  .user-order-detail-shell {
    width: min(1280px, 100%);
    margin: 0 auto;
  }

  .user-order-detail-hero {
    padding: 29px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    border:
      1px solid
      rgba(139, 91, 69, 0.14);
    border-radius: 26px;
    background:
      linear-gradient(
        135deg,
        #fffdf9,
        #fff1e9
      );
    box-shadow:
      0 17px 40px
      rgba(97, 62, 46, 0.06);
  }

  .user-order-detail-hero p,
  .user-order-panel-heading p,
  .user-order-proof-panel p {
    margin: 0;
    color: #df6750;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .user-order-detail-badges {
    margin-top: 9px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .user-order-detail-badges > span {
    min-height: 27px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #526b89;
    background: #eaf1fa;
    font-size: 9px;
    font-weight: 900;
  }

  .user-order-detail-status[data-status="PAID"] {
    color: #376c48;
    background: #e6f3e8;
  }

  .user-order-detail-status[data-status="READY"],
  .user-order-detail-status[data-status="PAYMENT_PENDING"] {
    color: #805b19;
    background: #fff1cd;
  }

  .user-order-detail-status[data-status="FAILED"],
  .user-order-detail-status[data-status="CANCELED"],
  .user-order-detail-status[data-status="REFUNDED"],
  .user-order-detail-status[data-status="PARTIALLY_REFUNDED"] {
    color: #984a42;
    background: #ffe8e4;
  }

  .user-order-detail-hero h1 {
    margin: 9px 0 0;
    font-family:
      var(--font-display),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(32px, 5vw, 48px);
    line-height: 1.25;
    letter-spacing: -0.055em;
  }

  .user-order-detail-hero small {
    display: block;
    margin-top: 8px;
    color: #856f65;
    font-size: 10px;
  }

  .user-order-detail-hero-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .user-order-detail-hero-actions a {
    min-height: 42px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #dbbaac;
    border-radius: 11px;
    color: #76574c;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .user-order-detail-hero-actions
  .user-order-detail-payment-link {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ef7962,
        #df5d48
      );
  }

  .user-order-detail-overview {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 9px;
  }

  .user-order-detail-overview article {
    min-width: 0;
    padding: 16px;
    border: 1px solid #eadbd4;
    border-radius: 16px;
    background: #ffffff;
  }

  .user-order-detail-overview span {
    color: #927b70;
    font-size: 9px;
    font-weight: 900;
  }

  .user-order-detail-overview strong {
    display: block;
    margin-top: 6px;
    overflow-wrap: anywhere;
    font-size: 14px;
  }

  .user-order-detail-panel {
    margin-top: 15px;
    padding: 22px;
    border:
      1px solid
      rgba(139, 91, 69, 0.12);
    border-radius: 21px;
    background: #ffffff;
    box-shadow:
      0 12px 31px
      rgba(97, 62, 46, 0.045);
  }

  .user-order-panel-heading {
    margin-bottom: 18px;
  }

  .user-order-panel-heading h2,
  .user-order-proof-panel h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-display),
      "Noto Serif KR",
      serif;
    font-size: 23px;
    letter-spacing: -0.04em;
  }

  .user-order-panel-heading > span,
  .user-order-proof-panel > div > span {
    display: block;
    margin-top: 7px;
    color: #8b756b;
    font-size: 11px;
    line-height: 1.65;
  }

  .user-order-proof-panel {
    margin-top: 15px;
    padding: 22px 25px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border: 1px solid #c9b7de;
    border-radius: 20px;
    background:
      linear-gradient(
        135deg,
        #faf7ff,
        #f4effb
      );
  }

  .user-order-proof-panel > a {
    min-height: 43px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    border-radius: 11px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #8060a8,
        #68478e
      );
    font-size: 11px;
    font-weight: 900;
  }

  .user-order-detail-grid {
    display: grid;
    grid-template-columns:
      minmax(0, 1.55fr)
      minmax(300px, 0.65fr);
    gap: 15px;
  }

  .user-order-detail-main,
  .user-order-detail-side {
    min-width: 0;
  }

  .user-order-data-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .user-order-data-box {
    min-width: 0;
    padding: 13px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid #eaded8;
    border-radius: 13px;
    background: #fffcfa;
  }

  .user-order-data-box[data-wide="true"] {
    grid-column: 1 / -1;
  }

  .user-order-data-box > div {
    min-width: 0;
  }

  .user-order-data-box span,
  .user-order-data-box strong {
    display: block;
  }

  .user-order-data-box span {
    color: #937b70;
    font-size: 9px;
    font-weight: 900;
  }

  .user-order-data-box strong {
    margin-top: 5px;
    overflow-wrap: anywhere;
    color: #554139;
    font-size: 11px;
    line-height: 1.65;
  }

  .user-order-side-list {
    display: grid;
    gap: 8px;
  }

  .user-order-book-card p {
    margin: 0;
    color: #d3644f;
    font-size: 10px;
    font-weight: 900;
  }

  .user-order-book-card h2 {
    margin: 7px 0 0;
    font-family:
      var(--font-display),
      "Noto Serif KR",
      serif;
    font-size: 22px;
    letter-spacing: -0.04em;
  }

  .user-order-book-card > span {
    display: block;
    margin-top: 8px;
    color: #8a756a;
    font-size: 11px;
    line-height: 1.7;
  }

  .user-order-book-card a {
    min-height: 40px;
    margin-top: 14px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #d9b8aa;
    border-radius: 10px;
    color: #75574c;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .user-order-help {
    margin-top: 15px;
    padding: 20px;
    border: 1px solid #e5cda1;
    border-radius: 18px;
    background: #fff9e9;
  }

  .user-order-help strong {
    font-size: 14px;
  }

  .user-order-help p {
    margin: 8px 0 13px;
    color: #806d61;
    font-size: 11px;
    line-height: 1.7;
  }

  @media (max-width: 1050px) {
    .user-order-detail-overview {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .user-order-detail-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 650px) {
    .user-order-detail-page {
      padding: 20px 14px 45px;
    }

    .user-order-detail-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 23px;
    }

    .user-order-detail-hero-actions {
      justify-content: flex-start;
    }

    .user-order-detail-overview {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .user-order-proof-panel {
      align-items: stretch;
      flex-direction: column;
    }

    .user-order-proof-panel > a {
      align-self: flex-start;
    }

    .user-order-data-grid {
      grid-template-columns: 1fr;
    }

    .user-order-data-box[data-wide="true"] {
      grid-column: auto;
    }
  }

  @media (max-width: 430px) {
    .user-order-detail-overview {
      grid-template-columns: 1fr;
    }

    .user-order-detail-hero-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .user-order-detail-hero-actions a {
      justify-content: center;
    }
  }
`;