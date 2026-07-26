import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
} from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
};

const PAGE_SIZE = 30;

const CATEGORIES = [
  "ORDER",
  "QUOTE",
  "PAYMENT",
  "PRODUCTION",
  "DELIVERY",
  "REFUND",
] as const;

const SOURCES = [
  "ADMIN",
  "CUSTOMER",
  "WEBHOOK",
  "SYSTEM",
] as const;

export default async function AdminOrderAuditPage({
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const admin =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
      },
    });

  if (admin?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params =
    await searchParams;

  const query =
    getParam(params.q)
      .slice(0, 120);

  const orderId =
    getParam(params.orderId)
      .slice(0, 100);

  const category =
    getAllowed(
      params.category,
      CATEGORIES,
    );

  const source =
    getAllowed(
      params.source,
      SOURCES,
    );

  const visibility =
    getParam(
      params.visibility,
    );

  const requestedPage =
    Number.parseInt(
      getParam(params.page),
      10,
    );

  const page =
    Number.isFinite(
      requestedPage,
    ) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const where:
    Prisma.BookOrderAuditLogWhereInput =
      {};

  if (orderId) {
    where.orderId = orderId;
  }

  if (category) {
    where.category = category;
  }

  if (source) {
    where.source = source;
  }

  if (
    visibility === "CUSTOMER"
  ) {
    where.isCustomerVisible =
      true;
  }

  if (
    visibility === "ADMIN"
  ) {
    where.isCustomerVisible =
      false;
  }

  if (query) {
    where.OR = [
      {
        summary: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        action: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        actorName: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        actorEmail: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        order: {
          orderId: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        order: {
          productName: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      {
        order: {
          book: {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  const startOfToday =
    new Date();

  startOfToday.setHours(
    0,
    0,
    0,
    0,
  );

  const [
    totalCount,
    todayCount,
    adminActionCount,
    customerVisibleCount,
  ] = await Promise.all([
    prisma.bookOrderAuditLog.count({
      where,
    }),

    prisma.bookOrderAuditLog.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    }),

    prisma.bookOrderAuditLog.count({
      where: {
        source: "ADMIN",
      },
    }),

    prisma.bookOrderAuditLog.count({
      where: {
        isCustomerVisible:
          true,
      },
    }),
  ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCount /
          PAGE_SIZE,
      ),
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

  const logs =
    await prisma.bookOrderAuditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip:
        (safePage - 1) *
        PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        order: {
          select: {
            id: true,
            orderId: true,
            productName: true,
            totalAmount: true,
            status: true,
            productionStage: true,
            book: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

  return (
    <main className="admin-order-audit-page">
      <style>
        {adminAuditStyles}
      </style>

      <div className="admin-order-audit-shell">
        <header className="admin-order-audit-hero">
          <div>
            <p>
              ADMIN · ORDER AUDIT
            </p>

            <h1>
              주문 처리 이력
            </h1>

            <span>
              주문·견적·결제·제작·배송의
              변경자와 변경 전후 값을
              확인합니다.
            </span>
          </div>

          <div>
            <Link href="/admin/orders">
              주문 관리
            </Link>

            <Link href="/admin">
              관리자 홈
            </Link>
          </div>
        </header>

        <section className="admin-order-audit-stats">
          <Stat
            label="검색된 이력"
            value={totalCount}
          />

          <Stat
            label="오늘 변경"
            value={todayCount}
          />

          <Stat
            label="관리자 처리"
            value={adminActionCount}
          />

          <Stat
            label="고객 공개"
            value={
              customerVisibleCount
            }
          />
        </section>

        <section className="admin-order-audit-filter">
          <form
            action="/admin/order-audit"
            method="get"
          >
            {orderId ? (
              <input
                type="hidden"
                name="orderId"
                value={orderId}
              />
            ) : null}

            <label>
              <span>
                이력 검색
              </span>

              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="주문번호, 책, 관리자, 변경 내용"
              />
            </label>

            <label>
              <span>
                구분
              </span>

              <select
                name="category"
                defaultValue={category}
              >
                <option value="">
                  전체 구분
                </option>

                {CATEGORIES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {getCategoryLabel(
                        value,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                처리 주체
              </span>

              <select
                name="source"
                defaultValue={source}
              >
                <option value="">
                  전체 처리 주체
                </option>

                {SOURCES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {getSourceLabel(
                        value,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                공개 범위
              </span>

              <select
                name="visibility"
                defaultValue={
                  visibility
                }
              >
                <option value="">
                  전체 공개 범위
                </option>

                <option value="CUSTOMER">
                  고객 공개
                </option>

                <option value="ADMIN">
                  관리자 전용
                </option>
              </select>
            </label>

            <div>
              <button type="submit">
                검색 적용
              </button>

              <Link href="/admin/order-audit">
                초기화
              </Link>
            </div>
          </form>
        </section>

        <section className="admin-order-audit-list-panel">
          <div className="admin-order-audit-list-heading">
            <div>
              <p>
                AUDIT LOG
              </p>

              <h2>
                총 {totalCount.toLocaleString()}건
              </h2>
            </div>

            <span>
              {safePage} / {totalPages} 페이지
            </span>
          </div>

          {logs.length > 0 ? (
            <div className="admin-order-audit-list">
              {logs.map((log) => {
                const fields =
                  getChangedFields(
                    log.changedFields,
                  );

                return (
                  <article key={log.id}>
                    <div className="admin-order-audit-card-head">
                      <div>
                        <strong
                          data-category={
                            log.category
                          }
                        >
                          {getCategoryLabel(
                            log.category,
                          )}
                        </strong>

                        <span>
                          {getSourceLabel(
                            log.source,
                          )}
                        </span>

                        <em
                          data-private={
                            log.isCustomerVisible
                              ? "false"
                              : "true"
                          }
                        >
                          {log.isCustomerVisible
                            ? "고객 공개"
                            : "관리자 전용"}
                        </em>
                      </div>

                      <time>
                        {formatDateTime(
                          log.createdAt,
                        )}
                      </time>
                    </div>

                    <div className="admin-order-audit-order">
                      <div>
                        <Link
                          href={`/admin/orders/${log.order.id}`}
                        >
                          {
                            log.order
                              .book.title
                          }
                        </Link>

                        <strong>
                          {
                            log.order
                              .productName
                          }
                        </strong>

                        <code>
                          {
                            log.order
                              .orderId
                          }
                        </code>
                      </div>

                      <span>
                        {log.order.totalAmount.toLocaleString()}원
                      </span>
                    </div>

                    <h3>
                      {log.summary}
                    </h3>

                    <p className="admin-order-audit-actor">
                      처리자:{" "}
                      {log.actorName ||
                        log.actorEmail ||
                        "시스템 자동 처리"}
                    </p>

                    {fields.length > 0 ? (
                      <div className="admin-order-audit-fields">
                        {fields.map(
                          (field) => (
                            <span
                              key={field}
                            >
                              {getFieldLabel(
                                field,
                              )}
                            </span>
                          ),
                        )}
                      </div>
                    ) : null}

                    <details>
                      <summary>
                        변경 전·후 값 확인
                      </summary>

                      <div className="admin-order-audit-json-grid">
                        <section>
                          <strong>
                            변경 전
                          </strong>

                          <pre>
                            {JSON.stringify(
                              log.beforeData,
                              null,
                              2,
                            )}
                          </pre>
                        </section>

                        <section>
                          <strong>
                            변경 후
                          </strong>

                          <pre>
                            {JSON.stringify(
                              log.afterData,
                              null,
                              2,
                            )}
                          </pre>
                        </section>
                      </div>
                    </details>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="admin-order-audit-empty">
              조건에 맞는 처리 이력이
              없습니다.
            </div>
          )}

          <nav
            className="admin-order-audit-pagination"
            aria-label="처리 이력 페이지"
          >
            <Link
              href={buildHref({
                q: query,
                orderId,
                category,
                source,
                visibility,
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
              {safePage} / {totalPages}
            </span>

            <Link
              href={buildHref({
                q: query,
                orderId,
                category,
                source,
                visibility,
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

function Stat({
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

function getAllowed<
  T extends readonly string[],
>(
  value:
    | string
    | string[]
    | undefined,
  allowed: T,
): T[number] | "" {
  const text =
    getParam(value);

  return allowed.includes(
    text as T[number],
  )
    ? text as T[number]
    : "";
}

function getChangedFields(
  value: Prisma.JsonValue,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

function buildHref({
  q,
  orderId,
  category,
  source,
  visibility,
  page,
}: {
  q: string;
  orderId: string;
  category: string;
  source: string;
  visibility: string;
  page: number;
}) {
  const params =
    new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (orderId) {
    params.set(
      "orderId",
      orderId,
    );
  }

  if (category) {
    params.set(
      "category",
      category,
    );
  }

  if (source) {
    params.set(
      "source",
      source,
    );
  }

  if (visibility) {
    params.set(
      "visibility",
      visibility,
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
    ? `/admin/order-audit?${query}`
    : "/admin/order-audit";
}

function getCategoryLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      ORDER: "주문",
      QUOTE: "견적",
      PAYMENT: "결제",
      PRODUCTION: "제작",
      DELIVERY: "배송",
      REFUND: "취소·환불",
    };

  return labels[value] ||
    value;
}

function getSourceLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      ADMIN: "관리자",
      CUSTOMER: "고객",
      WEBHOOK: "토스 웹훅",
      SYSTEM: "시스템",
    };

  return labels[value] ||
    value;
}

function getFieldLabel(
  value: string,
) {
  const labels:
    Record<string, string> = {
      productType: "상품 종류",
      productName: "상품명",
      specification: "제작 사양",
      quantity: "수량",
      productAmount: "상품 금액",
      shippingFee: "배송비",
      totalAmount: "최종 금액",
      status: "결제 상태",
      paymentKey: "결제키",
      paymentMethod: "결제수단",
      paidAt: "결제일",
      canceledAt: "취소·환불일",
      productionStage: "제작 단계",
      proofFileUrl: "교정본",
      recipientName: "수령인",
      recipientPhone: "수령인 연락처",
      postalCode: "우편번호",
      shippingAddress1: "기본 배송지",
      shippingAddress2: "상세 배송지",
      shippingMemo: "배송 메모",
      shippingCarrier: "택배사",
      trackingNumber: "송장번호",
      shippedAt: "발송일",
      completedAt: "완료일",
      productionNote: "관리자 메모",
      baseline: "기준 상태",
    };

  return labels[value] ||
    value;
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
      second: "2-digit",
      hour12: false,
    },
  ).format(value);
}

const adminAuditStyles = `
  .admin-order-audit-page,
  .admin-order-audit-page * {
    box-sizing: border-box;
  }

  .admin-order-audit-page {
    color: #432f26;
    font-family: var(--font-daldongne-sans), "Noto Sans KR", sans-serif;
  }

  .admin-order-audit-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-order-audit-shell {
    width: min(1500px, 100%);
    margin: 0 auto;
  }

  .admin-order-audit-hero {
    padding: 27px 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    border: 1px solid rgba(128, 83, 61, 0.13);
    border-radius: 24px;
    background: linear-gradient(135deg, #fffdf9, #fff4ec);
    box-shadow: 0 17px 39px rgba(91, 58, 43, 0.06);
  }

  .admin-order-audit-hero p,
  .admin-order-audit-list-heading p {
    margin: 0;
    color: #df6550;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .admin-order-audit-hero h1 {
    margin: 8px 0 0;
    font-family: var(--font-daldongne-serif), "Noto Serif KR", serif;
    font-size: clamp(30px, 4vw, 47px);
    letter-spacing: -0.055em;
  }

  .admin-order-audit-hero > div:first-child > span {
    display: block;
    margin-top: 9px;
    color: #806b62;
    font-size: 11px;
    line-height: 1.7;
  }

  .admin-order-audit-hero > div:last-child {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .admin-order-audit-hero a {
    min-height: 40px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    border: 1px solid #d6b2a3;
    border-radius: 10px;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-order-audit-stats {
    margin-top: 15px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .admin-order-audit-stats article {
    padding: 17px;
    border: 1px solid rgba(128, 83, 61, 0.12);
    border-radius: 17px;
    background: #ffffff;
  }

  .admin-order-audit-stats span {
    color: #937b70;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-order-audit-stats strong {
    display: block;
    margin-top: 7px;
    font-size: 27px;
  }

  .admin-order-audit-stats small {
    margin-left: 3px;
    font-size: 10px;
  }

  .admin-order-audit-filter,
  .admin-order-audit-list-panel {
    margin-top: 15px;
    padding: 20px;
    border: 1px solid rgba(128, 83, 61, 0.12);
    border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(91, 58, 43, 0.045);
  }

  .admin-order-audit-filter form {
    display: grid;
    grid-template-columns: minmax(230px, 1.4fr) repeat(3, minmax(135px, .6fr)) auto;
    align-items: end;
    gap: 9px;
  }

  .admin-order-audit-filter label span {
    display: block;
    margin-bottom: 6px;
    color: #775e53;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-order-audit-filter input,
  .admin-order-audit-filter select {
    width: 100%;
    min-height: 42px;
    padding: 0 11px;
    border: 1px solid #dec8bf;
    border-radius: 10px;
    background: #fffdfa;
    font: inherit;
    font-size: 9px;
  }

  .admin-order-audit-filter form > div {
    display: flex;
    gap: 6px;
  }

  .admin-order-audit-filter button,
  .admin-order-audit-filter form > div a {
    min-height: 42px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d6b2a3;
    border-radius: 10px;
    background: #ffffff;
    font: inherit;
    font-size: 8px;
    font-weight: 900;
    cursor: pointer;
  }

  .admin-order-audit-filter button {
    border-color: transparent;
    color: #ffffff;
    background: #764137;
  }

  .admin-order-audit-list-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  .admin-order-audit-list-heading h2 {
    margin: 5px 0 0;
    font-size: 21px;
  }

  .admin-order-audit-list-heading > span {
    color: #947c71;
    font-size: 8px;
  }

  .admin-order-audit-list {
    margin-top: 16px;
    display: grid;
    gap: 11px;
  }

  .admin-order-audit-list > article {
    min-width: 0;
    padding: 17px;
    border: 1px solid #eaded8;
    border-radius: 16px;
    background: #fffcfa;
  }

  .admin-order-audit-card-head,
  .admin-order-audit-order {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 13px;
  }

  .admin-order-audit-card-head > div {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-order-audit-card-head strong,
  .admin-order-audit-card-head span,
  .admin-order-audit-card-head em {
    min-height: 24px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 7px;
    font-style: normal;
    font-weight: 900;
  }

  .admin-order-audit-card-head strong {
    color: #654a3f;
    background: #f3e6df;
  }

  .admin-order-audit-card-head span {
    color: #4e6787;
    background: #e8f0fa;
  }

  .admin-order-audit-card-head em {
    color: #387049;
    background: #e5f3e8;
  }

  .admin-order-audit-card-head em[data-private="true"] {
    color: #85611d;
    background: #fff1c9;
  }

  .admin-order-audit-card-head time {
    color: #9a8479;
    font-size: 8px;
  }

  .admin-order-audit-order {
    margin-top: 13px;
    padding: 12px;
    border-radius: 12px;
    background: #f9f3ef;
  }

  .admin-order-audit-order > div {
    min-width: 0;
  }

  .admin-order-audit-order a,
  .admin-order-audit-order strong,
  .admin-order-audit-order code {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-order-audit-order a {
    color: #b95647;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-order-audit-order strong {
    margin-top: 4px;
    font-size: 10px;
  }

  .admin-order-audit-order code {
    margin-top: 4px;
    color: #8e7569;
    font-size: 7px;
  }

  .admin-order-audit-order > span {
    flex: 0 0 auto;
    font-size: 13px;
    font-weight: 900;
  }

  .admin-order-audit-list h3 {
    margin: 13px 0 0;
    font-size: 13px;
    line-height: 1.65;
  }

  .admin-order-audit-actor {
    margin: 6px 0 0;
    color: #8c756a;
    font-size: 8px;
  }

  .admin-order-audit-fields {
    margin-top: 11px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .admin-order-audit-fields span {
    padding: 5px 8px;
    border-radius: 999px;
    color: #6e584f;
    background: #eee4de;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-order-audit-list details {
    margin-top: 12px;
    border: 1px solid #dfd0c9;
    border-radius: 11px;
    background: #ffffff;
  }

  .admin-order-audit-list summary {
    padding: 11px 13px;
    font-size: 8px;
    font-weight: 900;
    cursor: pointer;
  }

  .admin-order-audit-json-grid {
    padding: 0 12px 12px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .admin-order-audit-json-grid section {
    min-width: 0;
  }

  .admin-order-audit-json-grid section > strong {
    font-size: 8px;
  }

  .admin-order-audit-json-grid pre {
    max-height: 330px;
    margin: 7px 0 0;
    padding: 11px;
    overflow: auto;
    border-radius: 9px;
    color: #46362f;
    background: #f5f0ed;
    font-size: 8px;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .admin-order-audit-empty {
    margin-top: 15px;
    padding: 45px;
    border: 1px dashed #d8c1b7;
    border-radius: 15px;
    color: #947d72;
    background: #fffaf7;
    text-align: center;
  }

  .admin-order-audit-pagination {
    margin-top: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .admin-order-audit-pagination a {
    min-width: 70px;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d8b9ac;
    border-radius: 9px;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-order-audit-pagination a[data-disabled="true"] {
    opacity: .4;
    pointer-events: none;
  }

  .admin-order-audit-pagination span {
    color: #8b7469;
    font-size: 8px;
    font-weight: 900;
  }

  @media (max-width: 1100px) {
    .admin-order-audit-filter form {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .admin-order-audit-filter form > div {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 700px) {
    .admin-order-audit-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 22px;
    }

    .admin-order-audit-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .admin-order-audit-filter form {
      display: block;
    }

    .admin-order-audit-filter label {
      display: block;
      margin-bottom: 10px;
    }

    .admin-order-audit-card-head,
    .admin-order-audit-order {
      align-items: flex-start;
      flex-direction: column;
    }

    .admin-order-audit-json-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 430px) {
    .admin-order-audit-stats {
      grid-template-columns: 1fr;
    }
  }
`;