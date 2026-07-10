import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ProductionRequestStatusButton from '@/components/admin/ProductionRequestStatusButton';

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

export default async function AdminBookDetailPage({ params }: PageProps) {
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

  const [author, productionRequest] = await Promise.all([
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
  ]);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '34px 28px 80px',
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
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 900,
              color: '#9a6a24',
            }}
          >
            관리자 / 책 상세
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 18,
              alignItems: 'flex-start',
              marginTop: 10,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'Noto Serif KR, serif',
                  fontSize: 40,
                  lineHeight: 1.25,
                  letterSpacing: '-0.05em',
                  color: '#20130d',
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
                  }}
                >
                  {book.subtitle}
                </p>
              ) : null}
            </div>

            <Link href="/admin/production-requests" style={buttonStyle('#24170f', '#fffaf0')}>
              상담 목록으로
            </Link>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <InfoBox title="책 상태" value={getBookStatusLabel(book.status)} />
          <InfoBox title="책 종류" value={getBookTypeLabel(book.type)} />
          <InfoBox title="예상 분량" value={getPageCountLabel(book.pageCount)} />
          <InfoBox title="사진" value={`${book.basedPhotoCount ?? 0}장`} />
          <InfoBox title="이야기" value={`${book.basedStoryCount ?? 0}개`} />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <section style={panelStyle()}>
            <p style={smallLabelStyle()}>작성자 정보</p>

            <h2 style={sectionTitleStyle()}>고객 정보</h2>

            <div
              style={{
                display: 'grid',
                gap: 12,
                marginTop: 18,
              }}
            >
              <InfoBox title="이름" value={author?.name || '-'} />
              <InfoBox title="이메일" value={author?.email || '-'} />
              <InfoBox title="고객 ID" value={book.authorId} />
            </div>
          </section>

          <section style={panelStyle()}>
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
                <InfoBox
                  title="상담 상태"
                  value={getProductionRequestStatusLabel(productionRequest.status)}
                />

                 <ProductionRequestStatusButton
                           requestId={productionRequest.id}
                           currentStatus={productionRequest.status}  
                   />                

                <InfoBox title="신청자" value={productionRequest.name || '-'} />
                <InfoBox title="연락처" value={productionRequest.phone || '-'} />
                <InfoBox title="이메일" value={productionRequest.email || '-'} />

                
                   

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
                    }}
                  >
                    {productionRequest.message || '요청 내용이 없습니다.'}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyBox text="아직 제작 상담 신청이 없습니다." />
            )}
          </section>
        </section>

        <section style={panelStyle()}>
          <p style={smallLabelStyle()}>원고 본문</p>

          <h2 style={sectionTitleStyle()}>관리자 원고 확인</h2>

          <article
            style={{
              marginTop: 20,
              borderRadius: 24,
              border: '1px solid #ead7b7',
              background: '#fffdf6',
              padding: '30px 36px',
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

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: '#fffdf6',
        border: '1px solid #ead7b7',
        padding: 14,
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

function panelStyle() {
  return {
    borderRadius: 30,
    padding: 30,
    background: '#fffaf0',
    border: '1px solid #e4cda3',
    boxShadow: '0 18px 45px rgba(80, 55, 20, 0.08)',
    marginBottom: 24,
  };
}

function buttonStyle(background: string, color: string) {
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
    whiteSpace: 'nowrap' as const,
  };
}

function smallLabelStyle() {
  return {
    margin: 0,
    fontSize: 14,
    fontWeight: 900,
    color: '#9a6a24',
  };
}

function sectionTitleStyle() {
  return {
    margin: '8px 0 0',
    fontFamily: 'Noto Serif KR, serif',
    fontSize: 28,
    lineHeight: 1.35,
    letterSpacing: '-0.04em',
    color: '#20130d',
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

function getPageCountLabel(pageCount: number | null | undefined) {
  if (!pageCount || pageCount <= 0) {
    return '원고 다시 정리 필요';
  }

  return `${pageCount}쪽`;
}