import { auth } from "@/auth";
import {
  cancelOrRefundOrder,
  syncOrderPayment,
} from "@/app/admin/orders/actions";
import AdminOrderAuditSummary from "@/components/admin/AdminOrderAuditSummary";
import AdminOrderConfirmButton from "@/components/admin/AdminOrderConfirmButton";
import CopyTextButton from "@/components/admin/CopyTextButton";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    message?: string | string[];
    error?: string | string[];
  }>;
};

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const adminUser =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
      },
    });

  if (
    adminUser?.role !== "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const query = await searchParams;

  const order =
    await prisma.bookOrder.findUnique({
      where: {
        id,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            subtitle: true,
            status: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        productionRequest: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            message: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

  if (!order) {
    notFound();
  }

  const message =
    getParam(query.message);

  const error =
    getParam(query.error);

  const paymentKeyDisplay =
    maskPaymentKey(
      order.paymentKey,
    );

  const cancelDisabled =
    [
      "CANCELED",
      "REFUNDED",
    ].includes(order.status);

  return (
    <main className="admin-order-detail-page">
      <style>
        {adminOrderDetailStyles}
      </style>

      <div className="admin-order-detail-shell">
        <header className="admin-order-detail-hero">
          <div>
            <p>
              ADMIN · ORDER DETAIL
            </p>

            <div className="admin-order-detail-badges">
              <StatusBadge
                status={order.status}
              />

              <StageBadge
                stage={
                  order.productionStage
                }
              />
            </div>

            <h1>
              {order.productName}
            </h1>

            <span>
              주문번호 {order.orderId}
            </span>
          </div>

          <div className="admin-order-detail-actions">
            <Link href="/admin/orders">
              주문 목록
            </Link>

            <Link
              href={`/admin/books/${order.book.id}`}
            >
              책 상세
            </Link>

            <Link
              href={`/admin/production-requests?q=${encodeURIComponent(
                order.orderId,
              )}`}
            >
              제작 상담
            </Link>
          </div>
        </header>

        {message ? (
          <div
            className="admin-order-detail-alert"
            data-tone="success"
          >
            {message}
          </div>
        ) : null}

        {error ? (
          <div
            className="admin-order-detail-alert"
            data-tone="error"
          >
            {error}
          </div>
        ) : null}

        <section className="admin-order-detail-overview">
          <InfoCard
            label="최종 결제금액"
            value={`${order.totalAmount.toLocaleString()}원`}
          />

          <InfoCard
            label="주문 수량"
            value={`${order.quantity.toLocaleString()}권`}
          />

          <InfoCard
            label="결제수단"
            value={
              order.paymentMethod ||
              "미등록"
            }
          />

          <InfoCard
            label="주문일"
            value={formatDateTime(
              order.createdAt,
            )}
          />

          <InfoCard
            label="최근 수정"
            value={formatDateTime(
              order.updatedAt,
            )}
          />
        </section>

        <AdminOrderAuditSummary
          orderRecordId={order.id}
          orderNumber={order.orderId}
        />

        <section className="admin-order-detail-grid">
          <div className="admin-order-detail-main">
            <Panel
              eyebrow="주문 정보"
              title="상품·금액·결제"
            >
              <div className="admin-order-detail-info-grid">
                <DataBox
                  label="주문번호"
                  value={order.orderId}
                  copyValue={
                    order.orderId
                  }
                />

                <DataBox
                  label="상품 종류"
                  value={getProductTypeLabel(
                    order.productType,
                  )}
                />

                <DataBox
                  label="상품명"
                  value={order.productName}
                />

                <DataBox
                  label="제작 사양"
                  value={
                    order.specification ||
                    "등록된 제작 사양 없음"
                  }
                  wide
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
                  label="결제키"
                  value={
                    paymentKeyDisplay ||
                    "결제키 없음"
                  }
                  copyValue={
                    order.paymentKey
                  }
                  wide
                />

                <DataBox
                  label="결제 완료일"
                  value={formatDateTime(
                    order.paidAt,
                  )}
                />

                <DataBox
                  label="취소·환불일"
                  value={formatDateTime(
                    order.canceledAt,
                  )}
                />
              </div>
            </Panel>

            <Panel
              eyebrow="제작 정보"
              title="원고·교정·인쇄 진행"
            >
              <div className="admin-order-detail-info-grid">
                <DataBox
                  label="현재 제작 단계"
                  value={getProductionStageLabel(
                    order.productionStage,
                  )}
                />

                <DataBox
                  label="단계 변경일"
                  value={formatDateTime(
                    order.productionStageUpdatedAt,
                  )}
                />

                <DataBox
                  label="원고 접수"
                  value={formatDateTime(
                    order.manuscriptReceivedAt,
                  )}
                />

                <DataBox
                  label="검토 시작"
                  value={formatDateTime(
                    order.reviewStartedAt,
                  )}
                />

                <DataBox
                  label="교정본 전달"
                  value={formatDateTime(
                    order.proofSentAt,
                  )}
                />

                <DataBox
                  label="교정 승인"
                  value={formatDateTime(
                    order.proofApprovedAt,
                  )}
                />

                <DataBox
                  label="인쇄 발주"
                  value={formatDateTime(
                    order.printOrderedAt,
                  )}
                />

                <DataBox
                  label="인쇄 완료"
                  value={formatDateTime(
                    order.printingCompletedAt,
                  )}
                />

                <DataBox
                  label="교정본 주소"
                  value={
                    order.proofFileUrl ||
                    "교정본 주소 없음"
                  }
                  copyValue={
                    order.proofFileUrl
                  }
                  wide
                />

                <DataBox
                  label="관리자 제작 메모"
                  value={
                    order.productionNote ||
                    "등록된 제작 메모 없음"
                  }
                  wide
                />
              </div>
            </Panel>

            <Panel
              eyebrow="배송 정보"
              title="수령인·주소·송장"
            >
              <div className="admin-order-detail-info-grid">
                <DataBox
                  label="수령인"
                  value={
                    order.recipientName ||
                    "미등록"
                  }
                />

                <DataBox
                  label="수령인 연락처"
                  value={
                    order.recipientPhone ||
                    "미등록"
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
                  label="기본 배송지"
                  value={
                    order.shippingAddress1 ||
                    "미등록"
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
                  label="배송 메모"
                  value={
                    order.shippingMemo ||
                    "배송 메모 없음"
                  }
                  wide
                />

                <DataBox
                  label="택배사"
                  value={
                    order.shippingCarrier ||
                    "미등록"
                  }
                />

                <DataBox
                  label="송장번호"
                  value={
                    order.trackingNumber ||
                    "미등록"
                  }
                  copyValue={
                    order.trackingNumber
                  }
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
            </Panel>
          </div>

          <aside className="admin-order-detail-side">
            <Panel
              eyebrow="고객 정보"
              title="주문자·상담 신청"
            >
              <div className="admin-order-detail-customer">
                <DataBox
                  label="고객 이름"
                  value={
                    order.productionRequest
                      .name ||
                    order.author.name ||
                    "이름 미등록"
                  }
                />

                <DataBox
                  label="고객 이메일"
                  value={
                    order.productionRequest
                      .email ||
                    order.author.email ||
                    "이메일 미등록"
                  }
                  copyValue={
                    order.productionRequest
                      .email ||
                    order.author.email
                  }
                />

                <DataBox
                  label="고객 연락처"
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
                  label="상담 상태"
                  value={getRequestStatusLabel(
                    order.productionRequest
                      .status,
                  )}
                />

                <DataBox
                  label="고객 요청"
                  value={
                    order.productionRequest
                      .message ||
                    "작성한 요청 내용 없음"
                  }
                />
              </div>
            </Panel>

            <Panel
              eyebrow="책 정보"
              title={order.book.title}
            >
              <div className="admin-order-detail-customer">
                <DataBox
                  label="책 부제"
                  value={
                    order.book.subtitle ||
                    "부제 없음"
                  }
                />

                <DataBox
                  label="책 상태"
                  value={getBookStatusLabel(
                    order.book.status,
                  )}
                />

                <DataBox
                  label="회원 이메일"
                  value={
                    order.author.email ||
                    "미등록"
                  }
                  copyValue={
                    order.author.email
                  }
                />
              </div>
            </Panel>

            <Panel
              eyebrow="결제 관리"
              title="조회·취소·환불"
            >
              <div className="admin-order-detail-action-box">
                <p>
                  토스 서버의 실제 결제
                  상태를 다시 조회해 주문
                  정보를 갱신합니다.
                </p>

                <form
                  action={
                    syncOrderPayment
                  }
                >
                  <input
                    type="hidden"
                    name="orderRecordId"
                    value={order.id}
                  />

                  <AdminOrderConfirmButton
                    label="토스 결제정보 다시 조회"
                    pendingLabel="결제정보 확인 중..."
                    confirmMessage="토스 서버에서 실제 결제상태를 다시 조회할까요?"
                  />
                </form>
              </div>

              <div
                className="admin-order-detail-action-box"
                data-danger="true"
              >
                <p>
                  미결제 주문은 취소하고,
                  결제 완료 주문은 전액
                  환불합니다.
                </p>

                <form
                  action={
                    cancelOrRefundOrder
                  }
                >
                  <input
                    type="hidden"
                    name="orderRecordId"
                    value={order.id}
                  />

                  <label>
                    <span>
                      취소·환불 사유
                    </span>

                    <textarea
                      name="cancelReason"
                      defaultValue="관리자 요청에 의한 주문 취소"
                      maxLength={200}
                    />
                  </label>

                  <AdminOrderConfirmButton
                    label={
                      order.paidAt
                        ? "전액 환불 처리"
                        : "주문 취소 처리"
                    }
                    pendingLabel="취소 처리 중..."
                    confirmMessage={
                      order.paidAt
                        ? "결제된 금액을 실제로 전액 환불합니다. 계속할까요?"
                        : "이 주문을 취소할까요?"
                    }
                    tone="danger"
                    disabled={
                      cancelDisabled
                    }
                  />
                </form>

                {cancelDisabled ? (
                  <span className="admin-order-detail-disabled-notice">
                    이미 취소 또는 환불된
                    주문입니다.
                  </span>
                ) : null}
              </div>

              <div className="admin-order-detail-warning">
                가상계좌 결제는 고객
                환불계좌 정보가 필요하므로
                토스 관리자센터에서 직접
                처리해야 합니다.
              </div>
            </Panel>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-order-detail-panel">
      <div className="admin-order-detail-panel-heading">
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>

      {children}
    </section>
  );
}

function InfoCard({
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
      className="admin-order-detail-data-box"
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
        <CopyTextButton
          value={copyValue}
          label={`${label} 복사`}
        />
      ) : null}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-order-detail-status"
      data-status={status}
    >
      {getOrderStatusLabel(status)}
    </span>
  );
}

function StageBadge({
  stage,
}: {
  stage: string;
}) {
  return (
    <span className="admin-order-detail-stage">
      {getProductionStageLabel(
        stage,
      )}
    </span>
  );
}

function getParam(
  value:
    | string
    | string[]
    | undefined,
) {
  return Array.isArray(value)
    ? value[0]?.trim() || ""
    : value?.trim() || "";
}

function maskPaymentKey(
  paymentKey: string | null,
) {
  if (!paymentKey) {
    return "";
  }

  if (paymentKey.length <= 12) {
    return paymentKey;
  }

  return `${paymentKey.slice(
    0,
    6,
  )}••••••${paymentKey.slice(-6)}`;
}

function getOrderStatusLabel(
  status: string,
) {
  const labels:
    Record<string, string> = {
      READY: "결제 준비",
      PAYMENT_PENDING:
        "결제 확인 중",
      PAID: "결제 완료",
      PARTIALLY_REFUNDED:
        "부분 환불",
      REFUNDED: "전액 환불",
      CANCELED: "주문 취소",
      FAILED: "결제 실패",
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
      PROOF_SENT: "교정본 전달",
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
    "단계 확인 필요"
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
      CUSTOM_BOOK: "맞춤 제작",
    };

  return (
    labels[type] ||
    "제작 상품"
  );
}

function getRequestStatusLabel(
  status: string,
) {
  const labels:
    Record<string, string> = {
      REQUESTED: "상담 신청 접수",
      CONTACTED: "고객 연락 완료",
      IN_PROGRESS:
        "제작 상담 진행 중",
      COMPLETED: "상담 완료",
      CANCELED: "상담 취소",
    };

  return (
    labels[status] ||
    "상담 상태 확인 필요"
  );
}

function getBookStatusLabel(
  status: string,
) {
  const labels:
    Record<string, string> = {
      DRAFT: "원고 초안",
      IN_PRODUCTION:
        "제작 준비 중",
      PUBLISHED: "완성",
    };

  return (
    labels[status] ||
    "책 상태 확인 필요"
  );
}

function formatDateTime(
  value:
    | Date
    | string
    | null,
) {
  if (!value) {
    return "-";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
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
  ).format(date);
}

const adminOrderDetailStyles = `
  .admin-order-detail-page,
  .admin-order-detail-page * {
    box-sizing: border-box;
  }

  .admin-order-detail-page {
    color: #432f26;
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-order-detail-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-order-detail-shell {
    width: min(1480px, 100%);
    margin: 0 auto;
  }

  .admin-order-detail-hero {
    padding: 27px 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border: 1px solid rgba(128, 83, 61, 0.13);
    border-radius: 24px;
    background:
      linear-gradient(
        135deg,
        #fffdf9,
        #fff4ec
      );
    box-shadow:
      0 17px 39px
      rgba(91, 58, 43, 0.06);
  }

  .admin-order-detail-hero p,
  .admin-order-detail-panel-heading p {
    margin: 0;
    color: #df6550;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.09em;
  }

  .admin-order-detail-badges {
    margin-top: 9px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-order-detail-status,
  .admin-order-detail-stage {
    min-height: 25px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #3e6388;
    background: #e8f2ff;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-order-detail-status[data-status="PAID"] {
    color: #316b43;
    background: #e5f4e8;
  }

  .admin-order-detail-status[data-status="REFUNDED"],
  .admin-order-detail-status[data-status="CANCELED"],
  .admin-order-detail-status[data-status="FAILED"],
  .admin-order-detail-status[data-status="PARTIALLY_REFUNDED"] {
    color: #984b42;
    background: #ffe8e4;
  }

  .admin-order-detail-hero h1 {
    margin: 9px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: clamp(29px, 4vw, 45px);
    line-height: 1.25;
    letter-spacing: -0.05em;
  }

  .admin-order-detail-hero > div:first-child > span {
    display: block;
    margin-top: 7px;
    color: #806b62;
    font-size: 9px;
  }

  .admin-order-detail-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .admin-order-detail-actions a {
    min-height: 40px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #d6b2a3;
    border-radius: 10px;
    color: #765449;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-order-detail-alert {
    margin-top: 14px;
    padding: 13px 15px;
    border-radius: 12px;
    font-size: 9px;
    font-weight: 800;
  }

  .admin-order-detail-alert[data-tone="success"] {
    color: #306844;
    border: 1px solid #b7d9c1;
    background: #edf8ef;
  }

  .admin-order-detail-alert[data-tone="error"] {
    color: #9a4239;
    border: 1px solid #efc1bb;
    background: #fff0ed;
  }

  .admin-order-detail-overview {
    margin-top: 14px;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-order-detail-overview article {
    min-width: 0;
    padding: 16px;
    border: 1px solid rgba(128, 83, 61, 0.12);
    border-radius: 16px;
    background: #ffffff;
  }

  .admin-order-detail-overview span {
    color: #927a70;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-order-detail-overview strong {
    display: block;
    margin-top: 6px;
    overflow-wrap: anywhere;
    font-size: 14px;
  }

  .admin-order-detail-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.55fr)
      minmax(310px, 0.65fr);
    gap: 14px;
  }

  .admin-order-detail-main,
  .admin-order-detail-side {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 14px;
  }

  .admin-order-detail-panel {
    min-width: 0;
    padding: 20px;
    border: 1px solid rgba(128, 83, 61, 0.12);
    border-radius: 20px;
    background: #ffffff;
    box-shadow:
      0 12px 28px
      rgba(91, 58, 43, 0.045);
  }

  .admin-order-detail-panel-heading {
    margin-bottom: 14px;
  }

  .admin-order-detail-panel-heading h2 {
    margin: 5px 0 0;
    overflow-wrap: anywhere;
    font-size: 20px;
  }

  .admin-order-detail-info-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-order-detail-data-box {
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

  .admin-order-detail-data-box[data-wide="true"] {
    grid-column: 1 / -1;
  }

  .admin-order-detail-data-box > div {
    min-width: 0;
  }

  .admin-order-detail-data-box span,
  .admin-order-detail-data-box strong {
    display: block;
  }

  .admin-order-detail-data-box span {
    color: #947d72;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-order-detail-data-box strong {
    margin-top: 5px;
    overflow-wrap: anywhere;
    font-size: 9px;
    line-height: 1.65;
  }

  .admin-order-detail-customer {
    display: grid;
    gap: 8px;
  }

  .admin-order-detail-action-box {
    padding: 14px;
    border: 1px solid #dfd1ca;
    border-radius: 14px;
    background: #fffaf7;
  }

  .admin-order-detail-action-box + .admin-order-detail-action-box {
    margin-top: 10px;
  }

  .admin-order-detail-action-box[data-danger="true"] {
    border-color: #efc9c4;
    background: #fff4f1;
  }

  .admin-order-detail-action-box p {
    margin: 0 0 11px;
    color: #7f6b62;
    font-size: 8px;
    line-height: 1.7;
  }

  .admin-order-detail-action-box form {
    display: grid;
    gap: 10px;
  }

  .admin-order-detail-action-box label span {
    display: block;
    margin-bottom: 5px;
    color: #7b6055;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-order-detail-action-box textarea {
    width: 100%;
    min-height: 76px;
    padding: 10px;
    resize: vertical;
    border: 1px solid #ddc6bc;
    border-radius: 10px;
    color: #4c382f;
    background: #ffffff;
    font: inherit;
    font-size: 8px;
    line-height: 1.6;
  }

  .admin-order-detail-disabled-notice {
    display: block;
    margin-top: 9px;
    color: #997c72;
    font-size: 7px;
  }

  .admin-order-detail-warning {
    margin-top: 10px;
    padding: 12px;
    border: 1px solid #ead5a4;
    border-radius: 12px;
    color: #805c19;
    background: #fff8df;
    font-size: 8px;
    line-height: 1.7;
  }

  @media (max-width: 1150px) {
    .admin-order-detail-overview {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-order-detail-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .admin-order-detail-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 22px;
    }

    .admin-order-detail-actions {
      justify-content: flex-start;
    }

    .admin-order-detail-overview {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-order-detail-info-grid {
      grid-template-columns: 1fr;
    }

    .admin-order-detail-data-box[data-wide="true"] {
      grid-column: auto;
    }
  }

  @media (max-width: 480px) {
    .admin-order-detail-overview {
      grid-template-columns: 1fr;
    }

    .admin-order-detail-actions a {
      flex: 1 1 auto;
      justify-content: center;
    }
  }
`;