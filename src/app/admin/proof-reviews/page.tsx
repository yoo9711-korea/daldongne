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

const RESPONSE_TYPES = [
  "APPROVED",
  "CHANGES_REQUESTED",
] as const;

const PROCESSING_STATUSES = [
  "PENDING",
  "RESOLVED",
] as const;

export default async function AdminProofReviewsPage({
  searchParams,
}: PageProps) {
  const session =
    await auth();

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

  const orderRecordId =
    getParam(
      params.orderId,
    ).slice(0, 100);

  const responseType =
    getAllowed(
      params.responseType,
      RESPONSE_TYPES,
    );

  const processingStatus =
    getAllowed(
      params.processingStatus,
      PROCESSING_STATUSES,
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
    Prisma.BookOrderProofReviewWhereInput =
      {};

  if (orderRecordId) {
    where.orderId =
      orderRecordId;
  }

  if (responseType) {
    where.responseType =
      responseType;
  }

  if (
    processingStatus ===
    "PENDING"
  ) {
    where.responseType =
      "CHANGES_REQUESTED";

    where.resolvedAt =
      null;
  }

  if (
    processingStatus ===
    "RESOLVED"
  ) {
    where.resolvedAt = {
      not: null,
    };
  }

  if (query) {
    where.OR = [
      {
        message: {
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
    pendingCount,
    approvedCount,
    todayCount,
  ] = await Promise.all([
    prisma.bookOrderProofReview.count({
      where,
    }),

    prisma.bookOrderProofReview.count({
      where: {
        responseType:
          "CHANGES_REQUESTED",
        resolvedAt: null,
      },
    }),

    prisma.bookOrderProofReview.count({
      where: {
        responseType:
          "APPROVED",
      },
    }),

    prisma.bookOrderProofReview.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
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

  const reviews =
    await prisma.bookOrderProofReview.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip:
        (safePage - 1) *
        PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        responseType: true,
        message: true,
        proofFileUrl: true,
        proofSentAt: true,
        resolvedAt: true,
        resolvedById: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderId: true,
            productName: true,
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
    <main className="admin-proof-reviews-page">
      <style>
        {adminProofReviewsStyles}
      </style>

      <div className="admin-proof-reviews-shell">
        <header className="admin-proof-reviews-hero">
          <div>
            <p>
              ADMIN · PROOF REVIEW
            </p>

            <h1>
              고객 교정 응답
            </h1>

            <span>
              고객의 교정 승인과 수정
              요청을 주문별·교정본
              회차별로 확인합니다.
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

        <section className="admin-proof-reviews-stats">
          <Stat
            label="검색된 응답"
            value={totalCount}
          />

          <Stat
            label="수정 처리 대기"
            value={pendingCount}
            tone="warning"
          />

          <Stat
            label="누적 교정 승인"
            value={approvedCount}
            tone="approved"
          />

          <Stat
            label="오늘 접수"
            value={todayCount}
          />
        </section>

        <section className="admin-proof-reviews-filter">
          <form
            action="/admin/proof-reviews"
            method="get"
          >
            {orderRecordId ? (
              <input
                type="hidden"
                name="orderId"
                value={
                  orderRecordId
                }
              />
            ) : null}

            <label>
              <span>
                교정 응답 검색
              </span>

              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="주문번호, 책, 고객, 수정 내용"
              />
            </label>

            <label>
              <span>
                응답 종류
              </span>

              <select
                name="responseType"
                defaultValue={
                  responseType
                }
              >
                <option value="">
                  전체 응답
                </option>

                <option value="APPROVED">
                  교정 승인
                </option>

                <option value="CHANGES_REQUESTED">
                  수정 요청
                </option>
              </select>
            </label>

            <label>
              <span>
                처리 상태
              </span>

              <select
                name="processingStatus"
                defaultValue={
                  processingStatus
                }
              >
                <option value="">
                  전체 상태
                </option>

                <option value="PENDING">
                  수정 처리 대기
                </option>

                <option value="RESOLVED">
                  수정 처리 완료
                </option>
              </select>
            </label>

            <div>
              <button type="submit">
                검색 적용
              </button>

              <Link href="/admin/proof-reviews">
                초기화
              </Link>
            </div>
          </form>
        </section>

        {orderRecordId ? (
          <div className="admin-proof-reviews-order-filter">
            <span>
              특정 주문의 교정 응답만
              표시하고 있습니다.
            </span>

            <Link href="/admin/proof-reviews">
              전체 주문 보기
            </Link>
          </div>
        ) : null}

        <section className="admin-proof-reviews-list-panel">
          <div className="admin-proof-reviews-list-heading">
            <div>
              <p>
                PROOF RESPONSES
              </p>

              <h2>
                총{" "}
                {totalCount.toLocaleString()}
                건
              </h2>
            </div>

            <span>
              {safePage} / {totalPages} 페이지
            </span>
          </div>

          {reviews.length > 0 ? (
            <div className="admin-proof-reviews-list">
              {reviews.map(
                (review) => {
                  const isPending =
                    review.responseType ===
                      "CHANGES_REQUESTED" &&
                    !review.resolvedAt;

                  return (
                    <article
                      key={review.id}
                      data-pending={
                        isPending
                          ? "true"
                          : "false"
                      }
                    >
                      <div className="admin-proof-review-card-heading">
                        <div>
                          <strong
                            data-response={
                              review.responseType
                            }
                          >
                            {review.responseType ===
                            "APPROVED"
                              ? "교정 승인"
                              : "수정 요청"}
                          </strong>

                          {isPending ? (
                            <span data-tone="pending">
                              처리 대기
                            </span>
                          ) : review.resolvedAt ? (
                            <span data-tone="resolved">
                              처리 완료
                            </span>
                          ) : (
                            <span data-tone="approved">
                              승인 완료
                            </span>
                          )}
                        </div>

                        <time>
                          {formatDateTime(
                            review.createdAt,
                          )}
                        </time>
                      </div>

                      <div className="admin-proof-review-card-order">
                        <div>
                          <span>
                            주문번호
                          </span>

                          <strong>
                            {
                              review
                                .order
                                .orderId
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            책·상품
                          </span>

                          <strong>
                            {review.order
                              .book
                              ?.title ||
                              review
                                .order
                                .productName}
                          </strong>
                        </div>

                        <div>
                          <span>
                            고객
                          </span>

                          <strong>
                            {review.author
                              .name ||
                              review.author
                                .email ||
                              "정보 없음"}
                          </strong>
                        </div>
                      </div>

                      <div className="admin-proof-review-card-message">
                        {review.message ||
                          (review.responseType ===
                          "APPROVED"
                            ? "고객이 교정본을 최종 승인했습니다."
                            : "수정 요청 내용이 없습니다.")}
                      </div>

                      <div className="admin-proof-review-card-meta">
                        <span>
                          제작 단계{" "}
                          {getProductionStageLabel(
                            String(
                              review
                                .order
                                .productionStage,
                            ),
                          )}
                        </span>

                        <span>
                          교정본 전달{" "}
                          {formatDateTime(
                            review.proofSentAt,
                          )}
                        </span>

                        {review.resolvedAt ? (
                          <span>
                            처리 완료{" "}
                            {formatDateTime(
                              review.resolvedAt,
                            )}
                          </span>
                        ) : null}
                      </div>

                      <div className="admin-proof-review-card-actions">
                        <Link
                          href={`/admin/orders/${review.order.id}`}
                        >
                          주문 상세 확인
                        </Link>

                        <a
                          href={
                            review.proofFileUrl
                          }
                          target={
                            review.proofFileUrl.startsWith(
                              "http",
                            )
                              ? "_blank"
                              : undefined
                          }
                          rel="noreferrer"
                        >
                          해당 교정본 열기
                        </a>

                        <Link
                          href={`/admin/order-audit?orderId=${encodeURIComponent(
                            review.order.id,
                          )}`}
                        >
                          주문 이력
                        </Link>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="admin-proof-reviews-empty">
              검색 조건에 해당하는 교정
              응답이 없습니다.
            </div>
          )}

          {totalPages > 1 ? (
            <nav
              className="admin-proof-reviews-pagination"
              aria-label="교정 응답 페이지 이동"
            >
              {safePage > 1 ? (
                <Link
                  href={buildPageHref({
                    query,
                    orderRecordId,
                    responseType,
                    processingStatus,
                    page:
                      safePage - 1,
                  })}
                >
                  이전
                </Link>
              ) : (
                <span>
                  이전
                </span>
              )}

              <strong>
                {safePage} / {totalPages}
              </strong>

              {safePage <
              totalPages ? (
                <Link
                  href={buildPageHref({
                    query,
                    orderRecordId,
                    responseType,
                    processingStatus,
                    page:
                      safePage + 1,
                  })}
                >
                  다음
                </Link>
              ) : (
                <span>
                  다음
                </span>
              )}
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?:
    | "default"
    | "warning"
    | "approved";
}) {
  return (
    <article data-tone={tone}>
      <span>
        {label}
      </span>

      <strong>
        {value.toLocaleString()}
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
  if (
    typeof value === "string"
  ) {
    return value.trim();
  }

  if (
    Array.isArray(value)
  ) {
    return (
      value[0]?.trim() ||
      ""
    );
  }

  return "";
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
  const normalized =
    getParam(value);

  return allowed.includes(
    normalized as T[number],
  )
    ? (normalized as T[number])
    : "";
}

function buildPageHref({
  query,
  orderRecordId,
  responseType,
  processingStatus,
  page,
}: {
  query: string;
  orderRecordId: string;
  responseType: string;
  processingStatus: string;
  page: number;
}) {
  const params =
    new URLSearchParams();

  if (query) {
    params.set(
      "q",
      query,
    );
  }

  if (orderRecordId) {
    params.set(
      "orderId",
      orderRecordId,
    );
  }

  if (responseType) {
    params.set(
      "responseType",
      responseType,
    );
  }

  if (processingStatus) {
    params.set(
      "processingStatus",
      processingStatus,
    );
  }

  params.set(
    "page",
    String(page),
  );

  return `/admin/proof-reviews?${params.toString()}`;
}

function getProductionStageLabel(
  value: string,
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
      DELIVERED: "배송 완료",
      COMPLETED: "제작 완료",
      ON_HOLD: "제작 보류",
    };

  return (
    labels[value] ||
    value
  );
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

const adminProofReviewsStyles = `
  .admin-proof-reviews-page,
  .admin-proof-reviews-page * {
    box-sizing: border-box;
  }

  .admin-proof-reviews-page {
    min-height: 100vh;
    padding: 28px 20px 60px;
    color: #4f3a31;
    background:
      linear-gradient(
        180deg,
        #fffaf6,
        #f7f1ec
      );
  }

  .admin-proof-reviews-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-proof-reviews-shell {
    width: min(
      1240px,
      100%
    );
    margin: 0 auto;
  }

  .admin-proof-reviews-hero {
    padding: 27px;
    display: flex;
    align-items: flex-end;
    justify-content:
      space-between;
    gap: 20px;
    border:
      1px solid
      rgba(
        126,
        82,
        61,
        0.13
      );
    border-radius: 24px;
    background: #ffffff;
    box-shadow:
      0 15px 38px
      rgba(
        95,
        57,
        40,
        0.055
      );
  }

  .admin-proof-reviews-hero p,
  .admin-proof-reviews-list-heading p {
    margin: 0;
    color: #79569a;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .admin-proof-reviews-hero h1 {
    margin: 7px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(
        27px,
        4vw,
        42px
      );
    letter-spacing: -0.05em;
  }

  .admin-proof-reviews-hero
  > div
  > span {
    display: block;
    margin-top: 8px;
    color: #8d776d;
    font-size: 10px;
    line-height: 1.7;
  }

  .admin-proof-reviews-hero
  > div:last-child {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .admin-proof-reviews-hero
  > div:last-child
  a {
    min-height: 41px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid
      #d8c1b7;
    border-radius: 11px;
    color: #71574c;
    background: #fffaf7;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-proof-reviews-stats {
    margin-top: 14px;
    display: grid;
    grid-template-columns:
      repeat(
        4,
        minmax(0, 1fr)
      );
    gap: 10px;
  }

  .admin-proof-reviews-stats article {
    padding: 17px;
    border:
      1px solid
      #eadfd9;
    border-radius: 16px;
    background: #ffffff;
  }

  .admin-proof-reviews-stats span,
  .admin-proof-reviews-stats strong {
    display: block;
  }

  .admin-proof-reviews-stats span {
    color: #927c71;
    font-size: 9px;
    font-weight: 800;
  }

  .admin-proof-reviews-stats strong {
    margin-top: 7px;
    font-size: 24px;
  }

  .admin-proof-reviews-stats
  article[data-tone="warning"] {
    border-color: #e7b7ad;
    background: #fff2ef;
  }

  .admin-proof-reviews-stats
  article[data-tone="warning"]
  strong {
    color: #9b4e43;
  }

  .admin-proof-reviews-stats
  article[data-tone="approved"] {
    border-color: #bad9c4;
    background: #eef8f1;
  }

  .admin-proof-reviews-stats
  article[data-tone="approved"]
  strong {
    color: #3c704d;
  }

  .admin-proof-reviews-filter,
  .admin-proof-reviews-list-panel {
    margin-top: 14px;
    padding: 20px;
    border:
      1px solid
      #eadfd9;
    border-radius: 20px;
    background: #ffffff;
  }

  .admin-proof-reviews-filter form {
    display: grid;
    grid-template-columns:
      minmax(240px, 2fr)
      minmax(150px, 1fr)
      minmax(150px, 1fr)
      auto;
    gap: 10px;
    align-items: end;
  }

  .admin-proof-reviews-filter label span {
    display: block;
    margin-bottom: 6px;
    color: #8b756b;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-proof-reviews-filter input,
  .admin-proof-reviews-filter select {
    width: 100%;
    min-height: 43px;
    padding: 0 12px;
    border:
      1px solid
      #dbc8bf;
    border-radius: 10px;
    color: #554037;
    background: #ffffff;
    font: inherit;
    font-size: 10px;
  }

  .admin-proof-reviews-filter
  form
  > div {
    display: flex;
    gap: 7px;
  }

  .admin-proof-reviews-filter button,
  .admin-proof-reviews-filter
  form
  > div
  a {
    min-height: 43px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font: inherit;
    font-size: 9px;
    font-weight: 900;
    cursor: pointer;
  }

  .admin-proof-reviews-filter button {
    border: 0;
    color: #ffffff;
    background: #745493;
  }

  .admin-proof-reviews-filter
  form
  > div
  a {
    border:
      1px solid
      #dbc8bf;
    background: #fffaf7;
  }

  .admin-proof-reviews-order-filter {
    margin-top: 12px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content:
      space-between;
    gap: 12px;
    border:
      1px solid
      #d7c5e5;
    border-radius: 13px;
    color: #6f5584;
    background: #f8f2fd;
    font-size: 9px;
  }

  .admin-proof-reviews-order-filter
  a {
    font-weight: 900;
  }

  .admin-proof-reviews-list-heading {
    display: flex;
    align-items: center;
    justify-content:
      space-between;
    gap: 15px;
  }

  .admin-proof-reviews-list-heading h2 {
    margin: 5px 0 0;
    font-size: 21px;
  }

  .admin-proof-reviews-list-heading
  > span {
    color: #927d73;
    font-size: 9px;
  }

  .admin-proof-reviews-list {
    margin-top: 15px;
    display: grid;
    gap: 10px;
  }

  .admin-proof-reviews-list article {
    padding: 17px;
    border:
      1px solid
      #eadfd9;
    border-radius: 16px;
    background: #fffcfa;
  }

  .admin-proof-reviews-list
  article[data-pending="true"] {
    border-color: #e5afa4;
    background:
      linear-gradient(
        135deg,
        #fff3f0,
        #fffaf8
      );
  }

  .admin-proof-review-card-heading {
    display: flex;
    align-items: center;
    justify-content:
      space-between;
    gap: 12px;
  }

  .admin-proof-review-card-heading
  > div {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-proof-review-card-heading
  strong,
  .admin-proof-review-card-heading
  span {
    min-height: 25px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-proof-review-card-heading
  strong {
    color: #924d42;
    background: #ffe7e2;
  }

  .admin-proof-review-card-heading
  strong[data-response="APPROVED"] {
    color: #39704b;
    background: #e3f2e7;
  }

  .admin-proof-review-card-heading
  span[data-tone="pending"] {
    color: #875918;
    background: #fff0c8;
  }

  .admin-proof-review-card-heading
  span[data-tone="resolved"] {
    color: #536b87;
    background: #eaf1fa;
  }

  .admin-proof-review-card-heading
  span[data-tone="approved"] {
    color: #39704b;
    background: #e3f2e7;
  }

  .admin-proof-review-card-heading
  time {
    color: #9b877d;
    font-size: 8px;
  }

  .admin-proof-review-card-order {
    margin-top: 12px;
    padding: 12px;
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
    gap: 10px;
    border:
      1px solid
      #eee3dd;
    border-radius: 12px;
    background: #ffffff;
  }

  .admin-proof-review-card-order
  span,
  .admin-proof-review-card-order
  strong {
    display: block;
  }

  .admin-proof-review-card-order
  span {
    color: #9a857b;
    font-size: 8px;
  }

  .admin-proof-review-card-order
  strong {
    margin-top: 4px;
    font-size: 10px;
    overflow-wrap: anywhere;
  }

  .admin-proof-review-card-message {
    margin-top: 11px;
    padding: 13px;
    border-left:
      4px solid
      #d8998d;
    border-radius: 9px;
    color: #644b43;
    background: #ffffff;
    font-size: 10px;
    line-height: 1.75;
    white-space: pre-wrap;
  }

  .admin-proof-review-card-meta {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 7px 13px;
    color: #947e74;
    font-size: 8px;
  }

  .admin-proof-review-card-actions {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .admin-proof-review-card-actions
  a {
    min-height: 36px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    border:
      1px solid
      #d8c5bc;
    border-radius: 9px;
    color: #684e43;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-proof-reviews-empty {
    margin-top: 15px;
    padding: 45px 20px;
    border:
      1px dashed
      #d6c1b7;
    border-radius: 14px;
    color: #947e74;
    background: #fffaf7;
    font-size: 10px;
    text-align: center;
  }

  .admin-proof-reviews-pagination {
    margin-top: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }

  .admin-proof-reviews-pagination
  a,
  .admin-proof-reviews-pagination
  span {
    min-width: 58px;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid
      #d7c4bb;
    border-radius: 9px;
    background: #ffffff;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-proof-reviews-pagination
  span {
    opacity: 0.45;
  }

  .admin-proof-reviews-pagination
  strong {
    font-size: 9px;
  }

  @media (max-width: 900px) {
    .admin-proof-reviews-stats {
      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );
    }

    .admin-proof-reviews-filter
    form {
      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );
    }
  }

  @media (max-width: 650px) {
    .admin-proof-reviews-page {
      padding:
        16px
        12px
        45px;
    }

    .admin-proof-reviews-hero,
    .admin-proof-review-card-heading,
    .admin-proof-reviews-order-filter {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-proof-reviews-filter
    form,
    .admin-proof-review-card-order {
      grid-template-columns: 1fr;
    }

    .admin-proof-reviews-filter
    form
    > div,
    .admin-proof-reviews-filter button,
    .admin-proof-reviews-filter
    form
    > div
    a {
      width: 100%;
    }

    .admin-proof-reviews-filter
    form
    > div {
      display: grid;
      grid-template-columns:
        1fr 1fr;
    }
  }
`;