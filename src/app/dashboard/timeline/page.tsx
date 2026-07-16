import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CSSProperties } from 'react';
import UploadForm from './UploadForm';

const REQUIRED_PHOTO_COUNT = 3;

function isInterviewMemory(title: string | null) {
  if (!title) {
    return false;
  }

  return (
    title.startsWith('AI 인터뷰') ||
    title.startsWith('AI Interview')
  );
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
    take: 200,
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      fileUrl: true,
      occurredAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const visibleMemories = memories.filter(
    (memory) =>
      !isInterviewMemory(memory.title),
  );

  const photos = visibleMemories.filter(
    (memory) => memory.type === 'PHOTO',
  );

  const storyCount = visibleMemories.filter(
    (memory) => memory.type === 'TEXT',
  ).length;

  const describedPhotoCount = photos.filter(
    (photo) =>
      Boolean(photo.description?.trim()),
  ).length;

  const datedPhotoCount = photos.filter(
    (photo) => Boolean(photo.occurredAt),
  ).length;

  const completePhotoCount = photos.filter(
    (photo) =>
      Boolean(photo.title?.trim()) &&
      Boolean(photo.description?.trim()) &&
      Boolean(photo.occurredAt),
  ).length;

  const groupedPhotos = photos.reduce<
    Record<string, typeof photos>
  >((groups, photo) => {
    const date =
      photo.occurredAt ?? photo.createdAt;

    const year = String(
      date.getFullYear(),
    );

    if (!groups[year]) {
      groups[year] = [];
    }

    groups[year].push(photo);

    return groups;
  }, {});

  const years = Object.keys(
    groupedPhotos,
  ).sort(
    (first, second) =>
      Number(second) - Number(first),
  );

  const remainingPhotoCount = Math.max(
    REQUIRED_PHOTO_COUNT - photos.length,
    0,
  );

  const photoReady =
    photos.length >= REQUIRED_PHOTO_COUNT;

  return (
    <main
      style={{
        padding: 28,
      }}
    >
      <style>{`
        .photo-page-container {
          max-width: 1380px;
          margin: 0 auto;
        }

        .photo-upload-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.05fr)
            minmax(300px, 0.95fr);
          gap: 24px;
          align-items: start;
        }

        .photo-list-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(245px, 1fr));
          gap: 16px;
        }

        .photo-card-status {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        @media (max-width: 920px) {
          .photo-upload-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .photo-page-main {
            padding: 16px !important;
          }

          .photo-hero {
            padding: 26px 20px !important;
            border-radius: 24px !important;
          }

          .photo-hero-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .photo-hero-actions a {
            width: 100%;
          }

          .photo-upload-section,
          .photo-tip-section,
          .photo-list-section {
            padding: 20px 16px !important;
            border-radius: 24px !important;
          }

          .photo-list-grid {
            grid-template-columns: 1fr;
          }

          .photo-card-image {
            height: 225px !important;
          }
        }
      `}</style>

      <div
        className="photo-page-main photo-page-container"
      >
        <section
          className="photo-hero"
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
            책 만들기 1단계
          </p>

          <h1
            style={{
              margin: 0,
              maxWidth: 900,
              fontFamily:
                'Noto Serif KR, serif',
              fontSize:
                'clamp(34px, 5vw, 56px)',
              lineHeight: 1.2,
              letterSpacing: '-0.05em',
            }}
          >
            소중한 사진과
           <br />
            삶의 시간을 모읍니다.
          </h1>

          <p
            style={{
              margin: '22px 0 0',
              maxWidth: 800,
              fontSize: 18,
              lineHeight: 1.8,
              color:
                'rgba(255, 248, 236, 0.86)',
            }}
          >
            오래된 앨범 사진부터 최근의
            가족사진까지 차례로 올려주세요.
            사진의 제목, 날짜와 기억나는
            설명을 함께 남기면 책의 중요한
            장면으로 활용할 수 있습니다.
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
              {photoReady
                ? `사진 ${photos.length}장이 모였습니다.`
                : `사진을 ${remainingPhotoCount}장 더 모아보세요.`}
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
              {photoReady
                ? '책 원고를 시작할 기본 사진 수가 준비되었습니다. 이제 사진 속 이야기를 남겨보세요.'
                : '사진 3장부터 책 원고 만들기의 기본 재료로 사용할 수 있습니다.'}
            </p>
          </div>

          <div
            className="photo-hero-actions"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 22,
            }}
          >
            <a
              href="#photo-upload"
              style={heroPrimaryButtonStyle()}
            >
              사진 올리기
            </a>

            <Link
              href="/dashboard/interview"
              style={heroSecondaryButtonStyle()}
            >
              이야기 남기기
            </Link>

            <Link
              href="/dashboard"
              style={heroSecondaryButtonStyle()}
            >
              작업실로 돌아가기
            </Link>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(165px, 1fr))',
            gap: 14,
            marginTop: 24,
          }}
        >
          <SummaryCard
            label="모은 사진"
            value={photos.length}
            unit="장"
            description="현재 책의 재료로 모아 둔 사진"
            color="#7b4f2a"
          />

          <SummaryCard
            label="설명 작성"
            value={describedPhotoCount}
            unit="장"
            description="사진 속 기억을 설명한 사진"
            color="#9b6d2f"
          />

          <SummaryCard
            label="날짜 입력"
            value={datedPhotoCount}
            unit="장"
            description="촬영 시기를 입력한 사진"
            color="#2e3f52"
          />

          <SummaryCard
            label="준비 완료"
            value={completePhotoCount}
            unit="장"
            description="제목·설명·날짜가 모두 준비된 사진"
            color="#3e5f3a"
          />

          <SummaryCard
            label="남긴 이야기"
            value={storyCount}
            unit="개"
            description="책의 문장이 되는 이야기 기록"
            color="#62438a"
          />
         </section>

        <section
          style={{
            marginTop: 24,
            padding: '20px 22px',
            borderRadius: 22,
            border: photoReady
              ? '1px solid #9dcca4'
              : '1px solid #e3bd7a',
            background: photoReady
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
                  color: photoReady
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
                {photoReady
                  ? '사진이 준비되었습니다. 사진 속 이야기를 남겨주세요.'
                  : '먼저 사진 3장 이상을 모아주세요.'}
              </strong>
            </div>

            {photoReady ? (
              <Link
                href="/dashboard/interview"
                style={nextStepButtonStyle()}
              >
                이야기 남기기로 이동
              </Link>
            ) : (
              <a
                href="#photo-upload"
                style={nextStepButtonStyle()}
              >
                사진 더 올리기
              </a>
            )}
          </div>
        </section>

        <section
          id="photo-upload"
          className="photo-upload-grid"
          style={{
            marginTop: 24,
          }}
        >
          <article
            className="photo-upload-section"
            style={{
              padding: 28,
              borderRadius: 30,
              background: '#fffaf1',
              border:
                '1px solid rgba(91, 66, 43, 0.12)',
              boxShadow:
                '0 12px 30px rgba(91, 66, 43, 0.08)',
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
              새 사진 올리기
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
              한 번에 한 장씩
              <br />
              천천히 기록해보세요.
            </h2>

            <p
              style={{
                margin: '14px 0 0',
                color: '#6b5845',
                fontSize: 15,
                lineHeight: 1.75,
              }}
            >
              사진을 올릴 때 제목, 설명과
              촬영 날짜를 함께 입력하면 나중에
              책의 시간 순서를 정리하기
              쉬워집니다.
            </p>

            <div
              style={{
                marginTop: 22,
              }}
            >
              <UploadForm />
            </div>
          </article>

          <aside
            className="photo-tip-section"
            style={{
              padding: 28,
              borderRadius: 30,
              background: '#f4ead8',
              border:
                '1px solid rgba(91, 66, 43, 0.12)',
              boxShadow:
                '0 12px 30px rgba(91, 66, 43, 0.08)',
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
              어떤 사진이 좋을까요?
            </p>

            <h2
              style={{
                margin: '9px 0 0',
                fontFamily:
                  'Noto Serif KR, serif',
                fontSize: 28,
                lineHeight: 1.4,
                letterSpacing: '-0.04em',
                color: '#33271d',
              }}
            >
              잘 찍은 사진보다
              이야기가 있는 사진이 좋습니다.
            </h2>

            <div
              style={{
                display: 'grid',
                gap: 10,
                marginTop: 20,
              }}
            >
              {[
                '부모님의 어린 시절이나 학창 시절 사진',
                '가족이 함께 찍은 명절과 여행 사진',
                '직장, 가게 또는 일터에서 찍은 사진',
                '결혼, 출산, 이사와 관련된 사진',
                '언제 찍었는지 궁금한 오래된 사진',
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '30px minmax(0, 1fr)',
                    gap: 10,
                    alignItems: 'start',
                    padding: 14,
                    borderRadius: 16,
                    background: '#fffaf1',
                    color: '#4c3a2a',
                    fontSize: 14,
                    lineHeight: 1.65,
                    fontWeight: 800,
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent:
                        'center',
                      borderRadius: 999,
                      background: '#33271d',
                      color: '#fff8ec',
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {index + 1}
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section
          className="photo-list-section"
          style={{
            marginTop: 24,
            padding: 28,
            borderRadius: 30,
            background: '#fffaf1',
            border:
              '1px solid rgba(91, 66, 43, 0.12)',
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
                모아 둔 사진
              </p>

              <h2
                style={{
                  margin: '9px 0 0',
                  fontFamily:
                    'Noto Serif KR, serif',
                  fontSize: 31,
                  lineHeight: 1.4,
                  letterSpacing:
                    '-0.04em',
                  color: '#33271d',
                }}
              >
                책의 장면이 될 사진
              </h2>

              <p
                style={{
                  margin: '8px 0 0',
                  color: '#6b5845',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                사진마다 제목·설명·날짜가
                준비됐는지 확인할 수 있습니다.
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
              전체 {photos.length}장
            </span>
          </div>

          {years.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gap: 30,
                marginTop: 26,
              }}
            >
              {years.map((year) => (
                <section key={year}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontFamily:
                          'Noto Serif KR, serif',
                        fontSize: 25,
                        color: '#33271d',
                      }}
                    >
                      {year}년
                    </h3>

                    <span
                      style={{
                        color: '#8b7a67',
                        fontSize: 12,
                      }}
                    >
                      {groupedPhotos[year].length}
                      장
                    </span>
                  </div>

                  <div className="photo-list-grid">
                    {groupedPhotos[year].map(
                      (photo) => {
                        const displayDate =
                          photo.occurredAt ??
                          photo.createdAt;

                        const hasTitle =
                          Boolean(
                            photo.title?.trim(),
                          );

                        const hasDescription =
                          Boolean(
                            photo.description?.trim(),
                          );

                        const hasOccurredAt =
                          Boolean(
                            photo.occurredAt,
                          );

                        const complete =
                          hasTitle &&
                          hasDescription &&
                          hasOccurredAt;

                        return (
                          <article
                            key={photo.id}
                            style={{
                              overflow: 'hidden',
                              borderRadius: 22,
                              background: '#ffffff',
                              border: complete
                                ? '1px solid #9dcca4'
                                : '1px solid rgba(91, 66, 43, 0.12)',
                              boxShadow:
                                '0 10px 26px rgba(91, 66, 43, 0.06)',
                            }}
                          >
                            <div
                              className="photo-card-image"
                              style={{
                                position:
                                  'relative',
                                height: 205,
                                overflow:
                                  'hidden',
                                background:
                                  'linear-gradient(135deg, rgba(91,66,43,0.14), rgba(240,195,106,0.28))',
                              }}
                            >
                              {photo.fileUrl ? (
                                <Image
                                  unoptimized
                                  src={`/api/blob/${photo.id}`}
                                  alt={
                                    photo.title ||
                                    '가족 사진'
                                  }
                                  fill
                                  sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                                  style={{
                                    objectFit:
                                      'contain',
                                    transform:
                                      'scale(1.08)',
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    height: '100%',
                                    display:
                                      'flex',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'center',
                                    color:
                                      '#8a6b4d',
                                    fontSize: 13,
                                    fontWeight: 900,
                                  }}
                                >
                                  사진 파일 없음
                                </div>
                              )}

                              <span
                                style={{
                                  position:
                                    'absolute',
                                  top: 12,
                                  right: 12,
                                  display:
                                    'inline-flex',
                                  padding:
                                    '5px 9px',
                                  borderRadius: 999,
                                  background:
                                    complete
                                      ? '#3e5f3a'
                                      : 'rgba(51,39,29,0.82)',
                                  color:
                                    '#fff8ec',
                                  fontSize: 10,
                                  fontWeight: 900,
                                }}
                              >
                                {complete
                                  ? '준비 완료'
                                  : '정보 보완 필요'}
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
                                  color:
                                    '#9b6d2f',
                                  fontSize: 11,
                                  fontWeight: 900,
                                }}
                              >
                                {photo.occurredAt
                                  ? `촬영일 ${formatDate(displayDate)}`
                                  : `등록일 ${formatDate(displayDate)}`}
                              </p>

                              <h4
                                style={{
                                  margin:
                                    '8px 0 0',
                                  color:
                                    '#33271d',
                                  fontSize: 18,
                                  lineHeight: 1.45,
                                  letterSpacing:
                                    '-0.03em',
                                  wordBreak:
                                    'break-word',
                                }}
                              >
                                {photo.title ||
                                  '제목 없는 사진'}
                              </h4>

                              <p
                                style={{
                                  margin:
                                    '8px 0 0',
                                  minHeight: 44,
                                  color:
                                    '#6b5845',
                                  fontSize: 13,
                                  lineHeight: 1.65,
                                  wordBreak:
                                    'break-word',
                                }}
                              >
                                {photo.description ||
                                  '아직 이 사진에 대한 설명이 없습니다.'}
                              </p>

                              <div
                                className="photo-card-status"
                                style={{
                                  marginTop: 14,
                                }}
                              >
                                <ReadinessBadge
                                  label="제목"
                                  ready={hasTitle}
                                />

                                <ReadinessBadge
                                  label="설명"
                                  ready={
                                    hasDescription
                                  }
                                />

                                <ReadinessBadge
                                  label="날짜"
                                  ready={
                                    hasOccurredAt
                                  }
                                />
                              </div>

                              <p
                                style={{
                                  margin:
                                    '12px 0 0',
                                  paddingTop: 11,
                                  borderTop:
                                    '1px solid rgba(91, 66, 43, 0.09)',
                                  color:
                                    '#8b7a67',
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
                      },
                    )}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: 22,
                padding: 32,
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
              아직 모아 둔 사진이 없습니다.
              <br />
              첫 번째 사진을 올리면 이곳에
              시간 순서대로 표시됩니다.

              <div
                style={{
                  marginTop: 16,
                }}
              >
                <a
                  href="#photo-upload"
                  style={nextStepButtonStyle()}
                >
                  첫 사진 올리기
                </a>
              </div>
            </div>
          )}
        </section>

        {photoReady ? (
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
                  사진 모으기 완료
                </p>

                <strong
                  style={{
                    display: 'block',
                    marginTop: 6,
                    color: '#33271d',
                    fontSize: 19,
                  }}
                >
                  다음은 사진 속 이야기를
                  남길 차례입니다.
                </strong>
              </div>

              <Link
                href="/dashboard/interview"
                style={nextStepButtonStyle()}
              >
                이야기 남기기
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

function ReadinessBadge({
  label,
  ready,
}: {
  label: string;
  ready: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 25,
        padding: '0 9px',
        borderRadius: 999,
        background: ready
          ? '#e3f4e5'
          : '#fff1c7',
        color: ready
          ? '#2f6b38'
          : '#83540d',
        fontSize: 10,
        fontWeight: 900,
      }}
    >
      {label} {ready ? '완료' : '필요'}
    </span>
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

function formatDate(
  value: Date | string,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
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