// src/app/dashboard/movie/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import MovieClient from './MovieClient';

export default async function MoviePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // 업로드된 사진 목록 가져오기
  const photos = await prisma.memory.findMany({
    where: {
      authorId: session.user.id,
      type: 'PHOTO',
      fileUrl: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // 인터뷰 답변 가져오기
  const interviews = await prisma.memory.findMany({
    where: {
      authorId: session.user.id,
      type: 'TEXT',
      title: { startsWith: 'AI 인터뷰:' },
    },
    orderBy: { createdAt: 'asc' },
  });

  // 제작된 영상 목록
  const movies = await prisma.book.findMany({
    where: {
      authorId: session.user.id,
      type: 'AI_MOVIE',
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">AI MOVIE</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>달동네 인생영상</span>
      </div>
      <h1 className="dash-greeting">당신만의 인생영상을 만들어보세요</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 40 }}>
        사진과 기억으로, AI가 감동적인 영상을 자동으로 만들어드립니다.
      </p>
      <MovieClient
        photos={photos.map(p => ({ id: p.id, url: `/api/blob/${p.id}`,  title: p.title || '',}))}
        interviews={interviews.map(i => ({ title: i.title || '', description: i.description || '' }))}
        userName={session.user.name || ''}
        movies={movies.map(m => ({ id: m.id, title: m.title, status: m.status, createdAt: m.createdAt.toISOString() }))}
      />
    </main>
  );
}