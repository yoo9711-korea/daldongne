import { auth } from '@/auth';
import ProductionRequestStatusButton from '@/components/admin/ProductionRequestStatusButton';
import CopyTextButton from '@/components/admin/CopyTextButton';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

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
};

type BookRecord = {
  id: string;
  title: string;
  status: string;
  type: string;
};

type PageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

type StatusFilter =
  | 'ALL'
  | 'REQUESTED'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

const STATUS_FILTERS: {
  value: StatusFilter;
  label: string;
}[] = [
  { value: 'ALL', label: '전체' },
  { value: 'REQUESTED', label: '상담 신청 접수' },
  { value: 'CONTACTED', label: '고객 연락 완료' },
  { value: 'IN_PROGRESS', label: '제작 상담 진행 중' },
  { value: 'COMPLETED', label: '상담 완료' },
  { value: 'CANCELED', label: '취소' },
];

export default async function AdminProductionRequestsPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;
  const statusFilter = normalizeStatusFilter(resolvedSearchParams?.status);

  const requestWhere =
    statusFilter === 'ALL'
      ? {}
      : {
          status: statusFilter,
        };

  const requests = (await prisma.bookProductionRequest.findMany({
    where: requestWhere,
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  })) as ProductionRequestRecord[];

     const statusCountRows =
    await prisma.bookProductionRequest.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

  const statusCountMap = new Map(
    statusCountRows.map((row) => [
      row.status,
      row._count._all,
    ]),
  );

  const totalRequestCount = statusCountRows.reduce(
    (total, row) => total + row._count._all,
    0,
  );
  
  const bookIds = Array.from(
    new Set(requests.map((request) => request.bookId)),
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
          status: true,
          type: true,
        },
      })) as BookRecord[])
    : [];

  const bookMap = new Map(books.map((book) => [book.id, book]));

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '34px 20px 80px',
        background: '#f7eddc',
        color: '#24170f',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1180,
          margin: '0 auto',
        }}
      >
        <section
          style={{
            border: '1px solid #e4cda3',
            background: '#fffaf0',
            borderRadius: 30,
            padding: 32,
            boxShadow: '0 18px 45px rgba(80, 55, 20, 0.10)',
            marginBottom: 24,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 900,
              color: '#9a6a24',
            }}
          >
            관리자 / 제작 상담
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 18,
              alignItems: 'center',
              marginTop: 10,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'Noto Serif KR, serif',
                  fontSize: 'clamp(30px, 5vw, 40px)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.05em',
                  color: '#20130d',
                }}
              >
                제작 상담 신청 목록
              </h1>

              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: '#6b5a46',
                }}
              >
                고객이 책 상세 페이지에서 신청한 제작 상담 요청을
                확인하고 처리합니다.
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
    style={buttonStyle('#f3d28a', '#6d4512')}
  >
    전체 책 관리
  </Link>

  <Link
    href="/admin"
    style={buttonStyle('#24170f', '#fffaf0')}
  >
    관리자 홈
  </Link>
</div>            

          </div>
        </section>

        <section
          style={{
            border: '1px solid #e4cda3',
            background: '#fffaf0',
            borderRadius: 24,
            padding: 18,
            boxShadow: '0 12px 30px rgba(80, 55, 20, 0.06)',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {STATUS_FILTERS.map((filter) => {
                
              const active = filter.value === statusFilter;
              const count =
                      filter.value === 'ALL'
                      ? totalRequestCount
                      : statusCountMap.get(filter.value) ?? 0;

         return (     

                  <Link
                    key={filter.value}
                    href={
                      filter.value === 'ALL'
                        ? '/admin/production-requests'
                        : `/admin/production-requests?status=${filter.value}`
                    }
                    style={buttonStyle(
                      active ? '#24170f' : '#fffaf0',
                      active ? '#fffaf0' : '#5a3a18',
                    )}
                  >
                    {filter.label} ({count})
                  </Link>
                );
              })}
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 900,
                color: '#8a806f',
              }}
            >
              현재 표시: {requests.length}건
            </p>
          </div>
        </section>

        <section
          style={{
            border: '1px solid #e4cda3',
            background: '#fffaf0',
            borderRadius: 30,
            padding: '28px clamp(16px, 4vw, 28px)',
            boxShadow: '0 18px 45px rgba(80, 55, 20, 0.08)',
          }}
        >
          {requests.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {requests.map((request) => {
                const book = bookMap.get(request.bookId);

                return (
                  <article
                    key={request.id}
                    style={{
                      borderRadius: 22,
                      border: '1px solid #ead7b7',
                      background: '#fffdf6',
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 16,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <span style={getStatusBadgeStyle(request.status)}>
                          {getStatusLabel(request.status)}
                        </span>

                        <h2
                          style={{
                            margin: '10px 0 0',
                            fontSize: 22,
                            lineHeight: 1.35,
                            color: '#20130d',
                          }}
                        >
                          {book?.title || '책 제목 확인 필요'}
                        </h2>

                        <p
                          style={{
                            margin: '8px 0 0',
                            fontSize: 14,
                            color: '#8a806f',
                          }}
                        >
                          신청일: {formatDate(request.createdAt)}
                        </p>

                        <p
                          style={{
                            margin: '4px 0 0',
                            fontSize: 13,
                            color: '#9b8c77',
                          }}
                        >
                          최근 처리일: {formatDate(request.updatedAt)}
                        </p>
                      </div>

                      <Link
                        href={`/admin/books/${request.bookId}`}
                        style={buttonStyle('#f3d28a', '#6d4512')}
                      >
                        책 상세 보기
                      </Link>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: 12,
                        marginTop: 18,
                      }}
                    >
                      <InfoBox
                        title="신청자"
                        value={request.name || '-'}
                      />

                      <InfoBox
                         title="연락처"
                         value={request.phone || '-'}
                         action={
                 <CopyTextButton
                        value={request.phone}
                        label="번호 복사"
                        />
                      }
                   />

                      <InfoBox
                          title="이메일"
                          value={request.email || '-'}
                          action={
                         <CopyTextButton
                        value={request.email}
                     label="메일 복사"
                      />
                    }
                 />

                      <InfoBox
                        title="책 상태"
                        value={getBookStatusLabel(book?.status || '')}
                      />

                      <InfoBox
                        title="책 종류"
                        value={getBookTypeLabel(book?.type || '')}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        borderRadius: 18,
                        background: '#f7eddc',
                        border: '1px solid #ead7b7',
                        padding: 16,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 900,
                          color: '#8a806f',
                        }}
                      >
                        요청 내용
                      </p>

                      <p
                        style={{
                          margin: '8px 0 0',
                          whiteSpace: 'pre-line',
                          fontSize: 15,
                          lineHeight: 1.75,
                          color: '#4a3828',
                          wordBreak: 'break-word',
                        }}
                      >
                        {request.message || '요청 내용이 없습니다.'}
                      </p>
                    </div>

                    <ProductionRequestStatusButton
                      requestId={request.id}
                      currentStatus={request.status}
                    />
                  </article>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                borderRadius: 22,
                border: '1px dashed #d6b778',
                background: '#f7eddc',
                padding: 34,
                textAlign: 'center',
                color: '#6b5a46',
                fontSize: 15,
                lineHeight: 1.75,
              }}
            >
              해당 상태의 제작 상담 신청이 없습니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function normalizeStatusFilter(value: string | undefined): StatusFilter {
  if (value === 'REQUESTED') return 'REQUESTED';
  if (value === 'CONTACTED') return 'CONTACTED';
  if (value === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (value === 'COMPLETED') return 'COMPLETED';
  if (value === 'CANCELED') return 'CANCELED';

  return 'ALL';
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
        borderRadius: 18,
        background: '#f7eddc',
        border: '1px solid #ead7b7',
        padding: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 900,
            color: '#8a806f',
          }}
        >
          {title}
        </p>

        {action}
      </div>

      <p
        style={{
          margin: '8px 0 0',
          fontSize: 15,
          fontWeight: 900,
          color: '#20130d',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function buttonStyle(background: string, color: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border: '1px solid #d6b778',
    background,
    color,
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function getStatusBadgeStyle(status: string): CSSProperties {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 30,
    padding: '0 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
    border: '1px solid transparent',
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

function getStatusLabel(status: string) {
  if (status === 'REQUESTED') return '상담 신청 접수';
  if (status === 'CONTACTED') return '고객 연락 완료';
  if (status === 'IN_PROGRESS') return '제작 상담 진행 중';
  if (status === 'COMPLETED') return '상담 완료';
  if (status === 'CANCELED') return '취소';

  return '상태 확인 필요';
}

function getBookStatusLabel(status: string) {
  if (status === 'DRAFT') return '원고 초안';
  if (status === 'IN_PRODUCTION') return '제작 준비 중';
  if (status === 'PUBLISHED') return '완성';

  return '상태 확인 필요';
}

function getBookTypeLabel(type: string) {
  if (type === 'LIFE_BOOK') return '부모님 인생책';
  if (type === 'FAMILY_BOOK') return '가족 이야기책';
  if (type === 'COUPLE_BOOK') return '부부 이야기책';
  if (type === 'BABY_BOOK') return '성장 기록책';
  if (type === 'TRAVEL_BOOK') return '여행 기록책';
  if (type === 'AI_MOVIE') return 'AI 영상';

  return '종류 확인 필요';
}

function formatDate(value: Date | string | unknown) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}