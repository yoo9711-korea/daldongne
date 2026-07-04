// src/app/dashboard/timeline/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import UploadForm from './UploadForm';

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
  TEXT: 'timeline__thumb--text',
};

export default async function TimelinePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const memories = await prisma.memory.findMany({
    where: {
      authorId: session.user.id,
    },
    orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
  });

  const groups = new Map<number, typeof memories>();

  for (const memory of memories) {
    const year = (memory.occurredAt ?? memory.createdAt).getFullYear();

    if (!groups.has(year)) {
      groups.set(year, []);
    }

    groups.get(year)!.push(memory);
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

      <UploadForm />

      {years.length === 0 ? (
        <div className="dash-card" style={{ marginTop: 32 }}>
          <p style={{ color: 'var(--ink-faint)', marginBottom: 12 }}>
            아직 저장된 기록이 없습니다. 위에서 첫 사진을 올려보세요.
          </p>
        </div>
      ) : (
        <div className="timeline" style={{ marginTop: 40 }}>
          {years.map((year) => (
            <div className="timeline__year-group" key={year}>
              <div className="timeline__year">{year}</div>

              <div className="timeline__items">
                {groups.get(year)!.map((memory) => {
                  const memoryDate = memory.occurredAt ?? memory.createdAt;
                  const title = memory.title || '제목 없는 기록';
                  const icon = TYPE_ICON[memory.type] || '📝';
                  const thumbClass = TYPE_CLASS[memory.type] || 'timeline__thumb--text';

                  return (
                    <div className="timeline__card" key={memory.id}>
                      {memory.fileUrl && memory.type === 'PHOTO' ? (
                        <img
                          src={`/api/blob/${memory.id}`}
                          alt={title}
                          style={{
                            width: '100%',
                            aspectRatio: '4 / 3',
                            objectFit: 'cover',
                            borderRadius: 6,
                          }}
                        />
                      ) : (
                        <div className={`timeline__thumb ${thumbClass}`}>{icon}</div>
                      )}

                      <p className="timeline__card-title">{title}</p>

                      <p className="timeline__card-meta">
                        {memoryDate.toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}