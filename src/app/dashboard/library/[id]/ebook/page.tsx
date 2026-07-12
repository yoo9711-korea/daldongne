import { auth } from '@/auth';
import EbookReader from '@/components/library/EbookReader';
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

type EbookBlock = {
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

export default async function EbookPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;
  const userId = session.user.id;

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
    );

  const linkedPhotos =
    linkedMemories.filter(
      (memory) =>
        String(memory.type) ===
          'PHOTO' &&
        Boolean(memory.fileUrl),
    );

  const linkedStoryCount =
    linkedMemories.filter(
      (memory) =>
        String(memory.type) !==
          'PHOTO' &&
        Boolean(
          memory.description?.trim(),
        ),
    ).length;

  const fallbackPhotos =
    linkedPhotos.length > 0
      ? []
      : await prisma.memory.findMany({
          where: {
            authorId: userId,
            type: 'PHOTO',
            fileUrl: {
              not: null,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 6,
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            fileUrl: true,
            occurredAt: true,
            createdAt: true,
          },
        });

  const photos =
    linkedPhotos.length > 0
      ? linkedPhotos
      : fallbackPhotos;

  const isUsingLinkedPhotos =
    linkedPhotos.length > 0;

  const contentBlocks =
    parseBookContent(book.content);

  const contentPages =
    chunkItems(contentBlocks, 5);

  const photoPages =
    chunkItems(photos, 6);

  const typeLabel =
    TYPE_LABEL[
      String(book.type)
    ] || '책 원고';

  const introPageNumber = 2;
  const tocPageNumber = 3;
  const firstPhotoPageNumber = 4;

  const firstContentPageNumber =
    firstPhotoPageNumber +
    photoPages.length;

  const finalPageNumber =
    firstContentPageNumber +
    contentPages.length;

  const displayedPhotoCount =
    book.basedPhotoCount ??
    photos.length;

  const displayedStoryCount =
    book.basedStoryCount ??
    linkedStoryCount;

  const estimatedPageCount =
    book.pageCount &&
    book.pageCount > 0
      ? book.pageCount
      : finalPageNumber;

  return (
    <main
      className="ebook-main"
      style={{
        minHeight: '100vh',
        padding: '30px 20px 64px',
        background:
          'linear-gradient(180deg, #f8efe1 0%, #fffaf2 42%, #f3e2ca 100%)',
      }}
    >
      <style>{ebookResponsiveStyles}</style>

      <div
        className="ebook-toolbar"
        style={{
          width: '100%',
          maxWidth: 1120,
          margin: '0 auto 24px',
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 7px',
              color: '#9a6a24',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            DALDONGNE E-BOOK
          </p>

          <h1
            style={{
              margin: 0,
              color: '#24170f',
              fontFamily:
                'Noto Serif KR, serif',
              fontSize:
                'clamp(29px, 4vw, 36px)',
              lineHeight: 1.3,
              letterSpacing: '-0.05em',
            }}
          >
            책처럼 읽는 전자책
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: '#6b5845',
              fontSize: 13,
              lineHeight: 1.65,
            }}
          >
            {book.title}
            {' · '}
            생성일{' '}
            {formatDate(
              book.createdAt,
            )}
          </p>
        </div>

        <div
          className="ebook-toolbar-actions"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Link
            href={`/dashboard/library/${book.id}`}
            style={toolbarButtonStyle(
              '#fff7e8',
              '#2b2118',
            )}
          >
            책 상세로
          </Link>

          <Link
            href={`/dashboard/library/${book.id}/print`}
            style={toolbarButtonStyle(
              '#2b2118',
              '#fff8ec',
            )}
          >
            인쇄용 원고
          </Link>
        </div>
      </div>

      <section
        className="ebook-book"
        style={bookWrapStyle}
      >
        <EbookReader>
          <article
            className="ebook-page ebook-cover"
            style={coverPageStyle}
          >
            <div
              style={{
                position: 'relative',
                zIndex: 1,
              }}
            >
              <p
                style={coverLabelStyle}
              >
                {typeLabel}
              </p>

              <h2
                style={coverTitleStyle}
              >
                {book.title}
              </h2>

              {book.subtitle ? (
                <p
                  style={
                    coverSubtitleStyle
                  }
                >
                  {book.subtitle}
                </p>
              ) : null}

              <div
                style={coverLineStyle}
              />

              <p
                style={coverTextStyle}
              >
                {book.coverText ||
                  book.summary ||
                  '사진과 이야기를 모아 한 권의 기억으로 엮었습니다.'}
              </p>

              <p
                style={coverFooterStyle}
              >
                사진과 이야기로 엮은
                우리들의 기록
              </p>
            </div>

            <div
              style={{
                position: 'absolute',
                width: 320,
                height: 320,
                right: -100,
                top: -90,
                borderRadius: 999,
                background:
                  'rgba(255,255,255,0.08)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                width: 230,
                height: 230,
                left: -80,
                bottom: -100,
                borderRadius: 999,
                background:
                  'rgba(243,210,138,0.1)',
              }}
            />

            <p style={pageNumberStyle}>
              1
            </p>
          </article>

          <article
            className="ebook-page"
            style={pageStyle}
          >
            <p style={pageLabelStyle}>
              이 책을 만든 이유
            </p>

            <h2 style={pageTitleStyle}>
              흩어진 기억을 한 권의 책으로
              남깁니다
            </h2>

            <p style={paragraphStyle}>
              사진은 한순간을 남기지만,
              이야기는 그 순간이 왜
              소중했는지를 알려줍니다.
              달동네는 사진과 짧은 기억을
              모아 가족이 오래 간직할 수
              있는 책의 형태로 정리합니다.
            </p>

            <p style={paragraphStyle}>
              이 전자책은 인쇄하기 전에
              원고를 실제 책처럼 읽어보는
              미리보기입니다. 문장과 흐름,
              사진의 분위기를 확인하고
              부족한 자료를 보완할 수
              있습니다.
            </p>

            <div style={infoGridStyle}>
              <InfoCard
                title="책 종류"
                value={typeLabel}
              />

              <InfoCard
                title="사진"
                value={`${displayedPhotoCount}장 기준`}
              />

              <InfoCard
                title="이야기"
                value={`${displayedStoryCount}개 기준`}
              />

              <InfoCard
                title="예상 분량"
                value={`${estimatedPageCount}쪽`}
              />
            </div>

            <p style={pageNumberStyle}>
              {introPageNumber}
            </p>
          </article>

          <article
            className="ebook-page"
            style={pageStyle}
          >
            <p style={pageLabelStyle}>
              목차
            </p>

            <h2 style={pageTitleStyle}>
              이 책의 흐름
            </h2>

            <div
              className="ebook-toc"
              style={{
                display: 'grid',
                gap: 0,
                marginTop: 24,
              }}
            >
              <TocItem
                number="01"
                title="표지"
                description="이 책의 첫 장"
                page={1}
              />

              <TocItem
                number="02"
                title="이 책을 만든 이유"
                description="사진과 이야기를 책으로 남기는 이유"
                page={introPageNumber}
              />

              {photoPages.length > 0 ? (
                <TocItem
                  number="03"
                  title="사진으로 남은 장면"
                  description="책 원고에 선택한 추억 사진"
                  page={firstPhotoPageNumber}
                />
              ) : null}

              <TocItem
                number={
                  photoPages.length > 0
                    ? '04'
                    : '03'
                }
                title="원고 본문"
                description="사진과 이야기를 바탕으로 정리한 책 원고"
                page={firstContentPageNumber}
              />

              <TocItem
                number={
                  photoPages.length > 0
                    ? '05'
                    : '04'
                }
                title="마지막 페이지"
                description="다음 세대에게 전해지는 기억"
                page={finalPageNumber}
              />
            </div>

            <p style={pageNumberStyle}>
              {tocPageNumber}
            </p>
          </article>

          {photoPages.map(
            (
              pagePhotos,
              pageIndex,
            ) => (
              <article
                key={`photos-${pageIndex}`}
                className="ebook-page"
                style={pageStyle}
              >
                <p style={pageLabelStyle}>
                  사진으로 남은 장면
                  {' · '}
                  {pageIndex + 1}/
                  {photoPages.length}
                </p>

                <h2
                  style={pageTitleStyle}
                >
                  책에 담긴 추억 사진
                </h2>

                <div
                  className="ebook-photo-grid"
                  style={photoGridStyle}
                >
                  {pagePhotos.map(
                    (photo) => (
                      <figure
                        key={photo.id}
                        style={figureStyle}
                      >
                        <div
                          className="ebook-photo-frame"
                          style={{
                            position:
                              'relative',
                            height: 230,
                            background:
                              '#efe2cc',
                          }}
                        >
                          <Image
                            src={`/api/blob/${photo.id}`}
                            alt={
                              photo.title ||
                              '추억 사진'
                            }
                            fill
                            unoptimized
                            sizes="(max-width: 760px) 100vw, 33vw"
                            style={{
                              objectFit:
                                'contain',
                            }}
                          />
                        </div>

                        <figcaption
                          style={
                            figcaptionStyle
                          }
                        >
                          <strong>
                            {photo.title ||
                              '제목 없는 사진'}
                          </strong>

                          <span>
                            {formatDate(
                              photo.occurredAt,
                            )}
                          </span>

                          {photo.description ? (
                            <small>
                              {makeShortText(
                                photo.description,
                                70,
                              )}
                            </small>
                          ) : null}
                        </figcaption>
                      </figure>
                    ),
                  )}
                </div>

                {pageIndex ===
                photoPages.length - 1 ? (
                  <p
                    style={
                      photoNoticeStyle
                    }
                  >
                    {isUsingLinkedPhotos
                      ? '이 전자책은 책 원고를 만들 때 선택한 사진을 기준으로 보여줍니다.'
                      : '이전 방식으로 만든 책이라 연결된 사진 정보가 없습니다. 원고를 다시 정리하면 선택한 사진이 이 책에 정확히 연결됩니다.'}
                  </p>
                ) : null}

                <p
                  style={pageNumberStyle}
                >
                  {firstPhotoPageNumber +
                    pageIndex}
                </p>
              </article>
            ),
          )}

          {contentPages.map(
            (
              pageBlocks,
              pageIndex,
            ) => (
              <article
                key={`content-${pageIndex}`}
                className="ebook-page"
                style={pageStyle}
              >
                <p style={pageLabelStyle}>
                  원고 본문
                  {' · '}
                  {pageIndex + 1}/
                  {contentPages.length}
                </p>

                {pageIndex === 0 ? (
                  <h2
                    style={pageTitleStyle}
                  >
                    {book.title}
                  </h2>
                ) : null}

                <div>
                  {pageBlocks.map(
                    (
                      block,
                      blockIndex,
                    ) => (
                      <ContentBlock
                        key={`${pageIndex}-${blockIndex}`}
                        block={block}
                      />
                    ),
                  )}
                </div>

                <p
                  style={pageNumberStyle}
                >
                  {firstContentPageNumber +
                    pageIndex}
                </p>
              </article>
            ),
          )}

          <article
            className="ebook-page ebook-last-page"
            style={lastPageStyle}
          >
            <p style={pageLabelStyle}>
              마지막 페이지
            </p>

            <h2 style={lastTitleStyle}>
              기억은 사라지지 않고,
              전해집니다
            </h2>

            <p style={lastTextStyle}>
              이 책은 완성된 끝이 아니라,
              가족이 함께 계속 채워갈 수
              있는 시작입니다. 사진 한 장과
              짧은 말 한 줄이 시간이 지나
              누군가에게는 가장 따뜻한
              유산이 됩니다.
            </p>

            <p
              style={{
                maxWidth: 680,
                margin:
                  '18px auto 0',
                color: '#765c42',
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              마지막 원고 정리일{' '}
              {formatDate(
                book.updatedAt,
              )}
            </p>

            <div
              className="ebook-last-actions"
              style={{
                marginTop: 34,
                display: 'flex',
                justifyContent:
                  'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <Link
                href={`/dashboard/library/${book.id}`}
                style={primaryButtonStyle}
              >
                책 상세로
              </Link>

              <Link
                href="/dashboard/timeline"
                style={
                  secondaryButtonStyle
                }
              >
                사진 보강하기
              </Link>

              <Link
                href="/dashboard/interview"
                style={
                  secondaryButtonStyle
                }
              >
                이야기 보강하기
              </Link>
            </div>

            <p style={pageNumberStyle}>
              {finalPageNumber}
            </p>
          </article>
        </EbookReader>
      </section>
    </main>
  );
}

function ContentBlock({
  block,
}: {
  block: EbookBlock;
}) {
  if (block.type === 'title') {
    return (
      <h2
        style={{
          margin: '0 0 24px',
          paddingBottom: 17,
          borderBottom:
            '1px solid #ead7b7',
          color: '#24170f',
          fontFamily:
            'Noto Serif KR, serif',
          fontSize: 34,
          lineHeight: 1.4,
          letterSpacing: '-0.05em',
        }}
      >
        {block.text}
      </h2>
    );
  }

  if (block.type === 'heading') {
    return (
      <h3
        style={{
          margin: '30px 0 14px',
          color: '#342318',
          fontFamily:
            'Noto Serif KR, serif',
          fontSize: 25,
          lineHeight: 1.5,
          letterSpacing: '-0.04em',
        }}
      >
        {block.text}
      </h3>
    );
  }

  if (block.type === 'numbered') {
    return (
      <p
        style={{
          margin: '14px 0',
          padding: '14px 17px',
          borderRadius: 17,
          border:
            '1px solid #ead7b7',
          background: '#fff6e6',
          color: '#4c3827',
          fontSize: 16,
          lineHeight: 1.85,
          fontWeight: 700,
        }}
      >
        {block.text}
      </p>
    );
  }

  return (
    <p style={paragraphStyle}>
      {block.text}
    </p>
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
    <div style={infoCardStyle}>
      <strong>{title}</strong>
      <span>{value}</span>
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
      className="ebook-toc-item"
      style={tocItemStyle}
    >
      <strong
        style={{
          color: '#b47a22',
          fontSize: 16,
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

        <em
          style={{
            display: 'block',
            marginTop: 4,
            color: '#88745d',
            fontSize: 13,
            fontStyle: 'normal',
            lineHeight: 1.55,
          }}
        >
          {description}
        </em>
      </div>

      <span
        style={{
          color: '#9f886c',
          fontSize: 13,
          fontWeight: 900,
        }}
      >
        {page}
      </span>
    </div>
  );
}

function parseBookContent(
  content?: string | null,
): EbookBlock[] {
  if (!content?.trim()) {
    return [
      {
        type: 'heading',
        text: '아직 원고가 준비되지 않았습니다',
      },
      {
        type: 'paragraph',
        text: '사진과 이야기를 더 남긴 뒤 책 상세 화면에서 원고 다시 정리하기를 실행해 주세요.',
      },
    ];
  }

  return content
    .replace(/\r\n/g, '\n')
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

  return chunks.length > 0
    ? chunks
    : [[]];
}

function makeShortText(
  value: string,
  maxLength: number,
) {
  if (
    value.length <= maxLength
  ) {
    return value;
  }

  return `${value
    .slice(0, maxLength)
    .trim()}...`;
}

function formatDate(
  date?: Date | null,
) {
  if (!date) {
    return '날짜 미정';
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).format(date);
}

function toolbarButtonStyle(
  background: string,
  color: string,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    padding: '0 18px',
    borderRadius: 999,
    border:
      '1px solid #c18a23',
    background,
    color,
    fontSize: 13,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

const bookWrapStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1120,
  margin: '0 auto',
  display: 'grid',
  gap: 28,
};

const coverPageStyle: CSSProperties = {
  position: 'relative',
  minHeight: 680,
  padding: 56,
  borderRadius: 34,
  overflow: 'hidden',
  background:
    'linear-gradient(145deg, #3a281b 0%, #6e4b2d 52%, #c18a23 100%)',
  color: '#fff8ec',
  boxShadow:
    '0 24px 70px rgba(63, 42, 24, 0.22)',
};

const pageStyle: CSSProperties = {
  position: 'relative',
  minHeight: 620,
  padding: 52,
  borderRadius: 34,
  border:
    '1px solid #ead7b7',
  background: '#fffdf7',
  boxShadow:
    '0 18px 54px rgba(80, 55, 20, 0.12)',
};

const lastPageStyle: CSSProperties = {
  ...pageStyle,
  textAlign: 'center',
  background:
    'linear-gradient(180deg, #fffdf7 0%, #fff4df 58%, #efd3a1 100%)',
};

const pageLabelStyle: CSSProperties = {
  margin: '0 0 18px',
  color: '#b47a22',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '0.08em',
};

const coverLabelStyle: CSSProperties = {
  ...pageLabelStyle,
  color: '#f3d28a',
};

const coverTitleStyle: CSSProperties = {
  margin: '76px 0 0',
  maxWidth: 760,
  fontFamily:
    'Noto Serif KR, serif',
  fontSize: 58,
  lineHeight: 1.22,
  letterSpacing: '-0.07em',
};

const coverSubtitleStyle: CSSProperties = {
  margin: '18px 0 0',
  maxWidth: 640,
  color: '#f8ddb0',
  fontSize: 23,
  lineHeight: 1.6,
  fontWeight: 800,
};

const coverLineStyle: CSSProperties = {
  width: 90,
  height: 3,
  margin: '38px 0',
  borderRadius: 999,
  background: '#f3d28a',
};

const coverTextStyle: CSSProperties = {
  maxWidth: 690,
  margin: 0,
  color: '#fff4df',
  fontSize: 19,
  lineHeight: 1.9,
  fontWeight: 700,
};

const coverFooterStyle: CSSProperties = {
  margin: '50px 0 0',
  paddingTop: 18,
  borderTop:
    '1px solid rgba(255,255,255,0.2)',
  color: '#f3d28a',
  fontSize: 13,
  fontWeight: 900,
};

const pageTitleStyle: CSSProperties = {
  margin: '0 0 26px',
  color: '#24170f',
  fontFamily:
    'Noto Serif KR, serif',
  fontSize: 38,
  lineHeight: 1.35,
  letterSpacing: '-0.05em',
};

const paragraphStyle: CSSProperties = {
  margin: '0 0 18px',
  color: '#433224',
  fontSize: 17,
  lineHeight: 2.05,
  wordBreak: 'keep-all',
};

const pageNumberStyle: CSSProperties = {
  position: 'absolute',
  right: 38,
  bottom: 28,
  margin: 0,
  color: '#b99a6c',
  fontSize: 13,
  fontWeight: 900,
};

const infoGridStyle: CSSProperties = {
  marginTop: 32,
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 12,
};

const infoCardStyle: CSSProperties = {
  padding: 17,
  borderRadius: 20,
  border:
    '1px solid #ead7b7',
  background: '#fff6e6',
  display: 'grid',
  gap: 6,
  color: '#4c3827',
  fontSize: 13,
};

const tocItemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    '52px minmax(0, 1fr) auto',
  gap: 16,
  alignItems: 'start',
  padding: '18px 0',
  borderBottom:
    '1px solid #ead7b7',
};

const photoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
};

const figureStyle: CSSProperties = {
  margin: 0,
  overflow: 'hidden',
  borderRadius: 22,
  border:
    '1px solid #ead7b7',
  background: '#fff6e6',
};

const figcaptionStyle: CSSProperties = {
  padding: 14,
  display: 'grid',
  gap: 4,
  color: '#4c3827',
  fontSize: 13,
  lineHeight: 1.5,
};

const photoNoticeStyle: CSSProperties = {
  margin: '22px 0 0',
  padding: 15,
  borderRadius: 17,
  background: '#fff8ec',
  color: '#6b5845',
  fontSize: 13,
  lineHeight: 1.7,
  fontWeight: 800,
};

const lastTitleStyle: CSSProperties = {
  margin: '72px auto 24px',
  maxWidth: 760,
  color: '#24170f',
  fontFamily:
    'Noto Serif KR, serif',
  fontSize: 44,
  lineHeight: 1.35,
  letterSpacing: '-0.06em',
};

const lastTextStyle: CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  color: '#5a4633',
  fontSize: 18,
  lineHeight: 2,
  fontWeight: 700,
};

const primaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 47,
  padding: '0 21px',
  borderRadius: 999,
  border:
    '1px solid #2b2118',
  background: '#2b2118',
  color: '#fff8ec',
  fontSize: 13,
  fontWeight: 900,
  textDecoration: 'none',
  textAlign: 'center',
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  border:
    '1px solid #c18a23',
  background: '#fff8ec',
  color: '#2b2118',
};

const ebookResponsiveStyles = `
  @media (max-width: 760px) {
    .ebook-main {
      padding: 17px 12px 44px !important;
    }

    .ebook-toolbar {
      display: grid !important;
      gap: 14px !important;
      margin-bottom: 18px !important;
    }

    .ebook-toolbar-actions {
      display: grid !important;
      grid-template-columns: 1fr 1fr;
      width: 100%;
    }

    .ebook-toolbar-actions a {
      width: 100%;
    }

    .ebook-book {
      gap: 18px !important;
    }

    .ebook-page {
      min-height: auto !important;
      padding: 28px 20px 54px !important;
      border-radius: 24px !important;
    }

    .ebook-cover {
      min-height: 540px !important;
      padding: 34px 22px 54px !important;
    }

    .ebook-cover h2 {
      margin-top: 52px !important;
      font-size: 38px !important;
      line-height: 1.28 !important;
    }

    .ebook-page h2 {
      font-size: 28px !important;
      line-height: 1.4 !important;
    }

    .ebook-page h3 {
      font-size: 22px !important;
    }

    .ebook-page p {
      font-size: 15px !important;
      line-height: 1.85 !important;
    }

    .ebook-toc-item {
      grid-template-columns: 42px minmax(0, 1fr) auto !important;
      gap: 10px !important;
    }

    .ebook-photo-grid {
      grid-template-columns: 1fr !important;
    }

    .ebook-photo-frame {
      height: 260px !important;
    }

    .ebook-last-actions {
      display: grid !important;
      grid-template-columns: 1fr !important;
    }

    .ebook-last-actions a {
      width: 100%;
    }
  }

  @media (max-width: 430px) {
    .ebook-page {
      padding: 24px 16px 52px !important;
    }

    .ebook-cover h2 {
      font-size: 32px !important;
    }

    .ebook-page h2 {
      font-size: 24px !important;
    }

    .ebook-toolbar-actions {
      grid-template-columns: 1fr;
    }

    .ebook-toc-item {
      grid-template-columns: 36px minmax(0, 1fr) !important;
    }

    .ebook-toc-item > span:last-child {
      display: none;
    }
  }
`;