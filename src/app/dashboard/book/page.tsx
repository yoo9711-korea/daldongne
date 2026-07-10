// src/app/dashboard/book/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import CreateBookDraftButton from './CreateBookDraftButton';
import BookMaterialSelector, {
  type BookMaterialItem,
} from './BookMaterialSelector';

import PageGuideBox from '@/components/guide/PageGuideBox';


const OUTLINE = [
  {
    chapter: '1장',
    title: '어린 시절의 풍경',
    text: '태어난 곳, 자란 동네, 어린 시절 기억을 정리합니다.',
  },
  {
    chapter: '2장',
    title: '부모님의 젊은 날',
    text: '청년 시절, 꿈, 일터, 처음 마주한 세상의 이야기를 담습니다.',
  },
  {
    chapter: '3장',
    title: '가족이 시작된 시간',
    text: '결혼, 자녀, 가족이 함께 살아온 시간을 엮습니다.',
  },
  {
    chapter: '4장',
    title: '삶의 무게와 일터',
    text: '가족을 위해 견뎌온 시간과 삶의 책임을 기록합니다.',
  },
  {
    chapter: '5장',
    title: '가족이 기억하는 말들',
    text: '자주 하시던 말, 표정, 습관, 가족의 기억을 모읍니다.',
  },
  {
    chapter: '6장',
    title: '지금 전하고 싶은 마음',
    text: '지금 가족에게 남기고 싶은 마음을 마지막 장으로 정리합니다.',
  },
];

function getReadyText(photoCount: number, storyCount: number) {
  if (photoCount >= 10 && storyCount >= 6) {
    return {
      label: '원고 제작 준비 완료',
      title: '이제 인생책 원고를 만들기에 충분합니다.',
      text: '사진과 이야기가 충분히 모였습니다. 사진에 붙인 이야기와 자유 이야기를 함께 엮어 가족이 읽을 수 있는 첫 원고로 정리할 수 있습니다.',
    };
  }

  if (photoCount >= 3 && storyCount >= 3) {
    return {
      label: '원고 제작 준비 중',
      title: '책 원고의 흐름을 잡을 수 있습니다.',
      text: '사진과 이야기가 함께 모이기 시작했습니다. 이제 AI가 사진, 사진에 붙인 이야기, 자유 이야기를 바탕으로 첫 원고를 만들 수 있습니다.',
    };
  }

  return {
    label: '자료 수집 단계',
    title: '아직은 사진과 이야기를 조금 더 모으면 좋습니다.',
    text: '사진 3장 이상, 사진에 붙인 이야기 또는 자유 이야기 3개 이상이 모이면 인생책 원고의 첫 흐름을 잡기 좋아집니다.',
  };
}

export default async function BookPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [
  photoCount,
  photoStoryCount,
  freeStoryCount,
  memoryCount,
  bookCount,
  materialMemories,
] = await Promise.all([
  prisma.memory.count({
    where: {
      authorId: userId,
      type: 'PHOTO',
      fileUrl: {
        not: null,
      },
    } as any,
  }),

  prisma.memory.count({
    where: {
      authorId: userId,
      type: 'PHOTO',
      fileUrl: {
        not: null,
      },
      description: {
        not: null,
      },
    } as any,
  }),

  prisma.memory.count({
    where: {
      authorId: userId,
      type: 'TEXT',
      OR: [
        {
          title: {
            startsWith: '이야기:',
          },
        },
        {
          title: {
            startsWith: 'AI 인터뷰:',
          },
        },
      ],
    } as any,
  }),

  prisma.memory.count({
    where: {
      authorId: userId,
    },
  }),

  prisma.book.count({
    where: {
      authorId: userId,
    },
  }),

  prisma.memory.findMany({
    where: {
      authorId: userId,
      OR: [
        {
          type: 'PHOTO',
          fileUrl: {
            not: null,
          },
        },
        {
          type: 'TEXT',
          OR: [
            {
              title: {
                startsWith: '이야기:',
              },
            },
            {
              title: {
                startsWith: 'AI 인터뷰:',
              },
            },
          ],
        },
      ],
    } as any,
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      fileUrl: true,
    },
  }),
]);


 const storyCount = photoStoryCount + freeStoryCount;
const materials: BookMaterialItem[] = materialMemories.map((memory) => {
  const type = String(memory.type);
  const description = memory.description || '';

  return {
    id: memory.id,
    kind: type === 'PHOTO' ? 'photo' : 'story',
    title: cleanMaterialTitle(memory.title || ''),
    description,
    hasStory: type === 'PHOTO' && description.trim().length >= 10,
  };
});

const ready = getReadyText(photoCount, storyCount);
const photoProgress = Math.min(100, Math.round((photoCount / 10) * 100));
const storyProgress = Math.min(100, Math.round((storyCount / 6) * 100));
const isReady = photoCount >= 3 && storyCount >= 3;

  return (
    <main className="page" style={gridPaperPageStyle()}>
      <div className="runninghead">
        <span className="runninghead__chapter">BOOK DRAFT</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>책 원고 만들기</span>
      </div>
 
            <PageGuideBox
        label="처음이라면 여기부터 확인하세요"
        title="이 화면은 책에 넣을 자료를 고르는 곳입니다"
        description="사진과 이야기를 삭제하는 화면이 아니라, AI 원고에 반영할 자료를 선택하는 화면입니다. 원본 사진과 이야기는 사진·이야기 화면에서 수정하거나 삭제할 수 있습니다."
        steps={[
          '사진과 이야기를 먼저 남깁니다.',
          '책에 넣고 싶은 사진과 이야기를 선택합니다.',
          '책 종류, 문체, 원고 길이를 고릅니다.',
          'AI 책 원고 생성을 누릅니다.',
          '완성된 원고는 내 책장에서 확인합니다.',
          '마음에 들면 제작 상담을 신청합니다.',
        ]}
        note="삭제 버튼이 보이지 않는 것은 정상입니다. 이 화면에서는 원본 삭제보다 책에 넣을 자료를 선택하는 것이 목적입니다."
      />

      <section
        style={{
          padding: '52px 38px',
          borderRadius: 34,
          background:
            'linear-gradient(135deg, #33271d 0%, #5b422c 52%, #8a6238 100%)',
          color: '#fff8ec',
          marginBottom: 28,
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
          사진 + 이야기 → 인생책 원고
        </p>

        <h1
          style={{
            margin: 0,
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 'clamp(38px, 5vw, 62px)',
            lineHeight: 1.18,
            letterSpacing: '-0.05em',
          }}
        >
          흩어진 사진과 이야기를
          <br />
          한 권의 책 원고로 엮습니다.
        </h1>

        <p
          style={{
            marginTop: 24,
            maxWidth: 820,
            fontSize: 21,
            lineHeight: 1.8,
            color: 'rgba(255, 248, 236, 0.86)',
          }}
        >
          사진은 책의 장면이 되고, 남겨둔 이야기는 책의 문장이 됩니다.
          달동네는 두 기록을 하나로 엮어 가족이 오래 간직할 인생책 원고의
          흐름을 준비합니다.
        </p>

        <div
          style={{
            marginTop: 34,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/dashboard/timeline" className="btn btn--gold">
            사진 더 모으기
          </Link>

          <Link
  href="/dashboard/interview"
  className="btn"
  style={{
    background: '#fff7e8',
    color: '#24170f',
    border: '1px solid #f0c36a',
    fontWeight: 900,
  }}
>
  이야기 더 남기기
</Link>

          <Link href="#book-material-selector" className="btn btn--gold">
                  책에 넣을 자료 선택하기
          </Link>

          <Link
  href="/dashboard/library"
  className="btn"
  style={{
    background: '#fff7e8',
    color: '#24170f',
    border: '1px solid #f0c36a',
    fontWeight: 900,
  }}
>
  내 책장 보기
</Link>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <article className="dash-card">
          <p className="dash-card__label">모은 사진</p>

          <strong
            style={{
              display: 'block',
              fontSize: 46,
              color: 'var(--ink)',
              lineHeight: 1,
              marginTop: 10,
            }}
          >
            {photoCount}
          </strong>

          <p
            style={{
              marginTop: 14,
              color: 'var(--ink-soft)',
              fontSize: 16,
              lineHeight: 1.65,
            }}
          >
            책의 장면이 되는 사진입니다. 우선 10장을 목표로 모아보세요.
          </p>
        </article>

        <article className="dash-card">
          <p className="dash-card__label">남긴 이야기</p>

          <strong
            style={{
              display: 'block',
              fontSize: 46,
              color: 'var(--ink)',
              lineHeight: 1,
              marginTop: 10,
            }}
          >
            {storyCount}
          </strong>

          <p
            style={{
              marginTop: 14,
              color: 'var(--ink-soft)',
              fontSize: 16,
              lineHeight: 1.65,
            }}
          >
            사진에 붙인 이야기 {photoStoryCount}개, 자유 이야기 {freeStoryCount}개가 준비되어 있습니다. 이 이야기들이 책의 문장이 됩니다.
          </p>
        </article>

        <article className="dash-card">
          <p className="dash-card__label">전체 기록</p>

          <strong
            style={{
              display: 'block',
              fontSize: 46,
              color: 'var(--ink)',
              lineHeight: 1,
              marginTop: 10,
            }}
          >
            {memoryCount}
          </strong>

          <p
            style={{
              marginTop: 14,
              color: 'var(--ink-soft)',
              fontSize: 16,
              lineHeight: 1.65,
            }}
          >
            사진, 글, 이야기 등 인생책의 재료로 모인 전체 기록입니다.
          </p>
        </article>

        <article className="dash-card">
          <p className="dash-card__label">보관된 책</p>

          <strong
            style={{
              display: 'block',
              fontSize: 46,
              color: 'var(--ink)',
              lineHeight: 1,
              marginTop: 10,
            }}
          >
            {bookCount}
          </strong>

          <p
            style={{
              marginTop: 14,
              color: 'var(--ink-soft)',
              fontSize: 16,
              lineHeight: 1.65,
            }}
          >
            내 책장에 보관된 인생책 원고와 결과물입니다.
          </p>
        </article>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 0.82fr)',
          gap: 22,
          alignItems: 'stretch',
          marginBottom: 28,
        }}
      >
        <article
          className="dash-card"
          style={{
            background: isReady ? '#33271d' : 'var(--paper)',
            color: isReady ? '#fff8ec' : 'var(--ink)',
          }}
        >
          <p
            style={{
              margin: '0 0 14px',
              color: isReady ? '#f0c36a' : 'var(--gold)',
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            {ready.label}
          </p>

          <h2
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 38,
              lineHeight: 1.35,
              letterSpacing: '-0.04em',
            }}
          >
            {ready.title}
          </h2>

          <p
            style={{
              marginTop: 18,
              maxWidth: 760,
              fontSize: 18,
              lineHeight: 1.8,
              color: isReady ? 'rgba(255, 248, 236, 0.82)' : 'var(--ink-soft)',
            }}
          >
            {ready.text}
          </p>

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 28,
  }}
>
  <Link
    href="/dashboard/timeline"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 46,
      padding: '0 22px',
      borderRadius: 999,
      background: '#f3d28a',
      border: '1px solid #f3d28a',
      color: '#24170f',
      fontSize: 15,
      fontWeight: 900,
      textDecoration: 'none',
      boxShadow: '0 10px 22px rgba(0, 0, 0, 0.18)',
    }}
  >
    사진 보러가기
  </Link>

  <Link
    href="/dashboard/interview"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 46,
      padding: '0 22px',
      borderRadius: 999,
      background: '#fffaf0',
      border: '1px solid #fffaf0',
      color: '#5a3a18',
      fontSize: 15,
      fontWeight: 900,
      textDecoration: 'none',
      boxShadow: '0 10px 22px rgba(0, 0, 0, 0.18)',
    }}
  >
    이야기 보러가기
  </Link>

  <Link
    href="/dashboard/library"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 46,
      padding: '0 22px',
      borderRadius: 999,
      background: '#c18a23',
      border: '1px solid #c18a23',
      color: '#fffaf0',
      fontSize: 15,
      fontWeight: 900,
      textDecoration: 'none',
      boxShadow: '0 10px 22px rgba(0, 0, 0, 0.18)',
    }}
  >
    내 책장 보기
  </Link>
</div>
          </div>
        </article>

        <aside
          className="dash-card"
          style={{
            background: '#f4ead8',
          }}
        >
          <p className="dash-card__label">원고 준비율</p>

          <div style={{ marginTop: 22 }}>
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                  color: 'var(--ink)',
                  fontWeight: 900,
                }}
              >
                <span>사진 준비</span>
                <span>{photoProgress}%</span>
              </div>

              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: 'rgba(51,39,29,0.12)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${photoProgress}%`,
                    height: '100%',
                    background: 'var(--gold)',
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                  color: 'var(--ink)',
                  fontWeight: 900,
                }}
              >
                <span>이야기 준비</span>
                <span>{storyProgress}%</span>
              </div>

              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: 'rgba(51,39,29,0.12)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${storyProgress}%`,
                    height: '100%',
                    background: 'var(--gold)',
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          </div>

          <p
            style={{
              marginTop: 24,
              color: 'var(--ink-soft)',
              fontSize: 16,
              lineHeight: 1.7,
            }}
          >
            기준은 사진 10장, 이야기 6개입니다. 이야기에는 사진에 붙인 이야기와 자유 이야기가 함께 포함됩니다.
          </p>
        </aside>
      </section>

       <div id="book-material-selector">
  <BookMaterialSelector materials={materials} />
</div>

      <section className="dash-card" style={{ marginBottom: 28 }}>
        <p className="dash-card__label">인생책 목차 초안</p>

        <h2
          style={{
            margin: '0 0 22px',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 38,
            lineHeight: 1.35,
            color: 'var(--ink)',
            letterSpacing: '-0.04em',
          }}
        >
          부모님의 삶은
          <br />
          이런 흐름으로 책이 됩니다.
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
          }}
        >
          {OUTLINE.map((item) => (
            <article
              key={item.chapter}
              style={{
                padding: 22,
                borderRadius: 22,
                background: 'var(--paper)',
                border: '1px solid rgba(34, 28, 22, 0.1)',
              }}
            >
              <p
                style={{
                  margin: '0 0 10px',
                  color: 'var(--gold)',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                }}
              >
                {item.chapter}
              </p>

              <h3
                style={{
                  margin: 0,
                  fontFamily: 'Noto Serif KR, serif',
                  fontSize: 24,
                  lineHeight: 1.35,
                  color: 'var(--ink)',
                  letterSpacing: '-0.03em',
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  margin: '12px 0 0',
                  color: 'var(--ink-soft)',
                  fontSize: 16,
                  lineHeight: 1.7,
                }}
              >
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="dash-card"
        style={{
          background: '#fffaf1',
          border: '1px solid rgba(91, 66, 43, 0.14)',
        }}
      >
        <p className="dash-card__label">책 원고 미리보기</p>

        <div
          style={{
            marginTop: 18,
            padding: 30,
            borderRadius: 28,
            background:
              'linear-gradient(180deg, #fff8ec 0%, #efe0c4 100%)',
            border: '1px solid rgba(91, 66, 43, 0.14)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.42)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 36,
              lineHeight: 1.35,
              color: 'var(--ink)',
              letterSpacing: '-0.04em',
            }}
          >
            어머니의 봄날 이야기
          </h2>

          <p
            style={{
              marginTop: 18,
              maxWidth: 760,
              fontSize: 18,
              lineHeight: 1.9,
              color: 'var(--ink-soft)',
            }}
          >
            오래된 사진 한 장에는 그 시절의 공기와 표정이 남아 있습니다.
            달동네는 그 사진에 남겨진 기억을 따라가며, 가족이 미처 묻지
            못했던 삶의 이야기를 한 권의 글로 정리합니다.
          </p>

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Link href="/dashboard/library" className="btn btn--ghost">
              내 책장 보기
            </Link>

            <Link href="/dashboard/interview" className="btn btn--ghost">
              이야기 더 남기기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function gridPaperPageStyle() {
  return {
    minHeight: '100vh',
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

function cleanMaterialTitle(title: string) {
  return title
    .replace(/^이야기:\s*/, '')
    .replace(/^AI 인터뷰:\s*/, '')
    .trim();
}