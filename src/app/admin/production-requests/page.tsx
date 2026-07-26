import { auth } from "@/auth";
import CopyTextButton from "@/components/admin/CopyTextButton";
import ProductionRequestStatusButton from "@/components/admin/ProductionRequestStatusButton";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import OrderQuoteForm from "./OrderQuoteForm";
import ProductionManagementForm from "./ProductionManagementForm";

type BookProductType =
  | "DIGITAL_MANUSCRIPT"
  | "BASIC_SOFTCOVER"
  | "CUSTOM_BOOK";

type BookOrderRecord = {
  productType: BookProductType;
  productName: string;
  specification: string | null;
  quantity: number;
  productAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: string;
  orderId: string;
  productionStage: string;
  productionStageUpdatedAt: Date;
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
  shippingAddress2: string | null;
  shippingMemo: string | null;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  shippedAt: Date | null;
  completedAt: Date | null;
  productionNote: string | null;
};

type ProductionRequestRecord = {
  id: string;
  bookId: string;
  authorId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  bookOrder: BookOrderRecord | null;
};

type BookRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  type: string;
};

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
};

type StatusFilter =
  | "ALL"
  | "REQUESTED"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<{
  value: StatusFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "전체",
  },
  {
    value: "REQUESTED",
    label: "상담 신청 접수",
  },
  {
    value: "CONTACTED",
    label: "고객 연락 완료",
  },
  {
    value: "IN_PROGRESS",
    label: "제작 상담 진행 중",
  },
  {
    value: "COMPLETED",
    label: "상담 완료",
  },
  {
    value: "CANCELED",
    label: "취소",
  },
];

export default async function AdminProductionRequestsPage({
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
        id: true,
        role: true,
      },
    });

  if (adminUser?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedSearchParams =
    await searchParams;

  const statusFilter =
    normalizeStatusFilter(
      resolvedSearchParams?.status,
    );

  const searchQuery = String(
    resolvedSearchParams?.q || "",
  )
    .trim()
    .slice(0, 100);

  const requestedPage = normalizePage(
    resolvedSearchParams?.page,
  );

  const matchingBooks = searchQuery
    ? await prisma.book.findMany({
        where: {
          OR: [
            {
              title: {
                contains: searchQuery,
              },
            },
            {
              subtitle: {
                contains: searchQuery,
              },
            },
          ],
        },
        select: {
          id: true,
        },
      })
    : [];

  const matchingBookIds =
    matchingBooks.map(
      (book) => book.id,
    );

  const requestWhere: Prisma.BookProductionRequestWhereInput =
    {};

  if (statusFilter !== "ALL") {
    requestWhere.status =
      statusFilter;
  }

  if (searchQuery) {
    requestWhere.OR = [
      {
        name: {
          contains: searchQuery,
        },
      },
      {
        phone: {
          contains: searchQuery,
        },
      },
      {
        email: {
          contains: searchQuery,
        },
      },
      {
        message: {
          contains: searchQuery,
        },
      },
      ...(matchingBookIds.length > 0
        ? [
            {
              bookId: {
                in: matchingBookIds,
              },
            },
          ]
        : []),
    ];
  }

  const [
    filteredRequestCount,
    statusCountRows,
  ] = await Promise.all([
    prisma.bookProductionRequest.count({
      where: requestWhere,
    }),

    prisma.bookProductionRequest.groupBy(
      {
        by: ["status"],
        _count: {
          _all: true,
        },
      },
    ),
  ]);

  const totalRequestCount =
    statusCountRows.reduce(
      (total, row) =>
        total + row._count._all,
      0,
    );

  const statusCountMap =
    new Map<string, number>(
      statusCountRows.map((row) => [
        String(row.status),
        row._count._all,
      ]),
    );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequestCount /
        PAGE_SIZE,
    ),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const skip =
    (currentPage - 1) *
    PAGE_SIZE;

  const requests =
    (await prisma.bookProductionRequest.findMany(
      {
        where: requestWhere,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          bookId: true,
          authorId: true,
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
              productionStage: true,
              productionStageUpdatedAt: true,
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
              productionNote: true,
            },
          },
        },
      },
    )) as ProductionRequestRecord[];

  const bookIds = Array.from(
    new Set(
      requests.map(
        (request) =>
          request.bookId,
      ),
    ),
  );

  const books = bookIds.length
    ? ((await prisma.book.findMany({
        where: {
          id: {
            in: bookIds,
          },
        },
        select: {
          id: true,
          title: true,
          subtitle: true,
          status: true,
          type: true,
        },
      })) as BookRecord[])
    : [];

  const bookMap = new Map(
    books.map((book) => [
      book.id,
      book,
    ]),
  );

  const firstVisibleRequest =
    requests.length === 0
      ? 0
      : skip + 1;

  const lastVisibleRequest =
    Math.min(
      skip + requests.length,
      filteredRequestCount,
    );

  const pageNumbers =
    getPageNumbers(
      currentPage,
      totalPages,
    );

  const hasActiveCondition =
    statusFilter !== "ALL" ||
    Boolean(searchQuery);

  const paymentReadyCount =
    requests.filter((request) =>
      ["READY", "FAILED"].includes(
        request.bookOrder?.status ||
          "",
      ),
    ).length;

  const quotedCount =
    requests.filter(
      (request) =>
        Boolean(request.bookOrder),
    ).length;

  return (
    <main className="admin-production-page">
      <style>{adminProductionStyles}</style>

      <div className="admin-production-shell">
        <header className="admin-production-hero">
          <div>
            <p>관리자 · 제작 운영</p>

            <h1>
              제작 상담과 주문 견적을
              관리합니다
            </h1>

            <span>
              고객 연락, 상담 상태,
              제작 견적과 결제 준비 상태를
              한 화면에서 확인하세요.
            </span>
          </div>

          <div className="admin-production-hero-actions">
            <Link href="/admin">
              관리자 홈
            </Link>

            <Link href="/admin/books">
              전체 책 관리
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </header>

        <section className="admin-production-summary">
          <SummaryCard
            label="전체 신청"
            value={totalRequestCount}
            tone="coral"
          />

          <SummaryCard
            label="신규 접수"
            value={
              statusCountMap.get(
                "REQUESTED",
              ) ?? 0
            }
            tone="yellow"
          />

          <SummaryCard
            label="고객 연락"
            value={
              statusCountMap.get(
                "CONTACTED",
              ) ?? 0
            }
            tone="blue"
          />

          <SummaryCard
            label="상담 진행"
            value={
              statusCountMap.get(
                "IN_PROGRESS",
              ) ?? 0
            }
            tone="purple"
          />

          <SummaryCard
            label="상담 완료"
            value={
              statusCountMap.get(
                "COMPLETED",
              ) ?? 0
            }
            tone="green"
          />

          <SummaryCard
            label="현재 검색 결과"
            value={filteredRequestCount}
            tone="gray"
          />
        </section>

        <section className="admin-production-current-page">
          <div>
            <span>현재 페이지 견적 등록</span>
            <strong>
              {quotedCount}건
            </strong>
          </div>

          <div>
            <span>현재 페이지 결제 대기</span>
            <strong>
              {paymentReadyCount}건
            </strong>
          </div>

          <p>
            결제 준비 또는 결제 실패
            주문은 고객의 검토·결제
            화면에 표시됩니다.
          </p>
        </section>

        <section className="admin-production-control">
          <form
            action="/admin/production-requests"
            method="get"
            className="admin-production-search"
          >
            {statusFilter !== "ALL" ? (
              <input
                type="hidden"
                name="status"
                value={statusFilter}
              />
            ) : null}

            <label>
              <span>
                상담 신청 검색
              </span>

              <div>
                <SearchIcon />

                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="고객 이름, 연락처, 이메일, 책 제목 검색"
                />
              </div>
            </label>

            <button type="submit">
              검색 적용
            </button>

            {searchQuery ? (
              <Link
                href={buildListHref({
                  status:
                    statusFilter,
                })}
              >
                검색 초기화
              </Link>
            ) : null}
          </form>

          <div className="admin-production-filters">
            <p>상담 진행 상태</p>

            <div>
              {STATUS_FILTERS.map(
                (filter) => {
                  const active =
                    filter.value ===
                    statusFilter;

                  const count =
                    filter.value ===
                    "ALL"
                      ? totalRequestCount
                      : statusCountMap.get(
                          filter.value,
                        ) ?? 0;

                  return (
                    <Link
                      key={filter.value}
                      href={buildListHref(
                        {
                          status:
                            filter.value,
                          searchQuery,
                        },
                      )}
                      data-active={
                        active
                          ? "true"
                          : "false"
                      }
                    >
                      {filter.label}
                      <small>
                        {count}
                      </small>
                    </Link>
                  );
                },
              )}
            </div>
          </div>
        </section>

        <section className="admin-production-list-section">
          <div className="admin-production-list-head">
            <div>
              <p>제작 상담 신청 목록</p>

              <h2>
                고객 요청과 견적을
                순서대로 처리하세요
              </h2>

              <span>
                {filteredRequestCount > 0
                  ? `${filteredRequestCount.toLocaleString()}건 중 ${firstVisibleRequest.toLocaleString()}–${lastVisibleRequest.toLocaleString()}번째 신청`
                  : "현재 조건에 맞는 신청이 없습니다."}
              </span>
            </div>

            {hasActiveCondition ? (
              <Link href="/admin/production-requests">
                전체 조건 초기화
              </Link>
            ) : null}
          </div>

          {requests.length > 0 ? (
            <>
              <div className="admin-production-list">
                {requests.map(
                  (
                    request,
                    index,
                  ) => (
                    <ProductionRequestCard
                      key={
                        request.id
                      }
                      request={
                        request
                      }
                      book={bookMap.get(
                        request.bookId,
                      )}
                      number={
                        skip +
                        index +
                        1
                      }
                    />
                  ),
                )}
              </div>

              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                pageNumbers={
                  pageNumbers
                }
                status={statusFilter}
                searchQuery={
                  searchQuery
                }
              />
            </>
          ) : (
            <div className="admin-production-empty">
              <span aria-hidden="true">
                <SearchIcon />
              </span>

              <strong>
                현재 조건에 맞는 제작
                상담 신청이 없습니다.
              </strong>

              <p>
                검색어를 지우거나 다른
                진행 상태를 선택해 주세요.
              </p>

              <Link href="/admin/production-requests">
                전체 신청 보기
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProductionRequestCard({
  request,
  book,
  number,
}: {
  request: ProductionRequestRecord;
  book: BookRecord | undefined;
  number: number;
}) {
  const order =
    request.bookOrder;

  return (
    <article className="admin-production-card">
      <div className="admin-production-card-head">
        <div className="admin-production-number">
          <span>접수 번호</span>
          <strong>
            #{number}
          </strong>
        </div>

        <div className="admin-production-title">
          <div>
            <StatusBadge
              status={
                request.status
              }
            />

            {order ? (
              <OrderStatusBadge
                status={
                  order.status
                }
              />
            ) : (
              <span className="admin-production-no-quote">
                견적 미등록
              </span>
            )}
          </div>

          <h3>
            {book?.title ||
              "삭제되었거나 찾을 수 없는 책"}
          </h3>

          <p>
            {book?.subtitle ||
              getBookTypeLabel(
                book?.type || "",
              )}
          </p>
        </div>

        <div className="admin-production-date">
          <span>
            신청{" "}
            {formatDateTime(
              request.createdAt,
            )}
          </span>

          <span>
            최근 처리{" "}
            {formatDateTime(
              request.updatedAt,
            )}
          </span>
        </div>

        <Link
          href={`/admin/books/${request.bookId}`}
          className="admin-production-book-link"
        >
          책 상세 보기
          <span aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      <div className="admin-production-info-grid">
        <InfoBox
          title="신청자"
          value={
            request.name ||
            "이름 없음"
          }
        />

        <InfoBox
          title="연락처"
          value={
            request.phone ||
            "연락처 없음"
          }
          action={
            <CopyTextButton
              value={request.phone}
              label="번호 복사"
            />
          }
        />

        <InfoBox
          title="이메일"
          value={
            request.email ||
            "이메일 없음"
          }
          action={
            <CopyTextButton
              value={request.email}
              label="메일 복사"
            />
          }
        />

        <InfoBox
          title="책 상태"
          value={getBookStatusLabel(
            book?.status || "",
          )}
        />

        <InfoBox
          title="책 종류"
          value={getBookTypeLabel(
            book?.type || "",
          )}
        />
      </div>

      <div className="admin-production-message">
        <strong>
          고객 요청 내용
        </strong>

        <p>
          {request.message ||
            "별도로 작성한 요청 내용이 없습니다."}
        </p>
      </div>

      {order ? (
        <section className="admin-production-order-summary">
          <div>
            <p>등록된 제작 견적</p>

            <h4>
              {order.productName}
            </h4>

            <span>
              {order.specification ||
                "별도 제작 사양이 없습니다."}
            </span>
          </div>

          <div className="admin-production-order-numbers">
            <PriceBox
              label="수량"
              value={`${order.quantity.toLocaleString()}권`}
            />

            <PriceBox
              label="상품 금액"
              value={`${order.productAmount.toLocaleString()}원`}
            />

            <PriceBox
              label="배송비"
              value={`${order.shippingFee.toLocaleString()}원`}
            />

            <PriceBox
              label="총 결제금액"
              value={`${order.totalAmount.toLocaleString()}원`}
              total
            />
          </div>

          <div className="admin-production-order-id">
            <span>주문번호</span>
            <strong>
              {order.orderId}
            </strong>
          </div>
        </section>
      ) : null}

      <div className="admin-production-work-grid">
        <section className="admin-production-quote-panel">
          <div>
            <p>제작 견적</p>

            <h4>
              {order
                ? "등록한 견적을 확인하거나 수정합니다"
                : "고객에게 보여줄 제작 견적을 등록합니다"}
            </h4>
          </div>

          <OrderQuoteForm
            requestId={request.id}
            requestStatus={
              request.status
            }
            initialOrder={
              request.bookOrder
            }
          />
        </section>

        <section className="admin-production-status-panel">
          <div>
            <p>상담 진행 상태</p>

            <h4>
              고객 연락과 상담 단계를
              변경합니다
            </h4>
          </div>

          <ProductionRequestStatusButton
            requestId={request.id}
            currentStatus={
              request.status
            }
          />
        </section>
      </div>

      <ProductionManagementForm
        requestId={request.id}
        initialOrder={request.bookOrder}
      />
    </article>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone:
    | "coral"
    | "yellow"
    | "blue"
    | "purple"
    | "green"
    | "gray";
}) {
  return (
    <article data-tone={tone}>
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>건</small>
      </strong>
    </article>
  );
}

function InfoBox({
  title,
  value,
  action,
}: {
  title: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-production-info-box">
      <div>
        <span>{title}</span>

        <strong>{value}</strong>
      </div>

      {action ? (
        <div className="admin-production-info-action">
          {action}
        </div>
      ) : null}
    </div>
  );
}

function PriceBox({
  label,
  value,
  total = false,
}: {
  label: string;
  value: string;
  total?: boolean;
}) {
  return (
    <div
      className="admin-production-price-box"
      data-total={
        total ? "true" : "false"
      }
    >
      <span>{label}</span>
      <strong>{value}</strong>
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
      className="admin-production-status-badge"
      data-status={status}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-production-order-badge"
      data-status={status}
    >
      {getOrderStatusLabel(
        status,
      )}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="17"
        cy="17"
        r="10"
        stroke="currentColor"
        strokeWidth="2.7"
      />

      <path
        d="m25 25 9 9"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  status,
  searchQuery,
}: {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  status: StatusFilter;
  searchQuery: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="admin-production-pagination"
      aria-label="제작 상담 페이지 이동"
    >
      {currentPage > 1 ? (
        <Link
          href={buildListHref({
            status,
            searchQuery,
            page:
              currentPage - 1,
          })}
        >
          이전
        </Link>
      ) : (
        <span data-disabled="true">
          이전
        </span>
      )}

      {pageNumbers.map(
        (pageNumber) => (
          <Link
            key={pageNumber}
            href={buildListHref({
              status,
              searchQuery,
              page: pageNumber,
            })}
            aria-current={
              pageNumber ===
              currentPage
                ? "page"
                : undefined
            }
            data-active={
              pageNumber ===
              currentPage
                ? "true"
                : "false"
            }
          >
            {pageNumber}
          </Link>
        ),
      )}

      {currentPage <
      totalPages ? (
        <Link
          href={buildListHref({
            status,
            searchQuery,
            page:
              currentPage + 1,
          })}
        >
          다음
        </Link>
      ) : (
        <span data-disabled="true">
          다음
        </span>
      )}
    </nav>
  );
}

function normalizeStatusFilter(
  value: string | undefined,
): StatusFilter {
  if (value === "REQUESTED") {
    return "REQUESTED";
  }

  if (value === "CONTACTED") {
    return "CONTACTED";
  }

  if (value === "IN_PROGRESS") {
    return "IN_PROGRESS";
  }

  if (value === "COMPLETED") {
    return "COMPLETED";
  }

  if (value === "CANCELED") {
    return "CANCELED";
  }

  return "ALL";
}

function normalizePage(
  value: string | undefined,
) {
  const parsed =
    Number.parseInt(
      String(value || "1"),
      10,
    );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return 1;
  }

  return parsed;
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
) {
  const start = Math.max(
    1,
    Math.min(
      currentPage - 2,
      totalPages - 4,
    ),
  );

  const end = Math.min(
    totalPages,
    start + 4,
  );

  const pages: number[] = [];

  for (
    let pageNumber = start;
    pageNumber <= end;
    pageNumber += 1
  ) {
    pages.push(pageNumber);
  }

  return pages;
}

function buildListHref({
  status,
  searchQuery = "",
  page = 1,
}: {
  status: StatusFilter;
  searchQuery?: string;
  page?: number;
}) {
  const params =
    new URLSearchParams();

  if (status !== "ALL") {
    params.set(
      "status",
      status,
    );
  }

  if (searchQuery.trim()) {
    params.set(
      "q",
      searchQuery.trim(),
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
    ? `/admin/production-requests?${query}`
    : "/admin/production-requests";
}

function getStatusLabel(
  status: string,
) {
  if (status === "REQUESTED") {
    return "상담 신청 접수";
  }

  if (status === "CONTACTED") {
    return "고객 연락 완료";
  }

  if (status === "IN_PROGRESS") {
    return "제작 상담 진행 중";
  }

  if (status === "COMPLETED") {
    return "상담 완료";
  }

  if (status === "CANCELED") {
    return "상담 취소";
  }

  return "상태 확인 필요";
}

function getOrderStatusLabel(
  status: string,
) {
  if (status === "READY") {
    return "결제 준비";
  }

  if (status === "FAILED") {
    return "결제 재시도";
  }

  if (status === "PAID") {
    return "결제 완료";
  }

  if (
    status === "IN_PRODUCTION"
  ) {
    return "인쇄 제작 중";
  }

  if (status === "COMPLETED") {
    return "제작 완료";
  }

  if (status === "CANCELED") {
    return "주문 취소";
  }

  return "주문 상태 확인";
}

function getBookStatusLabel(
  status: string,
) {
  if (status === "DRAFT") {
    return "원고 초안";
  }

  if (
    status === "IN_PRODUCTION"
  ) {
    return "제작 준비 중";
  }

  if (status === "PUBLISHED") {
    return "완성";
  }

  return "상태 확인 필요";
}

function getBookTypeLabel(
  type: string,
) {
  if (type === "LIFE_BOOK") {
    return "부모님 인생책";
  }

  if (type === "FAMILY_BOOK") {
    return "가족 이야기책";
  }

  if (type === "COUPLE_BOOK") {
    return "부부 이야기책";
  }

  if (type === "BABY_BOOK") {
    return "성장 기록책";
  }

  if (type === "TRAVEL_BOOK") {
    return "여행 기록책";
  }

  if (type === "AI_MOVIE") {
    return "AI 영상";
  }

  return "종류 확인 필요";
}

function formatDateTime(
  value: Date | string | unknown,
) {
  if (!value) {
    return "-";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(String(value));

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

const adminProductionStyles = `
  .admin-production-page,
  .admin-production-page * {
    box-sizing: border-box;
  }

  .admin-production-page {
    min-height: 100vh;
    padding: 28px 24px 58px;
    color: #432f26;
    background:
      radial-gradient(
        circle at 6% 8%,
        rgba(255, 228, 211, 0.52),
        transparent 29rem
      ),
      radial-gradient(
        circle at 95% 10%,
        rgba(230, 243, 229, 0.52),
        transparent 26rem
      ),
      linear-gradient(
        180deg,
        #fffdf9,
        #fff8f2
      );
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .admin-production-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-production-page a,
  .admin-production-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .admin-production-page a:hover,
  .admin-production-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .admin-production-page a:focus-visible,
  .admin-production-page button:focus-visible,
  .admin-production-page input:focus-visible,
  .admin-production-page select:focus-visible,
  .admin-production-page textarea:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .admin-production-shell {
    width: min(1420px, 100%);
    margin: 0 auto;
  }

  .admin-production-hero {
    padding: 31px 35px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 26px;
    background:
      linear-gradient(
        135deg,
        rgba(255, 253, 248, 0.98),
        rgba(255, 247, 240, 0.96)
      );
    box-shadow:
      0 19px 46px
      rgba(91, 59, 44, 0.065);
  }

  .admin-production-hero p {
    margin: 0;
    color: #e56852;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-production-hero h1 {
    margin: 8px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(32px, 4vw, 50px);
    line-height: 1.24;
    letter-spacing: -0.055em;
  }

  .admin-production-hero div:first-child > span {
    display: block;
    margin-top: 10px;
    color: #76635a;
    font-size: 13px;
    line-height: 1.75;
  }

  .admin-production-hero-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .admin-production-hero-actions a {
    min-height: 44px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border:
      1px solid #d6b3a3;
    border-radius: 12px;
    color: #755247;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
  }

  .admin-production-hero-actions a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-production-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-production-summary article {
    min-width: 0;
    padding: 15px;
    border:
      1px solid
      rgba(136, 94, 74, 0.11);
    border-radius: 15px;
    background: #ffffff;
    box-shadow:
      0 8px 20px
      rgba(91, 59, 44, 0.04);
  }

  .admin-production-summary article[data-tone="coral"] {
    background: #fff0eb;
  }

  .admin-production-summary article[data-tone="yellow"] {
    background: #fff7da;
  }

  .admin-production-summary article[data-tone="blue"] {
    background: #edf5ff;
  }

  .admin-production-summary article[data-tone="purple"] {
    background: #f3edff;
  }

  .admin-production-summary article[data-tone="green"] {
    background: #edf7e9;
  }

  .admin-production-summary article[data-tone="gray"] {
    background: #f2efed;
  }

  .admin-production-summary span {
    color: #7a675e;
    font-size: 9px;
    font-weight: 850;
  }

  .admin-production-summary strong {
    display: block;
    margin-top: 6px;
    color: #e0644e;
    font-size: 25px;
  }

  .admin-production-summary small {
    margin-left: 3px;
    color: #806d64;
    font-size: 9px;
  }

  .admin-production-current-page {
    margin-top: 13px;
    padding: 14px 18px;
    display: grid;
    grid-template-columns:
      155px 155px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    border:
      1px solid #dfbd84;
    border-radius: 16px;
    background:
      linear-gradient(
        135deg,
        #fff7e7,
        #fffdf9
      );
  }

  .admin-production-current-page > div {
    padding-right: 12px;
    border-right:
      1px dashed
      rgba(137, 95, 72, 0.22);
  }

  .admin-production-current-page span,
  .admin-production-current-page strong {
    display: block;
  }

  .admin-production-current-page span {
    color: #7c685e;
    font-size: 8px;
  }

  .admin-production-current-page strong {
    margin-top: 3px;
    color: #df614b;
    font-size: 18px;
  }

  .admin-production-current-page p {
    margin: 0;
    color: #78645a;
    font-size: 10px;
    line-height: 1.65;
  }

  .admin-production-control,
  .admin-production-list-section {
    margin-top: 16px;
    padding: 22px;
    border:
      1px solid
      rgba(136, 94, 74, 0.13);
    border-radius: 23px;
    background:
      rgba(255, 255, 255, 0.93);
    box-shadow:
      0 14px 36px
      rgba(91, 59, 44, 0.052);
  }

  .admin-production-search {
    display: grid;
    grid-template-columns:
      minmax(260px, 1fr)
      auto auto;
    align-items: end;
    gap: 9px;
  }

  .admin-production-search label > span {
    display: block;
    margin-bottom: 6px;
    color: #6d584e;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-production-search label > div {
    position: relative;
  }

  .admin-production-search svg {
    position: absolute;
    left: 12px;
    top: 50%;
    width: 22px;
    height: 22px;
    color: #9b7d70;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .admin-production-search input {
    width: 100%;
    min-height: 46px;
    padding: 0 14px 0 43px;
    border:
      1px solid
      rgba(142, 99, 78, 0.22);
    border-radius: 12px;
    color: #49362d;
    background: #fffdfb;
    font: inherit;
    font-size: 11px;
  }

  .admin-production-search button,
  .admin-production-search > a {
    min-height: 46px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid #d7b4a3;
    border-radius: 12px;
    color: #765247;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
  }

  .admin-production-search button {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-production-filters {
    margin-top: 17px;
    padding-top: 17px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-production-filters > p {
    margin: 0;
    color: #6d584e;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-production-filters > div {
    margin-top: 9px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-production-filters a {
    min-height: 37px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border:
      1px solid
      rgba(142, 99, 78, 0.18);
    border-radius: 10px;
    color: #72594e;
    background: #ffffff;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-production-filters a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-production-filters small {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: inherit;
    background:
      rgba(120, 82, 64, 0.09);
    font-size: 7px;
  }

  .admin-production-filters a[data-active="true"] small {
    background:
      rgba(255, 255, 255, 0.22);
  }

  .admin-production-list-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 17px;
  }

  .admin-production-list-head p {
    margin: 0;
    color: #e56852;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-production-list-head h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 27px;
    line-height: 1.42;
    letter-spacing: -0.045em;
  }

  .admin-production-list-head div > span {
    display: block;
    margin-top: 5px;
    color: #7a675e;
    font-size: 10px;
  }

  .admin-production-list-head > a {
    min-height: 40px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    border:
      1px solid #d6b3a3;
    border-radius: 11px;
    color: #755247;
    background: #ffffff;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-production-list {
    margin-top: 17px;
    display: grid;
    gap: 14px;
  }

  .admin-production-card {
    min-width: 0;
    padding: 18px;
    border:
      1px solid
      rgba(136, 94, 74, 0.15);
    border-radius: 20px;
    background:
      linear-gradient(
        145deg,
        #ffffff,
        #fff9f5
      );
    box-shadow:
      0 11px 27px
      rgba(83, 53, 40, 0.048);
  }

  .admin-production-card-head {
    display: grid;
    grid-template-columns:
      78px minmax(0, 1fr)
      auto auto;
    align-items: center;
    gap: 13px;
  }

  .admin-production-number {
    padding: 11px;
    border-radius: 12px;
    background: #fff0e9;
    text-align: center;
  }

  .admin-production-number span,
  .admin-production-number strong {
    display: block;
  }

  .admin-production-number span {
    color: #9a7566;
    font-size: 7px;
  }

  .admin-production-number strong {
    margin-top: 3px;
    color: #df624c;
    font-size: 16px;
  }

  .admin-production-title {
    min-width: 0;
  }

  .admin-production-title > div {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .admin-production-title h3 {
    margin: 7px 0 0;
    overflow: hidden;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 19px;
    line-height: 1.42;
    letter-spacing: -0.04em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-production-title p {
    margin: 4px 0 0;
    overflow: hidden;
    color: #79655c;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-production-status-badge,
  .admin-production-order-badge,
  .admin-production-no-quote {
    min-height: 24px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-production-status-badge[data-status="REQUESTED"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-production-status-badge[data-status="CONTACTED"] {
    color: #245d8c;
    background: #e4f2ff;
  }

  .admin-production-status-badge[data-status="IN_PROGRESS"] {
    color: #62438a;
    background: #efe6ff;
  }

  .admin-production-status-badge[data-status="COMPLETED"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-production-status-badge[data-status="CANCELED"] {
    color: #776868;
    background: #f2eeee;
  }

  .admin-production-order-badge {
    color: #3f668e;
    background: #eaf3ff;
  }

  .admin-production-order-badge[data-status="READY"],
  .admin-production-order-badge[data-status="FAILED"] {
    color: #b84836;
    background: #ffe8e2;
  }

  .admin-production-order-badge[data-status="COMPLETED"] {
    color: #4b713c;
    background: #edf7e8;
  }

  .admin-production-no-quote {
    color: #776c66;
    background: #f0ece9;
  }

  .admin-production-date {
    display: grid;
    gap: 3px;
    color: #8e786e;
    font-size: 8px;
    text-align: right;
    white-space: nowrap;
  }

  .admin-production-book-link {
    min-height: 39px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border:
      1px solid #d6b3a3;
    border-radius: 10px;
    color: #755247;
    background: #ffffff;
    font-size: 9px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-production-info-grid {
    margin-top: 14px;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 8px;
  }

  .admin-production-info-box {
    min-width: 0;
    min-height: 80px;
    padding: 11px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 7px;
    border:
      1px solid
      rgba(139, 97, 75, 0.12);
    border-radius: 12px;
    background: #fffaf6;
  }

  .admin-production-info-box > div:first-child {
    min-width: 0;
  }

  .admin-production-info-box span,
  .admin-production-info-box strong {
    display: block;
  }

  .admin-production-info-box span {
    color: #8b766c;
    font-size: 7px;
    font-weight: 850;
  }

  .admin-production-info-box strong {
    margin-top: 5px;
    overflow: hidden;
    color: #4a352c;
    font-size: 10px;
    line-height: 1.5;
    word-break: break-word;
  }

  .admin-production-info-action {
    flex: 0 0 auto;
  }

  .admin-production-info-action button {
    min-height: 28px !important;
    padding: 0 7px !important;
    border-radius: 8px !important;
    font-size: 7px !important;
  }

  .admin-production-message {
    margin-top: 11px;
    padding: 13px;
    border-radius: 13px;
    background: #fff6ef;
  }

  .admin-production-message strong {
    font-size: 9px;
  }

  .admin-production-message p {
    margin: 6px 0 0;
    color: #715e55;
    font-size: 10px;
    line-height: 1.75;
    white-space: pre-line;
    word-break: break-word;
  }

  .admin-production-order-summary {
    margin-top: 11px;
    padding: 15px;
    display: grid;
    grid-template-columns:
      minmax(230px, 0.78fr)
      minmax(450px, 1.22fr);
    gap: 13px;
    border:
      1px solid #dfbd84;
    border-radius: 15px;
    background:
      linear-gradient(
        135deg,
        #fff7e7,
        #fffdf9
      );
  }

  .admin-production-order-summary > div:first-child > p {
    margin: 0;
    color: #e56852;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-production-order-summary h4 {
    margin: 5px 0 0;
    font-size: 14px;
  }

  .admin-production-order-summary > div:first-child > span {
    display: block;
    margin-top: 5px;
    color: #78645a;
    font-size: 9px;
    line-height: 1.6;
    white-space: pre-line;
  }

  .admin-production-order-numbers {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 7px;
  }

  .admin-production-price-box {
    padding: 10px;
    border-radius: 10px;
    background: #ffffff;
  }

  .admin-production-price-box span,
  .admin-production-price-box strong {
    display: block;
  }

  .admin-production-price-box span {
    color: #8b756a;
    font-size: 7px;
  }

  .admin-production-price-box strong {
    margin-top: 4px;
    font-size: 10px;
  }

  .admin-production-price-box[data-total="true"] {
    background: #3d2d25;
  }

  .admin-production-price-box[data-total="true"] span {
    color:
      rgba(255, 255, 255, 0.7);
  }

  .admin-production-price-box[data-total="true"] strong {
    color: #ffffff;
    font-size: 12px;
  }

  .admin-production-order-id {
    grid-column: 1 / -1;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    border-radius: 10px;
    color: #ffffff;
    background: #3d2d25;
  }

  .admin-production-order-id span {
    color:
      rgba(255, 255, 255, 0.68);
    font-size: 7px;
  }

  .admin-production-order-id strong {
    overflow: hidden;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-production-work-grid {
    margin-top: 11px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.35fr)
      minmax(260px, 0.65fr);
    gap: 10px;
  }

  .admin-production-quote-panel,
  .admin-production-status-panel {
    min-width: 0;
    padding: 14px;
    border:
      1px solid
      rgba(139, 97, 75, 0.13);
    border-radius: 14px;
    background: #ffffff;
  }

  .admin-production-quote-panel > div:first-child > p,
  .admin-production-status-panel > div:first-child > p {
    margin: 0;
    color: #e56852;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-production-quote-panel h4,
  .admin-production-status-panel h4 {
    margin: 5px 0 0;
    font-size: 12px;
    line-height: 1.55;
  }

  .admin-production-quote-panel > *:last-child,
  .admin-production-status-panel > *:last-child {
    margin-top: 11px;
  }

  .admin-production-quote-panel form,
  .admin-production-status-panel form {
    max-width: 100%;
  }

  .admin-production-pagination {
    margin-top: 17px;
    padding-top: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-production-pagination a,
  .admin-production-pagination > span {
    min-width: 37px;
    min-height: 37px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid #d6b3a3;
    border-radius: 10px;
    color: #755247;
    background: #ffffff;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-production-pagination a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-production-pagination > span[data-disabled="true"] {
    opacity: 0.42;
  }

  .admin-production-empty {
    margin-top: 17px;
    padding: 52px 20px;
    border:
      1px dashed #ddb2a1;
    border-radius: 17px;
    background: #fffaf7;
    text-align: center;
  }

  .admin-production-empty > span {
    width: 52px;
    height: 52px;
    margin: 0 auto;
    display: block;
    color: #e57059;
  }

  .admin-production-empty svg {
    width: 100%;
    height: 100%;
  }

  .admin-production-empty strong {
    display: block;
    margin-top: 11px;
    font-size: 16px;
  }

  .admin-production-empty p {
    margin: 5px 0 0;
    color: #806b61;
    font-size: 10px;
  }

  .admin-production-empty a {
    min-height: 40px;
    margin-top: 14px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    border-radius: 10px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    font-size: 9px;
    font-weight: 900;
  }

  @media (max-width: 1140px) {
    .admin-production-summary {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-production-card-head {
      grid-template-columns:
        68px minmax(0, 1fr) auto;
    }

    .admin-production-date {
      grid-column: 2;
      text-align: left;
    }

    .admin-production-book-link {
      grid-column: 3;
      grid-row: 1 / span 2;
    }

    .admin-production-info-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-production-order-summary {
      grid-template-columns: 1fr;
    }

    .admin-production-order-id {
      grid-column: auto;
    }
  }

  @media (max-width: 850px) {
    .admin-production-page {
      padding: 18px 13px 42px;
    }

    .admin-production-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 24px;
      border-radius: 21px;
    }

    .admin-production-hero-actions {
      justify-content: flex-start;
    }

    .admin-production-current-page {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-production-current-page p {
      grid-column: 1 / -1;
    }

    .admin-production-search {
      grid-template-columns: 1fr;
    }

    .admin-production-info-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-production-work-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .admin-production-summary {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-production-control,
    .admin-production-list-section {
      padding: 16px;
      border-radius: 18px;
    }

    .admin-production-list-head {
      flex-direction: column;
      align-items: stretch;
    }

    .admin-production-list-head > a {
      justify-content: center;
    }

    .admin-production-card {
      padding: 13px;
      border-radius: 17px;
    }

    .admin-production-card-head {
      grid-template-columns:
        58px minmax(0, 1fr);
    }

    .admin-production-number {
      grid-row: 1 / span 2;
    }

    .admin-production-title {
      grid-column: 2;
    }

    .admin-production-date {
      grid-column: 2;
    }

    .admin-production-book-link {
      grid-column: 1 / -1;
      grid-row: auto;
      justify-content: center;
    }

    .admin-production-info-grid {
      grid-template-columns: 1fr;
    }

    .admin-production-order-numbers {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 420px) {
    .admin-production-current-page {
      grid-template-columns: 1fr;
    }

    .admin-production-current-page > div {
      padding-right: 0;
      padding-bottom: 8px;
      border-right: 0;
      border-bottom:
        1px dashed
        rgba(137, 95, 72, 0.22);
    }

    .admin-production-summary {
      grid-template-columns: 1fr;
    }

    .admin-production-order-numbers {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-production-page a,
    .admin-production-page button {
      transition: none;
    }
  }
`;
