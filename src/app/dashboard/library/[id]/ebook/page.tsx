import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import EbookReader from '@/components/library/EbookReader';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const TYPE_LABEL: Record<string, string> = {
  LIFE_BOOK: '인생책',
  FAMILY_BOOK: '가족기록책',
  COUPLE_BOOK: '부부 이야기',
  BABY_BOOK: '성장 기록',
  TRAVEL_BOOK: '여행 기록',
  AI_MOVIE: '추억 영상',
};

function splitContent(content?: string | null) {
  if (!content?.trim()) {
    return [
      '아직 원고 본문이 준비되지 않았습니다.',
      '사진과 이야기를 더 남긴 뒤 책 원고를 다시 생성해 주세요.',
    ];
  }

  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function chunkParagraphs(paragraphs: string[], size = 3) {
  const chunks: string[][] = [];

  for (let i = 0; i < paragraphs.length; i += size) {
    chunks.push(paragraphs.slice(i, i + size));
  }

  return chunks;
}

function formatDate(date?: Date | null) {
  if (!date) return '날짜 미정';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default async function EbookPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;
  const userId = session.user.id;

  const book = await prisma.book.findFirst({
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

  const linkedPhotos = linkedBookMemories
    .map((item) => item.memory)
    .filter((memory) => {
      return String(memory.type) === 'PHOTO' && Boolean(memory.fileUrl);
    });

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

  const photos = linkedPhotos.length > 0 ? linkedPhotos : fallbackPhotos;
  const isUsingLinkedPhotos = linkedPhotos.length > 0;

   const paragraphs = splitContent(book.content);
   const contentPages = chunkParagraphs(paragraphs, 3);
   const typeLabel = TYPE_LABEL[String(book.type)] || '인생책';
   const estimatedPageCount =
    book.pageCount ?? contentPages.length + (photos.length > 0 ? 5 : 4);

  return (
        <main
        className="ebook-main"
        style={{
        minHeight: '100vh',
        padding: '32px 20px 64px',
        background:
          'linear-gradient(180deg, #f8efe1 0%, #fffaf2 42%, #f3e2ca 100%)',
      }}
    >
        <style>{ebookResponsiveStyles}</style>

      <div
        className="ebook-toolbar"
        style={{
         maxWidth: 1120,
          margin: '0 auto 24px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 8px',
              color: '#9a6a24',
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            DALDONGNE E-BOOK
          </p>

          <h1
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 34,
              lineHeight: 1.3,
              letterSpacing: '-0.05em',
              color: '#24170f',
            }}
          >
            책처럼 보는 전자책
          </h1>
        </div>

        <Link
          href={`/dashboard/library/${book.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            padding: '0 18px',
            borderRadius: 999,
            border: '1px solid #c18a23',
            background: '#fff7e8',
            color: '#2b2118',
            fontWeight: 900,
            textDecoration: 'none',
          }}
        >
          책 상세로 돌아가기
        </Link>
      </div>

        <section className="ebook-book" style={bookWrapStyle}>
        <EbookReader>
        <article className="ebook-page ebook-cover" style={coverPageStyle}>
          <p style={pageLabelStyle}>{typeLabel}</p>

          <h2 style={coverTitleStyle}>{book.title}</h2>

          {book.subtitle ? <p style={coverSubtitleStyle}>{book.subtitle}</p> : null}

          <div style={coverLineStyle} />

          <p style={coverTextStyle}>
            {book.coverText ||
              book.summary ||
              '사진과 이야기를 모아 한 권의 기억으로 엮었습니다.'}
          </p>

          <p style={pageNumberStyle}>1</p>
        </article>

         <article className="ebook-page" style={pageStyle}>
          <p style={pageLabelStyle}>이 책을 만든 이유</p>

          <h2 style={pageTitleStyle}>흩어진 기억을 한 권의 책으로 남깁니다</h2>

          <p style={paragraphStyle}>
            사진은 한순간을 남기지만, 이야기는 그 순간이 왜 소중했는지
            알려줍니다. 달동네는 사진과 짧은 기억을 모아 가족이 오래 간직할
            수 있는 책의 형태로 정리합니다.
          </p>

          <p style={paragraphStyle}>
            이 전자책은 인쇄 전 원고를 책처럼 읽어보는 미리보기입니다. 문장,
            흐름, 사진의 분위기를 확인하고 필요하면 자료를 더 보강할 수
            있습니다.
          </p>

          <div style={infoGridStyle}>
            <div style={infoCardStyle}>
              <strong>사진</strong>
              <span>{book.basedPhotoCount ?? photos.length}장 기준</span>
            </div>

            <div style={infoCardStyle}>
              <strong>이야기</strong>
              <span>{book.basedStoryCount ?? 0}개 기준</span>
            </div>

            <div style={infoCardStyle}>
              <strong>예상 페이지</strong>
              <span>{estimatedPageCount}쪽</span>
            </div>
          </div>

          <p style={pageNumberStyle}>2</p>
          </article>

          <article className="ebook-page" style={pageStyle}>
          <p style={pageLabelStyle}>목차</p>

          <h2 style={pageTitleStyle}>이 책의 흐름</h2>

          <div
            style={{
              display: 'grid',
              gap: 14,
              marginTop: 24,
            }}
          >
            <div style={tocItemStyle}>
              <strong>01</strong>
              <span>표지</span>
              <em>이 책의 첫 장</em>
            </div>

            <div style={tocItemStyle}>
              <strong>02</strong>
              <span>이 책을 만든 이유</span>
              <em>사진과 이야기를 책으로 남기는 이유</em>
            </div>

            {photos.length > 0 ? (
              <div style={tocItemStyle}>
                <strong>03</strong>
                <span>사진으로 남은 장면</span>
                <em>책에 담길 수 있는 추억 사진</em>
              </div>
            ) : null}

            <div style={tocItemStyle}>
              <strong>{photos.length > 0 ? '04' : '03'}</strong>
              <span>원고 본문</span>
              <em>AI가 정리한 인생책 이야기</em>
            </div>

            <div style={tocItemStyle}>
              <strong>{photos.length > 0 ? '05' : '04'}</strong>
              <span>마지막 페이지</span>
              <em>가족에게 전해지는 기억</em>
            </div>
          </div>

          <p style={pageNumberStyle}>4</p>
        </article>

        {photos.length > 0 ? (
                  <article className="ebook-page" style={pageStyle}>
            <p style={pageLabelStyle}>사진으로 남은 장면</p>

            <h2 style={pageTitleStyle}>책에 담길 수 있는 추억 사진</h2>

            <div className="ebook-photo-grid" style={photoGridStyle}>
              {photos.map((photo) =>
                photo.fileUrl ? (
                  <figure key={photo.id} style={figureStyle}>
                   <img
                      src={`/api/blob/${photo.id}`}
                      alt={photo.title || '추억 사진'}
                      style={photoStyle}
                    />

                    <figcaption style={figcaptionStyle}>
                      <strong>{photo.title || '제목 없는 사진'}</strong>
                      <span>{formatDate(photo.occurredAt)}</span>
                    </figcaption>
                  </figure>
                ) : null,
              )}
            </div>

                        <p style={photoNoticeStyle}>
              {isUsingLinkedPhotos
                ? '이 전자책은 책 원고를 만들 때 선택한 사진을 기준으로 보여줍니다.'
                : '이전 방식으로 만든 책이라 연결된 사진 정보가 아직 없습니다. 책 원고를 다시 생성하면 선택한 사진만 정확히 연결됩니다.'}
            </p>

            <p style={pageNumberStyle}>3</p>
          </article>
        ) : null}

        {contentPages.map((pageParagraphs, index) => (
                    <article key={`content-${index}`} className="ebook-page" style={pageStyle}>
            <p style={pageLabelStyle}>
              {String(index + 1).padStart(2, '0')} / 원고 본문
            </p>

            {index === 0 ? <h2 style={pageTitleStyle}>{book.title}</h2> : null}

            {pageParagraphs.map((paragraph) => (
              <p key={paragraph} style={paragraphStyle}>
                {paragraph}
              </p>
            ))}

                        <p style={pageNumberStyle}>
              {index + (photos.length > 0 ? 5 : 4)}
            </p>
          </article>
        ))}

                <article className="ebook-page ebook-last-page" style={lastPageStyle}>
          <p style={pageLabelStyle}>마지막 페이지</p>

          <h2 style={lastTitleStyle}>기억은 사라지지 않고, 전해집니다</h2>

          <p style={lastTextStyle}>
            이 책은 완성된 끝이 아니라, 가족이 함께 더 채워갈 수 있는
            시작입니다. 사진 한 장, 짧은 말 한 줄이 시간이 지나 누군가에게는
            가장 따뜻한 유산이 됩니다.
          </p>

          <div
            style={{
              marginTop: 34,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href={`/dashboard/library/${book.id}`}
              style={primaryButtonStyle}
            >
              책 상세로 돌아가기
            </Link>

            <Link href="/dashboard/interview" style={secondaryButtonStyle}>
              사진과 이야기 보강하기
            </Link>
          </div>

          <p style={pageNumberStyle}>
            {contentPages.length + (photos.length > 0 ? 5 : 4)}
          </p>
           </article>
        </EbookReader>
      </section>
    </main>
  );
}

const bookWrapStyle = {
  maxWidth: 1120,
  margin: '0 auto',
  display: 'grid',
  gap: 28,
};

const coverPageStyle = {
  position: 'relative' as const,
  minHeight: 680,
  padding: 56,
  borderRadius: 34,
  background:
    'linear-gradient(145deg, #3a281b 0%, #6e4b2d 52%, #c18a23 100%)',
  color: '#fff8ec',
  boxShadow: '0 24px 70px rgba(63, 42, 24, 0.22)',
  overflow: 'hidden',
};

const pageStyle = {
  position: 'relative' as const,
  minHeight: 620,
  padding: 52,
  borderRadius: 34,
  border: '1px solid #ead7b7',
  background: '#fffdf7',
  boxShadow: '0 18px 54px rgba(80, 55, 20, 0.12)',
};

const lastPageStyle = {
  ...pageStyle,
  textAlign: 'center' as const,
  background:
    'linear-gradient(180deg, #fffdf7 0%, #fff4df 58%, #efd3a1 100%)',
};

const pageLabelStyle = {
  margin: '0 0 18px',
  color: '#b47a22',
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: '0.08em',
};

const coverTitleStyle = {
  margin: '80px 0 0',
  maxWidth: 720,
  fontFamily: 'Noto Serif KR, serif',
  fontSize: 58,
  lineHeight: 1.22,
  letterSpacing: '-0.07em',
};

const coverSubtitleStyle = {
  margin: '18px 0 0',
  maxWidth: 640,
  color: '#f8ddb0',
  fontSize: 24,
  lineHeight: 1.6,
  fontWeight: 800,
};

const coverLineStyle = {
  width: 90,
  height: 3,
  margin: '42px 0',
  borderRadius: 999,
  background: '#f3d28a',
};

const coverTextStyle = {
  maxWidth: 680,
  margin: 0,
  color: '#fff4df',
  fontSize: 20,
  lineHeight: 1.9,
  fontWeight: 700,
};

const pageTitleStyle = {
  margin: '0 0 26px',
  fontFamily: 'Noto Serif KR, serif',
  fontSize: 38,
  lineHeight: 1.35,
  letterSpacing: '-0.05em',
  color: '#24170f',
};

const paragraphStyle = {
  margin: '0 0 18px',
  color: '#433224',
  fontSize: 18,
  lineHeight: 2.05,
  wordBreak: 'keep-all' as const,
};

const pageNumberStyle = {
  position: 'absolute' as const,
  right: 38,
  bottom: 28,
  margin: 0,
  color: '#b99a6c',
  fontSize: 14,
  fontWeight: 900,
};

const infoGridStyle = {
  marginTop: 34,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 14,
};

const infoCardStyle = {
  padding: 18,
  borderRadius: 20,
  background: '#fff6e6',
  border: '1px solid #ead7b7',
  display: 'grid',
  gap: 6,
  color: '#4c3827',
};

const tocItemStyle = {
  display: 'grid',
  gridTemplateColumns: '56px minmax(0, 1fr)',
  gap: '4px 16px',
  alignItems: 'start',
  padding: '18px 0',
  borderBottom: '1px solid #ead7b7',
  color: '#3b2b1d',
};


const photoGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 18,
};

const figureStyle = {
  margin: 0,
  borderRadius: 24,
  overflow: 'hidden',
  background: '#fff6e6',
  border: '1px solid #ead7b7',
};

const photoStyle = {
  display: 'block',
  width: '100%',
  aspectRatio: '4 / 3',
  objectFit: 'cover' as const,
};

const figcaptionStyle = {
  padding: 14,
  display: 'grid',
  gap: 4,
  color: '#4c3827',
  fontSize: 14,
  lineHeight: 1.5,
};

const photoNoticeStyle = {
  margin: '22px 0 0',
  padding: 16,
  borderRadius: 18,
  background: '#fff8ec',
  color: '#6b5845',
  fontSize: 14,
  lineHeight: 1.7,
  fontWeight: 800,
};

const lastTitleStyle = {
  margin: '70px auto 24px',
  maxWidth: 760,
  fontFamily: 'Noto Serif KR, serif',
  fontSize: 44,
  lineHeight: 1.35,
  letterSpacing: '-0.06em',
  color: '#24170f',
};

const lastTextStyle = {
  maxWidth: 720,
  margin: '0 auto',
  color: '#5a4633',
  fontSize: 19,
  lineHeight: 2,
  fontWeight: 700,
};

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 48,
  padding: '0 22px',
  borderRadius: 999,
  background: '#2b2118',
  color: '#fff8ec',
  fontWeight: 900,
  textDecoration: 'none',
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  background: '#fff8ec',
  color: '#2b2118',
  border: '1px solid #c18a23',
};

const ebookResponsiveStyles = `
  @media (max-width: 760px) {
    .ebook-main {
      padding: 18px 12px 44px !important;
    }

    .ebook-toolbar {
      display: grid !important;
      gap: 14px !important;
      margin-bottom: 18px !important;
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
      min-height: 520px !important;
      padding: 34px 22px 54px !important;
    }

    .ebook-cover h2 {
      margin-top: 52px !important;
      font-size: 38px !important;
      line-height: 1.28 !important;
      letter-spacing: -0.06em !important;
    }

    .ebook-cover p {
      font-size: 16px !important;
      line-height: 1.75 !important;
    }

    .ebook-page h2 {
      font-size: 28px !important;
      line-height: 1.4 !important;
    }

    .ebook-page p {
      font-size: 16px !important;
      line-height: 1.85 !important;
    }

    .ebook-photo-grid {
      grid-template-columns: 1fr !important;
    }

    .ebook-page img {
      max-height: 320px !important;
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
  }
`;