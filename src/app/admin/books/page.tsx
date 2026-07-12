import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  BookStatus,
  BookType,
  Prisma,
} from '@prisma/client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    type?: string;
    consultation?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
};

type StatusFilter = 'ALL' | BookStatus;
type TypeFilter = 'ALL' | BookType;
type ConsultationFilter = 'ALL' | 'HAS' | 'NONE';
type SortOrder = 'latest' | 'oldest';

type FilterHrefOptions = {
  status: StatusFilter;
  type: TypeFilter;
  consultation: ConsultationFilter;
  searchQuery?: string;
  sortOrder?: SortOrder;
  page?: number;
};

const PAGE_SIZE = 20;

const STATUS_FILTERS: {
  value: StatusFilter;
  label: string;
}[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: BookStatus.DRAFT, label: '원고 초안' },
  {
    value: BookStatus.IN_PRODUCTION,
    label: '제작 준비 중',
  },
  { value: BookStatus.PUBLISHED, label: '완성' },
];

const TYPE_FILTERS: {
  value: TypeFilter;
  label: string;
}[] = [
  { value: 'ALL', label: '전체 종류' },
  {
    value: BookType.LIFE_BOOK,
    label: '부모님 인생책',
  },
  {
    value: BookType.FAMILY_BOOK,
    label: '가족 이야기책',
  },
  {
    value: BookType.COUPLE_BOOK,
    label: '부부 이야기책',
  },
  {
    value: BookType.BABY_BOOK,
    label: '성장 기록책',
  },
  {
    value: BookType.TRAVEL_BOOK,
    label: '여행 기록책',
  },
  {
    value: BookType.AI_MOVIE,
    label: 'AI 영상',
  },
];

const CONSULTATION_FILTERS: {
  value: ConsultationFilter;
  label: string;
}[] = [
  { value: 'ALL', label: '상담 전체' },
  { value: 'HAS', label: '상담 신청 있음' },
  { value: 'NONE', label: '상담 신청 없음' },
];

export default async function AdminBooksPage({
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const adminUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (adminUser?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const resolvedSearchParams = await searchParams;

  const statusFilter = normalizeStatusFilter(
    resolvedSearchParams?.status,
  );

  const typeFilter = normalizeTypeFilter(
    resolvedSearchParams?.type,
  );

  const consultationFilter =
    normalizeConsultationFilter(
      resolvedSearchParams?.consultation,
    );

  const searchQuery = String(
    resolvedSearchParams?.q || '',
  )
    .trim()
    .slice(0, 100);

  const sortOrder = normalizeSortOrder(
    resolvedSearchParams?.sort,
  );

  const requestedPage = normalizePage(
    resolvedSearchParams?.page,
  );

    const consultationBookRows =
    await prisma.bookProductionRequest.findMany({
      where: {
        status: {
          in: [
            'REQUESTED',
            'CONTACTED',
            'IN_PROGRESS',
          ],
        },
      },
      distinct: ['bookId'],
      select: {
        bookId: true,
      },
    });

  const consultationBookIds =
    consultationBookRows.map((row) => row.bookId);

  const consultationBookIdSet = new Set(
    consultationBookIds,
  );

  const where: Prisma.BookWhereInput = {};

  if (statusFilter !== 'ALL') {
    where.status = statusFilter;
  }

  if (typeFilter !== 'ALL') {
    where.type = typeFilter;
  }

  if (consultationFilter === 'HAS') {
    where.id = {
      in: consultationBookIds,
    };
  }

  if (consultationFilter === 'NONE') {
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
        author: {
          is: {
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
        },
      },
    ];
  }

  const filteredBookCount = await prisma.book.count({
    where,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookCount / PAGE_SIZE),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const skip = (currentPage - 1) * PAGE_SIZE;

  const [
    books,
    statusCountRows,
    typeCountRows,
    totalBookCount,
  ] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: {
        createdAt:
          sortOrder === 'oldest' ? 'asc' : 'desc',
      },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        authorId: true,
        title: true,
        subtitle: true,
        type: true,
        status: true,
        pageCount: true,
        basedPhotoCount: true,
        basedStoryCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.book.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    }),

    prisma.book.groupBy({
      by: ['type'],
      _count: {
        _all: true,
      },
    }),

    prisma.book.count(),
  ]);

  const authorIds = Array.from(
    new Set(books.map((book) => book.authorId)),
  );

  const bookIds = books.map((book) => book.id);

  const [authors, productionRequests] =
    await Promise.all([
      authorIds.length > 0
        ? prisma.user.findMany({
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
          })
        : Promise.resolve([]),

      bookIds.length > 0
        ? prisma.bookProductionRequest.findMany({
            where: {
              bookId: {
                in: bookIds,
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              bookId: true,
              name: true,
              phone: true,
              email: true,
              status: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

  const authorMap = new Map(
    authors.map((author) => [author.id, author]),
  );

    const latestRequestMap = new Map<
    string,
    (typeof productionRequests)[number]
  >();

  const activeRequestStatuses = new Set([
    'REQUESTED',
    'CONTACTED',
    'IN_PROGRESS',
  ]);

  for (const request of productionRequests) {
    const currentRequest = latestRequestMap.get(
      request.bookId,
    );

    if (!currentRequest) {
      latestRequestMap.set(request.bookId, request);
      continue;
    }

    const currentIsActive =
      activeRequestStatuses.has(currentRequest.status);

    const requestIsActive =
      activeRequestStatuses.has(request.status);

    if (!currentIsActive && requestIsActive) {
      latestRequestMap.set(request.bookId, request);
    }
  }

  const statusCountMap = new Map(
    statusCountRows.map((row) => [
      row.status,
      row._count._all,
    ]),
  );

  const typeCountMap = new Map(
    typeCountRows.map((row) => [
      row.type,
      row._count._all,
    ]),
  );

  const booksWithConsultationCount =
    consultationBookIds.length;

  const booksWithoutConsultationCount = Math.max(
    totalBookCount - booksWithConsultationCount,
    0,
  );

  const hasActiveCondition =
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    consultationFilter !== 'ALL' ||
    Boolean(searchQuery) ||
    sortOrder !== 'latest';

  const firstVisibleBook =
    filteredBookCount === 0 ? 0 : skip + 1;

  const lastVisibleBook = Math.min(
    skip + books.length,
    filteredBookCount,
  );

  const pageNumbers = getPageNumbers(
    currentPage,
    totalPages,
  );

  return (
    <main>
      <style>{`
        .admin-books-mobile-list {
          display: none;
        }

        @media (max-width: 860px) {
          .admin-books-desktop-table {
            display: none;
          }

          .admin-books-mobile-list {
            display: grid;
          }
        }
      `}</style>

      <div className="runninghead">
        <span className="runninghead__chapter">
          ADMIN
        </span>

        <span className="runninghead__rule" />

        <span style={{ color: 'var(--ink-soft)' }}>
          책 관리
        </span>
      </div>

      <section
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 18,
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            className="dash-greeting"
            style={{
              marginBottom: 10,
            }}
          >
            책 관리
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: 720,
              color: 'var(--ink-soft)',
              fontSize: 15,
              lineHeight: 1.75,
            }}
          >
            회원이 만든 책 원고와 제작 상태, 작성자 및
            제작 상담 현황을 확인합니다.
          </p>
        </div>

        <Link
          href="/admin"
          style={primaryButtonStyle()}
        >
          관리자 홈
        </Link>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(165px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <SummaryCard
          label="전체 책"
          value={totalBookCount}
          unit="권"
          color="var(--wine)"
        />

        <SummaryCard
          label="원고 초안"
          value={
            statusCountMap.get(BookStatus.DRAFT) ?? 0
          }
          unit="권"
          color="#7b4f2a"
        />

        <SummaryCard
          label="제작 준비 중"
          value={
            statusCountMap.get(
              BookStatus.IN_PRODUCTION,
            ) ?? 0
          }
          unit="권"
          color="#9a6a24"
        />

        <SummaryCard
          label="완성된 책"
          value={
            statusCountMap.get(
              BookStatus.PUBLISHED,
            ) ?? 0
          }
          unit="권"
          color="#3e5f3a"
        />

        <SummaryCard
          label="상담 신청 책"
          value={booksWithConsultationCount}
          unit="권"
          color="#62438a"
        />

        <SummaryCard
          label="현재 검색 결과"
          value={filteredBookCount}
          unit="권"
          color="#2e3f52"
        />
      </section>

      <section
        className="dash-card"
        style={{
          marginBottom: 22,
        }}
      >
        <form
          action="/admin/books"
          method="get"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 12,
            paddingBottom: 22,
            marginBottom: 22,
            borderBottom:
              '1px solid rgba(34, 28, 22, 0.08)',
          }}
        >
          {statusFilter !== 'ALL' ? (
            <input
              type="hidden"
              name="status"
              value={statusFilter}
            />
          ) : null}

          {typeFilter !== 'ALL' ? (
            <input
              type="hidden"
              name="type"
              value={typeFilter}
            />
          ) : null}

          {consultationFilter !== 'ALL' ? (
            <input
              type="hidden"
              name="consultation"
              value={consultationFilter}
            />
          ) : null}

          <label
            style={{
              display: 'grid',
              flex: '1 1 280px',
              gap: 7,
            }}
          >
            <span style={inputLabelStyle()}>
              책 또는 작성자 검색
            </span>

            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="책 제목, 작성자 이름, 이메일"
              maxLength={100}
              style={inputStyle()}
            />
          </label>

          <label
            style={{
              display: 'grid',
              flex: '0 1 180px',
              gap: 7,
            }}
          >
            <span style={inputLabelStyle()}>
              정렬
            </span>

            <select
              name="sort"
              defaultValue={sortOrder}
              style={selectStyle()}
            >
              <option value="latest">
                최신순
              </option>

              <option value="oldest">
                오래된순
              </option>
            </select>
          </label>

          <button
            type="submit"
            style={searchButtonStyle()}
          >
            검색 적용
          </button>

          {searchQuery ||
          sortOrder !== 'latest' ? (
            <Link
              href={buildFilterHref({
                status: statusFilter,
                type: typeFilter,
                consultation:
                  consultationFilter,
              })}
              style={secondaryButtonStyle()}
            >
              검색 초기화
            </Link>
          ) : null}
        </form>

        <FilterGroup
          label="책 상태"
          items={STATUS_FILTERS.map((filter) => ({
            key: filter.value,
            label: filter.label,
            count:
              filter.value === 'ALL'
                ? totalBookCount
                : statusCountMap.get(
                    filter.value,
                  ) ?? 0,
            active:
              filter.value === statusFilter,
            href: buildFilterHref({
              status: filter.value,
              type: typeFilter,
              consultation:
                consultationFilter,
              searchQuery,
              sortOrder,
            }),
          }))}
        />

        <FilterGroup
          label="책 종류"
          marginTop={22}
          items={TYPE_FILTERS.map((filter) => ({
            key: filter.value,
            label: filter.label,
            count:
              filter.value === 'ALL'
                ? totalBookCount
                : typeCountMap.get(
                    filter.value,
                  ) ?? 0,
            active: filter.value === typeFilter,
            href: buildFilterHref({
              status: statusFilter,
              type: filter.value,
              consultation:
                consultationFilter,
              searchQuery,
              sortOrder,
            }),
          }))}
        />

        <FilterGroup
          label="제작 상담 신청"
          marginTop={22}
          items={CONSULTATION_FILTERS.map(
            (filter) => {
              let count = totalBookCount;

              if (filter.value === 'HAS') {
                count = booksWithConsultationCount;
              }

              if (filter.value === 'NONE') {
                count =
                  booksWithoutConsultationCount;
              }

              return {
                key: filter.value,
                label: filter.label,
                count,
                active:
                  filter.value ===
                  consultationFilter,
                href: buildFilterHref({
                  status: statusFilter,
                  type: typeFilter,
                  consultation: filter.value,
                  searchQuery,
                  sortOrder,
                }),
              };
            },
          )}
        />
      </section>

      <section
        className="dash-card"
        style={{
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '20px 22px',
            borderBottom:
              '1px solid rgba(34, 28, 22, 0.08)',
          }}
        >
          <div>
            <p
              className="dash-card__label"
              style={{
                margin: 0,
              }}
            >
              책 원고 목록
            </p>

            <p
              style={{
                margin: '8px 0 0',
                color: 'var(--ink-soft)',
                fontSize: 13,
                lineHeight: 1.65,
              }}
            >
              전체 검색 결과 {filteredBookCount}권
              {' · '}
              {firstVisibleBook}–{lastVisibleBook}번째 표시
              {searchQuery
                ? ` · 검색어 "${searchQuery}"`
                : ''}
              {' · '}
              {sortOrder === 'oldest'
                ? '오래된순'
                : '최신순'}
            </p>
          </div>

          {hasActiveCondition ? (
            <Link
              href="/admin/books"
              style={secondaryButtonStyle()}
            >
              전체 조건 초기화
            </Link>
          ) : null}
        </div>

        {books.length > 0 ? (
          <>
            <div className="admin-books-desktop-table">
              <div
                style={{
                  overflowX: 'auto',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    minWidth: 1120,
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          'var(--paper-shade)',
                        borderBottom:
                          '1px solid rgba(34, 28, 22, 0.1)',
                      }}
                    >
                      {[
                        '책 제목',
                        '작성자',
                        '종류',
                        '책 상태',
                        '자료',
                        '예상 분량',
                        '제작 상담',
                        '생성일',
                        '관리',
                      ].map((heading) => (
                        <th
                          key={heading}
                          style={tableHeadingStyle()}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {books.map((book) => {
                      const author = authorMap.get(
                        book.authorId,
                      );

                      const request =
                        latestRequestMap.get(
                          book.id,
                        );

                      return (
                        <tr
                          key={book.id}
                          style={{
                            borderBottom:
                              '1px solid rgba(34, 28, 22, 0.06)',
                          }}
                        >
                          <td
                            style={{
                              padding: 14,
                              minWidth: 230,
                            }}
                          >
                            <BookTitle
                              title={book.title}
                              subtitle={book.subtitle}
                              updatedAt={book.updatedAt}
                            />
                          </td>

                          <td
                            style={{
                              padding: 14,
                              minWidth: 180,
                            }}
                          >
                            <AuthorInfo
                              name={author?.name}
                              email={author?.email}
                            />
                          </td>

                          <td
                            style={standardCellStyle()}
                          >
                            {getBookTypeLabel(
                              book.type,
                            )}
                          </td>

                          <td
                            style={{
                              padding: 14,
                            }}
                          >
                            <span
                              style={bookStatusBadgeStyle(
                                book.status,
                              )}
                            >
                              {getBookStatusLabel(
                                book.status,
                              )}
                            </span>
                          </td>

                          <td
                            style={standardCellStyle()}
                          >
                            사진{' '}
                            {book.basedPhotoCount ??
                              0}
                            장
                            <br />
                            이야기{' '}
                            {book.basedStoryCount ??
                              0}
                            개
                          </td>

                          <td
                            style={standardCellStyle()}
                          >
                            {book.pageCount
                              ? `${book.pageCount}쪽`
                              : '미정'}
                          </td>

                          <td
                            style={{
                              padding: 14,
                              minWidth: 140,
                            }}
                          >
                            <ConsultationStatus
                              request={request}
                            />
                          </td>

                          <td
                            style={{
                              padding: 14,
                              fontSize: 12,
                              color:
                                'var(--ink-faint)',
                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            {formatDate(
                              book.createdAt,
                            )}
                          </td>

                          <td
                            style={{
                              padding: 14,
                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            <Link
                              href={`/admin/books/${book.id}`}
                              style={detailButtonStyle()}
                            >
                              상세 보기
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              className="admin-books-mobile-list"
              style={{
                gap: 12,
                padding: 14,
              }}
            >
              {books.map((book) => {
                const author = authorMap.get(
                  book.authorId,
                );

                const request =
                  latestRequestMap.get(book.id);

                return (
                  <article
                    key={book.id}
                    style={{
                      borderRadius: 18,
                      border:
                        '1px solid rgba(34, 28, 22, 0.1)',
                      background:
                        'rgba(255, 255, 255, 0.32)',
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 7,
                      }}
                    >
                      <span
                        style={bookStatusBadgeStyle(
                          book.status,
                        )}
                      >
                        {getBookStatusLabel(
                          book.status,
                        )}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          color:
                            'var(--ink-faint)',
                        }}
                      >
                        {getBookTypeLabel(
                          book.type,
                        )}
                      </span>

                      {consultationBookIdSet.has(
                        book.id,
                      ) ? (
                        <span
                          style={{
                            display:
                              'inline-flex',
                            padding:
                              '4px 8px',
                            borderRadius: 999,
                            background:
                              '#efe6ff',
                            color: '#62438a',
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        >
                          상담 신청
                        </span>
                      ) : null}
                    </div>

                    <h2
                      style={{
                        margin: '11px 0 0',
                        fontSize: 18,
                        lineHeight: 1.5,
                        color: 'var(--ink)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {book.title}
                    </h2>

                    {book.subtitle ? (
                      <p
                        style={{
                          margin: '6px 0 0',
                          color:
                            'var(--ink-soft)',
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        {book.subtitle}
                      </p>
                    ) : null}

                    <div
                      style={{
                        marginTop: 13,
                        padding: 13,
                        borderRadius: 14,
                        background:
                          'rgba(34, 28, 22, 0.04)',
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          fontSize: 13,
                          color: 'var(--ink)',
                        }}
                      >
                        {author?.name ||
                          '이름 없음'}
                      </strong>

                      <span
                        style={{
                          display: 'block',
                          marginTop: 4,
                          fontSize: 12,
                          color:
                            'var(--ink-soft)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {author?.email ||
                          '이메일 없음'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(3, minmax(0, 1fr))',
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      <MobileInfo
                        label="사진"
                        value={`${
                          book.basedPhotoCount ??
                          0
                        }장`}
                      />

                      <MobileInfo
                        label="이야기"
                        value={`${
                          book.basedStoryCount ??
                          0
                        }개`}
                      />

                      <MobileInfo
                        label="분량"
                        value={
                          book.pageCount
                            ? `${book.pageCount}쪽`
                            : '미정'
                        }
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop:
                          '1px solid rgba(34, 28, 22, 0.08)',
                      }}
                    >
                      <ConsultationStatus
                        request={request}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          'space-between',
                        gap: 12,
                        marginTop: 14,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color:
                            'var(--ink-faint)',
                        }}
                      >
                        생성{' '}
                        {formatDate(
                          book.createdAt,
                        )}
                      </span>

                      <Link
                        href={`/admin/books/${book.id}`}
                        style={detailButtonStyle()}
                      >
                        상세 보기
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageNumbers={pageNumbers}
              status={statusFilter}
              type={typeFilter}
              consultation={consultationFilter}
              searchQuery={searchQuery}
              sortOrder={sortOrder}
            />
          </>
        ) : (
          <div
            style={{
              padding: 36,
              textAlign: 'center',
              color: 'var(--ink-soft)',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            현재 조건에 맞는 책이 없습니다.
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <article
      className="dash-card"
      style={{
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: '0 0 5px',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 34,
          lineHeight: 1.2,
          color,
        }}
      >
        {value.toLocaleString()}
      </p>

      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '.05em',
          color: 'var(--ink-faint)',
        }}
      >
        {label} ({unit})
      </p>
    </article>
  );
}

function FilterGroup({
  label,
  items,
  marginTop = 0,
}: {
  label: string;
  items: {
    key: string;
    label: string;
    count: number;
    active: boolean;
    href: string;
  }[];
  marginTop?: number;
}) {
  return (
    <div style={{ marginTop }}>
      <p
        className="dash-card__label"
        style={{
          margin: 0,
        }}
      >
        {label}
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 14,
        }}
      >
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            style={filterButtonStyle(item.active)}
          >
            {item.label} ({item.count})
          </Link>
        ))}
      </div>
    </div>
  );
}

function BookTitle({
  title,
  subtitle,
  updatedAt,
}: {
  title: string;
  subtitle: string | null;
  updatedAt: Date;
}) {
  return (
    <>
      <strong
        style={{
          display: 'block',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--ink)',
          wordBreak: 'break-word',
        }}
      >
        {title}
      </strong>

      {subtitle ? (
        <span
          style={{
            display: 'block',
            marginTop: 5,
            maxWidth: 290,
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--ink-soft)',
            wordBreak: 'break-word',
          }}
        >
          {subtitle}
        </span>
      ) : null}

      <span
        style={{
          display: 'block',
          marginTop: 5,
          fontSize: 11,
          color: 'var(--ink-faint)',
        }}
      >
        최근 수정 {formatDate(updatedAt)}
      </span>
    </>
  );
}

function AuthorInfo({
  name,
  email,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
}) {
  return (
    <>
      <strong
        style={{
          display: 'block',
          fontSize: 13,
          color: 'var(--ink)',
        }}
      >
        {name || '이름 없음'}
      </strong>

      <span
        style={{
          display: 'block',
          marginTop: 4,
          fontSize: 12,
          color: 'var(--ink-soft)',
          wordBreak: 'break-all',
        }}
      >
        {email || '이메일 없음'}
      </span>
    </>
  );
}

function ConsultationStatus({
  request,
}: {
  request:
    | {
        status: string;
        createdAt: Date;
        name: string | null;
      }
    | undefined;
}) {
  if (!request) {
    return (
      <span
        style={{
          fontSize: 12,
          color: 'var(--ink-faint)',
        }}
      >
        신청 없음
      </span>
    );
  }

  return (
    <>
      <span
        style={requestStatusBadgeStyle(
          request.status,
        )}
      >
        {getRequestStatusLabel(request.status)}
      </span>

      <span
        style={{
          display: 'block',
          marginTop: 5,
          fontSize: 11,
          color: 'var(--ink-faint)',
        }}
      >
        {request.name || '신청자 이름 없음'} ·{' '}
        {formatDate(request.createdAt)}
      </span>
    </>
  );
}

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: '10px 7px',
        borderRadius: 12,
        background: 'rgba(34, 28, 22, 0.05)',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: 10,
          color: 'var(--ink-faint)',
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: 'block',
          marginTop: 4,
          fontSize: 13,
          color: 'var(--ink)',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  pageNumbers,
  status,
  type,
  consultation,
  searchQuery,
  sortOrder,
}: {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  status: StatusFilter;
  type: TypeFilter;
  consultation: ConsultationFilter;
  searchQuery: string;
  sortOrder: SortOrder;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="책 목록 페이지 이동"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 7,
        padding: '20px 16px',
        borderTop:
          '1px solid rgba(34, 28, 22, 0.08)',
      }}
    >
      {currentPage > 1 ? (
        <Link
          href={buildFilterHref({
            status,
            type,
            consultation,
            searchQuery,
            sortOrder,
            page: currentPage - 1,
          })}
          style={pageButtonStyle(false)}
        >
          이전
        </Link>
      ) : (
        <span style={disabledPageButtonStyle()}>
          이전
        </span>
      )}

      {pageNumbers.map((pageNumber) => (
        <Link
          key={pageNumber}
          href={buildFilterHref({
            status,
            type,
            consultation,
            searchQuery,
            sortOrder,
            page: pageNumber,
          })}
          aria-current={
            pageNumber === currentPage
              ? 'page'
              : undefined
          }
          style={pageButtonStyle(
            pageNumber === currentPage,
          )}
        >
          {pageNumber}
        </Link>
      ))}

      {currentPage < totalPages ? (
        <Link
          href={buildFilterHref({
            status,
            type,
            consultation,
            searchQuery,
            sortOrder,
            page: currentPage + 1,
          })}
          style={pageButtonStyle(false)}
        >
          다음
        </Link>
      ) : (
        <span style={disabledPageButtonStyle()}>
          다음
        </span>
      )}
    </nav>
  );
}

function normalizeStatusFilter(
  value: string | undefined,
): StatusFilter {
  if (value === BookStatus.DRAFT) {
    return BookStatus.DRAFT;
  }

  if (value === BookStatus.IN_PRODUCTION) {
    return BookStatus.IN_PRODUCTION;
  }

  if (value === BookStatus.PUBLISHED) {
    return BookStatus.PUBLISHED;
  }

  return 'ALL';
}

function normalizeTypeFilter(
  value: string | undefined,
): TypeFilter {
  if (value === BookType.LIFE_BOOK) {
    return BookType.LIFE_BOOK;
  }

  if (value === BookType.FAMILY_BOOK) {
    return BookType.FAMILY_BOOK;
  }

  if (value === BookType.COUPLE_BOOK) {
    return BookType.COUPLE_BOOK;
  }

  if (value === BookType.BABY_BOOK) {
    return BookType.BABY_BOOK;
  }

  if (value === BookType.TRAVEL_BOOK) {
    return BookType.TRAVEL_BOOK;
  }

  if (value === BookType.AI_MOVIE) {
    return BookType.AI_MOVIE;
  }

  return 'ALL';
}

function normalizeConsultationFilter(
  value: string | undefined,
): ConsultationFilter {
  if (value === 'HAS') {
    return 'HAS';
  }

  if (value === 'NONE') {
    return 'NONE';
  }

  return 'ALL';
}

function normalizeSortOrder(
  value: string | undefined,
): SortOrder {
  if (value === 'oldest') {
    return 'oldest';
  }

  return 'latest';
}

function normalizePage(
  value: string | undefined,
) {
  const parsed = Number.parseInt(
    String(value || '1'),
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
    Math.min(currentPage - 2, totalPages - 4),
  );

  const end = Math.min(totalPages, start + 4);

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

function buildFilterHref({
  status,
  type,
  consultation,
  searchQuery = '',
  sortOrder = 'latest',
  page = 1,
}: FilterHrefOptions) {
  const params = new URLSearchParams();

  if (status !== 'ALL') {
    params.set('status', status);
  }

  if (type !== 'ALL') {
    params.set('type', type);
  }

  if (consultation !== 'ALL') {
    params.set('consultation', consultation);
  }

  if (searchQuery.trim()) {
    params.set('q', searchQuery.trim());
  }

  if (sortOrder !== 'latest') {
    params.set('sort', sortOrder);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/books?${query}`
    : '/admin/books';
}

function inputLabelStyle(): CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 900,
    color: 'var(--ink-soft)',
  };
}

function inputStyle(): CSSProperties {
  return {
    width: '100%',
    minHeight: 42,
    padding: '0 14px',
    borderRadius: 12,
    border:
      '1px solid rgba(34, 28, 22, 0.18)',
    background:
      'rgba(255, 255, 255, 0.55)',
    color: 'var(--ink)',
    fontSize: 14,
    outline: 'none',
  };
}

function selectStyle(): CSSProperties {
  return {
    width: '100%',
    minHeight: 42,
    padding: '0 12px',
    borderRadius: 12,
    border:
      '1px solid rgba(34, 28, 22, 0.18)',
    background:
      'rgba(255, 255, 255, 0.55)',
    color: 'var(--ink)',
    fontSize: 14,
  };
}

function primaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border: '1px solid var(--wine)',
    background: 'var(--wine)',
    color: 'var(--cream)',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function secondaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    padding: '0 12px',
    borderRadius: 999,
    border:
      '1px solid rgba(34, 28, 22, 0.18)',
    background: 'transparent',
    color: 'var(--ink-soft)',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function searchButtonStyle(): CSSProperties {
  return {
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border: '1px solid var(--wine)',
    background: 'var(--wine)',
    color: 'var(--cream)',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

function filterButtonStyle(
  active: boolean,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    padding: '0 12px',
    borderRadius: 999,
    border: active
      ? '1px solid var(--wine)'
      : '1px solid rgba(34, 28, 22, 0.16)',
    background: active
      ? 'var(--wine)'
      : 'transparent',
    color: active
      ? 'var(--cream)'
      : 'var(--ink-soft)',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function detailButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    padding: '0 11px',
    borderRadius: 999,
    border:
      '1px solid rgba(34, 28, 22, 0.2)',
    color: 'var(--wine)',
    fontSize: 11,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function pageButtonStyle(
  active: boolean,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    minHeight: 34,
    padding: '0 10px',
    borderRadius: 999,
    border: active
      ? '1px solid var(--wine)'
      : '1px solid rgba(34, 28, 22, 0.16)',
    background: active
      ? 'var(--wine)'
      : 'transparent',
    color: active
      ? 'var(--cream)'
      : 'var(--ink-soft)',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
  };
}

function disabledPageButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 34,
    minHeight: 34,
    padding: '0 10px',
    borderRadius: 999,
    border:
      '1px solid rgba(34, 28, 22, 0.08)',
    color: 'var(--ink-faint)',
    fontSize: 12,
    opacity: 0.5,
  };
}

function tableHeadingStyle(): CSSProperties {
  return {
    padding: '12px 14px',
    textAlign: 'left',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '.05em',
    color: 'var(--ink-faint)',
    whiteSpace: 'nowrap',
  };
}

function standardCellStyle(): CSSProperties {
  return {
    padding: 14,
    fontSize: 12,
    color: 'var(--ink-soft)',
    whiteSpace: 'nowrap',
  };
}

function bookStatusBadgeStyle(
  status: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 26,
    padding: '0 9px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };

  if (status === BookStatus.DRAFT) {
    return {
      ...base,
      background: '#f1eee8',
      color: '#6b5a46',
    };
  }

  if (
    status === BookStatus.IN_PRODUCTION
  ) {
    return {
      ...base,
      background: '#fff1c7',
      color: '#83540d',
    };
  }

  if (status === BookStatus.PUBLISHED) {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  return {
    ...base,
    background:
      'rgba(34, 28, 22, 0.08)',
    color: 'var(--ink-faint)',
  };
}

function requestStatusBadgeStyle(
  status: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 25,
    padding: '0 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  };

  if (status === 'REQUESTED') {
    return {
      ...base,
      background: '#fff1c7',
      color: '#83540d',
    };
  }

  if (status === 'CONTACTED') {
    return {
      ...base,
      background: '#e4f2ff',
      color: '#245d8c',
    };
  }

  if (status === 'IN_PROGRESS') {
    return {
      ...base,
      background: '#efe6ff',
      color: '#62438a',
    };
  }

  if (status === 'COMPLETED') {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  if (status === 'CANCELED') {
    return {
      ...base,
      background: '#f2eeee',
      color: '#776868',
    };
  }

  return {
    ...base,
    background:
      'rgba(34, 28, 22, 0.08)',
    color: 'var(--ink-faint)',
  };
}

function getBookStatusLabel(status: string) {
  if (status === BookStatus.DRAFT) {
    return '원고 초안';
  }

  if (
    status === BookStatus.IN_PRODUCTION
  ) {
    return '제작 준비 중';
  }

  if (status === BookStatus.PUBLISHED) {
    return '완성';
  }

  return '상태 확인';
}

function getBookTypeLabel(type: string) {
  if (type === BookType.LIFE_BOOK) {
    return '부모님 인생책';
  }

  if (type === BookType.FAMILY_BOOK) {
    return '가족 이야기책';
  }

  if (type === BookType.COUPLE_BOOK) {
    return '부부 이야기책';
  }

  if (type === BookType.BABY_BOOK) {
    return '성장 기록책';
  }

  if (type === BookType.TRAVEL_BOOK) {
    return '여행 기록책';
  }

  if (type === BookType.AI_MOVIE) {
    return 'AI 영상';
  }

  return '종류 확인';
}

function getRequestStatusLabel(
  status: string,
) {
  if (status === 'REQUESTED') {
    return '상담 접수';
  }

  if (status === 'CONTACTED') {
    return '고객 연락';
  }

  if (status === 'IN_PROGRESS') {
    return '상담 진행';
  }

  if (status === 'COMPLETED') {
    return '상담 완료';
  }

  if (status === 'CANCELED') {
    return '취소';
  }

  return '상태 확인';
}

function formatDate(value: Date | string) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}