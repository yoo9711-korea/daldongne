import { auth } from '@/auth';
import CopyTextButton from '@/components/admin/CopyTextButton';
import ProductionRequestStatusButton from '@/components/admin/ProductionRequestStatusButton';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import OrderQuoteForm from './OrderQuoteForm';
import ProductionManagementForm from './ProductionManagementForm';
import type {
  CSSProperties,
  ReactNode,
} from 'react';

type BookProductType =
  | 'DIGITAL_MANUSCRIPT'
  | 'BASIC_SOFTCOVER'
  | 'CUSTOM_BOOK';

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
  | 'ALL'
  | 'REQUESTED'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

const PAGE_SIZE = 20;

const STATUS_FILTERS: {
  value: StatusFilter;
  label: string;
}[] = [
  {
    value: 'ALL',
    label: '전체',
  },
  {
    value: 'REQUESTED',
    label: '상담 신청 접수',
  },
  {
    value: 'CONTACTED',
    label: '고객 연락 완료',
  },
  {
    value: 'IN_PROGRESS',
    label: '제작 상담 진행 중',
  },
  {
    value: 'COMPLETED',
    label: '상담 완료',
  },
  {
    value: 'CANCELED',
    label: '취소',
  },
];

export default async function AdminProductionRequestsPage({
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

  const searchQuery = String(
    resolvedSearchParams?.q || '',
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

  const matchingBookIds = matchingBooks.map(
    (book) => book.id,
  );

  const requestWhere: Prisma.BookProductionRequestWhereInput =
    {};

  if (statusFilter !== 'ALL') {
    requestWhere.status = statusFilter;
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
      {
        bookId: {
          in: matchingBookIds,
        },
      },
      ];
  }

  const statusCountWhere: Prisma.BookProductionRequestWhereInput =
    {};

  if (searchQuery) {
    statusCountWhere.OR =
      requestWhere.OR;
  }

  const [
    filteredRequestCount,
    statusCountRows,
  ] = await Promise.all([
    prisma.bookProductionRequest.count({
      where: requestWhere,
    }),

        prisma.bookProductionRequest.groupBy({
      by: ['status'],
      where: statusCountWhere,
      _count: {
        _all: true,
      },
    }),
  ]);

  const totalRequestCount = statusCountRows.reduce(
    (total, row) => total + row._count._all,
    0,
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRequestCount / PAGE_SIZE,
    ),
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages,
  );

  const skip =
    (currentPage - 1) * PAGE_SIZE;

    const requests =
    (await prisma.bookProductionRequest.findMany({
      where: requestWhere,
      include: {
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: PAGE_SIZE,
    })) as ProductionRequestRecord[];

  const bookIds = Array.from(
    new Set(
      requests.map(
        (request) => request.bookId,
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

  const statusCountMap = new Map(
    statusCountRows.map((row) => [
      row.status,
      row._count._all,
    ]),
  );

  const firstVisibleRequest =
    filteredRequestCount === 0
      ? 0
      : skip + 1;

  const lastVisibleRequest = Math.min(
    skip + requests.length,
    filteredRequestCount,
  );

  const pageNumbers = getPageNumbers(
    currentPage,
    totalPages,
  );

  const hasActiveCondition =
    statusFilter !== 'ALL' ||
    Boolean(searchQuery);

  return (
    <main>
      <style>{`
        .production-request-desktop {
          display: block;
        }

        .production-request-mobile {
          display: none;
        }

        @media (max-width: 860px) {
          .production-request-desktop {
            display: none;
          }

          .production-request-mobile {
            display: grid;
          }
        }
      `}</style>

      <div className="runninghead">
        <span className="runninghead__chapter">
          ADMIN
        </span>

        <span className="runninghead__rule" />

        <span
          style={{
            color: 'var(--ink-soft)',
          }}
        >
          제작 상담
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
            제작 상담 신청 목록
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
            고객이 책 상세 페이지에서 신청한 제작 상담
            내용을 확인하고 상담 진행 상태를 관리합니다.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Link
            href="/admin/books"
            style={secondaryHeaderButtonStyle()}
          >
            전체 책 관리
          </Link>

          <Link
            href="/admin"
            style={primaryHeaderButtonStyle()}
          >
            관리자 홈
          </Link>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <SummaryCard
          label="전체 상담"
          value={totalRequestCount}
          color="var(--wine)"
        />

        <SummaryCard
          label="상담 접수"
          value={
            statusCountMap.get(
              'REQUESTED',
            ) ?? 0
          }
          color="#83540d"
        />

        <SummaryCard
          label="고객 연락"
          value={
            statusCountMap.get(
              'CONTACTED',
            ) ?? 0
          }
          color="#245d8c"
        />

        <SummaryCard
          label="상담 진행"
          value={
            statusCountMap.get(
              'IN_PROGRESS',
            ) ?? 0
          }
          color="#62438a"
        />

        <SummaryCard
          label="상담 완료"
          value={
            statusCountMap.get(
              'COMPLETED',
            ) ?? 0
          }
          color="#2f6b38"
        />

        <SummaryCard
          label="현재 검색 결과"
          value={filteredRequestCount}
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
          action="/admin/production-requests"
          method="get"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 12,
            paddingBottom: 20,
            marginBottom: 20,
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

          <label
            style={{
              display: 'grid',
              flex: '1 1 320px',
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
              상담 신청 검색
            </span>

            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="책 제목, 신청자, 전화번호, 이메일"
              maxLength={100}
              style={searchInputStyle()}
            />
          </label>

          <button
            type="submit"
            style={searchButtonStyle()}
          >
            검색 적용
          </button>

          {searchQuery ? (
            <Link
              href={buildListHref({
                status: statusFilter,
              })}
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
          상담 진행 상태
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 14,
          }}
        >
          {STATUS_FILTERS.map(
            (filter) => {
              const active =
                filter.value ===
                statusFilter;

              const count =
                filter.value === 'ALL'
                  ? totalRequestCount
                  : statusCountMap.get(
                      filter.value,
                    ) ?? 0;

              return (
                <Link
                  key={filter.value}
                  href={buildListHref({
                    status: filter.value,
                    searchQuery,
                  })}
                  style={filterButtonStyle(
                    active,
                  )}
                >
                  {filter.label} ({count})
                </Link>
              );
            },
          )}
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
              제작 상담 목록
            </p>

            <p
              style={{
                margin: '8px 0 0',
                color: 'var(--ink-soft)',
                fontSize: 13,
                lineHeight: 1.65,
              }}
            >
              검색 결과 {filteredRequestCount}건
              {' · '}
              {firstVisibleRequest}–
              {lastVisibleRequest}번째 표시
              {searchQuery
                ? ` · 검색어 "${searchQuery}"`
                : ''}
            </p>
          </div>

          {hasActiveCondition ? (
            <Link
              href="/admin/production-requests"
              style={secondaryButtonStyle()}
            >
              전체 조건 초기화
            </Link>
          ) : null}
        </div>

        {requests.length > 0 ? (
          <>
            <div className="production-request-desktop">
              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  padding: 18,
                }}
              >
                {requests.map(
                  (request) => {
                    const book =
                      bookMap.get(
                        request.bookId,
                      );

                    return (
                      <ProductionRequestCard
                        key={request.id}
                        request={request}
                        book={book}
                        mobile={false}
                      />
                    );
                  },
                )}
              </div>
            </div>

            <div
              className="production-request-mobile"
              style={{
                gap: 12,
                padding: 12,
              }}
            >
              {requests.map(
                (request) => {
                  const book =
                    bookMap.get(
                      request.bookId,
                    );

                  return (
                    <ProductionRequestCard
                      key={request.id}
                      request={request}
                      book={book}
                      mobile
                    />
                  );
                },
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageNumbers={pageNumbers}
              status={statusFilter}
              searchQuery={searchQuery}
            />
          </>
        ) : (
          <div
            style={{
              padding: 38,
              textAlign: 'center',
              color: 'var(--ink-soft)',
              fontSize: 14,
              lineHeight: 1.75,
            }}
          >
            현재 조건에 맞는 제작 상담 신청이 없습니다.
          </div>
        )}
      </section>
    </main>
  );
}

function ProductionRequestCard({
  request,
  book,
  mobile,
}: {
  request: ProductionRequestRecord;
  book: BookRecord | undefined;
  mobile: boolean;
}) {
  return (
    <article
      style={{
        borderRadius: mobile ? 18 : 22,
        border:
          '1px solid rgba(34, 28, 22, 0.12)',
        background:
          'rgba(255, 255, 255, 0.34)',
        padding: mobile ? 15 : 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: '1 1 300px',
          }}
        >
          <span
            style={getStatusBadgeStyle(
              request.status,
            )}
          >
            {getStatusLabel(
              request.status,
            )}
          </span>

          <h2
            style={{
              margin: '10px 0 0',
              fontSize: mobile
                ? 18
                : 22,
              lineHeight: 1.4,
              color: 'var(--ink)',
              wordBreak: 'break-word',
            }}
          >
            {book?.title ||
              '책 제목 확인 필요'}
          </h2>

          {book?.subtitle ? (
            <p
              style={{
                margin: '5px 0 0',
                color:
                  'var(--ink-soft)',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {book.subtitle}
            </p>
          ) : null}

          <p
            style={{
              margin: '8px 0 0',
              fontSize: 12,
              color:
                'var(--ink-faint)',
              lineHeight: 1.6,
            }}
          >
            신청일{' '}
            {formatDate(
              request.createdAt,
            )}
            {' · '}
            최근 처리{' '}
            {formatDate(
              request.updatedAt,
            )}
          </p>
        </div>

        <Link
          href={`/admin/books/${request.bookId}`}
          style={bookDetailButtonStyle()}
        >
          책 상세 보기
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            mobile
              ? '1fr'
              : 'repeat(auto-fit, minmax(175px, 1fr))',
          gap: 10,
          marginTop: 18,
        }}
      >
        <InfoBox
          title="신청자"
          value={
            request.name ||
            '이름 없음'
          }
        />

        <InfoBox
          title="연락처"
          value={
            request.phone ||
            '연락처 없음'
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
            '이메일 없음'
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
            book?.status || '',
          )}
        />

        <InfoBox
          title="책 종류"
          value={getBookTypeLabel(
            book?.type || '',
          )}
        />
      </div>

      <div
        style={{
          marginTop: 13,
          borderRadius: 16,
          background:
            'rgba(34, 28, 22, 0.05)',
          border:
            '1px solid rgba(34, 28, 22, 0.08)',
          padding: mobile ? 13 : 16,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 900,
            color: 'var(--ink-soft)',
          }}
        >
          상담 요청 내용
        </p>

        <p
          style={{
            margin: '8px 0 0',
            whiteSpace: 'pre-line',
            fontSize: 14,
            lineHeight: 1.75,
            color: 'var(--ink)',
            wordBreak: 'break-word',
          }}
        >
          {request.message ||
            '상담 요청 내용이 없습니다.'}
        </p>
      </div>

            <OrderQuoteForm
  requestId={request.id}
  requestStatus={request.status}
  initialOrder={request.bookOrder}
/>

<ProductionManagementForm
  requestId={request.id}
  initialOrder={request.bookOrder}
/>

<ProductionRequestStatusButton
  requestId={request.id}
  currentStatus={request.status}
/>
    </article>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
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
          fontFamily:
            'var(--font-display)',
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
          fontFamily:
            'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '.05em',
          color: 'var(--ink-faint)',
        }}
      >
        {label} (건)
      </p>
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
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 15,
        background:
          'rgba(34, 28, 22, 0.045)',
        border:
          '1px solid rgba(34, 28, 22, 0.08)',
        padding: 13,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 900,
            color: 'var(--ink-soft)',
          }}
        >
          {title}
        </p>

        {action}
      </div>

      <p
        style={{
          margin: '7px 0 0',
          fontSize: 14,
          fontWeight: 900,
          color: 'var(--ink)',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </p>
    </div>
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
      aria-label="제작 상담 페이지 이동"
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
          href={buildListHref({
            status,
            searchQuery,
            page:
              currentPage - 1,
          })}
          style={pageButtonStyle(false)}
        >
          이전
        </Link>
      ) : (
        <span
          style={disabledPageButtonStyle()}
        >
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
                ? 'page'
                : undefined
            }
            style={pageButtonStyle(
              pageNumber ===
                currentPage,
            )}
          >
            {pageNumber}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={buildListHref({
            status,
            searchQuery,
            page:
              currentPage + 1,
          })}
          style={pageButtonStyle(false)}
        >
          다음
        </Link>
      ) : (
        <span
          style={disabledPageButtonStyle()}
        >
          다음
        </span>
      )}
    </nav>
  );
}

function normalizeStatusFilter(
  value: string | undefined,
): StatusFilter {
  if (value === 'REQUESTED') {
    return 'REQUESTED';
  }

  if (value === 'CONTACTED') {
    return 'CONTACTED';
  }

  if (value === 'IN_PROGRESS') {
    return 'IN_PROGRESS';
  }

  if (value === 'COMPLETED') {
    return 'COMPLETED';
  }

  if (value === 'CANCELED') {
    return 'CANCELED';
  }

  return 'ALL';
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
  searchQuery = '',
  page = 1,
}: {
  status: StatusFilter;
  searchQuery?: string;
  page?: number;
}) {
  const params =
    new URLSearchParams();

  if (status !== 'ALL') {
    params.set('status', status);
  }

  if (searchQuery.trim()) {
    params.set(
      'q',
      searchQuery.trim(),
    );
  }

  if (page > 1) {
    params.set(
      'page',
      String(page),
    );
  }

  const query = params.toString();

  return query
    ? `/admin/production-requests?${query}`
    : '/admin/production-requests';
}

function searchInputStyle(): CSSProperties {
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

function searchButtonStyle(): CSSProperties {
  return {
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border:
      '1px solid var(--wine)',
    background: 'var(--wine)',
    color: 'var(--cream)',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
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

function primaryHeaderButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border:
      '1px solid var(--wine)',
    background: 'var(--wine)',
    color: 'var(--cream)',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function secondaryHeaderButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border:
      '1px solid rgba(34, 28, 22, 0.18)',
    background:
      'rgba(255, 255, 255, 0.35)',
    color: 'var(--wine)',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
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

function bookDetailButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    padding: '0 13px',
    borderRadius: 999,
    border:
      '1px solid rgba(34, 28, 22, 0.18)',
    color: 'var(--wine)',
    fontSize: 12,
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

function getStatusBadgeStyle(
  status: string,
): CSSProperties {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 28,
    padding: '0 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    border:
      '1px solid transparent',
    whiteSpace: 'nowrap',
  };

  if (status === 'REQUESTED') {
    return {
      ...baseStyle,
      background: '#fff1c7',
      color: '#83540d',
      borderColor: '#eac66f',
    };
  }

  if (status === 'CONTACTED') {
    return {
      ...baseStyle,
      background: '#e4f2ff',
      color: '#245d8c',
      borderColor: '#9fc9e8',
    };
  }

  if (status === 'IN_PROGRESS') {
    return {
      ...baseStyle,
      background: '#efe6ff',
      color: '#62438a',
      borderColor: '#c8b1e8',
    };
  }

  if (status === 'COMPLETED') {
    return {
      ...baseStyle,
      background: '#e3f4e5',
      color: '#2f6b38',
      borderColor: '#9dcca4',
    };
  }

  if (status === 'CANCELED') {
    return {
      ...baseStyle,
      background: '#f2eeee',
      color: '#776868',
      borderColor: '#d8cccc',
    };
  }

  return {
    ...baseStyle,
    background: '#f1eee8',
    color: '#6b5a46',
    borderColor: '#d8cdbc',
  };
}

function getStatusLabel(
  status: string,
) {
  if (status === 'REQUESTED') {
    return '상담 신청 접수';
  }

  if (status === 'CONTACTED') {
    return '고객 연락 완료';
  }

  if (status === 'IN_PROGRESS') {
    return '제작 상담 진행 중';
  }

  if (status === 'COMPLETED') {
    return '상담 완료';
  }

  if (status === 'CANCELED') {
    return '취소';
  }

  return '상태 확인 필요';
}

function getBookStatusLabel(
  status: string,
) {
  if (status === 'DRAFT') {
    return '원고 초안';
  }

  if (status === 'IN_PRODUCTION') {
    return '제작 준비 중';
  }

  if (status === 'PUBLISHED') {
    return '완성';
  }

  return '상태 확인 필요';
}

function getBookTypeLabel(
  type: string,
) {
  if (type === 'LIFE_BOOK') {
    return '부모님 인생책';
  }

  if (type === 'FAMILY_BOOK') {
    return '가족 이야기책';
  }

  if (type === 'COUPLE_BOOK') {
    return '부부 이야기책';
  }

  if (type === 'BABY_BOOK') {
    return '성장 기록책';
  }

  if (type === 'TRAVEL_BOOK') {
    return '여행 기록책';
  }

  if (type === 'AI_MOVIE') {
    return 'AI 영상';
  }

  return '종류 확인 필요';
}

function formatDate(
  value: Date | string | unknown,
) {
  if (!value) {
    return '-';
  }

  const date =
    value instanceof Date
      ? value
      : new Date(String(value));

  if (
    Number.isNaN(date.getTime())
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}
