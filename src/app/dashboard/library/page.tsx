import { auth } from '@/auth';
import PageGuideBox from '@/components/guide/PageGuideBox';
import BookShelfView from '@/components/library/BookShelfView';
import LibraryBookList from '@/components/library/LibraryBookList';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';

const TYPE_LABEL: Record<string, string> = {
  LIFE_BOOK: '인생 기록책',
  FAMILY_BOOK: '가족 이야기책',
  COUPLE_BOOK: '부부 이야기책',
  BABY_BOOK: '성장 기록책',
  TRAVEL_BOOK: '여행 기록책',
  AI_MOVIE: 'AI 영상',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '원고 초안',
  IN_PRODUCTION: '제작 진행 중',
  PUBLISHED: '완성',
};

export default async function LibraryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const books = await prisma.book.findMany({
    where: {
      authorId: userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const bookIds = books.map(
    (book) => book.id,
  );

   const productionRequests =
    bookIds.length > 0
      ? await prisma.bookProductionRequest.findMany({
          where: {
            bookId: {
              in: bookIds,
            },
            authorId: userId,
          },
          orderBy: [
            {
              createdAt: 'desc',
            },
            {
              updatedAt: 'desc',
            },
          ],
          select: {
            bookId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : [];

  const activeProductionStatuses =
    new Set([
      'REQUESTED',
      'CONTACTED',
      'IN_PROGRESS',
    ]);

  const activeProductionRequestBookIds =
    new Set(
      productionRequests
        .filter(
          (request) =>
            request.status !==
            'CANCELED',
        )
        .map(
          (request) =>
            request.bookId,
        ),
    );

  const pendingProductionRequestBookIds =
    new Set(
      productionRequests
        .filter((request) =>
          activeProductionStatuses.has(
            String(
              request.status,
            ),
          ),
        )
        .map(
          (request) =>
            request.bookId,
        ),
    );

  const productionRequestsByBookId =
    new Map<
      string,
      Array<
        (typeof productionRequests)[number]
      >
    >();

  for (
    const request of productionRequests
  ) {
    const requests =
      productionRequestsByBookId.get(
        request.bookId,
      ) || [];

    requests.push(request);

    productionRequestsByBookId.set(
      request.bookId,
      requests,
    );
  }

  const representativeProductionRequestStatusByBookId =
    new Map<string, string>();

  for (
    const [
      bookId,
      requests,
    ] of productionRequestsByBookId
  ) {
    const activeRequest = requests
      .filter((request) =>
        activeProductionStatuses.has(
          String(
            request.status,
          ),
        ),
      )
      .sort(
        (first, second) =>
          second.updatedAt.getTime() -
          first.updatedAt.getTime(),
      )[0];

    const latestRequest = [
      ...requests,
    ].sort(
      (first, second) =>
        second.createdAt.getTime() -
        first.createdAt.getTime(),
    )[0];

    const representativeRequest =
      activeRequest ||
      latestRequest;

    if (representativeRequest) {
      representativeProductionRequestStatusByBookId.set(
        bookId,
        String(
          representativeRequest.status,
        ),
      );
    }
  }

  const draftCount = books.filter(
    (book) =>
      book.status === 'DRAFT',
  ).length;

  const inProductionCount =
    books.filter(
      (book) =>
        book.status ===
        'IN_PRODUCTION',
    ).length;

  const publishedCount =
    books.filter(
      (book) =>
        book.status === 'PUBLISHED',
    ).length;

  const shelfBooks = books
    .slice(0, 6)
    .map((book) => ({
      id: book.id,
      title: book.title,
      subtitle:
        TYPE_LABEL[
          String(book.type)
        ] || '책 원고',
      status:
        STATUS_LABEL[
          String(book.status)
        ] || '상태 확인 필요',
      href: `/dashboard/library/${book.id}`,
    }));

  const listBooks = books.map(
    (book) => ({
      id: book.id,
      type: String(book.type),
      title: book.title,
      status: String(book.status),
      summary: book.summary,
      pageCount: book.pageCount,
      basedPhotoCount:
        book.basedPhotoCount,
      basedStoryCount:
        book.basedStoryCount,
      createdAt:
        book.createdAt.toISOString(),
            hasProductionRequest:
        activeProductionRequestBookIds.has(
          book.id,
        ),
      productionRequestStatus:
        representativeProductionRequestStatusByBookId.get(
          book.id,
        ) || null,
    }),
  );

  return (
    <main
      style={gridPaperPageStyle()}
    >
      <style>{`
        .library-page-container {
          width: 100%;
          max-width: 1380px;
          margin: 0 auto;
          padding: 28px;
        }

        .library-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        @media (max-width: 700px) {
          .library-page-container {
            padding: 16px;
          }

          .library-page-hero {
            padding: 26px 20px !important;
            border-radius: 24px !important;
          }

          .library-hero-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .library-hero-actions a {
            width: 100%;
          }

          .library-page-section {
            padding: 20px 16px !important;
            border-radius: 24px !important;
          }
        }
      `}</style>

      <div className="library-page-container">
        <section
          className="library-page-hero"
          style={{
            padding: 38,
            borderRadius: 34,
            background:
              'linear-gradient(135deg, #33271d 0%, #5b422c 52%, #8a6238 100%)',
            color: '#fff8ec',
            boxShadow:
              '0 22px 60px rgba(51, 39, 29, 0.18)',
          }}
        >
          <p
            style={{
              margin: '0 0 13px',
              color: '#f0c36a',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            나의 책 보관함
          </p>

          <h1
            style={{
              margin: 0,
              maxWidth: 900,
              fontFamily:
                'Noto Serif KR, serif',
              fontSize:
                'clamp(34px, 5vw, 56px)',
              lineHeight: 1.2,
              letterSpacing: '-0.05em',
            }}
          >
            사진과 이야기를 모아 만든
            <br />
            책 원고를 보관합니다.
          </h1>

          <p
            style={{
              margin: '22px 0 0',
              maxWidth: 820,
              color:
                'rgba(255, 248, 236, 0.86)',
              fontSize: 18,
              lineHeight: 1.8,
            }}
          >
            지금까지 만든 책 원고를
            확인하고, 원고를 다시 정리하거나
            인쇄용 화면을 볼 수 있습니다.
            제작을 원하는 책은 상세 화면에서
            제작 상담을 신청할 수 있습니다.
          </p>

          <div
            style={{
              marginTop: 26,
              padding: '18px 20px',
              borderRadius: 20,
              border:
                '1px solid rgba(255,255,255,0.2)',
              background:
                'rgba(255,255,255,0.08)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#f0c36a',
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              현재 내 책장
            </p>

            <strong
              style={{
                display: 'block',
                marginTop: 7,
                fontSize: 21,
                lineHeight: 1.45,
              }}
            >
              {books.length > 0
                ? `총 ${books.length}권의 책 원고가 저장되어 있습니다.`
                : '아직 저장된 책 원고가 없습니다.'}
            </strong>

            <p
              style={{
                margin: '6px 0 0',
                color:
                  'rgba(255, 248, 236, 0.75)',
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {books.length > 0
                ? `제작 진행 중 ${inProductionCount}권, 완성된 책 ${publishedCount}권입니다.`
                : '사진을 모으고 이야기를 남긴 뒤 첫 번째 책 원고를 만들어보세요.'}
            </p>
          </div>

          <div
            className="library-hero-actions"
            style={{
              marginTop: 22,
            }}
          >
            <Link
              href="/dashboard/book"
              style={heroPrimaryButtonStyle()}
            >
              새 책 원고 만들기
            </Link>

            <Link
              href="/dashboard/timeline"
              style={heroSecondaryButtonStyle()}
            >
              사진 모으기
            </Link>

            <Link
              href="/dashboard/interview"
              style={heroSecondaryButtonStyle()}
            >
              이야기 남기기
            </Link>

            <Link
              href="/dashboard"
              style={heroSecondaryButtonStyle()}
            >
              작업실로 돌아가기
            </Link>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 14,
            marginTop: 24,
          }}
        >
          <SummaryCard
            label="전체 책"
            value={books.length}
            unit="권"
            description="내 책장에 저장된 모든 책 원고"
            color="#7b4f2a"
          />

          <SummaryCard
            label="원고 초안"
            value={draftCount}
            unit="권"
            description="내용을 확인하고 다듬을 수 있는 원고"
            color="#9b6d2f"
          />

          <SummaryCard
            label="제작 진행 중"
            value={inProductionCount}
            unit="권"
            description="제작 작업이 진행 중인 책"
            color="#62438a"
          />

          <SummaryCard
            label="완성된 책"
            value={publishedCount}
            unit="권"
            description="제작 과정이 완료된 책"
            color="#3e5f3a"
          />

          <SummaryCard
            label="상담 신청 책"
            value={
              activeProductionRequestBookIds.size
            }
            unit="권"
            description="제작 상담을 신청한 책"
            color="#245d8c"
          />

          <SummaryCard
            label="상담 처리 중"
            value={
              pendingProductionRequestBookIds.size
            }
            unit="권"
            description="접수 또는 상담이 진행 중인 책"
            color="#9a4b24"
          />
        </section>

        <div
          style={{
            marginTop: 24,
          }}
        >
          <PageGuideBox
            label="내 책장 이용 안내"
            title="책을 선택하면 원고와 제작 상태를 확인할 수 있습니다"
            description="내 책장에는 만든 책 원고가 저장됩니다. 책 상세 화면에서 원고를 읽고 다시 정리하거나 인쇄용 원고와 제작 상담을 확인할 수 있습니다."
            steps={[
              '저장된 책의 종류와 현재 상태를 확인합니다.',
              '책 상세 보기에서 원고와 사용된 사진·이야기를 확인합니다.',
              '필요하면 원고를 다시 정리해 내용을 보완합니다.',
              '인쇄용 원고 화면에서 표지, 목차와 본문을 확인합니다.',
              '실제 책 제작이 필요하면 제작 상담을 신청합니다.',
              '필요 없는 책은 여러 권을 선택해 한 번에 삭제할 수 있습니다.',
            ]}
            note="책을 삭제해도 원본 사진과 이야기 기록은 삭제되지 않습니다."
          />
        </div>

        {books.length > 0 ? (
          <section
            className="library-page-section"
            style={{
              marginTop: 24,
              padding: 28,
              borderRadius: 30,
              overflow: 'hidden',
              background: '#fffaf1',
              border:
                '1px solid rgba(91, 66, 43, 0.12)',
              boxShadow:
                '0 12px 30px rgba(91, 66, 43, 0.08)',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: '#9b6d2f',
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                }}
              >
                최근 책장
              </p>

              <h2
                style={{
                  margin: '9px 0 0',
                  fontFamily:
                    'Noto Serif KR, serif',
                  fontSize: 31,
                  lineHeight: 1.4,
                  letterSpacing: '-0.04em',
                  color: '#33271d',
                }}
              >
                최근에 만든 책을
                먼저 보여드립니다.
              </h2>

              <p
                style={{
                  margin: '9px 0 0',
                  color: '#6b5845',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                가장 최근에 만든 책 원고
                 6권을 책장 형태로 확인합니다.
              </p>
            </div>

            <div
              style={{
                marginTop: 22,
              }}
            >
              <BookShelfView
                books={shelfBooks}
              />
            </div>

            {books.length > 6 ? (
              <p
                style={{
                  margin: '16px 0 0',
                  color: '#6b5845',
                  fontSize: 12,
                  lineHeight: 1.7,
                }}
              >
                전체 {books.length}권 중
                최근 6권만 표시했습니다.
                모든 책은 아래 전체 목록에서
                확인할 수 있습니다.
              </p>
            ) : null}
          </section>
        ) : null}

        <section
          className="library-page-section"
          style={{
            marginTop: 24,
            padding: 28,
            borderRadius: 30,
            background: '#fffaf1',
            border:
              '1px solid rgba(91, 66, 43, 0.12)',
            boxShadow:
              '0 12px 30px rgba(91, 66, 43, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent:
                'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: '#9b6d2f',
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                }}
              >
                전체 책 목록
              </p>

              <h2
                style={{
                  margin: '9px 0 0',
                  fontFamily:
                    'Noto Serif KR, serif',
                  fontSize: 31,
                  lineHeight: 1.4,
                  letterSpacing: '-0.04em',
                  color: '#33271d',
                }}
              >
                책의 상태와 제작 상담을
                한눈에 확인합니다.
              </h2>

              <p
                style={{
                  margin: '9px 0 0',
                  maxWidth: 760,
                  color: '#6b5845',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                책 종류, 원고 상태, 만든 날짜,
                사용한 사진과 이야기 수,
                제작 상담 상태를 확인할 수
                있습니다.
              </p>
            </div>

            <Link
              href="/dashboard/book"
              style={darkButtonStyle()}
            >
              새 책 원고 만들기
            </Link>
          </div>

          <div
            style={{
              marginTop: 22,
            }}
          >
            <LibraryBookList
              books={listBooks}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  description,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  description: string;
  color: string;
}) {
  return (
    <article
      style={{
        padding: 21,
        borderRadius: 23,
        background: '#fffaf1',
        border:
          '1px solid rgba(91, 66, 43, 0.12)',
        boxShadow:
          '0 10px 25px rgba(91, 66, 43, 0.07)',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#9b6d2f',
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {label}
      </p>

      <strong
        style={{
          display: 'block',
          marginTop: 8,
          color,
          fontSize: 33,
          lineHeight: 1.1,
        }}
      >
        {value.toLocaleString()}

        <span
          style={{
            marginLeft: 4,
            color: '#6b5845',
            fontSize: 13,
          }}
        >
          {unit}
        </span>
      </strong>

      <p
        style={{
          margin: '11px 0 0',
          color: '#6b5845',
          fontSize: 12,
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
    </article>
  );
}

function heroPrimaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 21px',
    borderRadius: 999,
    background: '#f0c36a',
    color: '#2b2118',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

function heroSecondaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 21px',
    borderRadius: 999,
    border:
      '1px solid rgba(255,255,255,0.42)',
    background: 'transparent',
    color: '#fff8ec',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

function darkButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 15px',
    borderRadius: 999,
    border: '1px solid #33271d',
    background: '#33271d',
    color: '#fff8ec',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function gridPaperPageStyle(): CSSProperties {
  return {
    minHeight: '100vh',
    backgroundColor: '#f7eddc',
    backgroundImage: `
      linear-gradient(
        rgba(154, 106, 36, 0.08) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(154, 106, 36, 0.08) 1px,
        transparent 1px
      ),
      linear-gradient(
        rgba(154, 106, 36, 0.14) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(154, 106, 36, 0.14) 1px,
        transparent 1px
      )
    `,
    backgroundSize:
      '24px 24px, 24px 24px, 120px 120px, 120px 120px',
    backgroundPosition: '0 0',
  };
}