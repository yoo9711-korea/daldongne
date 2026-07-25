import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

type BookStatusFilter =
  | "ALL"
  | "DRAFT"
  | "IN_PRODUCTION"
  | "PUBLISHED";

type BookTypeFilter =
  | "ALL"
  | "LIFE_BOOK"
  | "FAMILY_BOOK"
  | "COUPLE_BOOK"
  | "BABY_BOOK"
  | "TRAVEL_BOOK"
  | "AI_MOVIE";

type ConsultationFilter =
  | "ALL"
  | "WITH"
  | "WITHOUT";

type SortOrder =
  | "UPDATED_DESC"
  | "CREATED_DESC"
  | "CREATED_ASC"
  | "TITLE_ASC";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    type?: string;
    consultation?: string;
    sort?: string;
    q?: string;
    page?: string;
  }>;
};

type BookRecord = {
  id: string;
  authorId: string;
  type: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  status: string;
  pageCount: number | null;
  basedPhotoCount: number | null;
  basedStoryCount: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type AuthorRecord = {
  id: string;
  name: string | null;
  email: string | null;
};

type LatestRequestRecord = {
  id: string;
  bookId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  bookOrder: {
    productName: string;
    totalAmount: number;
    status: string;
    orderId: string;
  } | null;
};

const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<{
  value: BookStatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "전체 상태" },
  { value: "DRAFT", label: "원고 초안" },
  {
    value: "IN_PRODUCTION",
    label: "제작 준비 중",
  },
  { value: "PUBLISHED", label: "완성" },
];

const TYPE_FILTERS: Array<{
  value: BookTypeFilter;
  label: string;
}> = [
  { value: "ALL", label: "전체 종류" },
  {
    value: "LIFE_BOOK",
    label: "부모님 인생책",
  },
  {
    value: "FAMILY_BOOK",
    label: "가족 이야기책",
  },
  {
    value: "COUPLE_BOOK",
    label: "부부 이야기책",
  },
  {
    value: "BABY_BOOK",
    label: "성장 기록책",
  },
  {
    value: "TRAVEL_BOOK",
    label: "여행 기록책",
  },
  {
    value: "AI_MOVIE",
    label: "AI 영상",
  },
];

const CONSULTATION_FILTERS: Array<{
  value: ConsultationFilter;
  label: string;
}> = [
  { value: "ALL", label: "상담 전체" },
  { value: "WITH", label: "상담 있음" },
  { value: "WITHOUT", label: "상담 없음" },
];

const SORT_OPTIONS: Array<{
  value: SortOrder;
  label: string;
}> = [
  {
    value: "UPDATED_DESC",
    label: "최근 수정순",
  },
  {
    value: "CREATED_DESC",
    label: "최근 생성순",
  },
  {
    value: "CREATED_ASC",
    label: "오래된 생성순",
  },
  {
    value: "TITLE_ASC",
    label: "책 제목순",
  },
];

export default async function AdminBooksPage({
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

  const typeFilter =
    normalizeTypeFilter(
      resolvedSearchParams?.type,
    );

  const consultationFilter =
    normalizeConsultationFilter(
      resolvedSearchParams?.consultation,
    );

  const sortOrder =
    normalizeSortOrder(
      resolvedSearchParams?.sort,
    );

  const searchQuery = String(
    resolvedSearchParams?.q || "",
  )
    .trim()
    .slice(0, 100);

  const requestedPage = normalizePage(
    resolvedSearchParams?.page,
  );

  const [
    consultationBookRows,
    matchingAuthors,
  ] = await Promise.all([
    prisma.bookProductionRequest.findMany({
      distinct: ["bookId"],
      select: {
        bookId: true,
      },
    }),

    searchQuery
      ? prisma.user.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: searchQuery,
                },
              },
              {
                email: {
                  contains: searchQuery,
                },
              },
            ],
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const consultationBookIds =
    consultationBookRows.map(
      (row) => row.bookId,
    );

  const matchingAuthorIds =
    matchingAuthors.map(
      (author) => author.id,
    );

  const where: Prisma.BookWhereInput =
    {};

  if (statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  if (typeFilter !== "ALL") {
    where.type = typeFilter;
  }

  if (
    consultationFilter === "WITH"
  ) {
    where.id = {
      in: consultationBookIds,
    };
  }

  if (
    consultationFilter === "WITHOUT" &&
    consultationBookIds.length > 0
  ) {
    where.id = {
      notIn: consultationBookIds,
    };
  }

  if (searchQuery) {
    where.OR = [
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
      {
        summary: {
          contains: searchQuery,
        },
      },
      ...(matchingAuthorIds.length > 0
        ? [
            {
              authorId: {
                in: matchingAuthorIds,
              },
            },
          ]
        : []),
    ];
  }

  const filteredBookCount =
    await prisma.book.count({
      where,
    });

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredBookCount /
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

  const orderBy =
    getBookOrderBy(sortOrder);

  const [
    books,
    statusCountRows,
    typeCountRows,
    totalBookCount,
  ] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        authorId: true,
        type: true,
        title: true,
        subtitle: true,
        summary: true,
        status: true,
        pageCount: true,
        basedPhotoCount: true,
        basedStoryCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }) as Promise<BookRecord[]>,

    prisma.book.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.book.groupBy({
      by: ["type"],
      _count: {
        _all: true,
      },
    }),

    prisma.book.count(),
  ]);

  const authorIds = Array.from(
    new Set(
      books.map(
        (book) => book.authorId,
      ),
    ),
  );

  const bookIds = books.map(
    (book) => book.id,
  );

  const [
    authors,
    productionRequests,
  ] = await Promise.all([
    authorIds.length > 0
      ? (prisma.user.findMany({
          where: {
            id: {
              in: authorIds,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        }) as Promise<
          AuthorRecord[]
        >)
      : Promise.resolve(
          [] as AuthorRecord[],
        ),

    bookIds.length > 0
      ? (prisma.bookProductionRequest.findMany(
          {
            where: {
              bookId: {
                in: bookIds,
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              bookId: true,
              name: true,
              phone: true,
              email: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              bookOrder: {
                select: {
                  productName: true,
                  totalAmount: true,
                  status: true,
                  orderId: true,
                },
              },
            },
          },
        ) as Promise<
          LatestRequestRecord[]
        >)
      : Promise.resolve(
          [] as LatestRequestRecord[],
        ),
  ]);

  const authorMap = new Map(
    authors.map((author) => [
      author.id,
      author,
    ]),
  );

  const latestRequestMap =
    new Map<
      string,
      LatestRequestRecord
    >();

  for (
    const request of
    productionRequests
  ) {
    if (
      !latestRequestMap.has(
        request.bookId,
      )
    ) {
      latestRequestMap.set(
        request.bookId,
        request,
      );
    }
  }

  const statusCountMap =
    new Map<string, number>(
      statusCountRows.map((row) => [
        String(row.status),
        row._count._all,
      ]),
    );

  const typeCountMap =
    new Map<string, number>(
      typeCountRows.map((row) => [
        String(row.type),
        row._count._all,
      ]),
    );

  const firstVisibleBook =
    books.length === 0
      ? 0
      : skip + 1;

  const lastVisibleBook =
    Math.min(
      skip + books.length,
      filteredBookCount,
    );

  const pageNumbers =
    getPageNumbers(
      currentPage,
      totalPages,
    );

  const hasActiveCondition =
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    consultationFilter !==
      "ALL" ||
    sortOrder !==
      "UPDATED_DESC" ||
    Boolean(searchQuery);

  return (
    <main className="admin-books-page">
      <style>
        {adminBooksStyles}
      </style>

      <div className="admin-books-shell">
        <header className="admin-books-hero">
          <div>
            <p>관리자 · 전체 책 관리</p>

            <h1>
              생성된 책과 제작 진행
              상태를 관리합니다
            </h1>

            <span>
              책 소유자, 원고 분량,
              사용 자료와 상담·주문
              현황을 한눈에 확인하세요.
            </span>
          </div>

          <div className="admin-books-hero-actions">
            <Link href="/admin">
              관리자 홈
            </Link>

            <Link href="/admin/production-requests">
              제작 상담 관리
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </header>

        <section className="admin-books-summary">
          <SummaryCard
            label="전체 책"
            value={totalBookCount}
            tone="coral"
          />

          <SummaryCard
            label="원고 초안"
            value={
              statusCountMap.get(
                "DRAFT",
              ) ?? 0
            }
            tone="yellow"
          />

          <SummaryCard
            label="제작 준비"
            value={
              statusCountMap.get(
                "IN_PRODUCTION",
              ) ?? 0
            }
            tone="blue"
          />

          <SummaryCard
            label="완성"
            value={
              statusCountMap.get(
                "PUBLISHED",
              ) ?? 0
            }
            tone="green"
          />

          <SummaryCard
            label="상담 신청 책"
            value={
              consultationBookIds.length
            }
            tone="purple"
          />

          <SummaryCard
            label="현재 검색 결과"
            value={filteredBookCount}
            tone="gray"
          />
        </section>

        <section className="admin-books-control">
          <form
            action="/admin/books"
            method="get"
            className="admin-books-search"
          >
            <label className="admin-books-search-field">
              <span>책 또는 소유자 검색</span>

              <div>
                <SearchIcon />

                <input
                  type="search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="책 제목, 부제, 소개, 소유자 이름·이메일"
                />
              </div>
            </label>

            <FilterSelect
              label="책 상태"
              name="status"
              value={statusFilter}
              options={STATUS_FILTERS}
            />

            <FilterSelect
              label="책 종류"
              name="type"
              value={typeFilter}
              options={TYPE_FILTERS}
            />

            <FilterSelect
              label="상담 여부"
              name="consultation"
              value={
                consultationFilter
              }
              options={
                CONSULTATION_FILTERS
              }
            />

            <FilterSelect
              label="정렬"
              name="sort"
              value={sortOrder}
              options={SORT_OPTIONS}
            />

            <button type="submit">
              조건 적용
            </button>

            {hasActiveCondition ? (
              <Link href="/admin/books">
                전체 초기화
              </Link>
            ) : null}
          </form>

          <div className="admin-books-quick-filters">
            <p>빠른 상태 필터</p>

            <div>
              {STATUS_FILTERS.map(
                (filter) => {
                  const active =
                    filter.value ===
                    statusFilter;

                  const count =
                    filter.value ===
                    "ALL"
                      ? totalBookCount
                      : statusCountMap.get(
                          filter.value,
                        ) ?? 0;

                  return (
                    <Link
                      key={filter.value}
                      href={buildListHref({
                        status:
                          filter.value,
                        type:
                          typeFilter,
                        consultation:
                          consultationFilter,
                        sort:
                          sortOrder,
                        searchQuery,
                      })}
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

          <div className="admin-books-type-overview">
            {TYPE_FILTERS.filter(
              (filter) =>
                filter.value !== "ALL",
            ).map((filter) => (
              <Link
                key={filter.value}
                href={buildListHref({
                  status:
                    statusFilter,
                  type: filter.value,
                  consultation:
                    consultationFilter,
                  sort: sortOrder,
                  searchQuery,
                })}
                data-active={
                  typeFilter ===
                  filter.value
                    ? "true"
                    : "false"
                }
              >
                <span>
                  {filter.label}
                </span>

                <strong>
                  {typeCountMap.get(
                    filter.value,
                  ) ?? 0}
                </strong>
              </Link>
            ))}
          </div>
        </section>

        <section className="admin-books-list-section">
          <div className="admin-books-list-head">
            <div>
              <p>책 목록</p>

              <h2>
                운영 확인이 필요한 책을
                살펴보세요
              </h2>

              <span>
                {filteredBookCount > 0
                  ? `${filteredBookCount.toLocaleString()}권 중 ${firstVisibleBook.toLocaleString()}–${lastVisibleBook.toLocaleString()}번째 책`
                  : "현재 조건에 맞는 책이 없습니다."}
              </span>
            </div>

            {hasActiveCondition ? (
              <Link href="/admin/books">
                전체 조건 초기화
              </Link>
            ) : null}
          </div>

          {books.length > 0 ? (
            <>
              <div className="admin-books-grid">
                {books.map(
                  (book, index) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      author={
                        authorMap.get(
                          book.authorId,
                        )
                      }
                      latestRequest={
                        latestRequestMap.get(
                          book.id,
                        )
                      }
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
                type={typeFilter}
                consultation={
                  consultationFilter
                }
                sort={sortOrder}
                searchQuery={
                  searchQuery
                }
              />
            </>
          ) : (
            <div className="admin-books-empty">
              <span aria-hidden="true">
                <BookIcon />
              </span>

              <strong>
                현재 조건에 맞는 책이
                없습니다.
              </strong>

              <p>
                검색어와 필터 조건을
                변경해 주세요.
              </p>

              <Link href="/admin/books">
                전체 책 보기
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function BookCard({
  book,
  author,
  latestRequest,
  number,
}: {
  book: BookRecord;
  author: AuthorRecord | undefined;
  latestRequest:
    | LatestRequestRecord
    | undefined;
  number: number;
}) {
  return (
    <article className="admin-book-card">
      <div className="admin-book-card-top">
        <div className="admin-book-number">
          <span>목록 번호</span>
          <strong>
            #{number}
          </strong>
        </div>

        <div className="admin-book-card-title">
          <div>
            <BookStatusBadge
              status={book.status}
            />

            <span className="admin-book-type-badge">
              {getBookTypeLabel(
                book.type,
              )}
            </span>

            {latestRequest ? (
              <RequestStatusBadge
                status={
                  latestRequest.status
                }
              />
            ) : (
              <span className="admin-book-no-request">
                상담 없음
              </span>
            )}
          </div>

          <h3>{book.title}</h3>

          <p>
            {book.subtitle ||
              "등록된 부제가 없습니다."}
          </p>
        </div>

        <Link
          href={`/admin/books/${book.id}`}
          className="admin-book-detail-link"
        >
          상세 관리
          <span aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      <div className="admin-book-owner">
        <div>
          <span>책 소유자</span>

          <strong>
            {author?.name ||
              "이름 미등록"}
          </strong>

          <small>
            {author?.email ||
              "이메일 미등록"}
          </small>
        </div>

        <div>
          <span>생성일</span>
          <strong>
            {formatDate(
              book.createdAt,
            )}
          </strong>
        </div>

        <div>
          <span>최근 수정</span>
          <strong>
            {formatDate(
              book.updatedAt,
            )}
          </strong>
        </div>
      </div>

      <div className="admin-book-metrics">
        <MetricBox
          label="예상 분량"
          value={
            book.pageCount &&
            book.pageCount > 0
              ? `${book.pageCount.toLocaleString()}쪽`
              : "미정"
          }
        />

        <MetricBox
          label="사용 사진"
          value={`${(
            book.basedPhotoCount ?? 0
          ).toLocaleString()}장`}
        />

        <MetricBox
          label="사용 이야기"
          value={`${(
            book.basedStoryCount ?? 0
          ).toLocaleString()}개`}
        />

        <MetricBox
          label="상담 여부"
          value={
            latestRequest
              ? "신청 있음"
              : "신청 없음"
          }
        />
      </div>

      {book.summary ? (
        <div className="admin-book-summary">
          <strong>책 소개</strong>

          <p>{book.summary}</p>
        </div>
      ) : null}

      {latestRequest ? (
        <section className="admin-book-request">
          <div>
            <p>최근 제작 상담</p>

            <h4>
              {getRequestStatusLabel(
                latestRequest.status,
              )}
            </h4>

            <span>
              신청자{" "}
              {latestRequest.name ||
                "이름 없음"}
              {" · "}
              {formatDateTime(
                latestRequest.createdAt,
              )}
            </span>
          </div>

          <div className="admin-book-request-contact">
            <span>
              {latestRequest.phone ||
                "연락처 없음"}
            </span>

            <span>
              {latestRequest.email ||
                "이메일 없음"}
            </span>
          </div>

          {latestRequest.bookOrder ? (
            <div className="admin-book-order">
              <div>
                <span>
                  {
                    latestRequest
                      .bookOrder
                      .productName
                  }
                </span>

                <strong>
                  {latestRequest.bookOrder.totalAmount.toLocaleString()}
                  원
                </strong>
              </div>

              <div>
                <OrderStatusBadge
                  status={
                    latestRequest
                      .bookOrder
                      .status
                  }
                />

                <small>
                  {
                    latestRequest
                      .bookOrder
                      .orderId
                  }
                </small>
              </div>
            </div>
          ) : (
            <div className="admin-book-order-empty">
              제작 견적이 아직 등록되지
              않았습니다.
            </div>
          )}

          <Link
            href={`/admin/production-requests?q=${encodeURIComponent(
              book.title,
            )}`}
          >
            상담·견적 관리
            <span aria-hidden="true">
              →
            </span>
          </Link>
        </section>
      ) : (
        <div className="admin-book-no-consultation">
          <span>
            이 책에는 아직 제작 상담
            신청이 없습니다.
          </span>

          <Link
            href={`/admin/books/${book.id}`}
          >
            책 내용 확인
          </Link>
        </div>
      )}
    </article>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <label className="admin-books-select-field">
      <span>{label}</span>

      <select
        name={name}
        defaultValue={value}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
    | "green"
    | "purple"
    | "gray";
}) {
  return (
    <article data-tone={tone}>
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>권</small>
      </strong>
    </article>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="admin-book-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BookStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-book-status-badge"
      data-status={status}
    >
      {getBookStatusLabel(status)}
    </span>
  );
}

function RequestStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className="admin-book-request-badge"
      data-status={status}
    >
      {getRequestStatusLabel(status)}
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
      className="admin-book-order-badge"
      data-status={status}
    >
      {getOrderStatusLabel(status)}
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

function BookIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 13.5c9.5-2.1 16.7.2 22 6.9 5.3-6.7 12.5-9 22-6.9v38.2c-9.5-2.1-16.7.2-22 6.8-5.3-6.6-12.5-8.9-22-6.8V13.5Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M32 20.4v38.1"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  status,
  type,
  consultation,
  sort,
  searchQuery,
}: {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  status: BookStatusFilter;
  type: BookTypeFilter;
  consultation: ConsultationFilter;
  sort: SortOrder;
  searchQuery: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="admin-books-pagination"
      aria-label="관리자 책 목록 페이지 이동"
    >
      {currentPage > 1 ? (
        <Link
          href={buildListHref({
            status,
            type,
            consultation,
            sort,
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
              type,
              consultation,
              sort,
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
            type,
            consultation,
            sort,
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
): BookStatusFilter {
  if (value === "DRAFT") {
    return "DRAFT";
  }

  if (
    value === "IN_PRODUCTION"
  ) {
    return "IN_PRODUCTION";
  }

  if (value === "PUBLISHED") {
    return "PUBLISHED";
  }

  return "ALL";
}

function normalizeTypeFilter(
  value: string | undefined,
): BookTypeFilter {
  if (value === "LIFE_BOOK") {
    return "LIFE_BOOK";
  }

  if (value === "FAMILY_BOOK") {
    return "FAMILY_BOOK";
  }

  if (value === "COUPLE_BOOK") {
    return "COUPLE_BOOK";
  }

  if (value === "BABY_BOOK") {
    return "BABY_BOOK";
  }

  if (value === "TRAVEL_BOOK") {
    return "TRAVEL_BOOK";
  }

  if (value === "AI_MOVIE") {
    return "AI_MOVIE";
  }

  return "ALL";
}

function normalizeConsultationFilter(
  value: string | undefined,
): ConsultationFilter {
  if (
    value === "WITH" ||
    value === "HAS" ||
    value === "WITH_REQUEST"
  ) {
    return "WITH";
  }

  if (
    value === "WITHOUT" ||
    value === "NONE" ||
    value === "WITHOUT_REQUEST"
  ) {
    return "WITHOUT";
  }

  return "ALL";
}

function normalizeSortOrder(
  value: string | undefined,
): SortOrder {
  if (
    value === "CREATED_DESC" ||
    value === "NEWEST"
  ) {
    return "CREATED_DESC";
  }

  if (
    value === "CREATED_ASC" ||
    value === "OLDEST"
  ) {
    return "CREATED_ASC";
  }

  if (
    value === "TITLE_ASC" ||
    value === "TITLE"
  ) {
    return "TITLE_ASC";
  }

  return "UPDATED_DESC";
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

function getBookOrderBy(
  sortOrder: SortOrder,
): Prisma.BookOrderByWithRelationInput {
  if (
    sortOrder === "CREATED_DESC"
  ) {
    return {
      createdAt: "desc",
    };
  }

  if (
    sortOrder === "CREATED_ASC"
  ) {
    return {
      createdAt: "asc",
    };
  }

  if (
    sortOrder === "TITLE_ASC"
  ) {
    return {
      title: "asc",
    };
  }

  return {
    updatedAt: "desc",
  };
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
  type,
  consultation,
  sort,
  searchQuery = "",
  page = 1,
}: {
  status: BookStatusFilter;
  type: BookTypeFilter;
  consultation: ConsultationFilter;
  sort: SortOrder;
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

  if (type !== "ALL") {
    params.set("type", type);
  }

  if (
    consultation !== "ALL"
  ) {
    params.set(
      "consultation",
      consultation,
    );
  }

  if (
    sort !== "UPDATED_DESC"
  ) {
    params.set("sort", sort);
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
    ? `/admin/books?${query}`
    : "/admin/books";
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

  return "종류 확인";
}

function getRequestStatusLabel(
  status: string,
) {
  if (status === "REQUESTED") {
    return "상담 접수";
  }

  if (status === "CONTACTED") {
    return "고객 연락";
  }

  if (status === "IN_PROGRESS") {
    return "상담 진행";
  }

  if (status === "COMPLETED") {
    return "상담 완료";
  }

  if (status === "CANCELED") {
    return "취소";
  }

  return "상태 확인";
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

function formatDate(
  value: Date | string,
) {
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
    },
  ).format(date);
}

function formatDateTime(
  value: Date | string,
) {
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

const adminBooksStyles = `
  .admin-books-page,
  .admin-books-page * {
    box-sizing: border-box;
  }

  .admin-books-page {
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

  .admin-books-page a {
    color: inherit;
    text-decoration: none;
  }

  .admin-books-page a,
  .admin-books-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .admin-books-page a:hover,
  .admin-books-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .admin-books-page a:focus-visible,
  .admin-books-page button:focus-visible,
  .admin-books-page input:focus-visible,
  .admin-books-page select:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .admin-books-shell {
    width: min(1420px, 100%);
    margin: 0 auto;
  }

  .admin-books-hero {
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

  .admin-books-hero p {
    margin: 0;
    color: #e56852;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .admin-books-hero h1 {
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

  .admin-books-hero div:first-child > span {
    display: block;
    margin-top: 10px;
    color: #76635a;
    font-size: 13px;
    line-height: 1.75;
  }

  .admin-books-hero-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .admin-books-hero-actions a {
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

  .admin-books-hero-actions a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-books-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 9px;
  }

  .admin-books-summary article {
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

  .admin-books-summary article[data-tone="coral"] {
    background: #fff0eb;
  }

  .admin-books-summary article[data-tone="yellow"] {
    background: #fff7da;
  }

  .admin-books-summary article[data-tone="blue"] {
    background: #edf5ff;
  }

  .admin-books-summary article[data-tone="green"] {
    background: #edf7e9;
  }

  .admin-books-summary article[data-tone="purple"] {
    background: #f3edff;
  }

  .admin-books-summary article[data-tone="gray"] {
    background: #f2efed;
  }

  .admin-books-summary span {
    color: #7a675e;
    font-size: 9px;
    font-weight: 850;
  }

  .admin-books-summary strong {
    display: block;
    margin-top: 6px;
    color: #e0644e;
    font-size: 25px;
  }

  .admin-books-summary small {
    margin-left: 3px;
    color: #806d64;
    font-size: 9px;
  }

  .admin-books-control,
  .admin-books-list-section {
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

  .admin-books-search {
    display: grid;
    grid-template-columns:
      minmax(270px, 1.3fr)
      repeat(4, minmax(130px, 0.55fr))
      auto auto;
    align-items: end;
    gap: 8px;
  }

  .admin-books-search-field > span,
  .admin-books-select-field > span {
    display: block;
    margin-bottom: 6px;
    color: #6d584e;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-books-search-field > div {
    position: relative;
  }

  .admin-books-search-field svg {
    position: absolute;
    left: 12px;
    top: 50%;
    width: 21px;
    height: 21px;
    color: #9b7d70;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .admin-books-search input,
  .admin-books-search select {
    width: 100%;
    min-height: 45px;
    border:
      1px solid
      rgba(142, 99, 78, 0.22);
    border-radius: 11px;
    color: #49362d;
    background: #fffdfb;
    font: inherit;
    font-size: 9px;
  }

  .admin-books-search input {
    padding: 0 13px 0 41px;
  }

  .admin-books-search select {
    padding: 0 10px;
  }

  .admin-books-search button,
  .admin-books-search > a {
    min-height: 45px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid #d7b4a3;
    border-radius: 11px;
    color: #765247;
    background: #ffffff;
    font-size: 9px;
    font-weight: 900;
    white-space: nowrap;
    cursor: pointer;
  }

  .admin-books-search button {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-books-quick-filters {
    margin-top: 17px;
    padding-top: 17px;
    border-top:
      1px solid
      rgba(136, 94, 74, 0.1);
  }

  .admin-books-quick-filters > p {
    margin: 0;
    color: #6d584e;
    font-size: 9px;
    font-weight: 900;
  }

  .admin-books-quick-filters > div {
    margin-top: 9px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-books-quick-filters a {
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

  .admin-books-quick-filters a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-books-quick-filters small {
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

  .admin-books-type-overview {
    margin-top: 12px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 7px;
  }

  .admin-books-type-overview a {
    min-width: 0;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 7px;
    border:
      1px solid
      rgba(139, 97, 75, 0.12);
    border-radius: 11px;
    color: #6f584d;
    background: #fffaf6;
  }

  .admin-books-type-overview a[data-active="true"] {
    border-color: #e99a85;
    background: #fff0e9;
  }

  .admin-books-type-overview span {
    overflow: hidden;
    font-size: 8px;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-books-type-overview strong {
    color: #e36650;
    font-size: 11px;
  }

  .admin-books-list-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 17px;
  }

  .admin-books-list-head p {
    margin: 0;
    color: #e56852;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .admin-books-list-head h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 27px;
    line-height: 1.42;
    letter-spacing: -0.045em;
  }

  .admin-books-list-head div > span {
    display: block;
    margin-top: 5px;
    color: #7a675e;
    font-size: 10px;
  }

  .admin-books-list-head > a {
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

  .admin-books-grid {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 13px;
  }

  .admin-book-card {
    min-width: 0;
    padding: 17px;
    border:
      1px solid
      rgba(136, 94, 74, 0.15);
    border-radius: 19px;
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

  .admin-book-card-top {
    display: grid;
    grid-template-columns:
      68px minmax(0, 1fr) auto;
    align-items: center;
    gap: 11px;
  }

  .admin-book-number {
    padding: 10px 8px;
    border-radius: 11px;
    background: #fff0e9;
    text-align: center;
  }

  .admin-book-number span,
  .admin-book-number strong {
    display: block;
  }

  .admin-book-number span {
    color: #9a7566;
    font-size: 6px;
  }

  .admin-book-number strong {
    margin-top: 3px;
    color: #df624c;
    font-size: 15px;
  }

  .admin-book-card-title {
    min-width: 0;
  }

  .admin-book-card-title > div {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .admin-book-card-title h3 {
    margin: 6px 0 0;
    overflow: hidden;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 17px;
    line-height: 1.42;
    letter-spacing: -0.04em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-card-title p {
    margin: 3px 0 0;
    overflow: hidden;
    color: #79655c;
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-status-badge,
  .admin-book-type-badge,
  .admin-book-request-badge,
  .admin-book-no-request,
  .admin-book-order-badge {
    min-height: 22px;
    padding: 0 7px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-book-status-badge[data-status="DRAFT"] {
    color: #8a5b15;
    background: #fff2ce;
  }

  .admin-book-status-badge[data-status="IN_PRODUCTION"] {
    color: #2b628e;
    background: #e8f3ff;
  }

  .admin-book-status-badge[data-status="PUBLISHED"] {
    color: #376e42;
    background: #e7f5e8;
  }

  .admin-book-type-badge {
    color: #9a5a45;
    background: #ffede7;
  }

  .admin-book-request-badge[data-status="REQUESTED"] {
    color: #83540d;
    background: #fff1c7;
  }

  .admin-book-request-badge[data-status="CONTACTED"] {
    color: #245d8c;
    background: #e4f2ff;
  }

  .admin-book-request-badge[data-status="IN_PROGRESS"] {
    color: #62438a;
    background: #efe6ff;
  }

  .admin-book-request-badge[data-status="COMPLETED"] {
    color: #2f6b38;
    background: #e3f4e5;
  }

  .admin-book-request-badge[data-status="CANCELED"] {
    color: #776868;
    background: #f2eeee;
  }

  .admin-book-no-request {
    color: #776c66;
    background: #f0ece9;
  }

  .admin-book-detail-link {
    min-height: 37px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border:
      1px solid #d6b3a3;
    border-radius: 9px;
    color: #755247;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-book-owner {
    margin-top: 12px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.25fr)
      repeat(2, minmax(0, 0.75fr));
    gap: 7px;
  }

  .admin-book-owner > div {
    min-width: 0;
    padding: 10px;
    border:
      1px solid
      rgba(139, 97, 75, 0.1);
    border-radius: 10px;
    background: #fffaf6;
  }

  .admin-book-owner span,
  .admin-book-owner strong,
  .admin-book-owner small {
    display: block;
  }

  .admin-book-owner span {
    color: #8b766c;
    font-size: 6px;
  }

  .admin-book-owner strong {
    margin-top: 4px;
    overflow: hidden;
    color: #4a352c;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-owner small {
    margin-top: 2px;
    overflow: hidden;
    color: #8b766c;
    font-size: 7px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-metrics {
    margin-top: 7px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .admin-book-metric {
    min-width: 0;
    padding: 9px;
    border-radius: 9px;
    background: #f7f1ec;
  }

  .admin-book-metric span,
  .admin-book-metric strong {
    display: block;
  }

  .admin-book-metric span {
    color: #89746a;
    font-size: 6px;
  }

  .admin-book-metric strong {
    margin-top: 3px;
    overflow: hidden;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-summary {
    margin-top: 8px;
    padding: 11px;
    border-radius: 11px;
    background: #fff5ee;
  }

  .admin-book-summary strong {
    font-size: 8px;
  }

  .admin-book-summary p {
    margin: 5px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #715e55;
    font-size: 9px;
    line-height: 1.65;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .admin-book-request {
    margin-top: 8px;
    padding: 12px;
    display: grid;
    grid-template-columns:
      minmax(150px, 0.8fr)
      minmax(130px, 0.7fr)
      minmax(190px, 1fr)
      auto;
    align-items: center;
    gap: 8px;
    border:
      1px solid #dfbd84;
    border-radius: 12px;
    background:
      linear-gradient(
        135deg,
        #fff7e7,
        #fffdf9
      );
  }

  .admin-book-request > div:first-child > p {
    margin: 0;
    color: #e56852;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-book-request h4 {
    margin: 3px 0 0;
    font-size: 10px;
  }

  .admin-book-request > div:first-child > span {
    display: block;
    margin-top: 3px;
    color: #7c685e;
    font-size: 7px;
  }

  .admin-book-request-contact {
    min-width: 0;
    display: grid;
    gap: 3px;
    color: #765f55;
    font-size: 7px;
  }

  .admin-book-request-contact span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-order {
    min-width: 0;
    padding: 8px 9px;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr) auto;
    gap: 7px;
    border-radius: 9px;
    background: #ffffff;
  }

  .admin-book-order > div:first-child {
    min-width: 0;
  }

  .admin-book-order span,
  .admin-book-order strong,
  .admin-book-order small {
    display: block;
  }

  .admin-book-order > div:first-child > span {
    overflow: hidden;
    color: #7a665d;
    font-size: 7px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-order strong {
    margin-top: 3px;
    font-size: 10px;
  }

  .admin-book-order > div:last-child {
    min-width: 0;
    text-align: right;
  }

  .admin-book-order-badge {
    color: #3f668e;
    background: #eaf3ff;
  }

  .admin-book-order-badge[data-status="READY"],
  .admin-book-order-badge[data-status="FAILED"] {
    color: #b84836;
    background: #ffe8e2;
  }

  .admin-book-order-badge[data-status="COMPLETED"] {
    color: #4b713c;
    background: #edf7e8;
  }

  .admin-book-order small {
    max-width: 90px;
    margin-top: 3px;
    overflow: hidden;
    color: #9a8175;
    font-size: 6px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-book-order-empty {
    padding: 9px;
    border-radius: 9px;
    color: #8a7469;
    background: #ffffff;
    font-size: 7px;
    line-height: 1.5;
  }

  .admin-book-request > a {
    min-height: 35px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 9px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
    font-size: 7px;
    font-weight: 900;
    white-space: nowrap;
  }

  .admin-book-no-consultation {
    margin-top: 8px;
    padding: 10px 11px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    border:
      1px dashed #d8b8aa;
    border-radius: 11px;
    color: #806b61;
    background: #fffaf7;
    font-size: 8px;
  }

  .admin-book-no-consultation a {
    min-height: 32px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    border:
      1px solid #d6b3a3;
    border-radius: 8px;
    color: #755247;
    background: #ffffff;
    font-size: 7px;
    font-weight: 900;
  }

  .admin-books-pagination {
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

  .admin-books-pagination a,
  .admin-books-pagination > span {
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

  .admin-books-pagination a[data-active="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5f4f
      );
  }

  .admin-books-pagination > span[data-disabled="true"] {
    opacity: 0.42;
  }

  .admin-books-empty {
    margin-top: 17px;
    padding: 52px 20px;
    border:
      1px dashed #ddb2a1;
    border-radius: 17px;
    background: #fffaf7;
    text-align: center;
  }

  .admin-books-empty > span {
    width: 55px;
    height: 55px;
    margin: 0 auto;
    display: block;
    color: #e57059;
  }

  .admin-books-empty svg {
    width: 100%;
    height: 100%;
  }

  .admin-books-empty strong {
    display: block;
    margin-top: 11px;
    font-size: 16px;
  }

  .admin-books-empty p {
    margin: 5px 0 0;
    color: #806b61;
    font-size: 10px;
  }

  .admin-books-empty a {
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

  @media (max-width: 1240px) {
    .admin-books-search {
      grid-template-columns:
        minmax(250px, 1fr)
        repeat(2, minmax(140px, 0.5fr))
        auto;
    }

    .admin-books-search-field {
      grid-column:
        1 / span 2;
    }

    .admin-books-type-overview {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-book-request {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-book-request > a {
      justify-content: center;
    }
  }

  @media (max-width: 920px) {
    .admin-books-page {
      padding: 18px 13px 42px;
    }

    .admin-books-hero {
      align-items: stretch;
      flex-direction: column;
      padding: 24px;
      border-radius: 21px;
    }

    .admin-books-hero-actions {
      justify-content: flex-start;
    }

    .admin-books-summary {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .admin-books-search {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-books-search-field {
      grid-column: 1 / -1;
    }

    .admin-books-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .admin-books-summary {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-books-control,
    .admin-books-list-section {
      padding: 16px;
      border-radius: 18px;
    }

    .admin-books-search {
      grid-template-columns: 1fr;
    }

    .admin-books-search-field {
      grid-column: auto;
    }

    .admin-books-type-overview {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-books-list-head {
      flex-direction: column;
      align-items: stretch;
    }

    .admin-books-list-head > a {
      justify-content: center;
    }

    .admin-book-card {
      padding: 13px;
      border-radius: 16px;
    }

    .admin-book-card-top {
      grid-template-columns:
        54px minmax(0, 1fr);
    }

    .admin-book-number {
      grid-row: 1 / span 2;
    }

    .admin-book-detail-link {
      grid-column: 1 / -1;
      justify-content: center;
    }

    .admin-book-owner {
      grid-template-columns: 1fr;
    }

    .admin-book-metrics {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .admin-book-request {
      grid-template-columns: 1fr;
    }

    .admin-book-order {
      grid-template-columns: 1fr;
    }

    .admin-book-order > div:last-child {
      text-align: left;
    }
  }

  @media (max-width: 420px) {
    .admin-books-summary,
    .admin-books-type-overview,
    .admin-book-metrics {
      grid-template-columns: 1fr;
    }

    .admin-book-no-consultation {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-book-no-consultation a {
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-books-page a,
    .admin-books-page button {
      transition: none;
    }
  }
`;
