import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import RefreshBookDraftButton from '@/components/library/RefreshBookDraftButton';
import DeleteBookButton from '@/components/library/DeleteBookButton';
import EditMemoryButton from '@/components/memory/EditMemoryButton';
import DeleteMemoryButton from '@/components/memory/DeleteMemoryButton';
import Image from 'next/image';
import BookProductionRequestButton from '@/components/library/BookProductionRequestButton';

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

export default async function BookDetailPage({ params }: PageProps) {
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

      const productionRequest = await prisma.bookProductionRequest.findFirst({
    where: {
      bookId: book.id,
      authorId: userId,
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
  });

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
          take: 50,
        });

  const allMemories =
    linkedMemories.length > 0
      ? linkedMemories
      : (fallbackMemories as unknown as MemoryRecord[]);

  const photoMemories = allMemories.filter(isPhotoMemory);
  const photos = photoMemories.slice(0, 6);
  const photoStories = photoMemories.filter(hasStoryDescription).slice(0, 8);
  const stories = allMemories.filter(isStoryMemory).slice(0, 8);
  const selectedMemoryIdsForRefresh = allMemories
    .map((memory) => {
      return typeof memory.id === 'string' ? memory.id : '';
    })
    .filter((id) => id.length > 0);

  const bookRecord = book as unknown as MemoryRecord;
  const content = cleanText(bookRecord.content);
  const parsedContent = parseBookContent(content);

  const coverText =
    cleanText(bookRecord.coverText) ||
    '사진 한 장에 멈춰 있던 시간이, 이제 한 권의 이야기로 다시 피어납니다.';

  const summary =
    cleanText(bookRecord.summary) ||
    '사진과 이야기를 바탕으로 정리한 인생책 원고 초안입니다.';

  return (
      <main
         style={{
         minHeight: '100vh',
         ...gridPaperPageStyle(),
         color: '#24170f',
         padding: '34px 28px 80px',
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
            marginBottom: 28,
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
            내 책장 / 책 상세 보기
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 24,
              alignItems: 'start',
              marginTop: 12,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'Noto Serif KR, serif',
                  fontSize: 42,
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
                    margin: '14px 0 0',
                    fontSize: 18,
                    lineHeight: 1.7,
                    color: '#6b5a46',
                  }}
                >
                  {book.subtitle}
                </p>
              ) : null}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'flex-end',
              }}
            >
              <RefreshBookDraftButton
                bookId={book.id}
                selectedMemoryIds={selectedMemoryIdsForRefresh}
              />

              <DeleteBookButton bookId={book.id} redirectTo="/dashboard/library" />

              <BookProductionRequestButton
                bookId={book.id}
                defaultName={
                  productionRequest?.name ||
                  cleanText(
                    (session?.user as { name?: unknown } | undefined)?.name,
                  )
                }
                defaultPhone={productionRequest?.phone || ''}
                defaultEmail={
                  productionRequest?.email ||
                  cleanText(
                    (session?.user as { email?: unknown } | undefined)?.email,
                  )
                }
                defaultMessage={productionRequest?.message || ''}
                existingRequestId={
                  productionRequest ? String(productionRequest.id) : null
                }
                existingStatus={
                  productionRequest ? String(productionRequest.status) : null
                }
              />

                              <Link
                href={`/dashboard/library/${book.id}/ebook`}
                style={buttonStyle('#fff4df', '#5a3510')}
              >
                전자책 보기
              </Link>

              <Link
                href={`/dashboard/library/${book.id}/print`}
                style={buttonStyle('#f3d28a', '#6d4512')}
              >
                인쇄용 원고 보기
              </Link>

               <Link href="/dashboard/library" style={buttonStyle('#fffaf0', '#4a3828')}>
                내 책장으로 돌아가기
              </Link>

              <Link href="/dashboard/book" style={buttonStyle('#24170f', '#fffaf0')}>
                책 원고 만들기
              </Link>
            </div>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 0.95fr) minmax(320px, 1.3fr)',
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              borderRadius: 30,
              padding: 34,
              background:
                'linear-gradient(135deg, #21150f 0%, #332016 58%, #6e3c22 100%)',
              color: '#fffaf0',
              minHeight: 330,
              boxShadow: '0 18px 40px rgba(70, 45, 20, 0.18)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#f3d28a',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              Daldongne Life Book
            </p>

            <h2
              style={{
                margin: '18px 0 0',
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 34,
                lineHeight: 1.32,
                letterSpacing: '-0.05em',
              }}
            >
              {book.title}
            </h2>

            <p
              style={{
                margin: '42px 0 0',
                fontSize: 19,
                lineHeight: 1.85,
                color: '#fff2d8',
                wordBreak: 'keep-all',
              }}
            >
              {coverText}
            </p>

            <p
              style={{
                margin: '42px 0 0',
                paddingTop: 18,
                borderTop: '1px solid rgba(255,255,255,0.18)',
                color: '#f3d28a',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              사진과 이야기로 엮은 우리 가족의 기록
            </p>
          </div>

          <div
            style={{
              borderRadius: 30,
              padding: 30,
              background: '#fffaf0',
              border: '1px solid #e4cda3',
              boxShadow: '0 18px 45px rgba(80, 55, 20, 0.08)',
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
              책 소개
            </p>

            <p
              style={{
                margin: '12px 0 0',
                fontSize: 18,
                lineHeight: 1.85,
                color: '#4a3828',
                wordBreak: 'keep-all',
              }}
            >
              {summary}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: 12,
                marginTop: 28,
              }}
            >
                            <InfoCard title="책 상태" value={getStatusLabel(String(book.status))} />

              <InfoCard
                title="제작 상담"
                value={
                  productionRequest
                    ? getProductionRequestStatusLabel(
                        String(productionRequest.status),
                      )
                    : '상담 미신청'
                }
              />

              <InfoCard title="예상 분량" value={getPageCountLabel(book.pageCount)} />

              <InfoCard
                title="사진"
                value={`${book.basedPhotoCount ?? photos.length}장`}
              />

              <InfoCard
                title="이야기"
                value={`${book.basedStoryCount ?? stories.length}개`}
              />
            </div>

            <p
              style={{
                margin: '22px 0 0',
                fontSize: 14,
                color: '#8a806f',
              }}
            >
              마지막 정리일: {formatDate(book.updatedAt)}
            </p>

             <p
              style={{
                margin: '12px 0 0',
                padding: '12px 14px',
                borderRadius: 16,
                background: linkedMemories.length > 0 ? '#f3fbf5' : '#fff9e8',
                border:
                  linkedMemories.length > 0
                    ? '1px solid #9ec9a8'
                    : '1px solid #e1bd67',
                color: linkedMemories.length > 0 ? '#2f6b3f' : '#7a4b00',
                fontSize: 13,
                lineHeight: 1.7,
                fontWeight: 800,
              }}
            >
              {linkedMemories.length > 0
                ? '이 책은 원고를 만들 때 선택한 사진과 이야기를 기준으로 표시됩니다.'
                : '이전 방식으로 만든 책이라 연결된 자료 정보가 아직 없습니다. 원고 다시 정리하기를 누르면 선택한 자료가 이 책에 정확히 연결됩니다.'}
            </p>
          </div>
        </section>

        <section
          style={{
            borderRadius: 30,
            padding: 32,
            background: '#fffaf0',
            border: '1px solid #e4cda3',
            boxShadow: '0 18px 45px rgba(80, 55, 20, 0.08)',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 18,
              alignItems: 'center',
              marginBottom: 22,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 900,
                  color: '#9a6a24',
                }}
              >
                책 원고 미리보기
              </p>

              <h2
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'Noto Serif KR, serif',
                  fontSize: 30,
                  lineHeight: 1.35,
                  letterSpacing: '-0.04em',
                  color: '#20130d',
                }}
              >
                한 권의 책처럼 읽히는 원고
              </h2>
            </div>

             <Link
              href={`/dashboard/library/${book.id}/ebook`}
              style={buttonStyle('#fff4df', '#5a3510')}
            >
              전자책 보기
            </Link>

            <Link
              href={`/dashboard/library/${book.id}/print`}
              style={buttonStyle('#f3d28a', '#6d4512')}
            >
              인쇄용 원고 보기
            </Link>
          </div>

          <p
            style={{
              margin: '0 0 26px',
              fontSize: 15,
              lineHeight: 1.75,
              color: '#6b5a46',
            }}
          >
            사진과 이야기를 단순 목록이 아니라 서문, 장면, 가족의 기억,
            앞으로 채워갈 원고 흐름으로 정리했습니다.
          </p>

          <BookContentPreview blocks={parsedContent} />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div style={panelStyle()}>
            <SectionTitle label="이 책에 들어갈 사진" title="사진에서 시작된 기억" />

            {photos.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 16,
                  marginTop: 20,
                }}
              >
                {photos.map((photo, index) => (
                  <PhotoCard key={String(photo.id ?? index)} photo={photo} />
                ))}
              </div>
            ) : (
              <EmptyBox text="아직 이 책에 넣을 사진이 없습니다." />
            )}
          </div>
       
          <div style={panelStyle()}>
  <SectionTitle
    label="사진에 붙인 이야기"
    title="사진 한 장에 담긴 기억"
  />

  {photoStories.length > 0 ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        marginTop: 20,
      }}
    >
      {photoStories.map((story, index) => (
        <PhotoStoryCard key={String(story.id ?? index)} story={story} />
      ))}
    </div>
  ) : (
    <EmptyBox text="아직 사진에 붙인 이야기가 없습니다." />
  )}
</div>

          <div style={panelStyle()}>
            <SectionTitle label="자유 이야기" title="글로 남긴 우리들의 시간" />

            {stories.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  marginTop: 20,
                }}
              >
                {stories.map((story, index) => (
                  <StoryCard key={String(story.id ?? index)} story={story} />
                ))}
              </div>
            ) : (
              <EmptyBox text="아직 이 책에 넣을 이야기가 없습니다." />
            )}
          </div>
        </section>

        <section style={panelStyle()}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              alignItems: 'center',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 900,
                  color: '#9a6a24',
                }}
              >
                다음 작업
              </p>

              <h2
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'Noto Serif KR, serif',
                  fontSize: 30,
                  lineHeight: 1.35,
                  letterSpacing: '-0.04em',
                  color: '#20130d',
                }}
              >
                이 원고는 계속 좋아질 수 있습니다
              </h2>

              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: '#6b5a46',
                }}
              >
                사진과 이야기를 더 추가한 뒤 원고를 다시 정리하면 책의 내용이
                더 깊어집니다.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Link href="/dashboard/timeline" style={buttonStyle('#fffaf0', '#4a3828')}>
                사진 더 모으기
              </Link>

              <Link href="/dashboard/interview" style={buttonStyle('#fffaf0', '#4a3828')}>
                이야기 더 남기기
              </Link>

              <RefreshBookDraftButton />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
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

function panelStyle() {
  return {
    borderRadius: 30,
    padding: 30,
    background: '#fffaf0',
    border: '1px solid #e4cda3',
    boxShadow: '0 18px 45px rgba(80, 55, 20, 0.08)',
  };
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
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
        {title}
      </p>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 18,
          fontWeight: 900,
          color: '#20130d',
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 900,
          color: '#9a6a24',
        }}
      >
        {label}
      </p>
      <h2
        style={{
          margin: '8px 0 0',
          fontFamily: 'Noto Serif KR, serif',
          fontSize: 28,
          lineHeight: 1.35,
          letterSpacing: '-0.04em',
          color: '#20130d',
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function BookContentPreview({ blocks }: { blocks: ParsedBookBlock[] }) {
  if (blocks.length === 0) {
    return (
      <EmptyBox text="아직 원고가 없습니다. 원고 다시 정리하기를 누르면 이곳에 책 원고가 표시됩니다." />
    );
  }

  return (
    <article
      style={{
        background: '#fffdf6',
        borderRadius: 24,
        border: '1px solid #ead7b7',
        padding: '34px 42px',
      }}
    >
      {blocks.map((block, index) => {
        if (block.type === 'title') {
          return (
            <h1
              key={`${block.type}-${index}`}
              style={{
                margin: '0 0 28px',
                paddingBottom: 22,
                borderBottom: '1px solid #ead7b7',
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 34,
                lineHeight: 1.35,
                letterSpacing: '-0.05em',
                color: '#20130d',
              }}
            >
              {block.text}
            </h1>
          );
        }

        if (block.type === 'heading') {
          return (
            <h2
              key={`${block.type}-${index}`}
              style={{
                margin: '34px 0 14px',
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 26,
                lineHeight: 1.45,
                letterSpacing: '-0.04em',
                color: '#2d1c12',
              }}
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === 'numbered') {
          return (
            <p
              key={`${block.type}-${index}`}
              style={{
                margin: '14px 0',
                padding: '14px 18px',
                borderRadius: 16,
                background: '#f7eddc',
                fontSize: 16,
                lineHeight: 1.8,
                color: '#4a3828',
              }}
            >
              {block.text}
            </p>
          );
        }

        return (
          <p
            key={`${block.type}-${index}`}
            style={{
              margin: '0 0 18px',
              fontSize: 17,
              lineHeight: 2,
              color: '#3b2b1d',
              wordBreak: 'keep-all',
            }}
          >
            {block.text}
          </p>
        );
      })}
    </article>
  );
}

function PhotoCard({ photo }: { photo: MemoryRecord }) {
  const title =
    pickText(photo, ['title', 'name', 'caption', 'originalName', 'filename']) ||
    '기억 속 사진';

  const rawDescription = pickText(photo, [
    'description',
    'content',
    'summary',
    'memo',
    'text',
  ]);

  const description = rawDescription || '아직 사진 설명이 없습니다.';

  const id = cleanText(photo.id);
  const imageUrl = id ? `/api/blob/${id}` : '';
  const occurredAt = getDateInputValue(photo.occurredAt);

  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: 22,
        border: '1px solid #ead7b7',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          width: '100%',
          height: 190,
          background: '#f3e6cf',
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
              color: '#9a6a24',
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            사진을 불러오지 못했습니다
          </div>
        )}
      </div>

      <div style={{ padding: 16 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.45,
            fontWeight: 900,
          }}
        >
          {makeShortText(title, 42)}
        </h3>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            lineHeight: 1.65,
            color: '#6b5a46',
          }}
        >
          {makeShortText(description, 80)}
        </p>

        {id ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 12,
            }}
          >
            <EditMemoryButton
              memoryId={id}
              initialTitle={title}
              initialDescription={rawDescription}
              initialOccurredAt={occurredAt}
              label="사진 수정"
            />

            <DeleteMemoryButton memoryId={id} label="사진 삭제" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PhotoStoryCard({ story }: { story: MemoryRecord }) {
  const title =
    pickText(story, ['title', 'name', 'caption', 'originalName', 'filename']) ||
    '사진에 담긴 이야기';

  const rawDescription = pickText(story, [
    'description',
    'content',
    'summary',
    'memo',
    'text',
  ]);

  const description = rawDescription || '아직 사진에 대한 이야기가 없습니다.';

  const id = cleanText(story.id);
  const imageUrl = id ? `/api/blob/${id}` : '';
  const occurredAt = getDateInputValue(story.occurredAt);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px minmax(0, 1fr)',
        gap: 16,
        alignItems: 'stretch',
        borderRadius: 22,
        border: '1px solid #ead7b7',
        background: '#f7eddc',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          minHeight: 130,
          background: '#eadcc5',
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            sizes="140px"
            style={{
              objectFit: 'cover',
            }}
          />
        ) : null}
      </div>

      <div
        style={{
          padding: '18px 18px 18px 0',
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
          {makeShortText(title, 80)}
        </p>

        <p
          style={{
            margin: '10px 0 0',
            whiteSpace: 'pre-line',
            fontSize: 15,
            lineHeight: 1.8,
            color: '#4a3828',
          }}
        >
          {makeShortText(description, 180)}
        </p>

        {id ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 14,
            }}
          >
            <EditMemoryButton
              memoryId={id}
              initialTitle={title}
              initialDescription={rawDescription}
              initialOccurredAt={occurredAt}
              label="이야기 수정"
            />

            <DeleteMemoryButton memoryId={id} label="사진 삭제" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StoryCard({ story }: { story: MemoryRecord }) {
  const question =
    pickText(story, ['question', 'title', 'prompt']) || '남겨진 이야기';

  const rawAnswer = pickText(story, [
    'answer',
    'content',
    'description',
    'summary',
    'memo',
  ]);

  const answer = rawAnswer || '아직 이야기 내용이 없습니다.';

  const id = cleanText(story.id);

  return (
    <div
      style={{
        borderRadius: 22,
        border: '1px solid #ead7b7',
        background: '#fffdf6',
        padding: 18,
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
        {makeShortText(question, 80)}
      </p>

      <p
        style={{
          margin: '10px 0 0',
          fontSize: 15,
          lineHeight: 1.75,
          color: '#4a3828',
        }}
      >
        {makeShortText(answer, 150)}
      </p>

      {id ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 14,
          }}
        >
          <EditMemoryButton
            memoryId={id}
            initialTitle={question}
            initialDescription={rawAnswer}
            label="이야기 수정"
          />

          <DeleteMemoryButton memoryId={id} label="이야기 삭제" />
        </div>
      ) : null}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      style={{
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

function makeShortText(text: string, maxLength = 120) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function getDateInputValue(value: unknown) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
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
  }).format(date);
}

function getPageCountLabel(pageCount: number | null | undefined) {
  if (!pageCount || pageCount <= 0) {
    return '원고 다시 정리 필요';
  }

  return `${pageCount}쪽`;
}

function getStatusLabel(status: string) {
  if (status === 'DRAFT') return '원고 초안';
  if (status === 'IN_PRODUCTION') return '제작 준비 중';
  if (status === 'PUBLISHED') return '완성';
  if (status === 'ARCHIVED') return '보관됨';

  return '상태 확인 필요';
}

function getProductionRequestStatusLabel(status: string) {
  if (status === 'REQUESTED') return '상담 신청 접수';
  if (status === 'CONTACTED') return '고객 연락 완료';
  if (status === 'IN_PROGRESS') return '제작 상담 진행 중';
  if (status === 'COMPLETED') return '상담 완료';
  if (status === 'CANCELED') return '상담 취소';

  return '상담 상태 확인 필요';
}

function gridPaperPageStyle() {
  return {
    backgroundColor: '#f7eddc',
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