import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import UploadForm from './UploadForm';

function isInterviewMemory(title: string | null) {
  if (!title) return false;

  return title.startsWith('AI 인터뷰') || title.startsWith('AI Interview');
}

function getTypeLabel(type: string) {
  if (type === 'PHOTO') return '사진';
  if (type === 'VIDEO') return '영상';
  if (type === 'AUDIO') return '음성';
  if (type === 'TEXT') return '이야기';

  return '기록';
}

export default async function TimelinePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const memories = await prisma.memory.findMany({
    where: {
      authorId: session.user.id,
    },
    orderBy: [
      {
        occurredAt: 'desc',
      },
      {
        createdAt: 'desc',
      },
    ],
    take: 100,
    select: {
      id: true,
      title: true,
      type: true,
      fileUrl: true,
      occurredAt: true,
      createdAt: true,
    },
  });

  const visibleMemories = memories.filter((memory) => !isInterviewMemory(memory.title));

  const photoCount = visibleMemories.filter((memory) => memory.type === 'PHOTO').length;
  const textCount = visibleMemories.filter((memory) => memory.type === 'TEXT').length;
  const mediaCount = visibleMemories.filter(
    (memory) => memory.type === 'VIDEO' || memory.type === 'AUDIO',
  ).length;

  const grouped = visibleMemories.reduce<Record<string, typeof visibleMemories>>(
    (acc, memory) => {
      const date = memory.occurredAt ?? memory.createdAt;
      const year = String(date.getFullYear());

      if (!acc[year]) {
        acc[year] = [];
      }

      acc[year].push(memory);

      return acc;
    },
    {},
  );

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <main style={{ padding: 28 }}>
      <section
        style={{
          borderRadius: 34,
          padding: 38,
          background:
            'linear-gradient(135deg, #33271d 0%, #5b422c 52%, #8a6238 100%)',
          color: '#fff8ec',
          boxShadow: '0 22px 60px rgba(51, 39, 29, 0.18)',
        }}
      >
        <p
          style={{
            margin: '0 0 14px',
            color: '#f0c36a',
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          사진 모으기
        </p>

        <h1
          style={{
            margin: 0,
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 'clamp(36px, 5vw, 58px)',
            lineHeight: 1.18,
            letterSpacing: '-0.05em',
          }}
        >
          부모님의 사진과
          <br />
          가족의 시간을 모읍니다.
        </h1>

        <p
          style={{
            marginTop: 24,
            maxWidth: 780,
            fontSize: 21,
            lineHeight: 1.75,
            color: 'rgba(255, 248, 236, 0.86)',
          }}
        >
          오래된 앨범 사진, 부모님의 젊은 시절 사진, 가족사진을 올려주세요.
          사진 한 장이 부모님의 삶을 책으로 만드는 첫 번째 단서가 됩니다.
        </p>
      </section>

      <section
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
        }}
      >
        {[
          {
            label: '모은 사진',
            value: photoCount,
            text: '인생책의 장면이 되는 사진입니다.',
          },
          {
            label: '남긴 이야기',
            value: textCount,
            text: '사진에 얽힌 기억과 설명입니다.',
          },
          {
            label: '영상·음성',
            value: mediaCount,
            text: '함께 보관된 가족 기록입니다.',
          },
        ].map((card) => (
          <article
            key={card.label}
            style={{
              padding: 24,
              borderRadius: 26,
              background: '#fffaf1',
              border: '1px solid rgba(91, 66, 43, 0.12)',
              boxShadow: '0 12px 30px rgba(91, 66, 43, 0.08)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#9b6d2f',
                fontWeight: 900,
              }}
            >
              {card.label}
            </p>

            <strong
              style={{
                display: 'block',
                marginTop: 10,
                fontSize: 38,
                lineHeight: 1,
                color: '#33271d',
              }}
            >
              {card.value}
            </strong>

            <p
              style={{
                margin: '14px 0 0',
                color: '#6b5845',
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              {card.text}
            </p>
          </article>
        ))}
      </section>

      <section
        style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.95fr) minmax(320px, 1.05fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            padding: 30,
            borderRadius: 30,
            background: '#fffaf1',
            border: '1px solid rgba(91, 66, 43, 0.12)',
            boxShadow: '0 12px 30px rgba(91, 66, 43, 0.08)',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              color: '#9b6d2f',
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            사진 올리기
          </p>

          <h2
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 34,
              lineHeight: 1.35,
              letterSpacing: '-0.04em',
              color: '#33271d',
            }}
          >
            부모님의 사진 10장부터
            <br />
            시작해 보세요.
          </h2>

          <p
            style={{
              marginTop: 16,
              fontSize: 18,
              lineHeight: 1.75,
              color: '#6b5845',
            }}
          >
            사진이 선명하지 않아도 괜찮습니다. 오래된 사진일수록 그 안에는
            가족이 잊고 있던 이야기가 남아 있을 수 있습니다.
          </p>

          <div style={{ marginTop: 24 }}>
            <UploadForm />
          </div>
        </div>

        <aside
          style={{
            padding: 30,
            borderRadius: 30,
            background: '#f4ead8',
            border: '1px solid rgba(91, 66, 43, 0.12)',
            boxShadow: '0 12px 30px rgba(91, 66, 43, 0.08)',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              color: '#9b6d2f',
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            어떤 사진이 좋을까요?
          </p>

          <h2
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 30,
              lineHeight: 1.35,
              letterSpacing: '-0.04em',
              color: '#33271d',
            }}
          >
            특별한 사진보다,
            이야기가 있는 사진이 좋습니다.
          </h2>

          <div
            style={{
              marginTop: 22,
              display: 'grid',
              gap: 14,
            }}
          >
            {[
              '부모님의 젊은 시절 사진',
              '가족이 함께 찍은 사진',
              '일터, 가게, 집 앞에서 찍은 사진',
              '칠순·팔순·퇴직과 관련된 사진',
              '왜 찍었는지 궁금한 오래된 사진',
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: '#fffaf1',
                  color: '#4c3a2a',
                  fontSize: 17,
                  lineHeight: 1.6,
                  fontWeight: 800,
                }}
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section
        style={{
          marginTop: 28,
          padding: 30,
          borderRadius: 30,
          background: '#fffaf1',
          border: '1px solid rgba(91, 66, 43, 0.12)',
          boxShadow: '0 12px 30px rgba(91, 66, 43, 0.08)',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            color: '#9b6d2f',
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          모아둔 기록
        </p>

        <h2
          style={{
            margin: 0,
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 34,
            lineHeight: 1.35,
            letterSpacing: '-0.04em',
            color: '#33271d',
          }}
        >
          인생책의 재료가 될 사진과 기록
        </h2>

        {years.length > 0 ? (
          <div style={{ marginTop: 28, display: 'grid', gap: 32 }}>
            {years.map((year) => (
              <div key={year}>
                <h3
                  style={{
                    margin: '0 0 16px',
                    fontFamily: 'Noto Serif KR, serif',
                    fontSize: 28,
                    color: '#33271d',
                  }}
                >
                  {year}년
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                  }}
                >
                  {grouped[year].map((memory) => {
                    const date = memory.occurredAt ?? memory.createdAt;

                    return (
                      <article
                        key={memory.id}
                        style={{
                          overflow: 'hidden',
                          borderRadius: 24,
                          background: '#ffffff',
                          border: '1px solid rgba(91, 66, 43, 0.1)',
                          boxShadow: '0 10px 26px rgba(91, 66, 43, 0.06)',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            height: 180,
                            background:
                              'linear-gradient(135deg, rgba(91,66,43,0.14), rgba(240,195,106,0.28))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8a6b4d',
                            fontWeight: 900,
                          }}
                        >
                          {memory.type === 'PHOTO' && memory.fileUrl ? (
                   <Image
                          unoptimized
                          src={`/api/blob/${memory.id}`}
                          alt={memory.title || '가족 사진'}
                          fill
                          sizes="(max-width: 768px) 100vw, 520px"
                            style={{
                         objectFit: 'contain',
                         padding: 0,
                         transform: 'scale(1.2)',
                          }}
                           />
                          ) : (
                            <span>{getTypeLabel(memory.type)}</span>
                          )}
                        </div>

                        <div style={{ padding: 20 }}>
                          <p
                            style={{
                              margin: 0,
                              color: '#9b6d2f',
                              fontSize: 14,
                              fontWeight: 900,
                            }}
                          >
                            {getTypeLabel(memory.type)} · {date.toLocaleDateString('ko-KR')}
                          </p>

                          <h4
                            style={{
                              margin: '10px 0 0',
                              fontSize: 20,
                              lineHeight: 1.4,
                              color: '#33271d',
                              letterSpacing: '-0.03em',
                            }}
                          >
                            {memory.title || '제목 없는 기록'}
                          </h4>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              marginTop: 24,
              padding: 34,
              borderRadius: 24,
              background: '#ffffff',
              border: '1px dashed rgba(91, 66, 43, 0.28)',
              color: '#6b5845',
              fontSize: 18,
              lineHeight: 1.75,
            }}
          >
            아직 모아둔 사진이나 기록이 없습니다. 부모님의 사진 한 장부터 올려보세요.
            그 사진이 인생책의 첫 장면이 될 수 있습니다.
          </div>
        )}
      </section>
    </main>
  );
}