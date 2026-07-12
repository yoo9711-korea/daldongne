import { auth } from '@/auth';
import CopyTextButton from '@/components/admin/CopyTextButton';
import ProductionRequestStatusButton from '@/components/admin/ProductionRequestStatusButton';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type BookRecord = {
  id: string;
  authorId: string;
  type: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  content: string | null;
  coverText: string | null;
  status: string;
  pageCount: number | null;
  basedPhotoCount: number | null;
  basedStoryCount: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type UserRecord = {
  id: string;
  name: string | null;
  email: string | null;
};

type ProductionRequestRecord = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type LinkedMemoryRecord = {
  id: string;
  order: number;
  memory: {
    id: string;
    type: string;
    title: string | null;
    description: string | null;
    fileUrl: string | null;
    occurredAt: Date | null;
    createdAt: Date;
  };
};

export default async function AdminBookDetailPage({
  params,
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

  const { id } = await params;

  const book = (await prisma.book.findUnique({
    where: {
      id,
    },
  })) as BookRecord | null;

  if (!book) {
    notFound();
  }

  const [author, productionRequest, linkedMemories] =
    await Promise.all([
      prisma.user.findUnique({
        where: {
          id: book.authorId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      }) as Promise<UserRecord | null>,

      prisma.bookProductionRequest.findFirst({
        where: {
          bookId: book.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          message: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }) as Promise<ProductionRequestRecord | null>,

      prisma.bookMemory.findMany({
        where: {
          bookId: book.id,
        },
        orderBy: {
          order: 'asc',
        },
        include: {
          memory: {
            select: {
              id: true,
              type: true,
              title: true,
              description: true,
              fileUrl: true,
              occurredAt: true,
              createdAt: true,
            },
          },
        },
      }) as Promise<LinkedMemoryRecord[]>,
    ]);

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
        <section style={panelStyle()}>
          <p style={smallLabelStyle()}>관리자 / 책 상세</p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 18,
              alignItems: 'flex-start',
              marginTop: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'Noto Serif KR, serif',
                  fontSize: 'clamp(30px, 5vw, 40px)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.05em',
                  color: '#20130d',
                  wordBreak: 'keep-all',
                }}
              >
                {book.title}
              </h1>

              {book.subtitle ? (
                <p
                  style={{
                    margin: '12px 0 0',
                    fontSize: 17,
                    lineHeight: 1.7,
                    color: '#6b5a46',
                    wordBreak: 'keep-all',
                  }}
                >
                  {book.subtitle}
                </p>
              ) : null}

              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: 13,
                  color: '#8a806f',
                }}
              >
                생성일 {formatDateTime(book.createdAt)} · 최근 수정{' '}
                {formatDateTime(book.updatedAt)}
              </p>
            </div>

            <Link
              href="/admin/production-requests"
              style={buttonStyle('#24170f', '#fffaf0')}
            >
              상담 목록으로
            </Link>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <InfoBox
            title="책 상태"
            value={getBookStatusLabel(book.status)}
          />

          <InfoBox
            title="책 종류"
            value={getBookTypeLabel(book.type)}
          />

          <InfoBox
            title="예상 분량"
            value={getPageCountLabel(book.pageCount)}
          />

          <InfoBox
            title="사용 사진"
            value={`${book.basedPhotoCount ?? 0}장`}
          />

          <InfoBox
            title="사용 이야기"
            value={`${book.basedStoryCount ?? 0}개`}
          />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <section style={panelStyle(false)}>
            <p style={smallLabelStyle()}>작성자 정보</p>
            <h2 style={sectionTitleStyle()}>고객 계정</h2>

            <div
              style={{
                display: 'grid',
                gap: 12,
                marginTop: 18,
              }}
            >
              <InfoBox
                title="고객 이름"
                value={author?.name || '-'}
              />

              <InfoBox
                title="계정 이메일"
                value={author?.email || '-'}
                action={
                  <CopyTextButton
                    value={author?.email || null}
                    label="메일 복사"
                  />
                }
              />

              <InfoBox
                title="고객 ID"
                value={book.authorId}
                action={
                  <CopyTextButton
                    value={book.authorId}
                    label="ID 복사"
                  />
                }
              />
            </div>
          </section>

          <section style={panelStyle(false)}>
            <p style={smallLabelStyle()}>제작 상담</p>
            <h2 style={sectionTitleStyle()}>상담 신청 정보</h2>

            {productionRequest ? (
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  marginTop: 18,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    borderRadius: 18,
                    background: '#fffdf6',
                    border: '1px solid #ead7b7',
                    padding: 14,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 900,
                        color: '#8a806f',
                      }}
                    >
                      상담 상태
                    </p>

                    <span
                      style={{
                        ...getProductionRequestStatusBadgeStyle(
                          productionRequest.status,
                        ),
                        marginTop: 8,
                      }}
                    >
                      {getProductionRequestStatusLabel(
                        productionRequest.status,
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      textAlign: 'right',
                      fontSize: 12,
                      lineHeight: 1.7,
                      color: '#8a806f',
                    }}
                  >
                    <div>
                      신청 {formatDateTime(productionRequest.createdAt)}
                    </div>
                    <div>
                      처리 {formatDateTime(productionRequest.updatedAt)}
                    </div>
                  </div>
                </div>

                <InfoBox
                  title="신청자"
                  value={productionRequest.name || '-'}
                />

                <InfoBox
                  title="연락처"
                  value={productionRequest.phone || '-'}
                  action={
                    <CopyTextButton
                      value={productionRequest.phone}
                      label="번호 복사"
                    />
                  }
                />

                <InfoBox
                  title="상담 이메일"
                  value={productionRequest.email || '-'}
                  action={
                    <CopyTextButton
                      value={productionRequest.email}
                      label="메일 복사"
                    />
                  }
                />

                <div
                  style={{
                    borderRadius: 18,
                    background: '#f7eddc',
                    border: '1px solid #ead7b7',
                    padding: 16,
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
                    {productionRequest.message ||
                      '요청 내용이 없습니다.'}
                  </p>
                </div>

                <ProductionRequestStatusButton
                  requestId={productionRequest.id}
                  currentStatus={productionRequest.status}
                />
              </div>
            ) : (
              <EmptyBox text="아직 제작 상담 신청이 없습니다." />
            )}
          </section>
        </section>

        <section style={panelStyle()}>
          <p style={smallLabelStyle()}>선택 자료</p>
          <h2 style={sectionTitleStyle()}>
            원고에 사용된 사진과 이야기
          </h2>

          <p
            style={{
              margin: '10px 0 0',
              fontSize: 14,
              lineHeight: 1.7,
              color: '#6b5a46',
            }}
          >
            총 {linkedMemories.length}개의 기록이 이 책에 연결되어
            있습니다.
          </p>

          {linkedMemories.length > 0 ? (
            <div
              style={{
                marginTop: 20,
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {linkedMemories.map((item, index) => {
                const memory = item.memory;
                const isPhoto =
                  memory.type === 'PHOTO' && Boolean(memory.fileUrl);

                return (
                  <article
                    key={item.id}
                    style={{
                      borderRadius: 22,
                      border: '1px solid #ead7b7',
                      background: '#fffdf6',
                      overflow: 'hidden',
                    }}
                  >
                    {isPhoto ? (
                      <img
                        src={`/api/blob/${memory.id}`}
                        alt={memory.title || '선택된 사진'}
                        style={{
                          width: '100%',
                          height: 170,
                          objectFit: 'cover',
                          display: 'block',
                          background: '#ead7b7',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          minHeight: 90,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f7eddc',
                          color: '#9a6a24',
                          fontSize: 14,
                          fontWeight: 900,
                        }}
                      >
                        {getMemoryTypeLabel(memory.type)}
                      </div>
                    )}

                    <div style={{ padding: 16 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 900,
                          color: '#9a6a24',
                        }}
                      >
                        {index + 1}.{' '}
                        {getMemoryTypeLabel(memory.type)}
                      </p>

                      <h3
                        style={{
                          margin: '8px 0 0',
                          fontSize: 17,
                          lineHeight: 1.45,
                          color: '#20130d',
                        }}
                      >
                        {memory.title || '제목 없는 기록'}
                      </h3>

                      <p
                        style={{
                          margin: '10px 0 0',
                          whiteSpace: 'pre-line',
                          fontSize: 14,
                          lineHeight: 1.7,
                          color: '#5f442a',
                          wordBreak: 'break-word',
                        }}
                      >
                        {memory.description || '설명이 없습니다.'}
                      </p>

                      <p
                        style={{
                          margin: '12px 0 0',
                          fontSize: 12,
                          color: '#8a806f',
                        }}
                      >
                        기록일{' '}
                        {formatDate(
                          memory.occurredAt || memory.createdAt,
                        )}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyBox text="이 책에 연결된 사진과 이야기 자료가 없습니다. 이전 방식으로 만든 책일 수 있습니다." />
          )}
        </section>

        <section style={panelStyle()}>
          <p style={smallLabelStyle()}>원고 본문</p>
          <h2 style={sectionTitleStyle()}>관리자 원고 확인</h2>

          {book.summary ? (
            <div
              style={{
                marginTop: 18,
                borderRadius: 20,
                border: '1px solid #e4cda3',
                background: '#f7eddc',
                padding: 20,
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
                원고 요약
              </p>

              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: '#4a3828',
                  whiteSpace: 'pre-line',
                }}
              >
                {book.summary}
              </p>
            </div>
          ) : null}

          <article
            style={{
              marginTop: 20,
              borderRadius: 24,
              border: '1px solid #ead7b7',
              background: '#fffdf6',
              padding: 'clamp(22px, 5vw, 36px)',
            }}
          >
            {book.content ? (
              <p
                style={{
                  margin: 0,
                  whiteSpace: 'pre-line',
                  fontSize: 16,
                  lineHeight: 2,
                  color: '#3b2b1d',
                  wordBreak: 'keep-all',
                }}
              >
                {book.content}
              </p>
            ) : (
              <EmptyBox text="아직 원고 본문이 없습니다." />
            )}
          </article>
        </section>
      </div>
    </main>
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
        borderRadius: 18,
        background: '#fffdf6',
        border: '1px solid #ead7b7',
        padding: 14,
        minWidth: 0,
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

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 18,
        borderRadius: 22,
        border: '1px dashed #d6b778',
        background: '#f7eddc',
        padding: 26,
        color: '#6b5a46',
        fontSize: 15,
        lineHeight: 1.75,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}

function panelStyle(includeMargin = true): CSSProperties {
  return {
    borderRadius: 30,
    padding: 'clamp(22px, 4vw, 30px)',
    background: '#fffaf0',
    border: '1px solid #e4cda3',
    boxShadow: '0 18px 45px rgba(80, 55, 20, 0.08)',
    marginBottom: includeMargin ? 24 : 0,
  };
}

function buttonStyle(
  background: string,
  color: string,
): CSSProperties {
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

function smallLabelStyle(): CSSProperties {
  return {
    margin: 0,
    fontSize: 14,
    fontWeight: 900,
    color: '#9a6a24',
  };
}

function sectionTitleStyle(): CSSProperties {
  return {
    margin: '8px 0 0',
    fontFamily: 'Noto Serif KR, serif',
    fontSize: 'clamp(24px, 4vw, 28px)',
    lineHeight: 1.35,
    letterSpacing: '-0.04em',
    color: '#20130d',
  };
}

function getProductionRequestStatusBadgeStyle(
  status: string,
): CSSProperties {
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

function getProductionRequestStatusLabel(status: string) {
  if (status === 'REQUESTED') return '상담 신청 접수';
  if (status === 'CONTACTED') return '고객 연락 완료';
  if (status === 'IN_PROGRESS') return '제작 상담 진행 중';
  if (status === 'COMPLETED') return '상담 완료';
  if (status === 'CANCELED') return '상담 취소';

  return '상담 상태 확인 필요';
}

function getPageCountLabel(
  pageCount: number | null | undefined,
) {
  if (!pageCount || pageCount <= 0) {
    return '원고 다시 정리 필요';
  }

  return `${pageCount}쪽`;
}

function getMemoryTypeLabel(type: string) {
  if (type === 'PHOTO') return '사진';
  if (type === 'TEXT') return '이야기';
  if (type === 'AUDIO') return '음성';
  if (type === 'VIDEO') return '영상';

  return '기록';
}

function formatDate(
  value: Date | string | null | undefined,
) {
  if (!value) return '-';

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatDateTime(
  value: Date | string | null | undefined,
) {
  if (!value) return '-';

  const date =
    value instanceof Date ? value : new Date(value);

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