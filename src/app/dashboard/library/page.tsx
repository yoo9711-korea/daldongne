// src/app/dashboard/library/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import BookShelfView from '@/components/library/BookShelfView';
import LibraryBookList from '@/components/library/LibraryBookList';
import PageGuideBox from '@/components/guide/PageGuideBox';

const TYPE_LABEL: Record<string, string> = {
  LIFE_BOOK: '부모님 인생책',
  FAMILY_BOOK: '우리 가족 인생책',
  COUPLE_BOOK: '부부 이야기책',
  BABY_BOOK: '성장 기록책',
  TRAVEL_BOOK: '여행 기록책',
  AI_MOVIE: '추억 영상',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '원고 초안',
  IN_PRODUCTION: '제작 준비 중',
  PUBLISHED: '완성',
  ARCHIVED: '보관됨',
};

export default async function LibraryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as { id?: string }).id;

  if (!userId) {
    redirect('/login');
  }

  const books = await prisma.book.findMany({
    where: {
      authorId: userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const shelfBooks = books.slice(0, 6).map((book) => ({
    id: book.id,
    title: book.title,
    subtitle: TYPE_LABEL[String(book.type)] || '인생책',
    status: STATUS_LABEL[String(book.status)] || '상태 확인 필요',
    href: `/dashboard/library/${book.id}`,
  }));

  const listBooks = books.map((book) => ({
    id: book.id,
    type: String(book.type),
    title: book.title,
    status: String(book.status),
    summary: book.summary,
    pageCount: book.pageCount,
    basedPhotoCount: book.basedPhotoCount,
    basedStoryCount: book.basedStoryCount,
  }));

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">BOOKSHELF</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>내 책장</span>
      </div>

            <PageGuideBox
        label="처음이라면 여기서 확인하세요"
        title="내 책장은 완성된 원고를 확인하는 공간입니다"
        description="AI가 만든 책 원고가 이곳에 저장됩니다. 원고를 읽어보고, 인쇄용 원고를 확인한 뒤 마음에 들면 제작 상담을 신청할 수 있습니다."
        steps={[
          '생성된 책 원고 목록을 확인합니다.',
          '책을 클릭해 상세 내용을 봅니다.',
          '원고 본문과 사진, 이야기를 확인합니다.',
          '필요하면 사진과 이야기를 더 보강합니다.',
          '인쇄용 원고를 확인합니다.',
          '마음에 들면 제작 상담을 신청합니다.',
        ]}
        note="책 원고가 마음에 들지 않으면 사진과 이야기를 더 추가한 뒤 다시 원고를 생성하면 됩니다."
      />

      <h1 className="dash-greeting">가족이 간직할 책을 보관합니다</h1>

      <p
        style={{
          color: 'var(--ink-soft)',
          marginBottom: 32,
          fontSize: 18,
          lineHeight: 1.75,
          maxWidth: 760,
        }}
      >
        사진과 이야기를 모아 만든 인생책, 원고, 추억 영상이 이곳에
        보관됩니다. 지금까지 총 {books.length}개의 결과물이 준비되어 있습니다.
      </p>

      <section
        className="dash-card"
        style={{
          marginBottom: 28,
          overflow: 'hidden',
        }}
      >
        <p className="dash-card__label">최근 책장</p>

        <h2
          style={{
            margin: '0 0 20px',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 32,
            lineHeight: 1.35,
            color: 'var(--ink)',
            letterSpacing: '-0.04em',
          }}
        >
          최근 정리한 책을 먼저 보여드립니다
        </h2>

        <BookShelfView books={shelfBooks} />

        {books.length > 6 ? (
          <p
            style={{
              marginTop: 16,
              marginBottom: 0,
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--ink-soft)',
            }}
          >
            책장이 복잡해 보이지 않도록 최근 6권만 위에 보여줍니다. 전체
            책은 아래 보관된 결과물에서 확인할 수 있습니다.
          </p>
        ) : null}
      </section>

      <section className="dash-card">
        <p className="dash-card__label">보관된 결과물</p>

        <h2
          style={{
            margin: '0 0 22px',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 36,
            lineHeight: 1.35,
            color: 'var(--ink)',
            letterSpacing: '-0.04em',
          }}
        >
          완성된 책과 원고를
          <br />
          다시 꺼내볼 수 있습니다.
        </h2>

        <LibraryBookList books={listBooks} />
      </section>
    </main>
  );
}