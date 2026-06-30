// src/app/dashboard/timeline/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const TYPE_ICON: Record<string, string> = {
  PHOTO: '📷',
  VIDEO: '🎬',
  AUDIO: '🎙',
  TEXT: '✍️',
};
const TYPE_CLASS: Record<string, string> = {
  PHOTO: 'timeline__thumb--photo',
  VIDEO: 'timeline__thumb--video',
  AUDIO: 'timeline__thumb--audio',
  TEXT: 'timeline__thumb--audio',
};

export default async function TimelinePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // 실제 쿼리: 본인이 작성한 Memory 전체를 최신순으로 조회
  const memories = await prisma.memory.findMany({
    where: { authorId: session.user.id },
    orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
  });

  // 연도별로 그룹핑 (occurredAt이 없으면 createdAt 기준)
  const groups = new Map<number, typeof memories>();
  for (const m of memories) {
    const year = (m.occurredAt ?? m.createdAt).getFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(m);
  }
  const years = Array.from(groups.keys()).sort((a, b) => b - a);

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">TIMELINE</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>Memory Timeline</span>
      </div>

      <h1 className="dash-greeting">당신의 시간이, 한 줄로 이어집니다</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
        총 {memories.length}개의 기록이 저장되어 있습니다.
      </p>

      {years.length === 0 ? (
        <div className="dash-card">
          <p style={{ color: 'var(--ink-faint)', marginBottom: 12 }}>
            아직 저장된 기록이 없습니다.
          </p>
          <Link href="/dashboard/interview" className="btn btn--gold btn--sm">
            AI 인터뷰로 첫 기록 남기기
          </Link>
        </div>
      ) : (
        <div className="timeline">
          {years.map((year) => (
            <div className="timeline__year-group" key={year}>
              <div className="timeline__year">{year}</div>
              <div className="timeline__items">
                {groups.get(year)!.map((m) => (
                  <div className="timeline__card" key={m.id}>
                    <div className={`timeline__thumb ${TYPE_CLASS[m.type]}`}>
                      {TYPE_ICON[m.type]}
                    </div>
                    <p className="timeline__card-title">{m.title || '제목 없는 기록'}</p>
                    <p className="timeline__card-meta">
                      {(m.occurredAt ?? m.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
