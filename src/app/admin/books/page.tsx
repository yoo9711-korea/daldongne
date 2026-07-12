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
    q?: string;
    sort?: string;
  }>;
};

type StatusFilter = 'ALL' | BookStatus;
type TypeFilter = 'ALL' | BookType;
type SortOrder = 'latest' | 'oldest';

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
  { value: BookType.LIFE_BOOK, label: '부모님 인생책' },
  { value: BookType.FAMILY_BOOK, label: '가족 이야기책' },
  { value: BookType.COUPLE_BOOK, label: '부부 이야기책' },
  { value: BookType.BABY_BOOK, label: '성장 기록책' },
  { value: BookType.TRAVEL_BOOK, label: '여행 기록책' },
  { value: BookType.AI_MOVIE, label: 'AI 영상' },
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

  const searchQuery = String(
    resolvedSearchParams?.q || '',
  )
    .trim()
    .slice(0, 100);

  const sortOrder = normalizeSortOrder(
    resolvedSearchParams?.sort,
  );

  const where: Prisma.BookWhereInput = {};

  if (statusFilter !== 'ALL') {
    where.status = statusFilter;
  }

  if (typeFilter !== 'ALL') {
    where.type = typeFilter;
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

  const [
    books,
    filteredBookCount,
    statusCountRows,
    typeCountRows,
  ] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: {
        createdAt:
          sortOrder === 'oldest' ? 'asc' : 'desc',
      },
      take: 200,
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

    prisma.book.count({
      where,
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
  ]);

  const authorIds = Array.from(
    new Set(books.map((book) => book.authorId)),
  );

  const bookIds = books.map((book) => book.id);

  const [authors, productionRequests] = await Promise.all([
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

  for (const request of productionRequests) {
    if (!latestRequestMap.has(request.bookId)) {
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

  const totalBookCount = statusCountRows.reduce(
    (total, row) => total + row._count._all,
    0,
  );

  const hasActiveCondition =
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    Boolean(searchQuery) ||
    sortOrder !== 'latest';

  return (
    <main>
      <div className="runninghead">
        <span className="runninghead__chapter">ADMIN</span>
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
            회원이 만든 책 원고와 제작 상태, 작성자 및 제작
            상담 현황을 확인합니다.
          </p>
        </div>

        <Link href="/admin" style={primaryButtonStyle()}>
          관리자 홈
        </Link>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(170px, 1fr))',
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
          value={statusCountMap.get(BookStatus.DRAFT) ?? 0}
          unit="권"
          color="#7b4f2a"
        />

        <SummaryCard
          label="제작 준비 중"
          value={
            statusCountMap.get(BookStatus.IN_PRODUCTION) ?? 0
          }
          unit="권"
          color="#9a6a24"
        />

        <SummaryCard
          label="완성된 책"
          value={
            statusCountMap.get(BookStatus.PUBLISHED) ?? 0
          }
          unit="권"
          color="#3e5f3a"
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

          <label
            style={{
              display: 'grid',
              flex: '1 1 280px',
              gap: 7,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: 'var(--ink-soft)',
              }}
            >
              책 또는 작성자 검색
            </span>

            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="책 제목, 작성자 이름, 이메일"
              maxLength={100}
              style={{
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
              }}
            />
          </label>

          <label
            style={{
              display: 'grid',
              flex: '0 1 180px',
              gap: 7,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: 'var(--ink-soft)',
              }}
            >
              정렬
            </span>

            <select
              name="sort"
              defaultValue={sortOrder}
              style={{
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
              }}
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>
          </label>

          <button type="submit" style={searchButtonStyle()}>
            검색 적용
          </button>

          {searchQuery || sortOrder !== 'latest' ? (
            <Link
              href={buildFilterHref(
                statusFilter,
                typeFilter,
                '',
                'latest',
              )}
              style={secondaryButtonStyle()}
            >
              검색 초기화
            </Link>
          ) : null}
        </form>

        <p
          className="dash-card__label"
          style={{
            margin: 0,
          }}
        >
          책 상태
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 14,
          }}
        >
          {STATUS_FILTERS.map((filter) => {
            const active = filter.value === statusFilter;

            const count =
              filter.value === 'ALL'
                ? totalBookCount
                : statusCountMap.get(filter.value) ?? 0;

            return (
              <Link
                key={filter.value}
                href={buildFilterHref(
                  filter.value,
                  typeFilter,
                  searchQuery,
                  sortOrder,
                )}
                style={filterButtonStyle(active)}
              >
                {filter.label} ({count})
              </Link>
            );
          })}
        </div>

        <p
          className="dash-card__label"
          style={{
            margin: '22px 0 0',
          }}
        >
          책 종류
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 14,
          }}
        >
          {TYPE_FILTERS.map((filter) => {
            const active = filter.value === typeFilter;

            const count =
              filter.value === 'ALL'
                ? totalBookCount
                : typeCountMap.get(filter.value) ?? 0;

            return (
              <Link
                key={filter.value}
                href={buildFilterHref(
                  statusFilter,
                  filter.value,
                  searchQuery,
                  sortOrder,
                )}
                style={filterButtonStyle(active)}
              >
                {filter.label} ({count})
              </Link>
            );
          })}
        </div>
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
                lineHeight: 1.6,
              }}
            >
              현재 조건에 맞는 책 {filteredBookCount}권
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
                    background: 'var(--paper-shade)',
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
                      style={{
                        padding: '12px 14px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 400,
                        letterSpacing: '.05em',
                        color: 'var(--ink-faint)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {books.map((book) => {
                  const author = authorMap.get(book.authorId);
                  const request = latestRequestMap.get(book.id);

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
                          padding: '14px',
                          minWidth: 230,
                        }}
                      >
                        <strong
                          style={{
                            display: 'block',
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: 'var(--ink)',
                            wordBreak: 'break-word',
                          }}
                        >
                          {book.title}
                        </strong>

                        {book.subtitle ? (
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
                            {book.subtitle}
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
                          최근 수정 {formatDate(book.updatedAt)}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '14px',
                          minWidth: 180,
                        }}
                      >
                        <strong
                          style={{
                            display: 'block',
                            fontSize: 13,
                            color: 'var(--ink)',
                          }}
                        >
                          {author?.name || '이름 없음'}
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
                          {author?.email || '이메일 없음'}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '14px',
                          fontSize: 12,
                          color: 'var(--ink-soft)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getBookTypeLabel(book.type)}
                      </td>

                      <td
                        style={{
                          padding: '14px',
                        }}
                      >
                        <span
                          style={bookStatusBadgeStyle(
                            book.status,
                          )}
                        >
                          {getBookStatusLabel(book.status)}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: '14px',
                          fontSize: 12,
                          color: 'var(--ink-soft)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        사진 {book.basedPhotoCount ?? 0}장
                        <br />
                        이야기 {book.basedStoryCount ?? 0}개
                      </td>

                      <td
                        style={{
                          padding: '14px',
                          fontSize: 13,
                          color: 'var(--ink-soft)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {book.pageCount
                          ? `${book.pageCount}쪽`
                          : '미정'}
                      </td>

                      <td
                        style={{
                          padding: '14px',
                          minWidth: 140,
                        }}
                      >
                        {request ? (
                          <>
                            <span
                              style={requestStatusBadgeStyle(
                                request.status,
                              )}
                            >
                              {getRequestStatusLabel(
                                request.status,
                              )}
                            </span>

                            <span
                              style={{
                                display: 'block',
                                marginTop: 5,
                                fontSize: 11,
                                color: 'var(--ink-faint)',
                              }}
                            >
                              {formatDate(request.createdAt)}
                            </span>
                          </>
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              color: 'var(--ink-faint)',
                            }}
                          >
                            신청 없음
                          </span>
                        )}
                      </td>

                      <td
                        style={{
                          padding: '14px',
                          fontSize: 12,
                          color: 'var(--ink-faint)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(book.createdAt)}
                      </td>

                      <td
                        style={{
                          padding: '14px',
                          whiteSpace: 'nowrap',
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

function normalizeSortOrder(
  value: string | undefined,
): SortOrder {
  if (value === 'oldest') {
    return 'oldest';
  }

  return 'latest';
}

function buildFilterHref(
  status: StatusFilter,
  type: TypeFilter,
  searchQuery = '',
  sortOrder: SortOrder = 'latest',
) {
  const params = new URLSearchParams();

  if (status !== 'ALL') {
    params.set('status', status);
  }

  if (type !== 'ALL') {
    params.set('type', type);
  }

  if (searchQuery.trim()) {
    params.set('q', searchQuery.trim());
  }

  if (sortOrder !== 'latest') {
    params.set('sort', sortOrder);
  }

  const query = params.toString();

  return query
    ? `/admin/books?${query}`
    : '/admin/books';
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
    border: '1px solid rgba(34, 28, 22, 0.18)',
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
    border: '1px solid rgba(34, 28, 22, 0.2)',
    color: 'var(--wine)',
    fontSize: 11,
    fontWeight: 900,
    textDecoration: 'none',
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

  if (status === BookStatus.IN_PRODUCTION) {
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
    background: 'rgba(34, 28, 22, 0.08)',
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
    background: 'rgba(34, 28, 22, 0.08)',
    color: 'var(--ink-faint)',
  };
}

function getBookStatusLabel(status: string) {
  if (status === BookStatus.DRAFT) {
    return '원고 초안';
  }

  if (status === BookStatus.IN_PRODUCTION) {
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

function getRequestStatusLabel(status: string) {
  if (status === 'REQUESTED') return '상담 접수';
  if (status === 'CONTACTED') return '고객 연락';
  if (status === 'IN_PROGRESS') return '상담 진행';
  if (status === 'COMPLETED') return '상담 완료';
  if (status === 'CANCELED') return '취소';

  return '상태 확인';
}

function formatDate(value: Date | string) {
  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}