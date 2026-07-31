import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic =
  "force-dynamic";

type Severity =
  | "critical"
  | "warning";

type Issue = {
  orderRecordId: string;
  orderId: string;
  bookTitle: string;
  severity: Severity;
  title: string;
  detail: string;
};

const STAGE_RANK:
  Record<string, number> = {
    PREPARING: 0,
    MANUSCRIPT_RECEIVED: 1,
    REVIEWING: 2,
    PROOFING: 3,
    PROOF_SENT: 4,
    PROOF_APPROVED: 5,
    PRINT_ORDERED: 6,
    PRINTING: 7,
    SHIPPING_PREPARATION: 8,
    SHIPPED: 9,
    COMPLETED: 10,
    ON_HOLD: -1,
  };

export default async function PhaseTwoSystemTestPage() {
  const session =
    await auth();

  const userId =
    session?.user?.id;

  if (!userId) {
    redirect(
      "/login?callbackUrl=/admin/system-test/phase-two",
    );
  }

  const admin =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

  if (
    admin?.role !==
    "ADMIN"
  ) {
    redirect(
      "/dashboard",
    );
  }

  const [
    orders,
    recentNotificationFailures,
  ] = await Promise.all([
    prisma.bookOrder.findMany({
      take: 500,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        orderId: true,
        productName: true,
        quantity: true,
        productAmount: true,
        shippingFee: true,
        totalAmount: true,
        status: true,
        paymentKey: true,
        paymentMethod: true,
        paidAt: true,
        productionStage: true,
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
        shippingCarrier: true,
        trackingNumber: true,
        shippedAt: true,
        completedAt: true,
        updatedAt: true,
        book: {
          select: {
            title: true,
            status: true,
          },
        },
        productionRequest: {
          select: {
            status: true,
          },
        },
        _count: {
          select: {
            auditLogs: true,
            proofReviews: true,
          },
        },
      },
    }),

    prisma.bookOrderAuditLog.findMany({
      where: {
        action:
          "EMAIL_FAILED",
      },
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderId: true,
        summary: true,
        createdAt: true,
      },
    }),
  ]);

  const issues =
    orders.flatMap(
      inspectOrder,
    );

  const criticalCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "critical",
    ).length;

  const warningCount =
    issues.length -
    criticalCount;

  const stageCounts =
    Array.from(
      orders.reduce(
        (map, order) => {
          const stage =
            String(
              order.productionStage,
            );

          map.set(
            stage,
            (map.get(stage) ||
              0) + 1,
          );

          return map;
        },
        new Map<string, number>(),
      ),
    ).sort(
      ([a], [b]) =>
        (STAGE_RANK[a] ?? 99) -
        (STAGE_RANK[b] ?? 99),
    );

  return (
    <main className="phase-two-page">
      <style>
        {styles}
      </style>

      <header className="phase-two-hero">
        <div>
          <p>
            PHASE 2 OPERATIONS
          </p>

          <h1>
            실제 주문 운영
            안전성 검증
          </h1>

          <span>
            결제 → 교정 승인 → 인쇄 →
            배송 → 제작 완료 과정의
            데이터와 필수 조건을 읽기
            전용으로 검사합니다.
          </span>
        </div>

        <div className="phase-two-hero-actions">
          <Link href="/admin/system-test">
            전체 테스트 센터
          </Link>

          <Link href="/admin/orders">
            주문 관리
          </Link>
        </div>
      </header>

      <section className="phase-two-summary">
        <Summary
          label="검사 주문"
          value={orders.length}
          tone="neutral"
        />

        <Summary
          label="중요 오류"
          value={criticalCount}
          tone={
            criticalCount > 0
              ? "critical"
              : "success"
          }
        />

        <Summary
          label="확인 필요"
          value={warningCount}
          tone={
            warningCount > 0
              ? "warning"
              : "success"
          }
        />

        <Summary
          label="최근 이메일 실패"
          value={
            recentNotificationFailures
              .length
          }
          tone={
            recentNotificationFailures
              .length > 0
              ? "warning"
              : "success"
          }
        />
      </section>

      <section className="phase-two-notice">
        <strong>
          운영 데이터는 자동 수정하지
          않습니다.
        </strong>

        <span>
          아래 주문별 문제를 확인한 뒤
          주문 상세 화면에서 올바른
          상태와 정보를 직접 저장해
          주세요.
        </span>
      </section>

      <section className="phase-two-section">
        <div className="phase-two-heading">
          <div>
            <p>
              DATA INTEGRITY
            </p>

            <h2>
              주문별 확인 항목
            </h2>
          </div>

          <span>
            총 {issues.length}건
          </span>
        </div>

        {issues.length > 0 ? (
          <div className="phase-two-issues">
            {issues.map(
              (issue, index) => (
                <article
                  key={`${issue.orderRecordId}-${issue.title}-${index}`}
                  data-severity={
                    issue.severity
                  }
                >
                  <div>
                    <span>
                      {issue.severity ===
                      "critical"
                        ? "중요 오류"
                        : "확인 필요"}
                    </span>

                    <h3>
                      {issue.title}
                    </h3>

                    <p>
                      {issue.detail}
                    </p>

                    <small>
                      {issue.bookTitle}
                      {" · "}
                      {issue.orderId}
                    </small>
                  </div>

                  <Link
                    href={`/admin/orders/${issue.orderRecordId}`}
                  >
                    주문 확인
                  </Link>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="phase-two-empty">
            검사된 주문에서 2단계 운영
            규칙 위반을 찾지 못했습니다.
          </div>
        )}
      </section>

      <section className="phase-two-grid">
        <article className="phase-two-section">
          <div className="phase-two-heading">
            <div>
              <p>
                STAGE DISTRIBUTION
              </p>

              <h2>
                제작 단계 분포
              </h2>
            </div>
          </div>

          <div className="phase-two-stages">
            {stageCounts.map(
              ([stage, count]) => (
                <div key={stage}>
                  <span>
                    {stage}
                  </span>

                  <strong>
                    {count}건
                  </strong>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="phase-two-section">
          <div className="phase-two-heading">
            <div>
              <p>
                NOTIFICATION
              </p>

              <h2>
                최근 알림 실패
              </h2>
            </div>
          </div>

          {recentNotificationFailures
            .length > 0 ? (
            <div className="phase-two-failures">
              {recentNotificationFailures.map(
                (failure) => (
                  <div key={failure.id}>
                    <strong>
                      {failure.summary}
                    </strong>

                    <span>
                      주문 내부 ID:{" "}
                      {failure.orderId}
                    </span>

                    <small>
                      {formatDateTime(
                        failure.createdAt,
                      )}
                    </small>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="phase-two-empty">
              기록된 이메일 발송 실패가
              없습니다.
            </div>
          )}
        </article>
      </section>

      <section className="phase-two-command">
        <div>
          <p>
            POWERSHELL
          </p>

          <h2>
            2단계 전체 검사 명령
          </h2>

          <span>
            정책 검사, 코드 연결 검사,
            운영 DB 읽기 검사를 한 번에
            실행합니다.
          </span>
        </div>

        <code>
          pnpm test:phase2:all
        </code>
      </section>
    </main>
  );
}

function inspectOrder(
  order: {
    id: string;
    orderId: string;
    productName: string;
    quantity: number;
    productAmount: number;
    shippingFee: number;
    totalAmount: number;
    status: unknown;
    paymentKey: string | null;
    paymentMethod: string | null;
    paidAt: Date | null;
    productionStage: unknown;
    manuscriptReceivedAt: Date | null;
    reviewStartedAt: Date | null;
    proofFileUrl: string | null;
    proofSentAt: Date | null;
    proofApprovedAt: Date | null;
    printOrderedAt: Date | null;
    printingCompletedAt: Date | null;
    recipientName: string | null;
    recipientPhone: string | null;
    postalCode: string | null;
    shippingAddress1: string | null;
    shippingCarrier: string | null;
    trackingNumber: string | null;
    shippedAt: Date | null;
    completedAt: Date | null;
    updatedAt: Date;
    book: {
      title: string;
      status: unknown;
    };
    productionRequest: {
      status: unknown;
    };
    _count: {
      auditLogs: number;
      proofReviews: number;
    };
  },
): Issue[] {
  const result: Issue[] =
    [];

  const stage =
    String(
      order.productionStage,
    );

  const status =
    String(order.status);

  const rank =
    STAGE_RANK[stage] ?? 0;

  const push = (
    severity: Severity,
    title: string,
    detail: string,
  ) => {
    result.push({
      orderRecordId:
        order.id,
      orderId:
        order.orderId,
      bookTitle:
        order.book.title ||
        order.productName,
      severity,
      title,
      detail,
    });
  };

  if (
    order.totalAmount !==
    order.productAmount +
      order.shippingFee
  ) {
    push(
      "critical",
      "주문 금액 합계 불일치",
      `상품 ${order.productAmount.toLocaleString()}원 + 배송비 ${order.shippingFee.toLocaleString()}원이 최종 결제금액 ${order.totalAmount.toLocaleString()}원과 일치하지 않습니다.`,
    );
  }

  if (
    order.quantity < 1 ||
    order.totalAmount < 100
  ) {
    push(
      "critical",
      "수량 또는 결제금액 오류",
      "수량은 1권 이상, 최종 결제금액은 100원 이상이어야 합니다.",
    );
  }

  if (
    status === "PAID" &&
    (
      !order.paidAt ||
      !order.paymentKey
    )
  ) {
    push(
      "critical",
      "결제 완료 정보 누락",
      "PAID 주문에는 결제 승인 시각과 결제키가 모두 있어야 합니다.",
    );
  }

  if (
    rank >= 1 &&
    status !== "PAID"
  ) {
    push(
      "critical",
      "결제 완료 전 제작 진행",
      `결제 상태가 ${status}인데 제작 단계가 ${stage}입니다.`,
    );
  }

  if (
    rank >= 1 &&
    !order.manuscriptReceivedAt
  ) {
    push(
      "critical",
      "원고 접수일 누락",
      "원고 접수 이후 단계인데 원고 접수일이 없습니다.",
    );
  }

  if (
    rank >= 4 &&
    (
      !order.proofFileUrl ||
      !order.proofSentAt
    )
  ) {
    push(
      "critical",
      "교정본 전달 정보 누락",
      "교정본 전달 이후 단계에는 교정 파일과 전달 시각이 필요합니다.",
    );
  }

  if (
    rank >= 5 &&
    !order.proofApprovedAt
  ) {
    push(
      "critical",
      "교정 승인 시각 누락",
      "교정 승인 이후 단계인데 고객 승인 시각이 없습니다.",
    );
  }

  if (
    rank >= 6 &&
    !order.printOrderedAt
  ) {
    push(
      "critical",
      "인쇄 발주일 누락",
      "인쇄 발주 이후 단계인데 인쇄 발주일이 없습니다.",
    );
  }

  if (
    rank >= 8 &&
    !order.printingCompletedAt
  ) {
    push(
      "critical",
      "인쇄 완료일 누락",
      "배송 준비 이후 단계인데 인쇄 완료일이 없습니다.",
    );
  }

  if (
    rank >= 8 &&
    (
      !cleanText(
        order.recipientName,
      ) ||
      !cleanText(
        order.recipientPhone,
      ) ||
      !cleanText(
        order.postalCode,
      ) ||
      !cleanText(
        order.shippingAddress1,
      )
    )
  ) {
    push(
      "critical",
      "배송지 정보 누락",
      "배송 준비 이후 단계에는 수령인·연락처·우편번호·주소가 모두 필요합니다.",
    );
  }

  if (
    rank >= 9 &&
    (
      !cleanText(
        order.shippingCarrier,
      ) ||
      !cleanText(
        order.trackingNumber,
      ) ||
      !order.shippedAt
    )
  ) {
    push(
      "critical",
      "택배 발송 정보 누락",
      "배송 중 이후 단계에는 택배사·송장번호·발송일이 모두 필요합니다.",
    );
  }

  if (
    rank >= 10 &&
    !order.completedAt
  ) {
    push(
      "critical",
      "제작 완료 시각 누락",
      "제작 완료 단계인데 완료 시각이 없습니다.",
    );
  }

  if (
    stage === "COMPLETED" &&
    String(order.book.status) !==
      "PUBLISHED"
  ) {
    push(
      "warning",
      "책 상태 동기화 필요",
      `주문은 완료됐지만 책 상태가 ${String(
        order.book.status,
      )}입니다.`,
    );
  }

  if (
    stage === "COMPLETED" &&
    String(
      order.productionRequest
        .status,
    ) !== "COMPLETED"
  ) {
    push(
      "warning",
      "상담 상태 동기화 필요",
      `주문은 완료됐지만 제작 상담 상태가 ${String(
        order.productionRequest
          .status,
      )}입니다.`,
    );
  }

  if (
    order._count.auditLogs ===
    0
  ) {
    push(
      "warning",
      "처리 이력 없음",
      "주문에 처리 이력이 한 건도 없습니다. 생성·결제·제작 변경 기록을 확인해 주세요.",
    );
  }

  if (
    stage ===
      "PROOF_APPROVED" &&
    order._count.proofReviews ===
      0
  ) {
    push(
      "warning",
      "교정 응답 기록 없음",
      "교정 승인 단계이지만 고객 교정 응답 기록이 없습니다.",
    );
  }

  return result;
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone:
    | "neutral"
    | "success"
    | "warning"
    | "critical";
}) {
  return (
    <article data-tone={tone}>
      <span>
        {label}
      </span>

      <strong>
        {value.toLocaleString()}
        <small>건</small>
      </strong>
    </article>
  );
}

function cleanText(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function formatDateTime(
  value: Date,
) {
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

const styles = `
  .phase-two-page,
  .phase-two-page * {
    box-sizing: border-box;
  }

  .phase-two-page {
    width: min(1320px, 100%);
    margin: 0 auto;
    padding: 28px;
    color: #4d3b33;
  }

  .phase-two-page a {
    color: inherit;
    text-decoration: none;
  }

  .phase-two-hero {
    padding: clamp(28px, 5vw, 52px);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 28px;
    border: 1px solid #eadbd3;
    border-radius: 28px;
    background:
      radial-gradient(
        circle at 85% 10%,
        rgba(255, 201, 169, .55),
        transparent 34%
      ),
      linear-gradient(
        145deg,
        #fff8f2,
        #fffdfb
      );
    box-shadow:
      0 20px 55px
      rgba(95, 58, 42, .075);
  }

  .phase-two-hero p,
  .phase-two-heading p,
  .phase-two-command p {
    margin: 0;
    color: #df6550;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .11em;
  }

  .phase-two-hero h1 {
    margin: 9px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(35px, 5vw, 58px);
    line-height: 1.18;
    letter-spacing: -.06em;
  }

  .phase-two-hero > div:first-child > span {
    max-width: 700px;
    margin-top: 17px;
    display: block;
    color: #816e64;
    font-size: 16.8px;
    line-height: 1.8;
  }

  .phase-two-hero-actions {
    display: flex;
    gap: 8px;
  }

  .phase-two-hero-actions a {
    min-height: 43px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #d9c1b5;
    border-radius: 12px;
    background: #fff;
    font-size: 10.8px;
    font-weight: 900;
    white-space: nowrap;
  }

  .phase-two-summary {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .phase-two-summary article {
    padding: 19px;
    border: 1px solid #eadfd9;
    border-radius: 17px;
    background: #fff;
  }

  .phase-two-summary article[data-tone="success"] {
    background: #edf7f0;
  }

  .phase-two-summary article[data-tone="warning"] {
    background: #fff3d6;
  }

  .phase-two-summary article[data-tone="critical"] {
    background: #ffebe8;
  }

  .phase-two-summary span {
    color: #8b756a;
    font-size: 10px;
    font-weight: 800;
  }

  .phase-two-summary strong {
    margin-top: 8px;
    display: block;
    font-size: 28px;
  }

  .phase-two-summary small {
    margin-left: 3px;
    font-size: 10px;
  }

  .phase-two-notice {
    margin-top: 17px;
    padding: 17px 20px;
    border: 1px solid #e9cf91;
    border-radius: 15px;
    color: #78561b;
    background: #fff8df;
  }

  .phase-two-notice strong,
  .phase-two-notice span {
    display: block;
  }

  .phase-two-notice strong {
    font-size: 14.4px;
  }

  .phase-two-notice span {
    margin-top: 5px;
    font-size: 12px;
    line-height: 1.7;
  }

  .phase-two-section {
    margin-top: 17px;
    padding: 25px;
    border: 1px solid #eadfd9;
    border-radius: 23px;
    background: #fff;
    box-shadow:
      0 13px 36px
      rgba(95, 58, 42, .045);
  }

  .phase-two-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .phase-two-heading h2 {
    margin: 6px 0 0;
    font-size: 23px;
    letter-spacing: -.04em;
  }

  .phase-two-heading > span {
    color: #8b756a;
    font-size: 12px;
    font-weight: 800;
  }

  .phase-two-issues,
  .phase-two-failures {
    margin-top: 18px;
    display: grid;
    gap: 9px;
  }

  .phase-two-issues article {
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border: 1px solid #eadfd9;
    border-radius: 15px;
  }

  .phase-two-issues article[data-severity="critical"] {
    border-color: #efc1bb;
    background: #fff5f3;
  }

  .phase-two-issues article[data-severity="warning"] {
    border-color: #ecd69f;
    background: #fffaf0;
  }

  .phase-two-issues article > div {
    min-width: 0;
  }

  .phase-two-issues article > div > span {
    color: #d45f50;
    font-size: 9.6px;
    font-weight: 900;
    letter-spacing: .08em;
  }

  .phase-two-issues h3 {
    margin: 5px 0 0;
    font-size: 15px;
  }

  .phase-two-issues p {
    margin: 5px 0 0;
    color: #7e6a60;
    font-size: 12px;
    line-height: 1.65;
  }

  .phase-two-issues small {
    margin-top: 6px;
    display: block;
    color: #a08b80;
    font-size: 10.8px;
  }

  .phase-two-issues article > a {
    min-height: 39px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    border-radius: 10px;
    color: #fff;
    background: #76564b;
    font-size: 9.6px;
    font-weight: 900;
    white-space: nowrap;
  }

  .phase-two-empty {
    margin-top: 18px;
    padding: 24px;
    border-radius: 14px;
    color: #7c6a61;
    background: #f8f3f0;
    font-size: 12px;
    text-align: center;
  }

  .phase-two-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 17px;
  }

  .phase-two-stages {
    margin-top: 18px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .phase-two-stages div,
  .phase-two-failures div {
    padding: 13px;
    border: 1px solid #eadfd9;
    border-radius: 12px;
    background: #fffcfa;
  }

  .phase-two-stages span,
  .phase-two-stages strong {
    display: block;
  }

  .phase-two-stages span {
    color: #8b756a;
    font-size: 9.6px;
    font-weight: 900;
  }

  .phase-two-stages strong {
    margin-top: 6px;
    font-size: 15px;
  }

  .phase-two-failures strong,
  .phase-two-failures span,
  .phase-two-failures small {
    display: block;
  }

  .phase-two-failures strong {
    font-size: 13.2px;
  }

  .phase-two-failures span,
  .phase-two-failures small {
    margin-top: 5px;
    color: #8b756a;
    font-size: 9.6px;
  }

  .phase-two-command {
    margin-top: 17px;
    padding: 25px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    border-radius: 23px;
    color: #fff;
    background:
      linear-gradient(
        135deg,
        #5a4035,
        #77574b
      );
  }

  .phase-two-command p {
    color: #ffc7b9;
  }

  .phase-two-command h2 {
    margin: 6px 0 0;
    font-size: 22px;
  }

  .phase-two-command span {
    margin-top: 7px;
    display: block;
    color: rgba(255, 255, 255, .74);
    font-size: 12px;
  }

  .phase-two-command code {
    padding: 15px 18px;
    border: 1px solid rgba(255, 255, 255, .2);
    border-radius: 13px;
    background: rgba(0, 0, 0, .18);
    font-size: 14.4px;
    font-weight: 800;
    white-space: nowrap;
  }

  @media (max-width: 900px) {
    .phase-two-summary {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .phase-two-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .phase-two-page {
      padding: 14px;
    }

    .phase-two-hero,
    .phase-two-command {
      align-items: stretch;
      flex-direction: column;
    }

    .phase-two-hero-actions {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .phase-two-hero-actions a {
      justify-content: center;
    }

    .phase-two-issues article {
      align-items: stretch;
      flex-direction: column;
    }

    .phase-two-issues article > a {
      min-height: 44px;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .phase-two-summary,
    .phase-two-stages {
      grid-template-columns: 1fr;
    }
  }
`;
