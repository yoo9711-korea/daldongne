import { auth } from '@/auth';
import PrintButton from '@/components/library/PrintButton';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import {
  notFound,
  redirect,
} from 'next/navigation';
import type { CSSProperties } from 'react';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PrintMemory = {
  id: string;
  type: unknown;
  title: string | null;
  description: string | null;
  fileUrl: string | null;
  occurredAt: Date | null;
  createdAt: Date;
};

type ParsedBookBlock = {
  type:
    | 'title'
    | 'heading'
    | 'numbered'
    | 'paragraph';
  text: string;
};

const TYPE_LABEL: Record<string, string> = {
  LIFE_BOOK: '인생 기록책',
  FAMILY_BOOK: '가족 이야기책',
  COUPLE_BOOK: '부부 이야기책',
  BABY_BOOK: '성장 기록책',
  TRAVEL_BOOK: '여행 기록책',
  AI_MOVIE: 'AI 영상',
};

export default async function BookPrintPage({
  params,
}: PageProps) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  const book =
    await prisma.book.findFirst({
      where: {
        id,
        authorId: userId,
      },
      select: {
        id: true,
        type: true,
        title: true,
        subtitle: true,
        summary: true,
        content: true,
        coverText: true,
        pageCount: true,
        basedPhotoCount: true,
        basedStoryCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  if (!book) {
    notFound();
  }

  const linkedBookMemories =
    await prisma.bookMemory.findMany({
      where: {
        bookId: book.id,
        memory: {
          authorId: userId,
        },
      },
      orderBy: {
        order: 'asc',
      },
      select: {
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
    });

  const linkedMemories =
    linkedBookMemories.map(
      (item) => item.memory,
    ) as PrintMemory[];

    const allMemories =
    linkedMemories;

  const photoMemories =
    allMemories.filter(
      isPhotoMemory,
    );

  const photos =
    photoMemories.slice(0, 12);

    const allPhotoStories =
    photoMemories.filter(
      hasStoryDescription,
    );

  const photoStories =
    allPhotoStories.slice(0, 12);

  const storyMemories =
    allMemories.filter(
      isStoryMemory,
    );

  const stories =
    storyMemories.slice(0, 16);

  const blocks =
    parseBookContent(
      cleanText(book.content),
    );

  const photoPages =
    chunkItems(photos, 4);

  const contentPages =
    blocks.length > 0
      ? chunkItems(blocks, 7)
      : [[]];

  const photoStoryPages =
    chunkItems(photoStories, 3);

  const storyPages =
    chunkItems(stories, 4);

  const coverPageNumber = 1;
  const introductionPageNumber = 2;
  const tableOfContentsPageNumber = 3;

  const photoStartPageNumber =
    tableOfContentsPageNumber + 1;

  const contentStartPageNumber =
    photoStartPageNumber +
    photoPages.length;

  const photoStoryStartPageNumber =
    contentStartPageNumber +
    contentPages.length;

  const storyStartPageNumber =
    photoStoryStartPageNumber +
    photoStoryPages.length;

  const finalPageNumber =
    storyStartPageNumber +
    storyPages.length;

  const typeLabel =
    TYPE_LABEL[String(book.type)] ||
    '책 원고';

  const displayedPhotoCount =
    book.basedPhotoCount ??
    photoMemories.length;

    const displayedStoryCount =
    book.basedStoryCount ??
    allPhotoStories.length +
      storyMemories.length;

  return (
    <main
      className="print-preview-main"
      style={{
        minHeight: '100vh',
        ...gridPaperPageStyle(),
        padding: '30px 20px 70px',
        color: '#24170f',
      }}
    >
      <style>{printStyles}</style>

      <div
        className="print-toolbar"
        style={{
          width: '100%',
          maxWidth: 900,
          margin: '0 auto 22px',
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: '#8a5a1f',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.06em',
            }}
          >
            인쇄용 원고 미리보기
          </p>

          <h1
            style={{
              margin: '6px 0 0',
              color: '#24170f',
              fontFamily:
                'Noto Serif KR, serif',
              fontSize: 28,
              lineHeight: 1.35,
              letterSpacing: '-0.04em',
            }}
          >
            {book.title}
          </h1>

          <p
            style={{
              margin: '7px 0 0',
              color: '#6b5845',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            브라우저 인쇄 창에서
            용지 크기를 A4로 선택하세요.
          </p>
        </div>

        <div
          className="print-toolbar-actions"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Link
            href={`/dashboard/library/${book.id}`}
            style={toolbarButtonStyle(
              '#fffaf0',
              '#5a3a18',
            )}
          >
            책 상세로
          </Link>

          <Link
            href={`/dashboard/library/${book.id}/ebook`}
            style={toolbarButtonStyle(
              '#fff4df',
              '#5a3510',
            )}
          >
            전자책 보기
          </Link>

          <PrintButton />
        </div>
      </div>

      <article className="print-document">
        <PrintPage
          pageNumber={coverPageNumber}
          className="print-cover-page"
          hidePageNumber
        >
          <div
            className="print-cover-content"
            style={{
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent:
                'space-between',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: '#f3d28a',
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                }}
              >
                DALDONGNE MEMORY BOOK
              </p>

              <p
                style={{
                  margin: '14px 0 0',
                  color:
                    'rgba(255,248,236,0.75)',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {typeLabel}
              </p>
            </div>

            <div
              style={{
                marginTop: 90,
                marginBottom: 90,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  maxWidth: 650,
                  color: '#fffaf0',
                  fontFamily:
                    'Noto Serif KR, serif',
                  fontSize: 52,
                  lineHeight: 1.25,
                  letterSpacing: '-0.06em',
                  wordBreak: 'keep-all',
                }}
              >
                {book.title}
              </h1>

              {book.subtitle ? (
                <p
                  style={{
                    margin: '18px 0 0',
                    maxWidth: 620,
                    color: '#f8ddb0',
                    fontSize: 21,
                    lineHeight: 1.65,
                    fontWeight: 700,
                  }}
                >
                  {book.subtitle}
                </p>
              ) : null}

              <div
                style={{
                  width: 80,
                  height: 3,
                  margin: '34px 0',
                  borderRadius: 999,
                  background: '#f3d28a',
                }}
              />

              <p
                style={{
                  margin: 0,
                  maxWidth: 650,
                  color: '#fff4df',
                  fontSize: 18,
                  lineHeight: 1.9,
                  fontWeight: 700,
                  wordBreak: 'keep-all',
                }}
              >
                {book.coverText ||
                  book.summary ||
                  '사진과 이야기를 모아 한 권의 기억으로 엮었습니다.'}
              </p>
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  paddingTop: 18,
                  borderTop:
                    '1px solid rgba(255,255,255,0.2)',
                  color: '#f3d28a',
                  fontSize: 13,
                  lineHeight: 1.7,
                  fontWeight: 900,
                }}
              >
                사진과 이야기로 엮은
                우리들의 기록
              </p>

              <p
                style={{
                  margin: '7px 0 0',
                  color:
                    'rgba(255,248,236,0.65)',
                  fontSize: 11,
                }}
              >
                달동네 출판사
              </p>
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              width: 340,
              height: 340,
              right: -130,
              top: -120,
              borderRadius: 999,
              background:
                'rgba(255,255,255,0.07)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              width: 260,
              height: 260,
              left: -100,
              bottom: -120,
              borderRadius: 999,
              background:
                'rgba(243,210,138,0.1)',
            }}
          />
        </PrintPage>

        <PrintPage
          pageNumber={
            introductionPageNumber
          }
        >
          <PageHeader
            label="책 소개"
            title="이 책을 만든 이유"
          />

          <p style={leadParagraphStyle}>
            사진은 한순간을 남기지만,
            이야기는 그 순간이 왜
            소중했는지를 알려줍니다.
            달동네는 흩어진 사진과 짧은
            기억을 모아 가족이 오래
            간직할 수 있는 책의 형태로
            정리합니다.
          </p>

          <p style={bodyParagraphStyle}>
            이 원고는 책을 제작하기 전
            전체 흐름을 점검하는
            인쇄용 미리보기입니다.
            문장과 사진의 배치, 이야기의
            연결을 확인하고 필요한
            내용을 보완할 수 있습니다.
          </p>

          {book.summary ? (
            <div
              className="print-summary-box"
              style={{
                marginTop: 28,
                padding: 22,
                borderRadius: 20,
                border:
                  '1px solid #ead7b7',
                background: '#fff6e6',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#9a6a24',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                책 소개
              </p>

              <p
                style={{
                  margin: '9px 0 0',
                  color: '#4a3828',
                  fontSize: 16,
                  lineHeight: 1.9,
                  wordBreak: 'keep-all',
                }}
              >
                {book.summary}
              </p>
            </div>
          ) : null}

          <div
            className="print-info-grid"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: 12,
              marginTop: 28,
            }}
          >
            <InfoCard
              title="책 종류"
              value={typeLabel}
            />

            <InfoCard
              title="예상 분량"
              value={
                book.pageCount &&
                book.pageCount > 0
                  ? `${book.pageCount}쪽`
                  : '분량 미정'
              }
            />

            <InfoCard
              title="사용 사진"
              value={`${displayedPhotoCount}장`}
            />

            <InfoCard
              title="사용 이야기"
              value={`${displayedStoryCount}개`}
            />
          </div>
        </PrintPage>

        <PrintPage
          pageNumber={
            tableOfContentsPageNumber
          }
        >
          <PageHeader
            label="목차"
            title="이 책의 흐름"
          />

          <div
            style={{
              display: 'grid',
              marginTop: 25,
            }}
          >
            <TocItem
              number="01"
              title="표지"
              description="이 책의 첫 장"
              page={coverPageNumber}
            />

            <TocItem
              number="02"
              title="책 소개"
              description="사진과 이야기를 책으로 남기는 이유"
              page={
                introductionPageNumber
              }
            />

            {photoPages.length > 0 ? (
              <TocItem
                number="03"
                title="사진으로 남은 장면"
                description="책 원고에 연결된 추억 사진"
                page={
                  photoStartPageNumber
                }
              />
            ) : null}

            <TocItem
              number={
                photoPages.length > 0
                  ? '04'
                  : '03'
              }
              title="책 원고 본문"
              description="사진과 이야기를 바탕으로 정리한 원고"
              page={
                contentStartPageNumber
              }
            />

            {photoStoryPages.length >
            0 ? (
              <TocItem
                number={
                  photoPages.length > 0
                    ? '05'
                    : '04'
                }
                title="사진에 붙인 이야기"
                description="사진마다 함께 기록한 기억"
                page={
                  photoStoryStartPageNumber
                }
              />
            ) : null}

            {storyPages.length > 0 ? (
              <TocItem
                number={
                  photoPages.length > 0
                    ? '06'
                    : '05'
                }
                title="글로 남긴 이야기"
                description="직접 작성해 남긴 삶의 기록"
                page={
                  storyStartPageNumber
                }
              />
            ) : null}

            <TocItem
              number="마지막"
              title="기억을 전하며"
              description="다음 세대에게 남기는 마지막 장"
              page={finalPageNumber}
            />
          </div>
        </PrintPage>

        {photoPages.map(
          (
            pagePhotos,
            pageIndex,
          ) => (
            <PrintPage
              key={`photo-page-${pageIndex}`}
              pageNumber={
                photoStartPageNumber +
                pageIndex
              }
            >
              <PageHeader
                label={`사진으로 남은 장면 ${
                  pageIndex + 1
                } / ${photoPages.length}`}
                title="책에 담긴 추억 사진"
              />

              <div
                className="print-photo-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: 16,
                  marginTop: 22,
                }}
              >
                {pagePhotos.map(
                  (photo, index) => (
                    <PrintPhotoCard
                      key={photo.id}
                      photo={photo}
                      fallbackTitle={`사진 ${
                        pageIndex * 4 +
                        index +
                        1
                      }`}
                    />
                  ),
                )}
              </div>

              {pageIndex ===
              photoPages.length - 1 ? (
                <p
                  style={{
                    margin: '20px 0 0',
                    padding: 14,
                    borderRadius: 16,
                    border:
                      '1px solid #ead7b7',
                    background: '#fff8ec',
                    color: '#6b5845',
                    fontSize: 12,
                    lineHeight: 1.7,
                  }}
                >
                  {linkedMemories.length >
                  0
                    ? '이 사진은 책 원고를 만들 때 선택한 자료를 기준으로 표시했습니다.'
                                        : '이전 방식으로 만든 책이라 연결된 자료가 없습니다. 원고 다시 정리하기에서 사용할 자료를 다시 선택해 주세요.'}
                </p>
              ) : null}
            </PrintPage>
          ),
        )}

        {contentPages.map(
          (
            pageBlocks,
            pageIndex,
          ) => (
            <PrintPage
              key={`content-page-${pageIndex}`}
              pageNumber={
                contentStartPageNumber +
                pageIndex
              }
            >
              <PageHeader
                label={`책 원고 본문 ${
                  pageIndex + 1
                } / ${contentPages.length}`}
                title={
                  pageIndex === 0
                    ? book.title
                    : '이어지는 이야기'
                }
              />

              {pageBlocks.length > 0 ? (
                <div
                  className="print-content"
                  style={{
                    marginTop: 22,
                  }}
                >
                  {pageBlocks.map(
                    (
                      block,
                      blockIndex,
                    ) => (
                      <BookPrintBlock
                        key={`${pageIndex}-${blockIndex}`}
                        block={block}
                      />
                    ),
                  )}
                </div>
              ) : (
                <EmptyPrintBox text="아직 인쇄할 원고가 없습니다. 책 상세 화면에서 원고 다시 정리하기를 실행해 주세요." />
              )}
            </PrintPage>
          ),
        )}

        {photoStoryPages.map(
          (
            pageStories,
            pageIndex,
          ) => (
            <PrintPage
              key={`photo-story-page-${pageIndex}`}
              pageNumber={
                photoStoryStartPageNumber +
                pageIndex
              }
            >
              <PageHeader
                label={`사진에 붙인 이야기 ${
                  pageIndex + 1
                } / ${
                  photoStoryPages.length
                }`}
                title="사진 한 장에 담긴 기억"
              />

              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  marginTop: 22,
                }}
              >
                {pageStories.map(
                  (story, index) => (
                    <PrintPhotoStoryCard
                      key={story.id}
                      story={story}
                      fallbackTitle={`사진 이야기 ${
                        pageIndex * 3 +
                        index +
                        1
                      }`}
                    />
                  ),
                )}
              </div>
            </PrintPage>
          ),
        )}

        {storyPages.map(
          (
            pageStories,
            pageIndex,
          ) => (
            <PrintPage
              key={`story-page-${pageIndex}`}
              pageNumber={
                storyStartPageNumber +
                pageIndex
              }
            >
              <PageHeader
                label={`글로 남긴 이야기 ${
                  pageIndex + 1
                } / ${
                  storyPages.length
                }`}
                title="우리들의 시간을 기록합니다"
              />

              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  marginTop: 22,
                }}
              >
                {pageStories.map(
                  (story, index) => (
                    <PrintStoryCard
                      key={story.id}
                      story={story}
                      fallbackTitle={`이야기 ${
                        pageIndex * 4 +
                        index +
                        1
                      }`}
                    />
                  ),
                )}
              </div>
            </PrintPage>
          ),
        )}

        <PrintPage
          pageNumber={finalPageNumber}
          className="print-final-page"
          isLastPage
        >
          <div
            style={{
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent:
                'center',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#9a6a24',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              마지막 페이지
            </p>

            <h2
              style={{
                margin:
                  '32px auto 22px',
                maxWidth: 660,
                color: '#24170f',
                fontFamily:
                  'Noto Serif KR, serif',
                fontSize: 40,
                lineHeight: 1.4,
                letterSpacing: '-0.05em',
              }}
            >
              기억은 사라지지 않고,
              다음 세대에게 전해집니다.
            </h2>

            <p
              style={{
                maxWidth: 650,
                margin: '0 auto',
                color: '#5a4633',
                fontSize: 17,
                lineHeight: 2,
                fontWeight: 700,
                wordBreak: 'keep-all',
              }}
            >
              이 책은 완성된 끝이 아니라,
              가족이 함께 계속 채워갈 수
              있는 시작입니다. 사진 한 장과
              짧은 말 한 줄이 시간이 지나
              누군가에게는 가장 따뜻한
              유산이 됩니다.
            </p>

            <div
              style={{
                width: 80,
                height: 3,
                margin:
                  '34px auto 26px',
                borderRadius: 999,
                background: '#c18a23',
              }}
            />

            <p
              style={{
                margin: 0,
                color: '#8a6d4d',
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              원고 생성일{' '}
              {formatDate(
                book.createdAt,
              )}
              <br />
              마지막 정리일{' '}
              {formatDate(
                book.updatedAt,
              )}
            </p>

            <p
              style={{
                margin: '36px 0 0',
                color: '#9a6a24',
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              달동네 출판사
            </p>
          </div>
        </PrintPage>
      </article>
    </main>
  );
}

function PrintPage({
  pageNumber,
  children,
  className = '',
  hidePageNumber = false,
  isLastPage = false,
}: {
  pageNumber: number;
  children: React.ReactNode;
  className?: string;
  hidePageNumber?: boolean;
  isLastPage?: boolean;
}) {
  return (
    <section
      className={[
        'print-page',
        className,
        isLastPage
          ? 'print-page-last'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        position: 'relative',
        minHeight: '277mm',
        boxSizing: 'border-box',
        padding: '18mm 17mm 16mm',
        overflow: 'hidden',
        border:
          '1px solid #e0c89c',
        background: '#fffdf7',
        boxShadow:
          '0 20px 55px rgba(80,55,20,0.13)',
      }}
    >
      {children}

      {!hidePageNumber ? (
        <p
          className="print-page-number"
          style={{
            position: 'absolute',
            right: '17mm',
            bottom: '8mm',
            margin: 0,
            color: '#aa9273',
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          {pageNumber}
        </p>
      ) : null}
    </section>
  );
}

function PageHeader({
  label,
  title,
}: {
  label: string;
  title: string;
}) {
  return (
    <header
      className="print-page-header"
      style={{
        paddingBottom: 18,
        borderBottom:
          '1px solid #ead7b7',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#9a6a24',
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </p>

      <h2
        style={{
          margin: '8px 0 0',
          color: '#24170f',
          fontFamily:
            'Noto Serif KR, serif',
          fontSize: 31,
          lineHeight: 1.4,
          letterSpacing: '-0.04em',
          wordBreak: 'keep-all',
        }}
      >
        {title}
      </h2>
    </header>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 17,
        border:
          '1px solid #ead7b7',
        background: '#fff6e6',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#8a806f',
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {title}
      </p>

      <strong
        style={{
          display: 'block',
          marginTop: 7,
          color: '#24170f',
          fontSize: 15,
          lineHeight: 1.45,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function TocItem({
  number,
  title,
  description,
  page,
}: {
  number: string;
  title: string;
  description: string;
  page: number;
}) {
  return (
    <div
      className="print-toc-item"
      style={{
        display: 'grid',
        gridTemplateColumns:
          '64px minmax(0, 1fr) auto',
        gap: 16,
        alignItems: 'start',
        padding: '18px 0',
        borderBottom:
          '1px solid #ead7b7',
      }}
    >
      <strong
        style={{
          color: '#b47a22',
          fontSize: 15,
        }}
      >
        {number}
      </strong>

      <div>
        <span
          style={{
            display: 'block',
            color: '#3b2b1d',
            fontSize: 17,
            fontWeight: 900,
          }}
        >
          {title}
        </span>

        <span
          style={{
            display: 'block',
            marginTop: 4,
            color: '#88745d',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {description}
        </span>
      </div>

      <span
        style={{
          color: '#9f886c',
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {page}
      </span>
    </div>
  );
}

function PrintPhotoCard({
  photo,
  fallbackTitle,
}: {
  photo: PrintMemory;
  fallbackTitle: string;
}) {
  const title =
    cleanText(photo.title) ||
    fallbackTitle;

  return (
    <figure
      className="print-photo-card"
      style={{
        margin: 0,
        overflow: 'hidden',
        borderRadius: 18,
        border:
          '1px solid #e7d3ad',
        background: '#fffaf0',
      }}
    >
      <div
        className="print-photo-frame"
        style={{
          position: 'relative',
          width: '100%',
          height: 220,
          overflow: 'hidden',
          background: '#ead7b7',
        }}
      >
        <Image
          src={`/api/blob/${photo.id}`}
          alt={title}
          fill
          unoptimized
          sizes="(max-width: 700px) 100vw, 420px"
          style={{
            objectFit: 'contain',
          }}
        />
      </div>

      <figcaption
        style={{
          padding: '12px 14px',
        }}
      >
        <strong
          style={{
            display: 'block',
            color: '#3b2b1d',
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          {makeShortText(
            title,
            65,
          )}
        </strong>

        <span
          style={{
            display: 'block',
            marginTop: 4,
            color: '#8a806f',
            fontSize: 10,
          }}
        >
          {formatDate(
            photo.occurredAt,
          )}
        </span>

        {photo.description ? (
          <p
            style={{
              margin: '7px 0 0',
              color: '#6b5845',
              fontSize: 11,
              lineHeight: 1.6,
            }}
          >
            {makeShortText(
              photo.description,
              75,
            )}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}

function PrintPhotoStoryCard({
  story,
  fallbackTitle,
}: {
  story: PrintMemory;
  fallbackTitle: string;
}) {
  const title =
    cleanText(story.title) ||
    fallbackTitle;

  const description =
    cleanText(story.description) ||
    '사진에 대한 이야기가 없습니다.';

  return (
    <article
      className="print-story-card print-photo-story-card"
      style={{
        display: 'grid',
        gridTemplateColumns:
          '130px minmax(0, 1fr)',
        overflow: 'hidden',
        borderRadius: 18,
        border:
          '1px solid #e7d3ad',
        background: '#f7eddc',
      }}
    >
      <div
        className="print-photo-story-image"
        style={{
          position: 'relative',
          minHeight: 130,
          background: '#eadcc5',
        }}
      >
        <Image
          src={`/api/blob/${story.id}`}
          alt={title}
          fill
          unoptimized
          sizes="130px"
          style={{
            objectFit: 'cover',
          }}
        />
      </div>

      <div
        style={{
          padding: 16,
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#9a6a24',
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {makeShortText(
            title,
            80,
          )}
        </p>

        <p
          style={{
            margin: '8px 0 0',
            whiteSpace: 'pre-line',
            color: '#4a3828',
            fontSize: 13,
            lineHeight: 1.75,
          }}
        >
          {makeShortText(
            description,
            230,
          )}
        </p>
      </div>
    </article>
  );
}

function PrintStoryCard({
  story,
  fallbackTitle,
}: {
  story: PrintMemory;
  fallbackTitle: string;
}) {
  const title =
    displayStoryTitle(
      cleanText(story.title) ||
        fallbackTitle,
    );

  const description =
    cleanText(story.description) ||
    '아직 이야기 내용이 없습니다.';

  return (
    <article
      className="print-story-card"
      style={{
        padding: 18,
        borderRadius: 18,
        border:
          '1px solid #e7d3ad',
        background: '#f7eddc',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#9a6a24',
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {makeShortText(
          title,
          90,
        )}
      </p>

      <p
        style={{
          margin: '8px 0 0',
          whiteSpace: 'pre-line',
          color: '#4a3828',
          fontSize: 13,
          lineHeight: 1.8,
        }}
      >
        {makeShortText(
          description,
          300,
        )}
      </p>
    </article>
  );
}

function BookPrintBlock({
  block,
}: {
  block: ParsedBookBlock;
}) {
  if (block.type === 'title') {
    return (
      <h2
        className="print-content-heading"
        style={{
          margin: '0 0 22px',
          paddingBottom: 16,
          borderBottom:
            '1px solid #ead7b7',
          color: '#24170f',
          fontFamily:
            'Noto Serif KR, serif',
          fontSize: 28,
          lineHeight: 1.45,
          letterSpacing: '-0.04em',
        }}
      >
        {block.text}
      </h2>
    );
  }

  if (block.type === 'heading') {
    return (
      <h3
        className="print-content-heading"
        style={{
          margin: '27px 0 13px',
          color: '#2d1c12',
          fontFamily:
            'Noto Serif KR, serif',
          fontSize: 22,
          lineHeight: 1.5,
          letterSpacing: '-0.03em',
        }}
      >
        {block.text}
      </h3>
    );
  }

  if (block.type === 'numbered') {
    return (
      <p
        className="print-numbered-block"
        style={{
          margin: '13px 0',
          padding: '13px 16px',
          borderRadius: 15,
          border:
            '1px solid #ead7b7',
          background: '#f3e6cf',
          color: '#4a3828',
          fontSize: 14,
          lineHeight: 1.85,
          fontWeight: 700,
        }}
      >
        {block.text}
      </p>
    );
  }

  return (
    <p
      style={{
        margin: '0 0 17px',
        color: '#3b2b1d',
        fontSize: 15,
        lineHeight: 2,
        letterSpacing: '-0.01em',
        wordBreak: 'keep-all',
      }}
    >
      {block.text}
    </p>
  );
}

function EmptyPrintBox({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        marginTop: 24,
        padding: 28,
        borderRadius: 18,
        border:
          '1px dashed #d6b778',
        background: '#f3e6cf',
        color: '#6b5a46',
        fontSize: 14,
        lineHeight: 1.8,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}

function isPhotoMemory(
  memory: PrintMemory,
) {
  return (
    String(
      memory.type ?? '',
    ).toUpperCase() ===
      'PHOTO' &&
    Boolean(memory.fileUrl)
  );
}

function hasStoryDescription(
  memory: PrintMemory,
) {
  return (
    cleanText(
      memory.description,
    ).length >= 10
  );
}

function isStoryMemory(
  memory: PrintMemory,
) {
  if (isPhotoMemory(memory)) {
    return false;
  }

  if (
    isLegacyAiInterviewMemory(
      memory,
    )
  ) {
    return false;
  }

  const type = String(
    memory.type ?? '',
  ).toUpperCase();

  const text = cleanText(
    memory.description,
  );

  return (
    (type.includes('STORY') ||
      type.includes('TEXT')) &&
    text.length >=10
  );
}

function isLegacyAiInterviewMemory(
  memory: PrintMemory,
) {
  const title = cleanText(
    memory.title,
  );

  return (
    title.startsWith(
      'AI 인터뷰',
    ) ||
    title.includes(
      'AI 인터뷰 -',
    )
  );
}

function parseBookContent(
  content: string,
): ParsedBookBlock[] {
  if (!content) {
    return [];
  }

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        line !== '---',
    )
    .map((line) => {
      if (
        line.startsWith('# ')
      ) {
        return {
          type: 'title' as const,
          text: line
            .replace(
              /^#\s+/,
              '',
            )
            .trim(),
        };
      }

      if (
        line.startsWith('## ')
      ) {
        return {
          type: 'heading' as const,
          text: line
            .replace(
              /^##\s+/,
              '',
            )
            .trim(),
        };
      }

      if (
        /^\d+\.\s+/.test(
          line,
        )
      ) {
        return {
          type: 'numbered' as const,
          text: line,
        };
      }

      return {
        type: 'paragraph' as const,
        text: line,
      };
    });
}

function chunkItems<T>(
  items: T[],
  size: number,
) {
  const chunks: T[][] = [];

  for (
    let index = 0;
    index < items.length;
    index += size
  ) {
    chunks.push(
      items.slice(
        index,
        index + size,
      ),
    );
  }

  return chunks;
}

function cleanText(
  value: unknown,
) {
  if (
    typeof value !== 'string'
  ) {
    return '';
  }

  return value
    .replace(/\r\n/g, '\n')
    .replace(
      /\n{3,}/g,
      '\n\n',
    )
    .replace(
      /[ \t]{2,}/g,
      ' ',
    )
    .trim();
}

function displayStoryTitle(
  title: string,
) {
  return title.replace(
    /^AI 인터뷰:/,
    '이야기:',
  );
}

function makeShortText(
  text: string,
  maxLength = 120,
) {
  if (
    text.length <= maxLength
  ) {
    return text;
  }

  return `${text
    .slice(0, maxLength)
    .trim()}...`;
}

function formatDate(
  value: Date | null,
) {
  if (!value) {
    return '날짜 미정';
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).format(value);
}

function toolbarButtonStyle(
  background: string,
  color: string,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 16px',
    borderRadius: 999,
    border:
      '1px solid #c9ad7b',
    background,
    color,
    fontSize: 13,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

function gridPaperPageStyle(): CSSProperties {
  return {
    backgroundColor: '#efe3cf',
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

const leadParagraphStyle: CSSProperties = {
  margin: '28px 0 0',
  color: '#3b2b1d',
  fontSize: 18,
  lineHeight: 2,
  fontWeight: 700,
  wordBreak: 'keep-all',
};

const bodyParagraphStyle: CSSProperties = {
  margin: '18px 0 0',
  color: '#4a3828',
  fontSize: 16,
  lineHeight: 1.95,
  wordBreak: 'keep-all',
};

const printStyles = `
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  .print-document {
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
    display: grid;
    gap: 24px;
  }

  .print-cover-page {
    background:
      linear-gradient(
        145deg,
        #3a281b 0%,
        #6e4b2d 55%,
        #c18a23 100%
      ) !important;
  }

  .print-final-page {
    background:
      linear-gradient(
        180deg,
        #fffdf7 0%,
        #fff4df 58%,
        #efd3a1 100%
      ) !important;
  }

  @media print {
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body * {
      visibility: hidden !important;
    }

    .print-document,
    .print-document * {
      visibility: visible !important;
    }

    .print-preview-main {
      min-height: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    .print-toolbar {
      display: none !important;
    }

    .print-document {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      display: block !important;
    }

    .print-page {
      width: 100% !important;
      min-height: 277mm !important;
      margin: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      break-after: page !important;
      page-break-after: always !important;
      overflow: hidden !important;
    }

    .print-page-last {
      break-after: auto !important;
      page-break-after: auto !important;
    }

    .print-photo-card,
    .print-story-card,
    .print-numbered-block,
    .print-content-heading,
    .print-summary-box,
    .print-info-grid > div,
    .print-toc-item {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .print-page-header {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
  }

  @media screen and (max-width: 760px) {
    .print-preview-main {
      padding: 16px 10px 50px !important;
    }

    .print-toolbar {
      display: grid !important;
      gap: 14px !important;
    }

    .print-toolbar-actions {
      display: grid !important;
      grid-template-columns: 1fr !important;
      width: 100%;
    }

    .print-toolbar-actions > * {
      width: 100%;
    }

    .print-document {
      gap: 16px;
    }

    .print-page {
      min-height: auto !important;
      padding: 28px 20px 54px !important;
      border-radius: 22px !important;
    }

    .print-cover-page {
      min-height: 560px !important;
    }

    .print-cover-page h1 {
      font-size: 36px !important;
    }

    .print-info-grid {
      grid-template-columns: 1fr 1fr !important;
    }

    .print-photo-grid {
      grid-template-columns: 1fr !important;
    }

    .print-photo-frame {
      height: 250px !important;
    }

    .print-photo-story-card {
      grid-template-columns: 1fr !important;
    }

    .print-photo-story-image {
      min-height: 220px !important;
    }

    .print-toc-item {
      grid-template-columns:
        48px minmax(0, 1fr) auto !important;
      gap: 10px !important;
    }

    .print-page-number {
      right: 20px !important;
      bottom: 18px !important;
    }
  }

  @media screen and (max-width: 430px) {
    .print-page {
      padding: 24px 16px 52px !important;
    }

    .print-cover-page h1 {
      font-size: 31px !important;
    }

    .print-info-grid {
      grid-template-columns: 1fr !important;
    }

    .print-toc-item {
      grid-template-columns:
        40px minmax(0, 1fr) !important;
    }

    .print-toc-item > span:last-child {
      display: none;
    }
  }
`;