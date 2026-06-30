// src/app/dashboard/library/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const TYPE_LABEL: Record<string, string> = {
  LIFE_BOOK: 'LIFE BOOK',
  FAMILY_BOOK: 'FAMILY BOOK',
  COUPLE_BOOK: 'COUPLE BOOK',
  BABY_BOOK: 'BABY BOOK',
  TRAVEL_BOOK: 'TRAVEL BOOK',
  AI_MOVIE: 'AI MOVIE',
};
const TYPE_SPINE: Record<string, string> = {
  LIFE_BOOK: '#6E2A36',
  FAMILY_BOOK: '#2E3F52',
  COUPLE_BOOK: '#5C3A52',
  BABY_BOOK: '#5C6B4F',
  TRAVEL_BOOK: '#8C4A2D',
  AI_MOVIE: '#B6892F',
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  IN_PRODUCTION: '제작 중',
  PUBLISHED: '출판 완료',
};

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // 실제 쿼리: 본인이 만든 책/영상 전체
  const books = await prisma.book.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">LIBRARY</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>Life Library</span>
      </div>

      <h1 className="dash-greeting">지금까지 만든 모든 기록이, 한 서재에</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
        총 {books.length}권이 보관되어 있습니다.
      </p>

      <div className="library-shelf">
        {books.map((b) => (
          <div className="library-book" key={b.id} style={{ '--spine': TYPE_SPINE[b.type] } as React.CSSProperties}>
            <p className="library-book__type">{TYPE_LABEL[b.type]}</p>
            <p className="library-book__title">{b.title}</p>
            <p className="library-book__meta">
              {STATUS_LABEL[b.status]} · {b.pageCount ? `${b.pageCount}p` : b.createdAt.toLocaleDateString('ko-KR')}
            </p>
          </div>
        ))}

        <Link href="/dashboard/interview" className="library-book library-book--empty">
          <p className="library-book__plus">+</p>
          <p className="library-book__title" style={{ color: 'var(--ink-faint)' }}>새 기록 시작하기</p>
        </Link>
      </div>

      {books.length === 0 && (
        <p style={{ color: 'var(--ink-faint)', fontSize: 13.5, marginTop: 20 }}>
          아직 출판된 책이 없습니다. 책 출판 신청은 기존 사이트의 출판 신청(apply) 흐름과
          연결될 예정입니다 — 지금은 빈 서재가 "진짜로 비어있다"는 것을 보여줍니다 (가짜 데이터 없음).
        </p>
      )}
    </main>
  );
}
