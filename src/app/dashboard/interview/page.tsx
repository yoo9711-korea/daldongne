import { auth } from "@/auth";
import StoryPhotoUploadBox from "@/components/interview/StoryPhotoUploadBox";
import DeleteMemoryButton from "@/components/memory/DeleteMemoryButton";
import EditMemoryButton from "@/components/memory/EditMemoryButton";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import InterviewClient from "./InterviewClient";

const REQUIRED_STORY_COUNT = 3;

export default async function InterviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [answers, storyPhotos, photoCount, bookCount] =
    await Promise.all([
      prisma.memory.findMany({
        where: {
          authorId: userId,
          type: "TEXT",
        },
        orderBy: {
          createdAt: "desc",
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
          type: "PHOTO",
          fileUrl: {
            not: null,
          },
        },
        orderBy: [
          {
            occurredAt: "desc",
          },
          {
            createdAt: "desc",
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
          type: "PHOTO",
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
    "use server";

    const currentSession = await auth();

    if (!currentSession?.user?.id) {
      redirect("/login");
    }

    const storyTitle = String(
      formData.get("storyTitle") || "",
    ).trim();

    const whenText = String(
      formData.get("whenText") || "",
    ).trim();

    const peopleText = String(
      formData.get("peopleText") || "",
    ).trim();

    const memoryText = String(
      formData.get("memoryText") || "",
    ).trim();

    const selectedPhotoTitle = String(
      formData.get("selectedPhotoTitle") || "",
    ).trim();

    if (!memoryText) {
      return;
    }

    const descriptionParts = [
      whenText
        ? `언제: ${whenText}`
        : "",
      peopleText
        ? `함께한 사람: ${peopleText}`
        : "",
      memoryText,
    ].filter(Boolean);

    const title =
      storyTitle ||
      selectedPhotoTitle ||
      "사진 속 소중한 이야기";

    await prisma.memory.create({
      data: {
        type: "TEXT",
        title: `이야기 · ${title.slice(0, 40)}`,
        description: descriptionParts.join("\n\n"),
        authorId: currentSession.user.id,
        occurredAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/interview");
    revalidatePath("/dashboard/book");
    revalidatePath("/dashboard/library");
  }

  return (
    <main className="interview-reference-page">
      <style>{interviewReferenceStyles}</style>

      <div className="interview-reference-shell">
        <section className="interview-reference-heading">
          <p>책 만들기 2단계</p>

          <h1>
            사진 속 이야기를
            <br className="interview-reference-mobile-break" />
            들려주세요
          </h1>

          <span>
            완벽한 글보다 지금 기억나는 한 문장이
            더 소중합니다.
          </span>
        </section>

        <section className="interview-reference-status">
          <StatusCard
            label="모은 사진"
            value={photoCount}
            unit="장"
          />

          <StatusCard
            label="사진 속 이야기"
            value={photoStoryCount}
            unit="개"
          />

          <StatusCard
            label="직접 남긴 이야기"
            value={writtenStoryCount}
            unit="개"
          />

          <StatusCard
            label="전체 이야기"
            value={totalStoryCount}
            unit="개"
          />

          <StatusCard
            label="만든 책"
            value={bookCount}
            unit="권"
          />
        </section>

        <section className="interview-reference-ready">
          <div>
            <p>현재 준비 상태</p>

            <strong>
              {storyReady
                ? `이야기 자료 ${totalStoryCount}개가 준비되었습니다.`
                : `이야기를 ${remainingStoryCount}개 더 남겨보세요.`}
            </strong>

            <span>
              사진 설명과 직접 작성한 이야기를 합쳐
              3개 이상이면 책 원고 만들기를 시작할 수
              있습니다.
            </span>
          </div>

          {storyReady ? (
            <Link href="/dashboard/book">
              책 원고 만들기
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <a href="#story-composer">
              이야기 작성하기
              <span aria-hidden="true">↓</span>
            </a>
          )}
        </section>

        <section
          id="story-composer"
          className="interview-reference-composer"
        >
          <InterviewClient
            photos={storyPhotos.map((photo) => ({
              id: photo.id,
              title: photo.title || "",
              occurredAt: photo.occurredAt
                ? photo.occurredAt.toISOString()
                : null,
              createdAt: photo.createdAt.toISOString(),
            }))}
            answers={answers.map((answer) => ({
              id: answer.id,
              title: answer.title || "",
              description: answer.description || "",
              createdAt: answer.createdAt.toISOString(),
            }))}
            submitAnswer={submitAnswer}
          />
        </section>

        <section className="interview-reference-photo-stories">
          <div className="interview-reference-section-head">
            <div>
              <p>사진 속 이야기</p>
              <h2>사진에 남긴 기억을 확인합니다</h2>
              <span>
                설명이 부족한 사진은 수정 버튼으로
                이야기를 보완할 수 있습니다.
              </span>
            </div>

            <strong>전체 {storyPhotos.length}장</strong>
          </div>

          {storyPhotos.length > 0 ? (
            <div className="interview-reference-photo-grid">
              {storyPhotos.map((photo) => {
                const hasDescription = Boolean(
                  photo.description?.trim(),
                );

                return (
                  <article
                    key={photo.id}
                    data-complete={
                      hasDescription ? "true" : "false"
                    }
                  >
                    <div className="interview-reference-photo-image">
                      <Image
                        src={`/api/blob/${photo.id}`}
                        alt={
                          photo.title ||
                          "이야기 사진"
                        }
                        fill
                        unoptimized
                        sizes="(max-width: 680px) 100vw, (max-width: 1050px) 50vw, 33vw"
                      />

                      <span>
                        {hasDescription
                          ? "이야기 있음"
                          : "이야기 필요"}
                      </span>
                    </div>

                    <div className="interview-reference-photo-content">
                      <time>
                        {photo.occurredAt
                          ? `촬영일 ${formatDate(photo.occurredAt)}`
                          : `등록일 ${formatDate(photo.createdAt)}`}
                      </time>

                      <h3>
                        {photo.title ||
                          "제목 없는 사진"}
                      </h3>

                      <p>
                        {photo.description ||
                          "아직 이 사진에 대한 이야기가 없습니다."}
                      </p>

                      <div className="interview-reference-photo-actions">
                        <EditMemoryButton
                          memoryId={photo.id}
                          initialTitle={
                            photo.title || ""
                          }
                          initialDescription={
                            photo.description || ""
                          }
                          initialOccurredAt={
                            photo.occurredAt
                              ? photo.occurredAt.toISOString()
                              : null
                          }
                          label="사진 이야기 수정"
                        />

                        <DeleteMemoryButton
                          memoryId={photo.id}
                          label="사진 삭제"
                        />
                      </div>

                      <small>
                        최근 수정{" "}
                        {formatDate(photo.updatedAt)}
                      </small>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="interview-reference-empty-photo">
              <div>
                <Image
                  src="/dashboard/interview-reference-v1/sample-family-story.webp"
                  alt="할머니, 엄마와 아이들이 함께 웃는 가족 사진 예시"
                  fill
                  sizes="(max-width: 700px) 100vw, 460px"
                />
              </div>

              <section>
                <p>사진이 아직 없습니다</p>

                <h3>
                  먼저 이야기할 사진을
                  올려주세요.
                </h3>

                <span>
                  사진을 올린 뒤 날짜와 함께한 사람,
                  기억나는 일을 차례로 적을 수 있습니다.
                </span>

                <Link href="/dashboard/timeline">
                  사진 올리기로 이동
                </Link>
              </section>
            </div>
          )}
        </section>

        <section className="interview-reference-upload-more">
          <div className="interview-reference-section-head">
            <div>
              <p>새 사진과 이야기 추가</p>
              <h2>이 화면에서도 사진을 추가할 수 있습니다</h2>
              <span>
                새로운 사진을 올리면서 이야기를 함께
                저장할 수 있습니다.
              </span>
            </div>
          </div>

          <StoryPhotoUploadBox />
        </section>

        <footer className="interview-reference-footer">
          <Link href="/dashboard/timeline">
            이전 단계
          </Link>

          <Link
            href={
              storyReady
                ? "/dashboard/book"
                : "/dashboard/interview#story-composer"
            }
            className="interview-reference-next"
          >
            {storyReady
              ? "이야기 저장하고 다음으로"
              : "이야기를 더 남겨주세요"}
            <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}

function StatusCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <article>
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>
    </article>
  );
}

function formatDate(value: Date | string) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const interviewReferenceStyles = `
  .interview-reference-page,
  .interview-reference-page * {
    box-sizing: border-box;
  }

  .interview-reference-page {
    min-height: 100vh;
    padding: 32px 24px 54px;
    color: #4a342b;
    background:
      radial-gradient(
        circle at 7% 8%,
        rgba(255, 231, 216, 0.56),
        transparent 28rem
      ),
      radial-gradient(
        circle at 94% 14%,
        rgba(231, 244, 231, 0.52),
        transparent 25rem
      ),
      linear-gradient(
        180deg,
        #fffdf8,
        #fff9f3
      );
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .interview-reference-page a {
    color: inherit;
    text-decoration: none;
  }

  .interview-reference-page a,
  .interview-reference-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .interview-reference-page a:hover,
  .interview-reference-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .interview-reference-page a:focus-visible,
  .interview-reference-page button:focus-visible,
  .interview-reference-page input:focus-visible,
  .interview-reference-page textarea:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .interview-reference-shell {
    width:
      min(1380px, 100%);
    margin: 0 auto;
  }

  .interview-reference-heading {
    text-align: center;
  }

  .interview-reference-heading > p {
    margin: 0;
    color: #ef6c55;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .interview-reference-heading h1 {
    margin: 11px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(40px, 5vw, 61px);
    line-height: 1.18;
    letter-spacing: -0.06em;
  }

  .interview-reference-heading > span {
    display: block;
    margin-top: 12px;
    color: #7b665d;
    font-size:
      clamp(14px, 1.5vw, 19px);
    line-height: 1.7;
  }

  .interview-reference-mobile-break {
    display: none;
  }

  .interview-reference-status {
    margin-top: 25px;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .interview-reference-status article {
    min-width: 0;
    padding: 14px 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border:
      1px solid
      rgba(135, 94, 74, 0.11);
    border-radius: 15px;
    background:
      rgba(255, 255, 255, 0.82);
    box-shadow:
      0 8px 20px
      rgba(95, 62, 46, 0.035);
  }

  .interview-reference-status article > span {
    color: #806c63;
    font-size: 11px;
    font-weight: 850;
  }

  .interview-reference-status article > strong {
    color: #e46750;
    font-size: 22px;
  }

  .interview-reference-status article small {
    margin-left: 3px;
    color: #8f7c72;
    font-size: 10px;
  }

  .interview-reference-ready {
    margin-top: 17px;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border:
      1px solid #c9d9ad;
    border-radius: 19px;
    background:
      linear-gradient(
        135deg,
        #f3f8e9,
        #fffdf7
      );
  }

  .interview-reference-ready p {
    margin: 0;
    color: #4f7a3e;
    font-size: 10px;
    font-weight: 900;
  }

  .interview-reference-ready strong {
    display: block;
    margin-top: 5px;
    font-size: 17px;
    line-height: 1.5;
  }

  .interview-reference-ready div > span {
    display: block;
    margin-top: 3px;
    color: #75816d;
    font-size: 11px;
    line-height: 1.6;
  }

  .interview-reference-ready > a {
    min-height: 43px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    gap: 11px;
    flex: 0 0 auto;
    border-radius: 12px;
    color: #ffffff;
    background: #769451;
    font-size: 12px;
    font-weight: 900;
  }

  .interview-reference-composer,
  .interview-reference-photo-stories,
  .interview-reference-upload-more {
    margin-top: 18px;
    padding: 25px;
    border:
      1px solid
      rgba(136, 94, 74, 0.12);
    border-radius: 28px;
    background:
      rgba(255, 255, 255, 0.92);
    box-shadow:
      0 20px 48px
      rgba(92, 61, 47, 0.07);
  }

  .interview-reference-section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .interview-reference-section-head p {
    margin: 0;
    color: #ea6b54;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.06em;
  }

  .interview-reference-section-head h2 {
    margin: 7px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 28px;
    line-height: 1.4;
    letter-spacing: -0.045em;
  }

  .interview-reference-section-head div > span {
    display: block;
    margin-top: 6px;
    color: #7b685f;
    font-size: 12px;
    line-height: 1.65;
  }

  .interview-reference-section-head > strong {
    min-height: 36px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #765c4f;
    background: #fff1e9;
    font-size: 11px;
  }

  .interview-reference-photo-grid {
    margin-top: 20px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .interview-reference-photo-grid article {
    min-width: 0;
    overflow: hidden;
    border:
      1px solid
      rgba(131, 92, 72, 0.13);
    border-radius: 19px;
    background: #ffffff;
    box-shadow:
      0 10px 25px
      rgba(80, 52, 40, 0.055);
  }

  .interview-reference-photo-grid
  article[data-complete="true"] {
    border-color: #a8ca9c;
  }

  .interview-reference-photo-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1.25 / 1;
    overflow: hidden;
    background: #f1ebe7;
  }

  .interview-reference-photo-image img {
    object-fit: contain;
  }

  .interview-reference-photo-image > span {
    position: absolute;
    top: 9px;
    right: 9px;
    min-height: 26px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #ffffff;
    background:
      rgba(89, 65, 54, 0.85);
    font-size: 8px;
    font-weight: 900;
  }

  .interview-reference-photo-grid
  article[data-complete="true"]
  .interview-reference-photo-image > span {
    background: #66885b;
  }

  .interview-reference-photo-content {
    padding: 15px;
  }

  .interview-reference-photo-content > time {
    color: #d0624c;
    font-size: 9px;
    font-weight: 850;
  }

  .interview-reference-photo-content h3 {
    margin: 6px 0 0;
    overflow: hidden;
    font-size: 16px;
    line-height: 1.45;
    letter-spacing: -0.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .interview-reference-photo-content > p {
    min-height: 59px;
    margin: 7px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #756158;
    font-size: 11px;
    line-height: 1.7;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .interview-reference-photo-actions {
    margin-top: 11px;
    padding-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(119, 84, 67, 0.09);
  }

  .interview-reference-photo-actions button {
    min-height: 31px !important;
    padding: 0 10px !important;
    border-radius: 9px !important;
    font-size: 10px !important;
  }

  .interview-reference-photo-content > small {
    display: block;
    margin-top: 8px;
    color: #a08c82;
    font-size: 8px;
  }

  .interview-reference-empty-photo {
    margin-top: 20px;
    padding: 18px;
    display: grid;
    grid-template-columns:
      minmax(260px, 0.8fr)
      minmax(0, 1.2fr);
    gap: 22px;
    align-items: center;
    border:
      1px dashed #e3ad9c;
    border-radius: 21px;
    background: #fffaf7;
  }

  .interview-reference-empty-photo > div {
    position: relative;
    width: 100%;
    aspect-ratio: 1.45 / 1;
    overflow: hidden;
    border-radius: 16px;
  }

  .interview-reference-empty-photo img {
    object-fit: cover;
  }

  .interview-reference-empty-photo section > p {
    margin: 0;
    color: #e36c55;
    font-size: 11px;
    font-weight: 900;
  }

  .interview-reference-empty-photo h3 {
    margin: 8px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 25px;
    line-height: 1.45;
    letter-spacing: -0.04em;
  }

  .interview-reference-empty-photo section > span {
    display: block;
    margin-top: 8px;
    color: #746057;
    font-size: 12px;
    line-height: 1.7;
  }

  .interview-reference-empty-photo section > a {
    min-height: 43px;
    margin-top: 15px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    border-radius: 12px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5e4f
      );
    font-size: 11px;
    font-weight: 900;
  }

  .interview-reference-upload-more
  > section {
    margin-top: 20px !important;
    border:
      1px solid
      rgba(136, 94, 74, 0.12) !important;
    background:
      linear-gradient(
        145deg,
        #fffaf6,
        #fff5ed
      ) !important;
    box-shadow: none !important;
  }

  .interview-reference-upload-more
  input,
  .interview-reference-upload-more
  textarea {
    border-color:
      rgba(142, 99, 78, 0.24) !important;
    background: #fffdfb !important;
  }

  .interview-reference-upload-more button {
    border-color: transparent !important;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5e4f
      ) !important;
    color: #ffffff !important;
  }

  .interview-reference-footer {
    margin-top: 18px;
    padding: 17px 22px;
    display: grid;
    grid-template-columns:
      minmax(180px, 0.55fr)
      minmax(300px, 1.45fr);
    gap: 14px;
    border:
      1px solid
      rgba(135, 94, 74, 0.12);
    border-radius: 21px;
    background:
      rgba(255, 255, 255, 0.9);
  }

  .interview-reference-footer > a {
    min-height: 53px;
    padding: 0 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    border:
      1px solid #d3ae9e;
    border-radius: 14px;
    color: #705448;
    background: #ffffff;
    font-size: 14px;
    font-weight: 900;
  }

  .interview-reference-footer
  .interview-reference-next {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7765,
        #ed604f
      );
    box-shadow:
      0 13px 27px
      rgba(220, 83, 63, 0.18);
  }

  @media (max-width: 980px) {
    .interview-reference-photo-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 780px) {
    .interview-reference-page {
      padding: 22px 13px 38px;
    }

    .interview-reference-status {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .interview-reference-ready {
      align-items: stretch;
      flex-direction: column;
    }

    .interview-reference-ready > a {
      justify-content: center;
    }

    .interview-reference-composer,
    .interview-reference-photo-stories,
    .interview-reference-upload-more {
      padding: 17px;
      border-radius: 21px;
    }

    .interview-reference-empty-photo {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .interview-reference-mobile-break {
      display: block;
    }

    .interview-reference-heading h1 {
      font-size: 37px;
    }

    .interview-reference-status article {
      padding: 11px;
    }

    .interview-reference-status article > span {
      font-size: 9px;
    }

    .interview-reference-status article > strong {
      font-size: 18px;
    }

    .interview-reference-section-head {
      align-items: stretch;
      flex-direction: column;
    }

    .interview-reference-photo-grid {
      grid-template-columns: 1fr;
    }

    .interview-reference-footer {
      padding: 12px;
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .interview-reference-page a,
    .interview-reference-page button {
      transition: none;
    }
  }
`;
