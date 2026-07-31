import { auth } from "@/auth";
import CopyTextButton from "@/components/admin/CopyTextButton";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
};

const PAGE_SIZE = 20;

const ORDER_STATUSES = [
  "READY",
  "PAYMENT_PENDING",
  "PAID",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "CANCELED",
  "FAILED",
] as const;

const PRODUCTION_STAGES = [
  "PREPARING",
  "MANUSCRIPT_RECEIVED",
  "REVIEWING",
  "PROOFING",
  "PROOF_SENT",
  "PROOF_APPROVED",
  "PRINT_ORDERED",
  "PRINTING",
  "SHIPPING_PREPARATION",
  "SHIPPED",
  "COMPLETED",
  "ON_HOLD",
] as const;

export default async function AdminOrdersPage({
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

  const params = await searchParams;

  const query = getParam(
    params.q,
  ).slice(0, 120);

  const status = getAllowedParam(
    params.status,
    ORDER_STATUSES,
  );

  const stage = getAllowedParam(
    params.stage,
    PRODUCTION_STAGES,
  );

  const requestedPage =
    Number.parseInt(
      getParam(params.page),
      10,
    );

  const page =
    Number.isFinite(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const where: Prisma.BookOrderWhereInput =
    {};

  if (status) {
    where.status = status;
  }

  if (stage) {
    where.productionStage =
      stage;
  }

  if (query) {
    where.OR = [
      {
        orderId: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        productName: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        specification: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        trackingNumber: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        author: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        author: {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        book: {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        productionRequest: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        productionRequest: {
          phone: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        productionRequest: {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [
    totalCount,
    orders,
    paidCount,
    pendingCount,
    refundCount,
    paidAggregate,
  ] = await Promise.all([
    prisma.bookOrder.count({
      where,
    }),

    prisma.bookOrder.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip:
        (page - 1) *
        PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderId: true,
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
        shippingCarrier: true,
        trackingNumber: true,
        createdAt: true,
        updatedAt: true,
        book: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
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
          },
        },
      },
    }),

    prisma.bookOrder.count({
      where: {
        ...where,
        status: "PAID",
      },
    }),

    prisma.bookOrder.count({
      where: {
        ...where,
        status: {
          in: [
            "READY",
            "PAYMENT_PENDING",
            "FAILED",
          ],
        },
      },
    }),

    prisma.bookOrder.count({
      where: {
        ...where,
        status: {
          in: [
            "PARTIALLY_REFUNDED",
            "REFUNDED",
            "CANCELED",
          ],
        },
      },
    }),

    prisma.bookOrder.aggregate({
      where: {
        ...where,
        status: "PAID",
      },
      _sum: {
        totalAmount: true,
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalCount / PAGE_SIZE,
    ),
  );

  const safePage = Math.min(
    page,
    totalPages,
  );

  if (safePage !== page) {
    redirect(
      buildOrdersHref({
        q: query,
        status,
        stage,
        page: safePage,
      }),
    );
  }

  return (
    <main className="admin-orders-page">
      <style>
        {adminOrdersStyles}
      </style>

      <div className="admin-orders-shell">
        <header className="admin-orders-hero">
          <div>
            <p>
              ADMIN · ORDERS
            </p>

            <h1>
              주문·결제 통합 관리
            </h1>

            <span>
              견적 주문, 결제 상태,
              제작 단계와 배송 정보를
              한 화면에서 확인합니다.
            </span>
          </div>

          <div className="admin-orders-hero-actions">
            <Link
              href={buildExportHref({
                q: query,
                status,
                stage,
              })}
            >
              CSV 내려받기
            </Link>

            <Link href="/admin/production-requests">
              제작 상담 관리
            </Link>
          </div>
        </header>

        <section className="admin-orders-stats">
          <StatCard
            label="검색된 주문"
            value={totalCount}
            unit="건"
          />

          <StatCard
            label="결제 완료"
            value={paidCount}
            unit="건"
          />

          <StatCard
            label="결제 확인 필요"
            value={pendingCount}
            unit="건"
          />

          <StatCard
            label="취소·환불"
            value={refundCount}
            unit="건"
          />

          <StatCard
            label="결제 완료 금액"
            value={
              paidAggregate._sum
                .totalAmount || 0
            }
            unit="원"
            money
          />
        </section>

        <section className="admin-orders-filter-panel">
          <form
            action="/admin/orders"
            method="get"
          >
            <label>
              <span>
                주문 검색
              </span>

              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="주문번호, 고객, 이메일, 책 제목, 송장번호"
              />
            </label>

            <label>
              <span>
                결제 상태
              </span>

              <select
                name="status"
                defaultValue={status}
              >
                <option value="">
                  전체 결제 상태
                </option>

                {ORDER_STATUSES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {getOrderStatusLabel(
                        value,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                제작 단계
              </span>

              <select
                name="stage"
                defaultValue={stage}
              >
                <option value="">
                  전체 제작 단계
                </option>

                {PRODUCTION_STAGES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {getProductionStageLabel(
                        value,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div>
              <button type="submit">
                검색 적용
              </button>

              <Link href="/admin/orders">
                초기화
              </Link>
            </div>
          </form>
        </section>

        <section className="admin-orders-list-panel">
          <div className="admin-orders-list-heading">
            <div>
              <p>
                주문 목록
              </p>

              <h2>
                총{" "}
                {totalCount.toLocaleString()}
                건
              </h2>
            </div>

            <span>
              {safePage.toLocaleString()}
              페이지 /{" "}
              {totalPages.toLocaleString()}
              페이지
            </span>
          </div>

          {orders.length > 0 ? (
            <div className="admin-orders-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      주문·고객
                    </th>
                    <th>
                      책·상품
                    </th>
                    <th>
                      금액
                    </th>
                    <th>
                      결제 상태
                    </th>
                    <th>
                      제작·배송
                    </th>
                    <th>
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map(
                    (order) => {
                      const customerName =
                        order.productionRequest
                          .name ||
                        order.author.name ||
                        "이름 미등록";

                      const customerEmail =
                        order.productionRequest
                          .email ||
                        order.author.email ||
                        "이메일 미등록";

                      return (
                        <tr key={order.id}>
                          <td>
                            <div className="admin-orders-primary-cell">
                              <strong>
                                {
                                  customerName
                                }
                              </strong>

                              <span>
                                {
                                  customerEmail
                                }
                              </span>

                              <small>
                                {formatDateTime(
                                  order.createdAt,
                                )}
                              </small>

                              <div className="admin-orders-copy-row">
                                <code>
                                  {
                                    order.orderId
                                  }
                                </code>

                                <CopyTextButton
                                  value={
                                    order.orderId
                                  }
                                  label="주문번호 복사"
                                />
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="admin-orders-book-cell">
                              <Link
                                href={`/admin/books/${order.book.id}`}
                              >
                                {
                                  order.book
                                    .title
                                }
                              </Link>

                              <strong>
                                {
                                  order.productName
                                }
                              </strong>

                              <span>
                                {
                                  order.quantity
                                }
                                권
                                {order.specification
                                  ? ` · ${order.specification}`
                                  : ""}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="admin-orders-money-cell">
                              <strong>
                                {order.totalAmount.toLocaleString()}
                                원
                              </strong>

                              <span>
                                상품{" "}
                                {order.productAmount.toLocaleString()}
                                원
                              </span>

                              <span>
                                배송{" "}
                                {order.shippingFee.toLocaleString()}
                                원
                              </span>
                            </div>
                          </td>

                          <td>
                            <OrderStatusBadge
                              status={
                                order.status
                              }
                            />

                            <div className="admin-orders-sub-info">
                              <span>
                                {order.paymentMethod ||
                                  "결제수단 미등록"}
                              </span>

                              <span>
                                {order.paidAt
                                  ? `결제 ${formatDateTime(
                                      order.paidAt,
                                    )}`
                                  : "결제일 없음"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <ProductionStageBadge
                              stage={
                                order.productionStage
                              }
                            />

                            <div className="admin-orders-sub-info">
                              <span>
                                {order.shippingCarrier ||
                                  "택배사 미등록"}
                              </span>

                              <span>
                                {order.trackingNumber ||
                                  "송장번호 없음"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <Link
                              className="admin-orders-detail-link"
                              href={`/admin/orders/${order.id}`}
                            >
                              상세 관리
                              <span aria-hidden="true">
                                →
                              </span>
                            </Link>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-orders-empty">
              조건에 맞는 주문이 없습니다.
            </div>
          )}

          <nav
            className="admin-orders-pagination"
            aria-label="주문 목록 페이지"
          >
            <Link
              href={buildOrdersHref({
                q: query,
                status,
                stage,
                page: Math.max(
                  1,
                  safePage - 1,
                ),
              })}
              aria-disabled={
                safePage <= 1
              }
              data-disabled={
                safePage <= 1
                  ? "true"
                  : "false"
              }
            >
              이전
            </Link>

            <span>
              {safePage} / {totalPages}
            </span>

            <Link
              href={buildOrdersHref({
                q: query,
                status,
                stage,
                page: Math.min(
                  totalPages,
                  safePage + 1,
                ),
              })}
              aria-disabled={
                safePage >=
                totalPages
              }
              data-disabled={
                safePage >=
                totalPages
                  ? "true"
                  : "false"
              }
            >
              다음
            </Link>
          </nav>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  unit,
  money = false,
}: {
  label: string;
  value: number;
  unit: string;
  money?: boolean;
}) {
  return (
    <article>
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>

      {money ? (
        <p>
          결제 완료 주문 기준
        </p>
      ) : null}
    </article>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-orders-status-badge"
      data-status={status}
    >
      {getOrderStatusLabel(status)}
    </span>
  );
}

function ProductionStageBadge({
  stage,
}: {
  stage: string;
}) {
  return (
    <span
      className="admin-orders-stage-badge"
      data-stage={stage}
    >
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

function getAllowedParam<
  T extends readonly string[],
>(
  value:
    | string
    | string[]
    | undefined,
  allowedValues: T,
): T[number] | "" {
  const text = getParam(value);

  return allowedValues.includes(
    text as T[number],
  )
    ? (text as T[number])
    : "";
}

function buildOrdersHref({
  q,
  status,
  stage,
  page,
}: {
  q: string;
  status: string;
  stage: string;
  page: number;
}) {
  const params =
    new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (status) {
    params.set(
      "status",
      status,
    );
  }

  if (stage) {
    params.set(
      "stage",
      stage,
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(page),
    );
  }

  const queryString =
    params.toString();

  return queryString
    ? `/admin/orders?${queryString}`
    : "/admin/orders";
}

function buildExportHref({
  q,
  status,
  stage,
}: {
  q: string;
  status: string;
  stage: string;
}) {
  const params =
    new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (status) {
    params.set(
      "status",
      status,
    );
  }

  if (stage) {
    params.set(
      "stage",
      stage,
    );
  }

  const queryString =
    params.toString();

  return queryString
    ? `/api/admin/orders/export?${queryString}`
    : "/api/admin/orders/export";
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

const adminOrdersStyles = `
  .admin-orders-page,
  .admin-orders-page * {
    box-sizing: border-box;
  }

  .admin-orders-page {
    color: #432f26;
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-orders-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-orders-shell {
    width: min(1500px, 100%);
    margin: 0 auto;
  }

  .admin-orders-hero {
    padding: 27px 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
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

  .admin-orders-hero p,
  .admin-orders-list-heading p {
    margin: 0;
    color: #df6550;
    font-size: 10.8px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .admin-orders-hero h1 {
    margin: 8px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: clamp(30px, 4vw, 47px);
    line-height: 1.25;
    letter-spacing: -0.055em;
  }

  .admin-orders-hero > div:first-child > span {
    display: block;
    margin-top: 9px;
    color: #806b62;
    font-size: 13.2px;
    line-height: 1.7;
  }

  .admin-orders-hero-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .admin-orders-hero-actions a,
  .admin-orders-detail-link {
    min-height: 40px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 1px solid #d6b2a3;
    border-radius: 10px;
    color: #765449;
    background: #ffffff;
    font-size: 9.6px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-orders-hero-actions a:first-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7563,
        #e85b4c
      );
  }

  .admin-orders-stats {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .admin-orders-stats article {
    min-width: 0;
    padding: 17px;
    border: 1px solid rgba(128, 83, 61, 0.12);
    border-radius: 17px;
    background: #ffffff;
    box-shadow:
      0 9px 22px
      rgba(91, 58, 43, 0.04);
  }

  .admin-orders-stats span {
    color: #937b70;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-orders-stats strong {
    display: block;
    margin-top: 7px;
    overflow-wrap: anywhere;
    font-size: clamp(21px, 2vw, 29px);
    line-height: 1.15;
  }

  .admin-orders-stats small {
    margin-left: 3px;
    font-size: 10px;
  }

  .admin-orders-stats p {
    margin: 5px 0 0;
    color: #a08b82;
    font-size: 7px;
  }

  .admin-orders-filter-panel,
  .admin-orders-list-panel {
    margin-top: 15px;
    padding: 20px;
    border: 1px solid rgba(128, 83, 61, 0.12);
    border-radius: 20px;
    background: #ffffff;
    box-shadow:
      0 12px 30px
      rgba(91, 58, 43, 0.045);
  }

  .admin-orders-filter-panel form {
    display: grid;
    grid-template-columns:
      minmax(260px, 1.5fr)
      minmax(150px, 0.7fr)
      minmax(170px, 0.8fr)
      auto;
    align-items: end;
    gap: 10px;
  }

  .admin-orders-filter-panel label span {
    display: block;
    margin-bottom: 6px;
    color: #775e53;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-orders-filter-panel input,
  .admin-orders-filter-panel select {
    width: 100%;
    min-height: 42px;
    padding: 0 11px;
    border: 1px solid #dec8bf;
    border-radius: 10px;
    color: #4f3a31;
    background: #fffdfa;
    font: inherit;
    font-size: 10.8px;
  }

  .admin-orders-filter-panel form > div {
    display: flex;
    gap: 6px;
  }

  .admin-orders-filter-panel button,
  .admin-orders-filter-panel form > div a {
    min-height: 42px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d6b2a3;
    border-radius: 10px;
    color: #765449;
    background: #ffffff;
    font: inherit;
    font-size: 9.6px;
    font-weight: 900;
    white-space: nowrap;
    cursor: pointer;
  }

  .admin-orders-filter-panel button {
    border-color: transparent;
    color: #ffffff;
    background: #764137;
  }

  .admin-orders-list-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .admin-orders-list-heading h2 {
    margin: 5px 0 0;
    font-size: 21px;
  }

  .admin-orders-list-heading > span {
    color: #947c71;
    font-size: 9.6px;
  }

  .admin-orders-table-wrap {
    margin-top: 15px;
    overflow-x: auto;
  }

  .admin-orders-table-wrap table {
    width: 100%;
    min-width: 1110px;
    border-collapse: collapse;
  }

  .admin-orders-table-wrap th {
    padding: 10px;
    color: #8c7469;
    background: #fbf5f1;
    font-size: 9.6px;
    text-align: left;
  }

  .admin-orders-table-wrap td {
    padding: 13px 10px;
    border-bottom: 1px solid #eee2dc;
    vertical-align: top;
    font-size: 10.8px;
  }

  .admin-orders-primary-cell strong,
  .admin-orders-primary-cell span,
  .admin-orders-primary-cell small,
  .admin-orders-book-cell strong,
  .admin-orders-book-cell span,
  .admin-orders-money-cell strong,
  .admin-orders-money-cell span,
  .admin-orders-sub-info span {
    display: block;
  }

  .admin-orders-primary-cell > span,
  .admin-orders-book-cell span,
  .admin-orders-money-cell span,
  .admin-orders-sub-info span {
    margin-top: 4px;
    color: #927a70;
    font-size: 8.4px;
    line-height: 1.5;
  }

  .admin-orders-primary-cell small {
    margin-top: 5px;
    color: #ad9990;
    font-size: 8.4px;
  }

  .admin-orders-copy-row {
    margin-top: 7px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .admin-orders-copy-row code {
    max-width: 155px;
    overflow: hidden;
    color: #7b5a4d;
    font-size: 8.4px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-orders-book-cell a {
    display: block;
    margin-bottom: 5px;
    color: #bb5848;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-orders-money-cell strong {
    font-size: 15.6px;
  }

  .admin-orders-status-badge,
  .admin-orders-stage-badge {
    min-height: 25px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #3f6388;
    background: #e8f2ff;
    font-size: 8.4px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-orders-status-badge[data-status="PAID"] {
    color: #316b43;
    background: #e5f4e8;
  }

  .admin-orders-status-badge[data-status="READY"],
  .admin-orders-status-badge[data-status="PAYMENT_PENDING"] {
    color: #886014;
    background: #fff2ca;
  }

  .admin-orders-status-badge[data-status="FAILED"],
  .admin-orders-status-badge[data-status="CANCELED"],
  .admin-orders-status-badge[data-status="REFUNDED"],
  .admin-orders-status-badge[data-status="PARTIALLY_REFUNDED"] {
    color: #994d43;
    background: #ffe9e5;
  }

  .admin-orders-stage-badge[data-stage="COMPLETED"] {
    color: #316b43;
    background: #e5f4e8;
  }

  .admin-orders-stage-badge[data-stage="ON_HOLD"] {
    color: #8b5a19;
    background: #fff0cb;
  }

  .admin-orders-sub-info {
    margin-top: 7px;
  }

  .admin-orders-empty {
    margin-top: 15px;
    padding: 45px 20px;
    border: 1px dashed #d8c1b7;
    border-radius: 15px;
    color: #947d72;
    background: #fffaf7;
    font-size: 12px;
    text-align: center;
  }

  .admin-orders-pagination {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .admin-orders-pagination a {
    min-width: 70px;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d8b9ac;
    border-radius: 9px;
    color: #75564b;
    background: #ffffff;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-orders-pagination a[data-disabled="true"] {
    opacity: 0.4;
    pointer-events: none;
  }

  .admin-orders-pagination span {
    color: #8b7469;
    font-size: 9.6px;
    font-weight: 900;
  }

  @media (max-width: 1180px) {
    .admin-orders-stats {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-orders-filter-panel form {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .admin-orders-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 22px;
    }

    .admin-orders-hero-actions {
      justify-content: flex-start;
    }

    .admin-orders-stats {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-orders-filter-panel form {
      display: block;
    }

    .admin-orders-filter-panel label {
      display: block;
      margin-bottom: 10px;
    }

    .admin-orders-filter-panel form > div {
      margin-top: 12px;
    }
  }

  @media (max-width: 480px) {
    .admin-orders-stats {
      grid-template-columns: 1fr;
    }

    .admin-orders-hero-actions a,
    .admin-orders-filter-panel button,
    .admin-orders-filter-panel form > div a {
      flex: 1 1 auto;
    }
  }
`;