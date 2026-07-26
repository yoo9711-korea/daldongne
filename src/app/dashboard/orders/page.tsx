import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  BookOrderStatus,
  BookProductionStage,
} from "@prisma/client";
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

const PAGE_SIZE = 12;

const STATUS_FILTERS = [
  {
    value: "",
    label: "전체 주문",
  },
  {
    value:
      BookOrderStatus.READY,
    label: "결제 준비",
  },
  {
    value:
      BookOrderStatus.PAYMENT_PENDING,
    label: "입금 확인 중",
  },
  {
    value:
      BookOrderStatus.PAID,
    label: "결제 완료",
  },
  {
    value:
      BookOrderStatus.FAILED,
    label: "결제 재시도",
  },
  {
    value:
      BookOrderStatus.CANCELED,
    label: "취소",
  },
  {
    value:
      BookOrderStatus.REFUNDED,
    label: "환불",
  },
] as const;

export default async function DashboardOrdersPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(
      "/login?callbackUrl=/dashboard/orders",
    );
  }

  const params = await searchParams;

  const searchText =
    getParameter(params.q).slice(
      0,
      100,
    );

  const requestedStatus =
    getParameter(params.status);

  const statusFilter =
    STATUS_FILTERS.find(
      (item) =>
        item.value ===
        requestedStatus,
    )?.value || "";

  const requestedPage =
    Number.parseInt(
      getParameter(params.page),
      10,
    );

  const page =
    Number.isFinite(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const where:
    Prisma.BookOrderWhereInput = {
      authorId: userId,
    };

  if (statusFilter) {
    where.status =
      statusFilter;
  }

  if (searchText) {
    where.OR = [
      {
        orderId: {
          contains: searchText,
          mode: "insensitive",
        },
      },
      {
        productName: {
          contains: searchText,
          mode: "insensitive",
        },
      },
      {
        book: {
          title: {
            contains: searchText,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [
    filteredCount,
    totalCount,
    paymentRequiredCount,
    productionCount,
    completedCount,
  ] = await Promise.all([
    prisma.bookOrder.count({
      where,
    }),

    prisma.bookOrder.count({
      where: {
        authorId: userId,
      },
    }),

    prisma.bookOrder.count({
      where: {
        authorId: userId,
        status: {
          in: [
            BookOrderStatus.READY,
            BookOrderStatus.FAILED,
          ],
        },
      },
    }),

    prisma.bookOrder.count({
      where: {
        authorId: userId,
        status:
          BookOrderStatus.PAID,
        productionStage: {
          notIn: [
            BookProductionStage.COMPLETED,
            BookProductionStage.ON_HOLD,
          ],
        },
      },
    }),

    prisma.bookOrder.count({
      where: {
        authorId: userId,
        productionStage:
          BookProductionStage.COMPLETED,
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCount / PAGE_SIZE,
    ),
  );

  const safePage = Math.min(
    page,
    totalPages,
  );

  const orders =
    await prisma.bookOrder.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      skip:
        (safePage - 1) *
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
        productionStage: true,
        productionStageUpdatedAt:
          true,
        shippingCarrier: true,
        trackingNumber: true,
        createdAt: true,
        updatedAt: true,
        book: {
          select: {
            id: true,
            title: true,
            subtitle: true,
          },
        },
      },
    });

  return (
    <main className="user-orders-page">
      <style>
        {userOrdersStyles}
      </style>

      <div className="user-orders-shell">
        <header className="user-orders-hero">
          <div>
            <p>
              MY ORDER & PRODUCTION
            </p>

            <h1>
              나의 주문·제작 현황
            </h1>

            <span>
              결제부터 교정, 인쇄,
              배송까지 책 제작 과정을
              확인할 수 있습니다.
            </span>
          </div>

          <Link href="/dashboard/library">
            내 책장 보기
          </Link>
        </header>

        <section className="user-orders-summary">
          <SummaryCard
            label="전체 주문"
            value={totalCount}
          />

          <SummaryCard
            label="결제 필요"
            value={
              paymentRequiredCount
            }
          />

          <SummaryCard
            label="제작 진행"
            value={productionCount}
          />

          <SummaryCard
            label="제작 완료"
            value={completedCount}
          />
        </section>

        <section className="user-orders-filter">
          <form
            action="/dashboard/orders"
            method="get"
          >
            <label>
              <span>
                주문 검색
              </span>

              <input
                type="search"
                name="q"
                defaultValue={
                  searchText
                }
                placeholder="책 제목, 상품명, 주문번호"
              />
            </label>

            <label>
              <span>
                주문 상태
              </span>

              <select
                name="status"
                defaultValue={
                  statusFilter
                }
              >
                {STATUS_FILTERS.map(
                  (filter) => (
                    <option
                      key={
                        filter.value ||
                        "ALL"
                      }
                      value={
                        filter.value
                      }
                    >
                      {
                        filter.label
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <div>
              <button type="submit">
                검색
              </button>

              <Link href="/dashboard/orders">
                초기화
              </Link>
            </div>
          </form>
        </section>

        <section className="user-orders-list-panel">
          <div className="user-orders-list-heading">
            <div>
              <p>
                주문 목록
              </p>

              <h2>
                {filteredCount.toLocaleString()}
                건
              </h2>
            </div>

            <span>
              {safePage} /{" "}
              {totalPages} 페이지
            </span>
          </div>

          {orders.length > 0 ? (
            <div className="user-orders-list">
              {orders.map(
                (order) => {
              const needsPayment =
                    order.status === BookOrderStatus.READY ||
                    order.status === BookOrderStatus.FAILED;

                  return (
                    <article
                      key={order.id}
                      className="user-order-card"
                    >
                      <div className="user-order-card-top">
                        <div>
                          <OrderStatusBadge
                            status={String(
                              order.status,
                            )}
                          />

                          <ProductionBadge
                            stage={String(
                              order.productionStage,
                            )}
                          />
                        </div>

                        <time>
                          {formatDate(
                            order.updatedAt,
                          )}
                        </time>
                      </div>

                      <div className="user-order-card-body">
                        <div>
                          <p>
                            {
                              order.productName
                            }
                          </p>

                          <h3>
                            {
                              order.book
                                .title
                            }
                          </h3>

                          <span>
                            {order.book
                              .subtitle ||
                              order.specification ||
                              "사진과 이야기로 만드는 스토리북"}
                          </span>
                        </div>

                        <strong>
                          {order.totalAmount.toLocaleString()}
                          원
                        </strong>
                      </div>

                      <div className="user-order-card-information">
                        <span>
                          주문번호
                          <strong>
                            {
                              order.orderId
                            }
                          </strong>
                        </span>

                        <span>
                          수량
                          <strong>
                            {
                              order.quantity
                            }
                            권
                          </strong>
                        </span>

                        <span>
                          결제수단
                          <strong>
                            {order.paymentMethod ||
                              "미등록"}
                          </strong>
                        </span>

                        <span>
                          배송
                          <strong>
                            {order.trackingNumber
                              ? `${
                                  order.shippingCarrier ||
                                  "택배"
                                } · ${order.trackingNumber}`
                              : "배송 전"}
                          </strong>
                        </span>
                      </div>

                      <div className="user-order-card-actions">
                        {needsPayment ? (
                          <Link
                            className="user-order-payment-link"
                            href={`/dashboard/library/${order.book.id}/checkout`}
                          >
                            결제하기
                          </Link>
                        ) : null}

                        <Link
                          href={`/dashboard/orders/${order.id}`}
                        >
                          자세히 보기
                          <span aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="user-orders-empty">
              <strong>
                조건에 맞는 주문이
                없습니다.
              </strong>

              <p>
                책 상세 화면에서 제작
                신청을 접수하면 주문 현황이
                이곳에 표시됩니다.
              </p>

              <Link href="/dashboard/library">
                내 책장으로 이동
              </Link>
            </div>
          )}

          <nav
            className="user-orders-pagination"
            aria-label="주문 페이지"
          >
            <Link
              href={createPageHref({
                q: searchText,
                status:
                  statusFilter,
                page: Math.max(
                  1,
                  safePage - 1,
                ),
              })}
              data-disabled={
                safePage <= 1
                  ? "true"
                  : "false"
              }
            >
              이전
            </Link>

            <span>
              {safePage} /{" "}
              {totalPages}
            </span>

            <Link
              href={createPageHref({
                q: searchText,
                status:
                  statusFilter,
                page: Math.min(
                  totalPages,
                  safePage + 1,
                ),
              })}
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

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article>
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>건</small>
      </strong>
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
      className="user-order-status-badge"
      data-status={status}
    >
      {getOrderStatusLabel(
        status,
      )}
    </span>
  );
}

function ProductionBadge({
  stage,
}: {
  stage: string;
}) {
  return (
    <span className="user-order-production-badge">
      {getProductionStageLabel(
        stage,
      )}
    </span>
  );
}

function getParameter(
  value:
    | string
    | string[]
    | undefined,
) {
  return Array.isArray(value)
    ? value[0]?.trim() || ""
    : value?.trim() || "";
}

function createPageHref({
  q,
  status,
  page,
}: {
  q: string;
  status: string;
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

  if (page > 1) {
    params.set(
      "page",
      String(page),
    );
  }

  const query =
    params.toString();

  return query
    ? `/dashboard/orders?${query}`
    : "/dashboard/orders";
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

function formatDate(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(value);
}

const userOrdersStyles = `
  .user-orders-page,
  .user-orders-page * {
    box-sizing: border-box;
  }

  .user-orders-page {
    min-height: 100vh;
    padding: 32px 24px 65px;
    color: #49342b;
  }

  .user-orders-page a {
    color: inherit;
    text-decoration: none;
  }

  .user-orders-shell {
    width: min(1280px, 100%);
    margin: 0 auto;
  }

  .user-orders-hero {
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

  .user-orders-hero p,
  .user-orders-list-heading p {
    margin: 0;
    color: #df6750;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.09em;
  }

  .user-orders-hero h1 {
    margin: 8px 0 0;
    font-family:
      var(--font-display),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(33px, 5vw, 49px);
    line-height: 1.25;
    letter-spacing: -0.055em;
  }

  .user-orders-hero > div > span {
    display: block;
    margin-top: 10px;
    color: #806c62;
    font-size: 13px;
    line-height: 1.7;
  }

  .user-orders-hero > a {
    min-height: 43px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #dfbfb1;
    border-radius: 12px;
    color: #74564b;
    background: #ffffff;
    font-size: 11px;
    font-weight: 900;
    white-space: nowrap;
  }

  .user-orders-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .user-orders-summary article {
    padding: 18px;
    border:
      1px solid
      rgba(139, 91, 69, 0.12);
    border-radius: 18px;
    background: #ffffff;
  }

  .user-orders-summary span {
    color: #90786d;
    font-size: 10px;
    font-weight: 900;
  }

  .user-orders-summary strong {
    display: block;
    margin-top: 7px;
    font-size: 26px;
  }

  .user-orders-summary small {
    margin-left: 3px;
    font-size: 11px;
  }

  .user-orders-filter,
  .user-orders-list-panel {
    margin-top: 16px;
    padding: 21px;
    border:
      1px solid
      rgba(139, 91, 69, 0.12);
    border-radius: 21px;
    background: #ffffff;
    box-shadow:
      0 12px 31px
      rgba(97, 62, 46, 0.045);
  }

  .user-orders-filter form {
    display: grid;
    grid-template-columns:
      minmax(260px, 1fr)
      minmax(180px, 0.45fr)
      auto;
    align-items: end;
    gap: 10px;
  }

  .user-orders-filter label > span {
    display: block;
    margin-bottom: 6px;
    color: #775f54;
    font-size: 10px;
    font-weight: 900;
  }

  .user-orders-filter input,
  .user-orders-filter select {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid #dfc9c0;
    border-radius: 11px;
    color: #513d34;
    background: #fffdfb;
    font: inherit;
    font-size: 12px;
  }

  .user-orders-filter form > div {
    display: flex;
    gap: 7px;
  }

  .user-orders-filter button,
  .user-orders-filter form > div > a {
    min-height: 44px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d9b7a9;
    border-radius: 11px;
    color: #74564b;
    background: #ffffff;
    font: inherit;
    font-size: 11px;
    font-weight: 900;
    cursor: pointer;
    white-space: nowrap;
  }

  .user-orders-filter button {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ef7962,
        #e05e49
      );
  }

  .user-orders-list-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 15px;
  }

  .user-orders-list-heading h2 {
    margin: 6px 0 0;
    font-size: 23px;
  }

  .user-orders-list-heading > span {
    color: #917b70;
    font-size: 10px;
  }

  .user-orders-list {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .user-order-card {
    min-width: 0;
    padding: 19px;
    border: 1px solid #eadcd5;
    border-radius: 18px;
    background:
      linear-gradient(
        145deg,
        #ffffff,
        #fffcfa
      );
  }

  .user-order-card-top,
  .user-order-card-body,
  .user-order-card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .user-order-card-top > div {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .user-order-card-top time {
    color: #a08a80;
    font-size: 9px;
  }

  .user-order-status-badge,
  .user-order-production-badge {
    min-height: 26px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #386b48;
    background: #e7f4e9;
    font-size: 9px;
    font-weight: 900;
  }

  .user-order-production-badge {
    color: #51698a;
    background: #eaf1fa;
  }

  .user-order-status-badge[data-status="READY"],
  .user-order-status-badge[data-status="PAYMENT_PENDING"] {
    color: #815c18;
    background: #fff2cd;
  }

  .user-order-status-badge[data-status="FAILED"],
  .user-order-status-badge[data-status="CANCELED"],
  .user-order-status-badge[data-status="REFUNDED"],
  .user-order-status-badge[data-status="PARTIALLY_REFUNDED"] {
    color: #984b42;
    background: #ffe9e5;
  }

  .user-order-card-body {
    margin-top: 15px;
    align-items: flex-start;
  }

  .user-order-card-body > div {
    min-width: 0;
  }

  .user-order-card-body p {
    margin: 0;
    color: #cf624d;
    font-size: 10px;
    font-weight: 900;
  }

  .user-order-card-body h3 {
    margin: 5px 0 0;
    overflow: hidden;
    font-family:
      var(--font-display),
      "Noto Serif KR",
      serif;
    font-size: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-order-card-body span {
    display: block;
    margin-top: 6px;
    overflow: hidden;
    color: #8c766c;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-order-card-body > strong {
    flex: 0 0 auto;
    color: #5b3e32;
    font-size: 18px;
  }

  .user-order-card-information {
    margin-top: 15px;
    padding: 13px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 10px;
    border-radius: 13px;
    background: #faf5f2;
  }

  .user-order-card-information span {
    min-width: 0;
    color: #947d72;
    font-size: 9px;
  }

  .user-order-card-information strong {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: #5a453c;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-order-card-actions {
    margin-top: 15px;
    justify-content: flex-end;
  }

  .user-order-card-actions a {
    min-height: 39px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid #d9b7a8;
    border-radius: 10px;
    color: #76574c;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .user-order-card-actions
  .user-order-payment-link {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ef7962,
        #e05d48
      );
  }

  .user-orders-empty {
    margin-top: 16px;
    padding: 53px 20px;
    border: 1px dashed #d9c0b5;
    border-radius: 17px;
    background: #fffaf7;
    text-align: center;
  }

  .user-orders-empty strong {
    font-size: 17px;
  }

  .user-orders-empty p {
    margin: 9px 0 16px;
    color: #8d776d;
    font-size: 12px;
    line-height: 1.7;
  }

  .user-orders-empty a {
    min-height: 40px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    border-radius: 10px;
    color: #ffffff;
    background: #df654f;
    font-size: 11px;
    font-weight: 900;
  }

  .user-orders-pagination {
    margin-top: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
  }

  .user-orders-pagination a {
    min-width: 74px;
    min-height: 37px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d8b8aa;
    border-radius: 10px;
    color: #76574d;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .user-orders-pagination a[data-disabled="true"] {
    opacity: 0.4;
    pointer-events: none;
  }

  .user-orders-pagination span {
    color: #8b746a;
    font-size: 10px;
    font-weight: 900;
  }

  @media (max-width: 850px) {
    .user-orders-summary {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .user-orders-list {
      grid-template-columns: 1fr;
    }

    .user-orders-filter form {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .user-orders-filter form > div {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 620px) {
    .user-orders-page {
      padding: 20px 14px 45px;
    }

    .user-orders-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 23px;
    }

    .user-orders-hero > a {
      align-self: flex-start;
    }

    .user-orders-filter form {
      display: block;
    }

    .user-orders-filter label {
      display: block;
      margin-bottom: 11px;
    }

    .user-orders-filter form > div {
      margin-top: 12px;
    }

    .user-order-card-body {
      align-items: flex-start;
      flex-direction: column;
    }

    .user-order-card-information {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 430px) {
    .user-orders-summary {
      grid-template-columns: 1fr;
    }

    .user-order-card-actions {
      display: grid;
      grid-template-columns: 1fr;
    }

    .user-order-card-actions a {
      justify-content: center;
    }
  }
`;