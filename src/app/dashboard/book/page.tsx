import { auth } from '@/auth';
import PageGuideBox from '@/components/guide/PageGuideBox';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';
import BookMaterialSelector, {
  type BookMaterialItem,
} from './BookMaterialSelector';

const REQUIRED_PHOTO_COUNT = 3;
const RECOMMENDED_STORY_COUNT = 3;

const OUTLINE = [
  {
    chapter: '1장',
    title: '이야기의 시작과 배경',
    text: '태어난 곳, 성장한 환경과 이야기의 출발점을 정리합니다.',
  },
  {
    chapter: '2장',
    title: '사람과 관계',
    text: '삶에 영향을 준 가족과 주변 사람들의 이야기를 담습니다.',
  },
  {
    chapter: '3장',
    title: '변화의 순간',
    text: '삶의 방향을 바꾸었던 사건과 중요한 선택을 기록합니다.',
  },
  {
    chapter: '4장',
    title: '일과 삶의 시간',
    text: '일터와 생활 속에서 겪었던 노력과 책임을 돌아봅니다.',
  },
  {
    chapter: '5장',
    title: '기억에 남은 말과 장면',
    text: '오랫동안 기억하고 싶은 말, 장소와 순간을 모읍니다.',
  },
  {
    chapter: '6장',
    title: '지금 전하고 싶은 마음',
    text: '현재의 생각과 다음 세대에게 남기고 싶은 마음을 담습니다.',
  },
];

export default async function BookPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [
    memoryCount,
    bookCount,
    materialMemories,
  ] = await Promise.all([
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
            description: {
              not: null,
            },
          },
        ],
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
        type: true,
        title: true,
        description: true,
        fileUrl: true,
      },
    }),
  ]);

    const usableMemories =
    materialMemories.filter((memory) => {
      const title =
        memory.title?.trim() || '';

      if (
        memory.type === 'TEXT' &&
        isLegacyAiInterviewTitle(title)
      ) {
        return false;
      }

      if (memory.type === 'PHOTO') {
        return Boolean(memory.fileUrl);
      }

            if (memory.type === 'TEXT') {
        return (
          memory.description?.trim().length ??
          0
        ) >= 10;
      }

      return false;
    });

  const photoCount =
    usableMemories.filter(
      (memory) =>
        memory.type === 'PHOTO',
    ).length;

  const photoStoryCount =
    usableMemories.filter(
      (memory) =>
        memory.type === 'PHOTO' &&
        (memory.description?.trim().length ??
          0) >= 10,
    ).length;

  const writtenStoryCount =
    usableMemories.filter(
      (memory) =>
        memory.type === 'TEXT' &&
        Boolean(
          memory.description?.trim(),
        ),
    ).length;

  const storyCount =
    photoStoryCount +
    writtenStoryCount;

  const materials: BookMaterialItem[] =
    usableMemories.map((memory) => {
      const isPhoto =
        memory.type === 'PHOTO';

      const description =
        memory.description || '';

      return {
        id: memory.id,
        kind: isPhoto
          ? 'photo'
          : 'story',
        title: cleanMaterialTitle(
          memory.title || '',
        ),
        description,
                hasStory:
          description.trim().length >= 10,
      };
    });

  const canCreateDraft =
    photoCount >= REQUIRED_PHOTO_COUNT;

  const recommendedReady =
    canCreateDraft &&
    storyCount >=
      RECOMMENDED_STORY_COUNT;

  const missingPhotoCount = Math.max(
    REQUIRED_PHOTO_COUNT - photoCount,
    0,
  );

  const missingStoryCount = Math.max(
    RECOMMENDED_STORY_COUNT -
      storyCount,
    0,
  );

  const photoProgress = Math.min(
    100,
    Math.round(
      (photoCount /
        REQUIRED_PHOTO_COUNT) *
        100,
    ),
  );

  const storyProgress = Math.min(
    100,
    Math.round(
      (storyCount /
        RECOMMENDED_STORY_COUNT) *
        100,
    ),
  );

  const readiness =
    getReadiness({
      canCreateDraft,
      recommendedReady,
      missingPhotoCount,
      missingStoryCount,
    });

  return (
    <main
      className="book-page-main"
      style={gridPaperPageStyle()}
    >
      <style>{`
        .book-page-container {
          width: 100%;
          max-width: 1380px;
          margin: 0 auto;
          padding: 28px;
        }

        .book-readiness-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(280px, 0.72fr);
          gap: 22px;
          align-items: stretch;
        }

        .book-outline-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(245px, 1fr));
          gap: 14px;
        }

        @media (max-width: 900px) {
          .book-readiness-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .book-page-container {
            padding: 16px;
          }

          .book-hero {
            padding: 26px 20px !important;
            border-radius: 24px !important;
          }

          .book-hero-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .book-hero-actions a {
            width: 100%;
          }

          .book-page-section {
            padding: 20px 16px !important;
            border-radius: 24px !important;
          }

          .book-outline-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="book-page-container">
        <section
          className="book-hero"
          style={{
            padding: 38,
            borderRadius: 34,
            background:
              'linear-gradient(135deg, #33271d 0%, #5b422c 52%, #8a6238 100%)',
            color: '#fff8ec',
            boxShadow:
              '0 22px 60px rgba(51, 39, 29, 0.18)',
          }}
        >
          <p
            style={{
              margin: '0 0 13px',
              color: '#f0c36a',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            책 만들기 3단계
          </p>

          <h1
            style={{
              margin: 0,
              maxWidth: 930,
              fontFamily:
                'Noto Serif KR, serif',
              fontSize:
                'clamp(34px, 5vw, 56px)',
              lineHeight: 1.2,
              letterSpacing: '-0.05em',
            }}
          >
            모아 둔 사진과 이야기를
            <br />
            한 권의 책 원고로 만듭니다.
          </h1>

          <p
            style={{
              margin: '22px 0 0',
              maxWidth: 830,
              fontSize: 18,
              lineHeight: 1.8,
              color:
                'rgba(255, 248, 236, 0.86)',
            }}
          >
            책에 넣을 자료를 고르고 책의
            종류, 문체와 원고 길이를
            선택하세요. 선택한 사진과
            이야기만 사용해 원고를 만들고
            완성된 결과는 내 책장에
            저장합니다.
          </p>

          <div
            style={{
              marginTop: 26,
              padding: '18px 20px',
              borderRadius: 20,
              border:
                '1px solid rgba(255,255,255,0.2)',
              background:
                'rgba(255,255,255,0.08)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#f0c36a',
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              현재 원고 준비 상태
            </p>

            <strong
              style={{
                display: 'block',
                marginTop: 7,
                fontSize: 21,
                lineHeight: 1.45,
              }}
            >
              {readiness.title}
            </strong>

            <p
              style={{
                margin: '6px 0 0',
                color:
                  'rgba(255, 248, 236, 0.75)',
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {readiness.description}
            </p>
          </div>

          <div
  className="book-hero-actions"
  style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  }}
>
  <a
    href="#book-material-selector"
    style={heroPrimaryButtonStyle()}
  >
    자료 선택
  </a>

  <a
    href="#book-material-selector"
    style={heroSecondaryButtonStyle()}
  >
    책 만들기
  </a>

  <Link
    href="/dashboard/library"
    style={heroSecondaryButtonStyle()}
  >
    내 책장
  </Link>
</div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 14,
            marginTop: 24,
          }}
        >
          <SummaryCard
            label="사용 가능한 사진"
            value={photoCount}
            unit="장"
            description="원고 자료로 선택할 수 있는 사진"
            color="#7b4f2a"
          />

          <SummaryCard
            label="사진 속 이야기"
            value={photoStoryCount}
            unit="개"
            description="설명이 충분히 작성된 사진"
            color="#9b6d2f"
          />

          <SummaryCard
            label="직접 남긴 이야기"
            value={writtenStoryCount}
            unit="개"
            description="질문과 기록으로 남긴 이야기"
            color="#62438a"
          />

          <SummaryCard
            label="전체 이야기 자료"
            value={storyCount}
            unit="개"
            description="책의 문장으로 활용할 이야기"
            color="#3e5f3a"
          />

          <SummaryCard
            label="전체 기록"
            value={memoryCount}
            unit="개"
            description="계정에 저장된 모든 기록"
            color="#2e3f52"
          />

          <SummaryCard
            label="만든 책"
            value={bookCount}
            unit="권"
            description="내 책장에 저장된 책 원고"
            color="#245d8c"
          />
        </section>

        <section
          className="book-readiness-grid"
          style={{
            marginTop: 24,
          }}
        >
          <article
            className="book-page-section"
            style={{
              padding: 28,
              borderRadius: 30,
              border: recommendedReady
                ? '1px solid #9dcca4'
                : canCreateDraft
                  ? '1px solid #e3bd7a'
                  : '1px solid #d09a8a',
              background: recommendedReady
                ? '#edf8ee'
                : canCreateDraft
                  ? '#fff4df'
                  : '#fff3ef',
              boxShadow:
                '0 12px 30px rgba(91, 66, 43, 0.07)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: recommendedReady
                  ? '#2f6b38'
                  : canCreateDraft
                    ? '#83540d'
                    : '#9a3f2e',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.06em',
              }}
            >
              {readiness.label}
            </p>

            <h2
              style={{
                margin: '9px 0 0',
                fontFamily:
                  'Noto Serif KR, serif',
                fontSize: 31,
                lineHeight: 1.4,
                letterSpacing: '-0.04em',
                color: '#33271d',
              }}
            >
              {readiness.title}
            </h2>

            <p
              style={{
                margin: '13px 0 0',
                maxWidth: 760,
                color: '#6b5845',
                fontSize: 15,
                lineHeight: 1.75,
              }}
            >
              {readiness.description}
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 9,
                marginTop: 20,
              }}
            >
              {!canCreateDraft ? (
                <Link
                  href="/dashboard/timeline"
                  style={darkButtonStyle()}
                >
                  사진 {missingPhotoCount}장 더 모으기
                </Link>
              ) : null}

              {canCreateDraft &&
              !recommendedReady ? (
                <Link
                  href="/dashboard/interview"
                  style={darkButtonStyle()}
                >
                  이야기 {missingStoryCount}개 더 남기기
                </Link>
              ) : null}

              {canCreateDraft ? (
                <a
                  href="#book-material-selector"
                  style={goldButtonStyle()}
                >
                  자료 선택 시작
                </a>
              ) : null}

              <Link
                href="/dashboard/library"
                style={outlineButtonStyle()}
              >
                내 책장 보기
              </Link>
            </div>
          </article>

          <aside
            className="book-page-section"
            style={{
              padding: 28,
              borderRadius: 30,
              background: '#f4ead8',
              border:
                '1px solid rgba(91, 66, 43, 0.12)',
              boxShadow:
                '0 12px 30px rgba(91, 66, 43, 0.07)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#9b6d2f',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.06em',
              }}
            >
              원고 준비율
            </p>

            <ProgressBar
              label="사진 준비"
              value={photoProgress}
              current={`${photoCount}장`}
              target="기본 3장"
            />

            <ProgressBar
              label="이야기 준비"
              value={storyProgress}
              current={`${storyCount}개`}
              target="권장 3개"
            />

            <p
              style={{
                margin: '20px 0 0',
                color: '#6b5845',
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              사진 3장이 있으면 원고를
              만들 수 있습니다. 이야기 자료
              3개 이상을 함께 선택하면 더
              구체적이고 풍부한 원고를 만들 수
              있습니다.
            </p>
          </aside>
        </section>

        <div
          style={{
            marginTop: 24,
          }}
        >
          <PageGuideBox
            label="책 원고 만들기 안내"
            title="자료를 고른 뒤 책의 방향을 선택하세요"
            description="이 화면에서는 원본 사진과 이야기를 삭제하지 않습니다. 책 원고에 사용할 자료만 선택하고 책 종류, 문체와 원고 길이를 정하는 단계입니다."
            steps={[
              '책에 넣을 사진과 이야기를 확인합니다.',
              '필요한 자료만 선택하고 불필요한 자료는 선택 해제합니다.',
              '인생책, 가족 이야기책, 부부·아이·여행책 등 원하는 책 종류를 선택합니다.',
              '따뜻한 문체, 담백한 문체, 편지체 또는 자서전 문체를 선택합니다.',
              '짧은 소책자, 보통 분량 또는 긴 원고를 선택합니다.',
              '원고 만들기 버튼을 누르면 완성된 원고가 내 책장에 저장됩니다.',
            ]}
            note="원본 자료를 수정하거나 삭제하려면 사진 모으기 또는 이야기 남기기 화면으로 이동하세요."
          />
        </div>

        <div
          id="book-material-selector"
          style={{
            marginTop: 24,
            scrollMarginTop: 24,
          }}
        >
          <BookMaterialSelector
            materials={materials}
          />
        </div>

        <section
          className="book-page-section"
          style={{
            marginTop: 24,
            padding: 28,
            borderRadius: 30,
            background: '#fffaf1',
            border:
              '1px solid rgba(91, 66, 43, 0.12)',
            boxShadow:
              '0 12px 30px rgba(91, 66, 43, 0.07)',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#9b6d2f',
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            책의 기본 구성
          </p>

          <h2
            style={{
              margin: '9px 0 0',
              fontFamily:
                'Noto Serif KR, serif',
              fontSize: 31,
              lineHeight: 1.4,
              letterSpacing: '-0.04em',
              color: '#33271d',
            }}
          >
            선택한 자료에 따라 목차와
            내용은 달라집니다.
          </h2>

          <p
            style={{
              margin: '10px 0 0',
              maxWidth: 800,
              color: '#6b5845',
              fontSize: 14,
              lineHeight: 1.75,
            }}
          >
            아래 구성은 원고의 기본 흐름입니다.
            실제 목차와 장 제목은 선택한 사진,
            이야기와 책 종류를 바탕으로
            자동으로 조정됩니다.
          </p>

          <div
            className="book-outline-grid"
            style={{
              marginTop: 21,
            }}
          >
            {OUTLINE.map((item) => (
              <article
                key={item.chapter}
                style={{
                  padding: 20,
                  borderRadius: 20,
                  background: '#ffffff',
                  border:
                    '1px solid rgba(91, 66, 43, 0.1)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: '#9b6d2f',
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: '0.07em',
                  }}
                >
                  {item.chapter}
                </p>

                <h3
                  style={{
                    margin: '8px 0 0',
                    color: '#33271d',
                    fontSize: 20,
                    lineHeight: 1.45,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    margin: '9px 0 0',
                    color: '#6b5845',
                    fontSize: 13,
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
          style={{
            marginTop: 24,
            padding: '22px 24px',
            borderRadius: 24,
            border:
              '1px solid rgba(91, 66, 43, 0.14)',
            background: '#f4ead8',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: '#9b6d2f',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                원고를 만든 후
              </p>

              <strong
                style={{
                  display: 'block',
                  marginTop: 6,
                  color: '#33271d',
                  fontSize: 19,
                  lineHeight: 1.5,
                }}
              >
                완성된 원고는 내 책장에서
                확인하고 다시 정리할 수 있습니다.
              </strong>
            </div>

            <Link
              href="/dashboard/library"
              style={darkButtonStyle()}
            >
              내 책장 보기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  description,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  description: string;
  color: string;
}) {
  return (
    <article
      style={{
        padding: 21,
        borderRadius: 23,
        background: '#fffaf1',
        border:
          '1px solid rgba(91, 66, 43, 0.12)',
        boxShadow:
          '0 10px 25px rgba(91, 66, 43, 0.07)',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#9b6d2f',
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {label}
      </p>

      <strong
        style={{
          display: 'block',
          marginTop: 8,
          color,
          fontSize: 33,
          lineHeight: 1.1,
        }}
      >
        {value.toLocaleString()}

        <span
          style={{
            marginLeft: 4,
            color: '#6b5845',
            fontSize: 13,
          }}
        >
          {unit}
        </span>
      </strong>

      <p
        style={{
          margin: '11px 0 0',
          color: '#6b5845',
          fontSize: 12,
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
    </article>
  );
}

function ProgressBar({
  label,
  value,
  current,
  target,
}: {
  label: string;
  value: number;
  current: string;
  target: string;
}) {
  return (
    <div
      style={{
        marginTop: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <strong
          style={{
            color: '#33271d',
            fontSize: 13,
          }}
        >
          {label}
        </strong>

        <span
          style={{
            color: '#6b5845',
            fontSize: 11,
          }}
        >
          {current} · {target}
        </span>
      </div>

      <div
        style={{
          height: 10,
          overflow: 'hidden',
          borderRadius: 999,
          background:
            'rgba(51, 39, 29, 0.12)',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            borderRadius: 999,
            background: '#c18a23',
          }}
        />
      </div>

      <p
        style={{
          margin: '6px 0 0',
          color: '#8b7a67',
          fontSize: 10,
          textAlign: 'right',
        }}
      >
        {value}%
      </p>
    </div>
  );
}

function getReadiness({
  canCreateDraft,
  recommendedReady,
  missingPhotoCount,
  missingStoryCount,
}: {
  canCreateDraft: boolean;
  recommendedReady: boolean;
  missingPhotoCount: number;
  missingStoryCount: number;
}) {
  if (recommendedReady) {
    return {
      label: '권장 자료 준비 완료',
      title:
        '사진과 이야기가 충분히 준비되었습니다.',
      description:
        '책에 넣을 자료를 선택하고 책 종류, 문체와 원고 길이를 정해 원고를 만들어보세요.',
    };
  }

  if (canCreateDraft) {
    return {
      label: '기본 원고 만들기 가능',
      title:
        '지금도 책 원고를 만들 수 있습니다.',
      description: `사진은 준비되었습니다. 이야기를 ${missingStoryCount}개 더 남기면 더 구체적이고 풍부한 원고를 만들 수 있습니다.`,
    };
  }

  return {
    label: '사진 자료 준비 필요',
    title: `사진을 ${missingPhotoCount}장 더 모아주세요.`,
    description:
      '책 원고를 만들려면 선택 가능한 사진이 최소 3장 필요합니다. 사진 모으기 화면에서 사진을 추가해주세요.',
  };
}

function isLegacyAiInterviewTitle(
  title: string,
) {
  return (
    title.startsWith('AI 인터뷰') ||
    title.includes('AI 인터뷰 -')
  );
}

function cleanMaterialTitle(
  title: string,
) {
  return title
    .replace(
      /^이야기\s*[·:\-]?\s*/i,
      '',
    )
    .replace(
      /^AI\s*인터뷰\s*[·:\-]?\s*/i,
      '',
    )
    .replace(
      /^AI\s*Interview\s*[·:\-]?\s*/i,
      '',
    )
    .trim();
}

function heroPrimaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 21px',
    borderRadius: 999,
    background: '#f0c36a',
    color: '#2b2118',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

function heroSecondaryButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 21px',
    borderRadius: 999,
    border:
      '1px solid rgba(255,255,255,0.42)',
    background: 'transparent',
    color: '#fff8ec',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

function darkButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 15px',
    borderRadius: 999,
    border: '1px solid #33271d',
    background: '#33271d',
    color: '#fff8ec',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function goldButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 15px',
    borderRadius: 999,
    border: '1px solid #c18a23',
    background: '#c18a23',
    color: '#fffaf0',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function outlineButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 15px',
    borderRadius: 999,
    border:
      '1px solid rgba(51, 39, 29, 0.28)',
    background:
      'rgba(255,255,255,0.38)',
    color: '#5a3a18',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

function gridPaperPageStyle(): CSSProperties {
  return {
    minHeight: '100vh',
    backgroundColor: '#f7eddc',
    backgroundImage: `
      linear-gradient(
        rgba(154, 106, 36, 0.08) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(154, 106, 36, 0.08) 1px,
        transparent 1px
      ),
      linear-gradient(
        rgba(154, 106, 36, 0.14) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(154, 106, 36, 0.14) 1px,
        transparent 1px
      )
    `,
    backgroundSize:
      '24px 24px, 24px 24px, 120px 120px, 120px 120px',
    backgroundPosition: '0 0',
  };
}