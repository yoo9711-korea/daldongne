import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic =
  "force-dynamic";

type Metric = {
  label: string;
  value: number | null;
  description: string;
};

type StatusCount = {
  name: string;
  count: number;
};

const FLOW_STEPS = [
  {
    number: 1,
    title: "회원가입",
    description:
      "새 고객 계정을 만들고 로그인 가능한지 확인합니다.",
    customerHref:
      "/register",
    adminHref:
      "/admin/users",
    expected:
      "회원 목록에 새 계정이 표시되고 로그인할 수 있어야 합니다.",
  },
  {
    number: 2,
    title: "로그인",
    description:
      "일반 로그인과 Google 로그인 후 작업실로 이동하는지 확인합니다.",
    customerHref:
      "/login",
    adminHref:
      "/admin/users",
    expected:
      "로그인 후 /dashboard로 이동하고 로그아웃도 정상 작동해야 합니다.",
  },
  {
    number: 3,
    title: "사진 등록",
    description:
      "사진과 제목, 날짜, 설명을 등록하고 수정·삭제를 확인합니다.",
    customerHref:
      "/dashboard/timeline",
    adminHref:
      "/admin/users",
    expected:
      "등록한 사진이 다시 접속해도 남아 있고 이미지가 정상 표시되어야 합니다.",
  },
  {
    number: 4,
    title: "이야기 등록",
    description:
      "자유 이야기와 사진 이야기를 작성하고 AI 다듬기를 확인합니다.",
    customerHref:
      "/dashboard/interview",
    adminHref:
      "/admin/users",
    expected:
      "작성 내용이 저장되고 수정·삭제 후 화면과 데이터가 일치해야 합니다.",
  },
  {
    number: 5,
    title: "책 원고 생성",
    description:
      "사진과 이야기를 선택해 AI 책 원고를 생성합니다.",
    customerHref:
      "/dashboard/book",
    adminHref:
      "/admin/books",
    expected:
      "중복 생성 없이 원고가 완성되고 내 책장에 한 권만 저장되어야 합니다.",
  },
  {
    number: 6,
    title: "내 책장과 PDF",
    description:
      "책 상세, 원고, 사진, 인쇄용 화면을 확인합니다.",
    customerHref:
      "/dashboard/library",
    adminHref:
      "/admin/books",
    expected:
      "책 제목·페이지·사진·원고가 상세 화면과 PDF 화면에서 일치해야 합니다.",
  },
  {
    number: 7,
    title: "제작 상담",
    description:
      "제작 상담 신청과 수정·취소·재신청을 확인합니다.",
    customerHref:
      "/dashboard/library",
    adminHref:
      "/admin/production-requests",
    expected:
      "고객 요청과 관리자 상담 목록의 책·연락처·상태가 일치해야 합니다.",
  },
  {
    number: 8,
    title: "주문과 견적",
    description:
      "관리자가 상품, 수량, 배송비와 최종 결제금액을 확정합니다.",
    customerHref:
      "/dashboard/orders",
    adminHref:
      "/admin/orders",
    expected:
      "고객 주문 화면과 관리자 주문 화면의 주문번호·금액이 같아야 합니다.",
  },
  {
    number: 9,
    title: "결제",
    description:
      "토스 결제 후 주문 상태, 결제수단, 승인 시각과 이메일을 확인합니다.",
    customerHref:
      "/dashboard/orders",
    adminHref:
      "/admin/orders",
    expected:
      "결제금액 검증 후 PAID가 되고 결제 완료 이메일과 처리 이력이 남아야 합니다.",
  },
  {
    number: 10,
    title: "교정본 확인",
    description:
      "관리자 교정본 전달과 고객 승인·수정 요청을 확인합니다.",
    customerHref:
      "/dashboard/orders",
    adminHref:
      "/admin/proof-reviews",
    expected:
      "교정본 회차와 고객 응답이 관리자 화면 및 처리 이력에 표시되어야 합니다.",
  },
  {
    number: 11,
    title: "인쇄와 배송",
    description:
      "인쇄 발주, 인쇄 진행, 배송 준비와 송장 등록을 확인합니다.",
    customerHref:
      "/dashboard/orders",
    adminHref:
      "/admin/orders",
    expected:
      "SHIPPED 단계에는 택배사·송장번호·발송일이 모두 있어야 합니다.",
  },
  {
    number: 12,
    title: "제작 완료",
    description:
      "배송 완료와 제작 완료 처리, 고객 화면과 이메일을 확인합니다.",
    customerHref:
      "/dashboard/orders",
    adminHref:
      "/admin/order-audit",
    expected:
      "COMPLETED 단계와 완료 시각이 저장되고 모든 변경 이력이 남아야 합니다.",
  },
] as const;

async function safeCount(
  query: () => Promise<number>,
) {
  try {
    return await query();
  } catch (error) {
    console.error(
      "[SYSTEM_TEST_COUNT_ERROR]",
      error,
    );

    return null;
  }
}

async function getStatusCounts(
  field:
    | "status"
    | "productionStage",
): Promise<StatusCount[]> {
  try {
    const rows =
      field === "status"
        ? await prisma.bookOrder.groupBy({
            by: ["status"],
            _count: {
              _all: true,
            },
            orderBy: {
              status: "asc",
            },
          })
        : await prisma.bookOrder.groupBy({
            by: [
              "productionStage",
            ],
            _count: {
              _all: true,
            },
            orderBy: {
              productionStage:
                "asc",
            },
          });

    return rows.map(
      (row) => ({
        name:
          field === "status"
            ? String(
                "status" in row
                  ? row.status
                  : "",
              )
            : String(
                "productionStage" in
                  row
                  ? row.productionStage
                  : "",
              ),
        count:
          row._count._all,
      }),
    );
  } catch (error) {
    console.error(
      "[SYSTEM_TEST_GROUP_ERROR]",
      error,
    );

    return [];
  }
}

export default async function SystemTestPage() {
  const [
    userCount,
    memoryCount,
    bookCount,
    productionRequestCount,
    orderCount,
    proofReviewCount,
    auditCount,
    paidWithoutDate,
    shippedWithoutTracking,
    completedWithoutDate,
    orderStatuses,
    productionStages,
  ] = await Promise.all([
    safeCount(
      () =>
        prisma.user.count(),
    ),
    safeCount(
      () =>
        prisma.memory.count(),
    ),
    safeCount(
      () =>
        prisma.book.count(),
    ),
    safeCount(
      () =>
        prisma.bookProductionRequest.count(),
    ),
    safeCount(
      () =>
        prisma.bookOrder.count(),
    ),
    safeCount(
      () =>
        prisma.bookOrderProofReview.count(),
    ),
    safeCount(
      () =>
        prisma.bookOrderAuditLog.count(),
    ),
    safeCount(
      () =>
        prisma.bookOrder.count({
          where: {
            status: "PAID",
            paidAt: null,
          },
        }),
    ),
    safeCount(
      () =>
        prisma.bookOrder.count({
          where: {
            productionStage:
              "SHIPPED",
            OR: [
              {
                shippingCarrier:
                  null,
              },
              {
                shippingCarrier:
                  "",
              },
              {
                trackingNumber:
                  null,
              },
              {
                trackingNumber:
                  "",
              },
            ],
          },
        }),
    ),
    safeCount(
      () =>
        prisma.bookOrder.count({
          where: {
            productionStage:
              "COMPLETED",
            completedAt: null,
          },
        }),
    ),
    getStatusCounts(
      "status",
    ),
    getStatusCounts(
      "productionStage",
    ),
  ]);

  const metrics: Metric[] = [
    {
      label: "회원",
      value: userCount,
      description:
        "가입된 고객과 관리자",
    },
    {
      label: "사진·이야기",
      value: memoryCount,
      description:
        "등록된 기록 자료",
    },
    {
      label: "책 원고",
      value: bookCount,
      description:
        "생성된 책과 원고",
    },
    {
      label: "제작 상담",
      value:
        productionRequestCount,
      description:
        "고객 제작 요청",
    },
    {
      label: "주문",
      value: orderCount,
      description:
        "결제·제작 주문",
    },
    {
      label: "교정 응답",
      value: proofReviewCount,
      description:
        "승인과 수정 요청",
    },
    {
      label: "처리 이력",
      value: auditCount,
      description:
        "주문 변경 기록",
    },
  ];

  const anomalies = [
    {
      label:
        "결제 완료인데 승인 시각 없음",
      value:
        paidWithoutDate,
    },
    {
      label:
        "배송 중인데 택배사·송장 누락",
      value:
        shippedWithoutTracking,
    },
    {
      label:
        "제작 완료인데 완료 시각 없음",
      value:
        completedWithoutDate,
    },
  ];

  const anomalyTotal =
    anomalies.reduce(
      (sum, item) =>
        sum +
        (item.value || 0),
      0,
    );

  return (
    <main className="system-test-page">
      <style>
        {systemTestStyles}
      </style>

      <header className="system-test-hero">
        <div>
          <p>
            CUSTOMER FLOW TEST
          </p>

          <h1>
            고객 전체 흐름
            통합 테스트
          </h1>

          <span>
            회원가입부터 사진·이야기,
            원고, 주문, 결제, 교정,
            인쇄와 배송 완료까지 한
            화면에서 점검합니다.
          </span>
        </div>

        <div
          className="system-test-result"
          data-tone={
            anomalyTotal > 0
              ? "warning"
              : "success"
          }
        >
          <strong>
            {anomalyTotal > 0
              ? `${anomalyTotal}건 확인 필요`
              : "데이터 이상 없음"}
          </strong>

          <span>
            읽기 전용 자동 검사 결과
          </span>
        </div>
      </header>

      <section className="system-test-metrics">
        {metrics.map(
          (metric) => (
            <article
              key={metric.label}
            >
              <span>
                {metric.label}
              </span>

              <strong>
                {metric.value ===
                null
                  ? "확인 불가"
                  : metric.value.toLocaleString()}
              </strong>

              <small>
                {metric.description}
              </small>
            </article>
          ),
        )}
      </section>

      <section className="system-test-section">
        <div className="system-test-heading">
          <div>
            <p>
              DATA INTEGRITY
            </p>

            <h2>
              주요 데이터 이상 검사
            </h2>
          </div>

          <Link href="/admin/order-audit">
            전체 처리 이력
            <span aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className="system-test-anomalies">
          {anomalies.map(
            (item) => (
              <article
                key={item.label}
                data-tone={
                  (item.value || 0) >
                  0
                    ? "warning"
                    : "success"
                }
              >
                <span>
                  {item.label}
                </span>

                <strong>
                  {item.value ===
                  null
                    ? "확인 불가"
                    : `${item.value}건`}
                </strong>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="system-test-section">
        <div className="system-test-heading">
          <div>
            <p>
              ORDER STATUS
            </p>

            <h2>
              주문 상태 분포
            </h2>
          </div>

          <Link href="/admin/orders">
            주문 관리
            <span aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <StatusGrid
          items={orderStatuses}
          emptyText="등록된 주문 상태가 없습니다."
        />
      </section>

      <section className="system-test-section">
        <div className="system-test-heading">
          <div>
            <p>
              PRODUCTION STAGE
            </p>

            <h2>
              제작 단계 분포
            </h2>
          </div>
        </div>

        <StatusGrid
          items={productionStages}
          emptyText="등록된 제작 단계가 없습니다."
        />
      </section>

      <section className="system-test-section">
        <div className="system-test-heading">
          <div>
            <p>
              12 STEP CHECKLIST
            </p>

            <h2>
              실제 고객 테스트 순서
            </h2>

            <span>
              테스트 계정 하나와 테스트용
              사진 3장 이상을 준비해 아래
              순서대로 확인합니다.
            </span>
          </div>
        </div>

        <ol className="system-test-flow">
          {FLOW_STEPS.map(
            (step) => (
              <li key={step.number}>
                <div className="system-test-step-number">
                  {step.number}
                </div>

                <div className="system-test-step-copy">
                  <h3>
                    {step.title}
                  </h3>

                  <p>
                    {step.description}
                  </p>

                  <small>
                    정상 기준:{" "}
                    {step.expected}
                  </small>
                </div>

                <div className="system-test-step-actions">
                  <Link
                    href={
                      step.customerHref
                    }
                  >
                    고객 화면
                  </Link>

                  <Link
                    href={
                      step.adminHref
                    }
                  >
                    관리자 확인
                  </Link>
                </div>
              </li>
            ),
          )}
        </ol>
      </section>

      <section className="system-test-command">
        <div>
          <p>
            AUTOMATED COMMANDS
          </p>

          <h2>
            코드·데이터·운영 주소
            자동 검사
          </h2>

          <span>
            프로젝트 루트의 PowerShell에서
            아래 명령을 실행하면 보고서가
            자동 생성됩니다.
          </span>
        </div>

        <pre>
          <code>
            pnpm test:flow:all
          </code>
        </pre>
      </section>
    </main>
  );
}

function StatusGrid({
  items,
  emptyText,
}: {
  items: StatusCount[];
  emptyText: string;
}) {
  if (
    items.length === 0
  ) {
    return (
      <div className="system-test-empty">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="system-test-status-grid">
      {items.map(
        (item) => (
          <article key={item.name}>
            <span>
              {item.name}
            </span>

            <strong>
              {item.count.toLocaleString()}
              <small>건</small>
            </strong>
          </article>
        ),
      )}
    </div>
  );
}

const systemTestStyles = `
  .system-test-page,
  .system-test-page * {
    box-sizing: border-box;
  }

  .system-test-page {
    width: min(1320px, 100%);
    margin: 0 auto;
    padding: 28px;
    color: #4d3b33;
  }

  .system-test-page a {
    color: inherit;
    text-decoration: none;
  }

  .system-test-hero {
    padding: clamp(28px, 5vw, 52px);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 30px;
    border: 1px solid #eadbd3;
    border-radius: 28px;
    background:
      radial-gradient(
        circle at 85% 12%,
        rgba(255, 204, 177, 0.56),
        transparent 34%
      ),
      linear-gradient(
        145deg,
        #fff9f4,
        #fffdfb
      );
    box-shadow:
      0 20px 55px
      rgba(95, 58, 42, 0.075);
  }

  .system-test-hero p,
  .system-test-heading p,
  .system-test-command p {
    margin: 0;
    color: #df6550;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.11em;
  }

  .system-test-hero h1 {
    margin: 9px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(35px, 5vw, 58px);
    line-height: 1.18;
    letter-spacing: -0.06em;
  }

  .system-test-hero > div:first-child > span {
    max-width: 700px;
    margin-top: 17px;
    display: block;
    color: #816e64;
    font-size: 16.8px;
    line-height: 1.8;
  }

  .system-test-result {
    min-width: 190px;
    padding: 19px;
    border-radius: 18px;
  }

  .system-test-result[data-tone="success"] {
    color: #39634b;
    background: #e8f5ec;
  }

  .system-test-result[data-tone="warning"] {
    color: #8b5a17;
    background: #fff1c9;
  }

  .system-test-result strong,
  .system-test-result span {
    display: block;
  }

  .system-test-result strong {
    font-size: 19px;
  }

  .system-test-result span {
    margin-top: 6px;
    font-size: 12px;
  }

  .system-test-metrics {
    margin-top: 18px;
    display: grid;
    grid-template-columns:
      repeat(7, minmax(0, 1fr));
    gap: 10px;
  }

  .system-test-metrics article,
  .system-test-status-grid article {
    padding: 18px;
    border: 1px solid #eadfd9;
    border-radius: 17px;
    background: #ffffff;
  }

  .system-test-metrics span,
  .system-test-status-grid span {
    display: block;
    color: #8b756a;
    font-size: 10px;
    font-weight: 800;
  }

  .system-test-metrics strong,
  .system-test-status-grid strong {
    margin-top: 8px;
    display: block;
    color: #4d3b33;
    font-size: 25px;
  }

  .system-test-metrics small {
    margin-top: 5px;
    display: block;
    color: #a18e84;
    font-size: 9px;
    line-height: 1.5;
  }

  .system-test-section {
    margin-top: 18px;
    padding: 25px;
    border: 1px solid #eadfd9;
    border-radius: 23px;
    background: #ffffff;
    box-shadow:
      0 13px 36px
      rgba(95, 58, 42, 0.045);
  }

  .system-test-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
  }

  .system-test-heading h2,
  .system-test-command h2 {
    margin: 6px 0 0;
    font-size: 23px;
    letter-spacing: -0.04em;
  }

  .system-test-heading > div > span,
  .system-test-command > div > span {
    margin-top: 7px;
    display: block;
    color: #8b756a;
    font-size: 12px;
  }

  .system-test-heading > a {
    min-height: 40px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    border: 1px solid #dec8bd;
    border-radius: 11px;
    color: #76564b;
    font-size: 10.8px;
    font-weight: 900;
  }

  .system-test-anomalies {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .system-test-anomalies article {
    padding: 16px;
    border-radius: 14px;
  }

  .system-test-anomalies article[data-tone="success"] {
    color: #3e684d;
    background: #edf7f0;
  }

  .system-test-anomalies article[data-tone="warning"] {
    color: #8c5a19;
    background: #fff2ce;
  }

  .system-test-anomalies span,
  .system-test-anomalies strong {
    display: block;
  }

  .system-test-anomalies span {
    font-size: 12px;
    font-weight: 800;
  }

  .system-test-anomalies strong {
    margin-top: 7px;
    font-size: 19px;
  }

  .system-test-status-grid {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .system-test-status-grid strong small {
    margin-left: 3px;
    font-size: 12px;
  }

  .system-test-empty {
    margin-top: 17px;
    padding: 25px;
    border-radius: 14px;
    color: #8b756a;
    background: #f8f3f0;
    font-size: 13.2px;
    text-align: center;
  }

  .system-test-flow {
    margin: 21px 0 0;
    padding: 0;
    display: grid;
    gap: 9px;
    list-style: none;
  }

  .system-test-flow li {
    min-width: 0;
    padding: 15px;
    display: grid;
    grid-template-columns:
      42px minmax(0, 1fr) auto;
    align-items: center;
    gap: 15px;
    border: 1px solid #eadfd9;
    border-radius: 15px;
    background: #fffcfa;
  }

  .system-test-step-number {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ed7a65,
        #d95c4c
      );
    font-size: 16.8px;
    font-weight: 900;
  }

  .system-test-step-copy {
    min-width: 0;
  }

  .system-test-step-copy h3 {
    margin: 0;
    font-size: 15px;
  }

  .system-test-step-copy p {
    margin: 5px 0 0;
    color: #806d63;
    font-size: 12px;
    line-height: 1.6;
  }

  .system-test-step-copy small {
    margin-top: 5px;
    display: block;
    color: #9a8277;
    font-size: 10.8px;
    line-height: 1.6;
  }

  .system-test-step-actions {
    display: flex;
    gap: 7px;
  }

  .system-test-step-actions a {
    min-height: 37px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #dec8bd;
    border-radius: 10px;
    color: #76564b;
    background: #ffffff;
    font-size: 9.6px;
    font-weight: 900;
    white-space: nowrap;
  }

  .system-test-step-actions a:first-child {
    border-color: transparent;
    color: #ffffff;
    background: #77574b;
  }

  .system-test-command {
    margin-top: 18px;
    padding: 25px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    border-radius: 23px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #5a4035,
        #77574b
      );
  }

  .system-test-command p {
    color: #ffc7b9;
  }

  .system-test-command > div > span {
    color: rgba(255, 255, 255, 0.75);
  }

  .system-test-command pre {
    margin: 0;
    padding: 15px 18px;
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 13px;
    background: rgba(0, 0, 0, 0.18);
  }

  .system-test-command code {
    color: #ffffff;
    font-size: 14.4px;
    font-weight: 800;
    white-space: nowrap;
  }

  @media (max-width: 1120px) {
    .system-test-metrics {
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
    }

    .system-test-status-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 780px) {
    .system-test-page {
      padding: 14px;
    }

    .system-test-hero,
    .system-test-command {
      align-items: stretch;
      flex-direction: column;
    }

    .system-test-result {
      min-width: 0;
    }

    .system-test-metrics {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .system-test-anomalies,
    .system-test-status-grid {
      grid-template-columns: 1fr;
    }

    .system-test-flow li {
      grid-template-columns:
        42px minmax(0, 1fr);
    }

    .system-test-step-actions {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .system-test-step-actions a {
      min-height: 44px;
    }
  }

  @media (max-width: 460px) {
    .system-test-metrics {
      grid-template-columns: 1fr;
    }

    .system-test-heading {
      align-items: stretch;
      flex-direction: column;
    }

    .system-test-heading > a {
      justify-content: center;
    }
  }
`;
