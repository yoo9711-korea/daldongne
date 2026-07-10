import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import PrintButton from '@/components/library/PrintButton';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type MemoryRecord = Record<string, unknown>;

type ParsedBookBlock = {
  type: 'title' | 'heading' | 'numbered' | 'paragraph';
  text: string;
};

export default async function BookPrintPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect('/login');
  }

  const book = await prisma.book.findFirst({
    where: {
      id,
      authorId: userId,
    } as any,
  });

  if (!book) {
    notFound();
  }

    const linkedBookMemories = await prisma.bookMemory.findMany({
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
      memory: true,
    },
  });

  const linkedMemories = linkedBookMemories.map((item) => {
    return item.memory;
  }) as unknown as MemoryRecord[];

  const fallbackMemories =
    linkedMemories.length > 0
      ? []
      : await prisma.memory.findMany({
          where: {
            authorId: userId,
          } as any,
          orderBy: {
            createdAt: 'desc',
          },
          take: 40,
        });

  const allMemories =
    linkedMemories.length > 0
      ? linkedMemories
      : (fallbackMemories as unknown as MemoryRecord[]);

  const photoMemories = allMemories.filter(isPhotoMemory);
  const photos = photoMemories.slice(0, 6);
  const photoStories = photoMemories.filter(hasStoryDescription).slice(0, 8);
  const stories = allMemories.filter(isStoryMemory).slice(0, 8);

const content = cleanText(book.content);
const blocks = parseBookContent(content);

  return (
    <main
         style={{
         minHeight: '100vh',
         ...gridPaperPageStyle(),
         padding: '32px 20px',
         color: '#24170f',
         }}
     >
      <style>
        {`
          @page {
            size: A4;
            margin: 18mm;
          }

          @media print {
  body {
    background: white !important;
  }

  body * {
    visibility: hidden !important;
  }

  .print-document,
  .print-document * {
    visibility: visible !important;
  }

  .print-document {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: 0 !important;
    background: white !important;
  }

  .print-toolbar {
    display: none !important;
  }

  aside,
  nav,
  header,
  .sidebar,
  .dashboard-sidebar,
  .dashboard-layout,
  .runninghead {
    display: none !important;
  }

  .print-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .print-photo-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
        `}
      </style>

      <div
        className="print-toolbar"
        style={{
          maxWidth: 880,
          margin: '0 auto 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 800,
              color: '#8a5a1f',
            }}
          >
            인쇄용 원고 보기
          </p>
          <h1
            style={{
              margin: '6px 0 0',
              fontSize: 28,
              lineHeight: 1.3,
              letterSpacing: '-0.04em',
            }}
          >
            {book.title}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href={`/dashboard/library/${book.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 42,
              padding: '0 16px',
              borderRadius: 999,
              border: '1px solid #c9ad7b',
              background: '#fffaf0',
              color: '#5a3a18',
              fontSize: 14,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            책 상세로 돌아가기
          </Link>

          <PrintButton />
        </div>
      </div>

      <article
          className="print-document"
          style={{
          maxWidth: 880,
          margin: '0 auto',
          background: '#fffaf0',
          border: '1px solid #e0c89c',
          borderRadius: 28,
          padding: '64px 72px',
          boxShadow: '0 24px 70px rgba(80, 55, 20, 0.18)',
        }}
      >
        <header
          style={{
            textAlign: 'center',
            paddingBottom: 36,
            marginBottom: 40,
            borderBottom: '1px solid #e7d3ad',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              letterSpacing: '0.16em',
              fontWeight: 900,
              color: '#9a6a24',
            }}
          >
            DALDONGNE LIFE BOOK
          </p>

          <h1
            style={{
              margin: '18px 0 0',
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 42,
              lineHeight: 1.32,
              letterSpacing: '-0.05em',
              color: '#24170f',
            }}
          >
            {book.title}
          </h1>

          {book.subtitle ? (
            <p
              style={{
                margin: '16px 0 0',
                fontSize: 18,
                lineHeight: 1.7,
                color: '#6b5a46',
              }}
            >
              {book.subtitle}
            </p>
          ) : null}
        </header>

        {blocks.length > 0 ? (
          blocks.map((block, index) => {
            const shouldShowPhotos =
              block.type === 'heading' &&
              block.text.includes('사진에서 시작된 이야기') &&
              photos.length > 0;

            return (
              <div key={`${block.type}-${index}`}>
                <BookPrintBlock block={block} index={index} />

                {shouldShowPhotos ? (
                  <PrintPhotoSection photos={photos} />
                ) : null}
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: 28,
              borderRadius: 18,
              background: '#f3e6cf',
              color: '#6b5a46',
              fontSize: 17,
              lineHeight: 1.8,
            }}
          >
            아직 인쇄할 원고가 없습니다. 책 상세 화면에서 원고 다시 정리하기를
            먼저 눌러주세요.
          </div>
        )}

                {photoStories.length > 0 ? (
          <PrintPhotoStorySection photoStories={photoStories} />
        ) : null}

        {stories.length > 0 ? (
          <PrintStorySection stories={stories} />
        ) : null}

        <footer
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: '1px solid #e7d3ad',
            textAlign: 'center',
            fontSize: 13,
            lineHeight: 1.7,
            color: '#9a8062',
          }}
        >
          달동네 출판사 · 사진과 이야기로 엮은 우리 가족의 기록
        </footer>
      </article>
    </main>
  );
}

function PrintPhotoSection({ photos }: { photos: MemoryRecord[] }) {
  return (
    <section
      className="print-section"
      style={{
        margin: '24px 0 34px',
        padding: 22,
        borderRadius: 22,
        background: '#f7eddc',
        border: '1px solid #ead7b7',
      }}
    >
      <p
        style={{
          margin: '0 0 16px',
          fontSize: 15,
          fontWeight: 900,
          color: '#9a6a24',
        }}
      >
        이 원고에 함께 담긴 사진
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        {photos.map((photo, index) => {
          const title =
            pickText(photo, [
              'title',
              'name',
              'caption',
              'originalName',
              'filename',
            ]) || `사진 ${index + 1}`;

          const id = cleanText(photo.id);
          const imageUrl = id ? `/api/blob/${id}` : '';

          return (
            <figure
              key={String(photo.id ?? index)}
              className="print-photo-card"
              style={{
                margin: 0,
                borderRadius: 18,
                overflow: 'hidden',
                background: '#fffaf0',
                border: '1px solid #e7d3ad',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 210,
                  background: '#ead7b7',
                  overflow: 'hidden',
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8a5a1f',
                      fontSize: 14,
                      fontWeight: 900,
                    }}
                  >
                    사진을 불러오지 못했습니다
                  </div>
                )}
              </div>

              <figcaption
                style={{
                  padding: '12px 14px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontWeight: 800,
                  color: '#3b2b1d',
                }}
              >
                {makeShortText(title, 70)}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function PrintPhotoStorySection({
  photoStories,
}: {
  photoStories: MemoryRecord[];
}) {
  return (
    <section
      className="print-section"
      style={{
        margin: '34px 0 34px',
        padding: 22,
        borderRadius: 22,
        background: '#fffaf0',
        border: '1px solid #e7d3ad',
      }}
    >
      <p
        style={{
          margin: '0 0 18px',
          fontSize: 13,
          fontWeight: 900,
          color: '#9a6a24',
        }}
      >
        사진에 붙인 이야기
      </p>

      <div
        style={{
          display: 'grid',
          gap: 14,
        }}
      >
        {photoStories.map((story, index) => {
          const title =
            pickText(story, [
              'title',
              'name',
              'caption',
              'originalName',
              'filename',
            ]) || `사진 이야기 ${index + 1}`;

          const description =
            pickText(story, [
              'description',
              'content',
              'summary',
              'memo',
              'text',
            ]) || '사진에 대한 이야기가 없습니다.';

          const id = cleanText(story.id);
          const imageUrl = id ? `/api/blob/${id}` : '';

          return (
            <article
              key={String(story.id ?? index)}
              className="print-photo-card"
              style={{
                display: 'grid',
                gridTemplateColumns: '120px minmax(0, 1fr)',
                gap: 14,
                borderRadius: 18,
                overflow: 'hidden',
                background: '#f7eddc',
                border: '1px solid #e7d3ad',
              }}
            >
              <div
                style={{
                  height: 110,
                  background: '#eadcc5',
                  overflow: 'hidden',
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : null}
              </div>

              <div
                style={{
                  padding: '14px 14px 14px 0',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 900,
                    color: '#9a6a24',
                  }}
                >
                  {makeShortText(title, 80)}
                </p>

                <p
                  style={{
                    margin: '8px 0 0',
                    whiteSpace: 'pre-line',
                    fontSize: 14,
                    lineHeight: 1.75,
                    color: '#4a3828',
                  }}
                >
                  {makeShortText(description, 220)}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PrintStorySection({ stories }: { stories: MemoryRecord[] }) {
  return (
    <section
      className="print-section"
      style={{
        margin: '34px 0 34px',
        padding: 22,
        borderRadius: 22,
        background: '#fffaf0',
        border: '1px solid #e7d3ad',
      }}
    >
      <p
        style={{
          margin: '0 0 18px',
          fontSize: 13,
          fontWeight: 900,
          color: '#9a6a24',
        }}
      >
        글로 남긴 우리들의 시간
      </p>

      <div
        style={{
          display: 'grid',
          gap: 14,
        }}
      >
        {stories.map((story, index) => {
          const title =
            pickText(story, ['question', 'title', 'prompt']) ||
            `이야기 ${index + 1}`;

          const answer =
            pickText(story, [
              'answer',
              'content',
              'description',
              'summary',
              'memo',
            ]) || '아직 이야기 내용이 없습니다.';

          return (
            <article
              key={String(story.id ?? index)}
              className="print-photo-card"
              style={{
                padding: 18,
                borderRadius: 18,
                background: '#f7eddc',
                border: '1px solid #e7d3ad',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 900,
                  color: '#9a6a24',
                }}
              >
                {makeShortText(displayStoryTitle(title), 90)}
              </p>

              <p
                style={{
                  margin: '8px 0 0',
                  whiteSpace: 'pre-line',
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: '#4a3828',
                }}
              >
                {makeShortText(answer, 260)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BookPrintBlock({
  block,
  index,
}: {
  block: ParsedBookBlock;
  index: number;
}) {
  if (block.type === 'title') {
    return null;
  }

  if (block.type === 'heading') {
    return (
      <section className="print-section">
        <h2
          style={{
            margin: index === 0 ? '0 0 18px' : '44px 0 18px',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 28,
            lineHeight: 1.45,
            letterSpacing: '-0.04em',
            color: '#2d1c12',
          }}
        >
          {block.text}
        </h2>
      </section>
    );
  }

  if (block.type === 'numbered') {
    return (
      <p
        style={{
          margin: '16px 0',
          padding: '14px 18px',
          borderRadius: 16,
          background: '#f3e6cf',
          fontSize: 17,
          lineHeight: 1.9,
          color: '#4a3828',
        }}
      >
        {block.text}
      </p>
    );
  }

  return (
    <p
      style={{
        margin: '0 0 20px',
        fontSize: 18,
        lineHeight: 2.05,
        letterSpacing: '-0.02em',
        color: '#3b2b1d',
        wordBreak: 'keep-all',
      }}
    >
      {block.text}
    </p>
  );
}

function isPhotoMemory(memory: MemoryRecord) {
  const type = String(memory.type ?? '').toUpperCase();
  const fileUrl = pickText(memory, ['fileUrl', 'imageUrl', 'photoUrl', 'url']);

  return type === 'PHOTO' || Boolean(fileUrl);
}

function hasStoryDescription(memory: MemoryRecord) {
  const description = pickText(memory, [
    'description',
    'content',
    'summary',
    'memo',
    'text',
  ]);

  return description.length >= 10;
}

function isStoryMemory(memory: MemoryRecord) {
  if (isPhotoMemory(memory)) return false;
  if (isLegacyAiInterviewMemory(memory)) return false;

  const type = String(memory.type ?? '').toUpperCase();

  if (type.includes('STORY') || type.includes('TEXT')) {
    const storyText = pickText(memory, [
      'answer',
      'content',
      'description',
      'summary',
      'memo',
    ]);

    return storyText.length > 0;
  }

  const hasStoryText = Boolean(
    pickText(memory, ['answer', 'content', 'description', 'summary', 'memo']),
  );

  return hasStoryText;
}

function isLegacyAiInterviewMemory(memory: MemoryRecord) {
  const title = pickText(memory, ['title', 'question', 'prompt']);
  const normalizedTitle = title.trim();

  return (
    normalizedTitle.startsWith('AI 인터뷰') ||
    normalizedTitle.includes('AI 인터뷰 -')
  );
}


function parseBookContent(content: string): ParsedBookBlock[] {
  if (!content) return [];

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line !== '---')
    .map((line) => {
      if (line.startsWith('# ')) {
        return {
          type: 'title',
          text: line.replace(/^#\s+/, '').trim(),
        };
      }

      if (line.startsWith('## ')) {
        return {
          type: 'heading',
          text: line.replace(/^##\s+/, '').trim(),
        };
      }

      if (/^\d+\.\s+/.test(line)) {
        return {
          type: 'numbered',
          text: line,
        };
      }

      return {
        type: 'paragraph',
        text: line,
      };
    });
}

function cleanText(value: unknown) {
  if (typeof value !== 'string') return '';

  return value
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function pickText(item: MemoryRecord, keys: string[]) {
  for (const key of keys) {
    const value = cleanText(item[key]);
    if (value) return value;
  }

  return '';
}

function displayStoryTitle(title: string) {
  return title.replace(/^AI 인터뷰:/, '이야기:');
}

function makeShortText(text: string, maxLength = 120) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function gridPaperPageStyle() {
  return {
    backgroundColor: '#efe3cf',
    backgroundImage: `
      linear-gradient(rgba(154, 106, 36, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(154, 106, 36, 0.08) 1px, transparent 1px),
      linear-gradient(rgba(154, 106, 36, 0.14) 1px, transparent 1px),
      linear-gradient(90deg, rgba(154, 106, 36, 0.14) 1px, transparent 1px)
    `,
    backgroundSize: '24px 24px, 24px 24px, 120px 120px, 120px 120px',
    backgroundPosition: '0 0',
  };
}