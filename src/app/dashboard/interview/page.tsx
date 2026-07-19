import { auth } from '@/auth';
import PageGuideBox from '@/components/guide/PageGuideBox';
import StoryPhotoUploadBox from '@/components/interview/StoryPhotoUploadBox';
import DeleteMemoryButton from '@/components/memory/DeleteMemoryButton';
import EditMemoryButton from '@/components/memory/EditMemoryButton';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';
import InterviewClient from './InterviewClient';

const REQUIRED_STORY_COUNT = 3;

export default async function InterviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [answers, storyPhotos, photoCount, bookCount] =
    await Promise.all([
      prisma.memory.findMany({
        where: {
          authorId: userId,
          type: 'TEXT',
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
        },
      }),

      prisma.memory.findMany({
        where: {
          authorId: userId,
          type: 'PHOTO',
          fileUrl: {
            not: null,
          },
        },
        orderBy: [
          {
            occurredAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        take: 24,
        select: {
          id: true,
          title: true,
          description: true,
          fileUrl: true,
          occurredAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.memory.count({
        where: {
          authorId: userId,
          type: 'PHOTO',
        },
      }),

      prisma.book.count({
        where: {
          authorId: userId,
        },
      }),
    ]);

  const writtenStoryCount = answers.filter((answer) =>
    Boolean(answer.description?.trim()),
  ).length;

  const photoStoryCount = storyPhotos.filter((photo) =>
    Boolean(photo.description?.trim()),
  ).length;

  const totalStoryCount =
    writtenStoryCount + photoStoryCount;

  const remainingStoryCount = Math.max(
    REQUIRED_STORY_COUNT - totalStoryCount,
    0,
  );

  const storyReady =
    totalStoryCount >= REQUIRED_STORY_COUNT;

  async function submitAnswer(formData: FormData) {
    'use server';

    const currentSession = await auth();

    if (!currentSession?.user?.id) {
      redirect('/login');
    }

    const answer = String(
      formData.get('answer') || '',
    ).trim();

    const question = String(
      formData.get('question') || '',
    ).trim();

    if (!answer) {
      return;
    }

    const title =
      question || '우리 가족의 기억';

    await prisma.memory.create({
      data: {
        type: 'TEXT',
        title: `이야기 · ${title.slice(0, 40)}`,
        description: answer,
        authorId: currentSession.user.id,
        occurredAt: new Date(),
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/interview');
    revalidatePath('/dashboard/book');
    revalidatePath('/dashboard/library');
  }

  return (
    <main
      className="story-page-main"
      style={gridPaperPageStyle()}
    >
      <style>{`
                .story-page-main {
          min-height: 100vh;
          color: #4a352b;
          background-color: #fffdf9 !important;
          background-image:
            linear-gradient(
              rgba(220, 167, 136, 0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(220, 167, 136, 0.035) 1px,
              transparent 1px
            ) !important;
          background-size: 32px 32px !important;
        }

        .story-hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 90% 5%,
              rgba(255, 211, 191, 0.58),
              transparent 25rem
            ),
            radial-gradient(
              circle at 5% 100%,
              rgba(255, 241, 203, 0.52),
              transparent 22rem
            ),
            linear-gradient(
              135deg,
              #fff8f3 0%,
              #ffffff 52%,
              #fff1e8 100%
            ) !important;
          color: #49352b !important;
          border:
            1px solid rgba(218, 143, 108, 0.22) !important;
          box-shadow:
            0 18px 48px
            rgba(156, 91, 58, 0.08) !important;
        }

        .story-hero h1,
        .story-hero strong {
          color: #49352b !important;
        }

        .story-hero > p:first-of-type {
          color: #dd765b !important;
        }

        .story-hero > p:not(:first-of-type) {
          color: #725d52 !important;
        }

        .story-hero
        > div:not(.story-hero-actions) {
          border:
            1px solid rgba(218, 143, 108, 0.2) !important;
          background:
            rgba(255, 255, 255, 0.78) !important;
          box-shadow:
            0 10px 26px
            rgba(147, 87, 55, 0.045);
        }

        .story-hero
        > div:not(.story-hero-actions)
        p {
          color: #80685c !important;
        }

        .story-hero
        > div:not(.story-hero-actions)
        p:first-child {
          color: #d56f55 !important;
        }

        .story-hero-actions a {
          border:
            1px solid rgba(210, 126, 90, 0.3) !important;
          background: #ffffff !important;
          color: #a65f48 !important;
          box-shadow:
            0 9px 22px
            rgba(181, 104, 71, 0.08);
        }

        .story-hero-actions a:first-child {
          border-color: transparent !important;
          background:
            linear-gradient(
              135deg,
              #f49378,
              #e97861
            ) !important;
          color: #ffffff !important;
          box-shadow:
            0 11px 25px
            rgba(220, 104, 77, 0.2);
        }

        .story-section {
          background: #ffffff !important;
          border:
            1px solid rgba(196, 139, 108, 0.18) !important;
          box-shadow:
            0 14px 34px
            rgba(132, 79, 48, 0.055) !important;
        }

        .story-section > div > p:first-child,
        .story-section > p:first-child {
          color: #d67358 !important;
        }

        .story-section h2,
        .story-section h3 {
          color: #49352b !important;
        }

        .story-section input,
        .story-section textarea,
        .story-section select {
          border:
            1px solid rgba(192, 139, 108, 0.28) !important;
          background: #fffdfb !important;
          color: #49352b !important;
          box-shadow: none !important;
        }

        .story-section input:focus,
        .story-section textarea:focus,
        .story-section select:focus {
          border-color: #e68a6f !important;
          outline:
            3px solid rgba(230, 138, 111, 0.12) !important;
        }

        .story-section button {
          border-color: transparent !important;
          background:
            linear-gradient(
              135deg,
              #f49378,
              #e97861
            ) !important;
          color: #ffffff !important;
          box-shadow:
            0 10px 24px
            rgba(220, 104, 77, 0.18) !important;
        }

        .story-section article {
          background: #ffffff !important;
          border-color:
            rgba(191, 137, 106, 0.19) !important;
          box-shadow:
            0 12px 28px
            rgba(127, 76, 47, 0.05) !important;
        }

        .story-photo-image {
          background: #fff4ed !important;
        }

        .story-photo-grid article h3 {
          color: #49352b !important;
        }

        .story-photo-grid article p {
          color: #725d52;
        }

        .story-page-main
        section:not(.story-hero)
        > div
        > span {
          background: #fff1ea !important;
          color: #a85f48 !important;
        }
        .story-page-container {
          width: 100%;
          max-width: 1380px;
          margin: 0 auto;
          padding: 28px;
        }

        .story-photo-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(245px, 1fr));
          gap: 16px;
        }

        .story-photo-actions {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 8px;
        }

        @media (max-width: 700px) {
          .story-page-container {
            padding: 16px;
          }

          .story-hero {
            padding: 26px 20px !important;
            border-radius: 24px !important;
          }

          .story-hero-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .story-hero-actions a {
            width: 100%;
          }

          .story-section {
            padding: 20px 16px !important;
            border-radius: 24px !important;
          }

          .story-photo-grid {
            grid-template-columns: 1fr;
          }

          .story-photo-image {
            height: 230px !important;
          }
        }
      `}</style>

      <div className="story-page-container">
        <section
          className="story-hero"
          style={{
            borderRadius: 34,
            padding: 38,
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
            책 만들기 2단계
          </p>

          <h1
            style={{
              margin: 0,
              maxWidth: 900,
              fontFamily: 'Noto Serif KR, serif',
              fontSize:
                'clamp(34px, 5vw, 56px)',
              lineHeight: 1.2,
              letterSpacing: '-0.05em',
            }}
          >
            사진 속 기억과
           <br />
           소중한 삶의 이야기를 남깁니다.
          </h1>

          <p
            style={{
              margin: '22px 0 0',
              maxWidth: 820,
              fontSize: 18,
              lineHeight: 1.8,
              color:
                'rgba(255, 248, 236, 0.86)',
            }}
          >
            좋은 글을 쓰려고 애쓰지 않아도
            괜찮습니다. 사진을 보며 떠오르는
            사람, 장소, 사건과 그때의 감정을
            편하게 남겨주세요. 짧은 기억도
            책의 중요한 문장이 됩니다.
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
              현재 준비 상태
            </p>

            <strong
              style={{
                display: 'block',
                marginTop: 7,
                fontSize: 21,
                lineHeight: 1.45,
              }}
            >
              {storyReady
                ? `이야기 자료 ${totalStoryCount}개가 준비되었습니다.`
                : `이야기를 ${remainingStoryCount}개 더 남겨보세요.`}
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
              사진 설명과 직접 작성한 이야기를
              합쳐 3개 이상이면 책 원고 만들기를
              시작할 수 있습니다.
            </p>
          </div>

          <div
            className="story-hero-actions"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 22,
            }}
          >
            <a
              href="#story-writing"
              style={heroPrimaryButtonStyle()}
            >
              이야기 작성하기
            </a>

            <a
              href="#photo-story"
              style={heroSecondaryButtonStyle()}
            >
              사진 이야기 확인
            </a>

            <Link
              href="/dashboard/timeline"
              style={heroSecondaryButtonStyle()}
            >
              사진 모으기로 돌아가기
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
            label="모은 사진"
            value={photoCount}
            unit="장"
            description="이야기를 연결할 수 있는 사진"
            color="#7b4f2a"
          />

          <SummaryCard
            label="사진 속 이야기"
            value={photoStoryCount}
            unit="개"
            description="사진 설명으로 남긴 기억"
            color="#9b6d2f"
          />

          <SummaryCard
            label="직접 남긴 이야기"
            value={writtenStoryCount}
            unit="개"
            description="질문에 답하며 작성한 이야기"
            color="#62438a"
          />

          <SummaryCard
            label="전체 이야기 자료"
            value={totalStoryCount}
            unit="개"
            description="책 원고에 사용할 수 있는 자료"
            color="#3e5f3a"
          />

          <SummaryCard
            label="만든 책"
            value={bookCount}
            unit="권"
            description="내 책장에 저장된 책 원고"
            color="#2e3f52"
          />
        </section>

        <section
          style={{
            marginTop: 24,
            padding: '20px 22px',
            borderRadius: 22,
            border: storyReady
              ? '1px solid #9dcca4'
              : '1px solid #e3bd7a',
            background: storyReady
              ? '#edf8ee'
              : '#fff4df',
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
                  color: storyReady
                    ? '#2f6b38'
                    : '#83540d',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                다음 단계 안내
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
                {storyReady
                  ? '사진과 이야기가 준비되었습니다. 책 원고를 만들어보세요.'
                  : '사진 속 기억이나 삶의 이야기를 조금 더 남겨주세요.'}
              </strong>
            </div>

            {storyReady ? (
              <Link
                href="/dashboard/book"
                style={nextStepButtonStyle()}
              >
                책 원고 만들기
              </Link>
            ) : (
              <a
                href="#story-writing"
                style={nextStepButtonStyle()}
              >
                이야기 더 남기기
              </a>
            )}
          </div>
        </section>

        <div
          style={{
            marginTop: 24,
          }}
        >
          <PageGuideBox
            label="이야기 남기기 안내"
            title="사진을 보고 떠오르는 기억부터 편하게 남겨주세요"
            description="완성된 문장이나 긴 글이 아니어도 괜찮습니다. 날짜, 장소, 사람, 사건과 그때의 감정을 짧게 적으면 책 원고의 중요한 재료가 됩니다."
            steps={[
              '먼저 이야기를 남기고 싶은 사진을 고릅니다.',
              '사진의 제목과 촬영 시기를 확인합니다.',
              '사진 속 사람과 장소를 적습니다.',
              '그날 있었던 일과 기억나는 말을 남깁니다.',
              '그때 느꼈던 감정이나 지금의 생각을 덧붙입니다.',
              '이야기 자료가 3개 이상 모이면 책 원고 만들기로 이동합니다.',
            ]}
            note="사진 설명과 직접 작성한 이야기는 모두 책 원고의 재료로 사용할 수 있습니다."
          />
        </div>

        <section
          className="story-section"
          style={{
            marginTop: 24,
            padding: 28,
            borderRadius: 30,
            border:
              '1px solid rgba(91, 66, 43, 0.12)',
            background: '#fffaf1',
            boxShadow:
              '0 12px 30px rgba(91, 66, 43, 0.08)',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: '#9b6d2f',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              새 사진과 이야기 추가
            </p>

            <h2
              style={{
                margin: '9px 0 0',
                fontFamily:
                  'Noto Serif KR, serif',
                fontSize: 30,
                lineHeight: 1.4,
                letterSpacing: '-0.04em',
                color: '#33271d',
              }}
            >
              이야기를 남길 사진을
              바로 추가할 수 있습니다.
            </h2>

            <p
              style={{
                margin: '11px 0 0',
                maxWidth: 760,
                color: '#6b5845',
                fontSize: 14,
                lineHeight: 1.75,
              }}
            >
              사진이 아직 등록되지 않았다면
              이곳에서 사진과 설명을 함께
              올려주세요.
            </p>
          </div>

          <div
            style={{
              marginTop: 20,
            }}
          >
            <StoryPhotoUploadBox />
          </div>
        </section>

        <section
          id="photo-story"
          className="story-section"
          style={{
            marginTop: 24,
            padding: 28,
            borderRadius: 30,
            border:
              '1px solid rgba(91, 66, 43, 0.12)',
            background: '#fffaf1',
            boxShadow:
              '0 12px 30px rgba(91, 66, 43, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent:
                'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: '#9b6d2f',
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                }}
              >
                사진 속 이야기
              </p>

              <h2
                style={{
                  margin: '9px 0 0',
                  fontFamily:
                    'Noto Serif KR, serif',
                  fontSize: 30,
                  lineHeight: 1.4,
                  letterSpacing: '-0.04em',
                  color: '#33271d',
                }}
              >
                사진에 남겨 둔 이야기를
                확인합니다.
              </h2>

              <p
                style={{
                  margin: '9px 0 0',
                  color: '#6b5845',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                설명이 부족한 사진은 수정 버튼으로
                이야기를 보완할 수 있습니다.
              </p>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 35,
                padding: '0 13px',
                borderRadius: 999,
                background: '#f4ead8',
                color: '#6b5845',
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              전체 {storyPhotos.length}장
            </span>
          </div>

          {storyPhotos.length > 0 ? (
            <div
              className="story-photo-grid"
              style={{
                marginTop: 22,
              }}
            >
              {storyPhotos.map((photo) => {
                const hasDescription =
                  Boolean(
                    photo.description?.trim(),
                  );

                return (
                  <article
                    key={photo.id}
                    style={{
                      overflow: 'hidden',
                      borderRadius: 22,
                      border: hasDescription
                        ? '1px solid #9dcca4'
                        : '1px solid #ead7b7',
                      background: '#ffffff',
                      boxShadow:
                        '0 10px 26px rgba(91, 66, 43, 0.06)',
                    }}
                  >
                    <div
                      className="story-photo-image"
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: 205,
                        overflow: 'hidden',
                        background: '#eadcc5',
                      }}
                    >
                      <Image
                        src={`/api/blob/${photo.id}`}
                        alt={
                          photo.title ||
                          '이야기 사진'
                        }
                        fill
                        unoptimized
                        sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                        style={{
                          objectFit: 'contain',
                        }}
                      />

                      <span
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          display: 'inline-flex',
                          padding: '5px 9px',
                          borderRadius: 999,
                          background: hasDescription
                            ? '#3e5f3a'
                            : 'rgba(51,39,29,0.82)',
                          color: '#fff8ec',
                          fontSize: 10,
                          fontWeight: 900,
                        }}
                      >
                        {hasDescription
                          ? '이야기 있음'
                          : '이야기 필요'}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: 18,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: '#9b6d2f',
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        {photo.occurredAt
                          ? `촬영일 ${formatDate(photo.occurredAt)}`
                          : `등록일 ${formatDate(photo.createdAt)}`}
                      </p>

                      <h3
                        style={{
                          margin: '8px 0 0',
                          color: '#33271d',
                          fontSize: 18,
                          lineHeight: 1.45,
                          letterSpacing: '-0.03em',
                          wordBreak: 'break-word',
                        }}
                      >
                        {photo.title ||
                          '제목 없는 사진'}
                      </h3>

                      <p
                        style={{
                          margin: '9px 0 0',
                          minHeight: 68,
                          whiteSpace: 'pre-line',
                          color: '#5f4a35',
                          fontSize: 13,
                          lineHeight: 1.7,
                          wordBreak: 'break-word',
                        }}
                      >
                        {photo.description ||
                          '아직 이 사진에 대한 이야기가 없습니다.'}
                      </p>

                      <div className="story-photo-actions">
                        <EditMemoryButton
                          memoryId={photo.id}
                          initialTitle={
                            photo.title || ''
                          }
                          initialDescription={
                            photo.description || ''
                          }
                          label="사진 이야기 수정"
                        />

                        <DeleteMemoryButton
                          memoryId={photo.id}
                          label="사진 삭제"
                        />
                      </div>

                      <p
                        style={{
                          margin: '12px 0 0',
                          paddingTop: 11,
                          borderTop:
                            '1px solid rgba(91, 66, 43, 0.09)',
                          color: '#8b7a67',
                          fontSize: 10,
                        }}
                      >
                        최근 수정{' '}
                        {formatDate(
                          photo.updatedAt,
                        )}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                marginTop: 20,
                padding: 30,
                borderRadius: 22,
                background: '#ffffff',
                border:
                  '1px dashed rgba(91, 66, 43, 0.28)',
                color: '#6b5845',
                fontSize: 15,
                lineHeight: 1.75,
                textAlign: 'center',
              }}
            >
              아직 등록된 사진이 없습니다.
              <br />
              위의 사진 추가 영역이나 사진 모으기
              화면에서 첫 사진을 올려주세요.

              <div
                style={{
                  marginTop: 16,
                }}
              >
                <Link
                  href="/dashboard/timeline"
                  style={nextStepButtonStyle()}
                >
                  사진 모으기로 이동
                </Link>
              </div>
            </div>
          )}
        </section>

        <section
          id="story-writing"
          className="story-section"
          style={{
            marginTop: 24,
            padding: 28,
            borderRadius: 30,
            border:
              '1px solid rgba(91, 66, 43, 0.12)',
            background: '#fffaf1',
            boxShadow:
              '0 12px 30px rgba(91, 66, 43, 0.08)',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: '#9b6d2f',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              직접 이야기 남기기
            </p>

            <h2
              style={{
                margin: '9px 0 0',
                fontFamily:
                  'Noto Serif KR, serif',
                fontSize: 30,
                lineHeight: 1.4,
                letterSpacing: '-0.04em',
                color: '#33271d',
              }}
            >
              질문을 따라 기억나는 이야기를
              적어보세요.
            </h2>

            <p
              style={{
                margin: '10px 0 0',
                maxWidth: 760,
                color: '#6b5845',
                fontSize: 14,
                lineHeight: 1.75,
              }}
            >
              답변은 저장한 뒤에도 수정하거나
              삭제할 수 있습니다.
            </p>
          </div>

          <div
            style={{
              marginTop: 20,
            }}
          >
            <InterviewClient
              answers={answers.map((answer) => ({
                id: answer.id,
                title: answer.title || '',
                description:
                  answer.description || '',
              }))}
              submitAnswer={submitAnswer}
            />
          </div>
        </section>

        {storyReady ? (
          <section
            style={{
              marginTop: 24,
              padding: '22px 24px',
              borderRadius: 24,
              border: '1px solid #9dcca4',
              background: '#edf8ee',
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
                    color: '#2f6b38',
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  이야기 남기기 완료
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
                  사진과 이야기를 바탕으로 책
                  원고를 만들 수 있습니다.
                </strong>
              </div>

              <Link
                href="/dashboard/book"
                style={nextStepButtonStyle()}
              >
                책 원고 만들기
              </Link>
            </div>
          </section>
        ) : null}
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

function nextStepButtonStyle(): CSSProperties {
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

function formatDate(
  value: Date | string,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).format(date);
}