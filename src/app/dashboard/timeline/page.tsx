import { auth } from "@/auth";
import DeleteMemoryButton from "@/components/memory/DeleteMemoryButton";
import EditMemoryButton from "@/components/memory/EditMemoryButton";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import UploadForm from "./UploadForm";

const REQUIRED_PHOTO_COUNT = 3;

const samplePhotos = [
  {
    src: "/dashboard/timeline-reference-v1/sample-elderly.webp",
    title: "함께한 봄날",
    date: "2024.04.15",
  },
  {
    src: "/dashboard/timeline-reference-v1/sample-street.webp",
    title: "그 시절 우리 동네",
    date: "2024.04.16",
  },
  {
    src: "/dashboard/timeline-reference-v1/sample-flowers.webp",
    title: "마당에 핀 꽃",
    date: "2024.04.17",
  },
  {
    src: "/dashboard/timeline-reference-v1/sample-children.webp",
    title: "아이들의 웃음",
    date: "2024.04.18",
  },
  {
    src: "/dashboard/timeline-reference-v1/sample-sunset.webp",
    title: "노을진 저녁",
    date: "2024.04.19",
  },
  {
    src: "/dashboard/timeline-reference-v1/sample-cat.webp",
    title: "햇살 아래 고양이",
    date: "2024.04.20",
  },
];

function isInterviewMemory(title: string | null) {
  if (!title) {
    return false;
  }

  return (
    title.startsWith("AI 인터뷰") ||
    title.startsWith("AI Interview")
  );
}

export default async function TimelinePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const memories = await prisma.memory.findMany({
    where: {
      authorId: session.user.id,
    },
    orderBy: [
      {
        occurredAt: "desc",
      },
      {
        createdAt: "desc",
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
    (memory) => !isInterviewMemory(memory.title),
  );

  const photos = visibleMemories.filter(
    (memory) => memory.type === "PHOTO",
  );

  const storyCount = visibleMemories.filter(
    (memory) => memory.type === "TEXT",
  ).length;

  const describedPhotoCount = photos.filter((photo) =>
    Boolean(photo.description?.trim()),
  ).length;

  const datedPhotoCount = photos.filter((photo) =>
    Boolean(photo.occurredAt),
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
    const date = photo.occurredAt ?? photo.createdAt;
    const year = String(date.getFullYear());

    if (!groups[year]) {
      groups[year] = [];
    }

    groups[year].push(photo);
    return groups;
  }, {});

  const years = Object.keys(groupedPhotos).sort(
    (first, second) => Number(second) - Number(first),
  );

  const remainingPhotoCount = Math.max(
    REQUIRED_PHOTO_COUNT - photos.length,
    0,
  );

  const photoReady =
    photos.length >= REQUIRED_PHOTO_COUNT;

  return (
    <main className="timeline-reference-page">
      <style>{timelineReferenceStyles}</style>

      <div className="timeline-reference-shell">
        <section className="timeline-reference-heading">
          <p>책 만들기 1단계</p>

          <h1>사진을 올려주세요</h1>

          <span>
            휴대폰이나 컴퓨터에 있는 소중한 사진을
            선택하세요.
          </span>
        </section>

        <section className="timeline-reference-status">
          <StatusItem
            label="모은 사진"
            value={photos.length}
            unit="장"
          />

          <StatusItem
            label="설명 작성"
            value={describedPhotoCount}
            unit="장"
          />

          <StatusItem
            label="날짜 입력"
            value={datedPhotoCount}
            unit="장"
          />

          <StatusItem
            label="준비 완료"
            value={completePhotoCount}
            unit="장"
          />

          <StatusItem
            label="남긴 이야기"
            value={storyCount}
            unit="개"
          />
        </section>

        <section
          id="photo-upload"
          className="timeline-reference-upload"
        >
          <UploadForm />

          <div className="timeline-reference-upload-help">
            <div className="timeline-reference-help-icon">
              <PhotoStackIcon />
            </div>

            <div>
              <p>사진을 고를 때 참고하세요</p>

              <h2>
                잘 찍은 사진보다
                <br />
                이야기가 있는 사진이 좋습니다.
              </h2>

              <ul>
                <li>가족이 함께한 평범한 일상</li>
                <li>오래된 앨범 속 어린 시절</li>
                <li>여행·명절·기념일의 한 장면</li>
                <li>반려동물과 함께한 시간</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="timeline-reference-ready">
          <div>
            <p>현재 준비 상태</p>

            <strong>
              {photoReady
                ? `사진 ${photos.length}장이 모였습니다.`
                : `사진을 ${remainingPhotoCount}장 더 모아보세요.`}
            </strong>

            <span>
              {photoReady
                ? "책 원고에 사용할 기본 사진이 준비되었습니다."
                : "사진 3장부터 책 원고 만들기의 기본 재료로 사용할 수 있습니다."}
            </span>
          </div>

          {photoReady ? (
            <Link href="/dashboard/interview">
              이야기 쓰기로 이동
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <a href="#photo-upload">
              사진 더 올리기
              <span aria-hidden="true">↓</span>
            </a>
          )}
        </section>

        <section className="timeline-reference-gallery">
          <div className="timeline-reference-section-head">
            <div>
              <p>저장된 기억</p>
              <h2>모아 둔 사진</h2>
              <span>
                제목과 날짜, 사진 속 이야기를 확인하고
                수정할 수 있습니다.
              </span>
            </div>

            <strong>전체 {photos.length}장</strong>
          </div>

          {years.length > 0 ? (
            <div className="timeline-reference-year-list">
              {years.map((year) => (
                <section
                  key={year}
                  className="timeline-reference-year"
                >
                  <div className="timeline-reference-year-title">
                    <h3>{year}년</h3>
                    <span>
                      {groupedPhotos[year].length}장
                    </span>
                  </div>

                  <div className="timeline-reference-photo-grid">
                    {groupedPhotos[year].map((photo) => {
                      const displayDate =
                        photo.occurredAt ?? photo.createdAt;

                      const hasTitle = Boolean(
                        photo.title?.trim(),
                      );

                      const hasDescription = Boolean(
                        photo.description?.trim(),
                      );

                      const hasOccurredAt = Boolean(
                        photo.occurredAt,
                      );

                      const complete =
                        hasTitle &&
                        hasDescription &&
                        hasOccurredAt;

                      return (
                        <article
                          key={photo.id}
                          className="timeline-reference-photo-card"
                          data-complete={
                            complete ? "true" : "false"
                          }
                        >
                          <div className="timeline-reference-photo-image">
                            {photo.fileUrl ? (
                              <Image
                                unoptimized
                                src={`/api/blob/${photo.id}`}
                                alt={
                                  photo.title ||
                                  "저장된 사진"
                                }
                                fill
                                sizes="(max-width: 680px) 100vw, (max-width: 1050px) 50vw, 25vw"
                              />
                            ) : (
                              <div className="timeline-reference-no-image">
                                사진 파일 없음
                              </div>
                            )}

                            <span
                              className="timeline-reference-photo-state"
                              data-complete={
                                complete ? "true" : "false"
                              }
                            >
                              {complete
                                ? "준비 완료"
                                : "정보 보완 필요"}
                            </span>
                          </div>

                          <div className="timeline-reference-photo-content">
                            <time>
                              {photo.occurredAt
                                ? `촬영일 ${formatDate(displayDate)}`
                                : `등록일 ${formatDate(displayDate)}`}
                            </time>

                            <h4>
                              {photo.title ||
                                "제목 없는 사진"}
                            </h4>

                            <p>
                              {photo.description ||
                                "아직 이 사진에 대한 이야기가 없습니다."}
                            </p>

                            <div className="timeline-reference-badges">
                              <ReadinessBadge
                                label="제목"
                                ready={hasTitle}
                              />

                              <ReadinessBadge
                                label="이야기"
                                ready={hasDescription}
                              />

                              <ReadinessBadge
                                label="날짜"
                                ready={hasOccurredAt}
                              />
                            </div>

                            <div className="timeline-reference-photo-actions">
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
                                label="수정"
                              />

                              <DeleteMemoryButton
                                memoryId={photo.id}
                                label="삭제"
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
                </section>
              ))}
            </div>
          ) : (
            <div className="timeline-reference-empty">
              <p>
                아직 올린 사진이 없어 예시 사진을
                보여드리고 있어요.
              </p>

              <div className="timeline-reference-sample-grid">
                {samplePhotos.map((sample) => (
                  <article key={sample.src}>
                    <div>
                      <Image
                        src={sample.src}
                        alt={sample.title}
                        fill
                        sizes="(max-width: 680px) 46vw, 190px"
                      />
                    </div>

                    <strong>{sample.title}</strong>
                    <time>{sample.date}</time>
                  </article>
                ))}
              </div>

              <a href="#photo-upload">
                첫 사진 선택하기
                <span aria-hidden="true">↑</span>
              </a>
            </div>
          )}
        </section>

        <footer className="timeline-reference-footer">
          <Link href="/dashboard">
            나중에 하기
          </Link>

          <Link
            href={
              photoReady
                ? "/dashboard/interview"
                : "/dashboard/timeline#photo-upload"
            }
            className="timeline-reference-next"
          >
            {photoReady
              ? "사진 저장하고 다음으로"
              : "사진을 더 올려주세요"}
            <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}

function StatusItem({
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

function ReadinessBadge({
  label,
  ready,
}: {
  label: string;
  ready: boolean;
}) {
  return (
    <span data-ready={ready ? "true" : "false"}>
      {label} {ready ? "완료" : "필요"}
    </span>
  );
}

function PhotoStackIcon() {
  return (
    <svg viewBox="0 0 72 72" fill="none">
      <rect
        x="14"
        y="17"
        width="42"
        height="38"
        rx="7"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle
        cx="29"
        cy="30"
        r="5"
        fill="currentColor"
        opacity=".75"
      />
      <path
        d="m19 48 12-12 8 8 6-6 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 11h33a8 8 0 0 1 8 8v29"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".45"
      />
    </svg>
  );
}

function formatDate(value: Date | string) {
  const date =
    value instanceof Date ?
      value :
      new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const timelineReferenceStyles = `
  .timeline-reference-page,
  .timeline-reference-page * {
    box-sizing: border-box;
  }

  .timeline-reference-page {
    min-height: 100vh;
    padding:
      32px
      24px
      52px;
    color: #4a342b;
    background:
      radial-gradient(
        circle at 8% 8%,
        rgba(255, 231, 216, 0.62),
        transparent 28rem
      ),
      radial-gradient(
        circle at 95% 15%,
        rgba(231, 244, 231, 0.56),
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

  .timeline-reference-page a {
    color: inherit;
    text-decoration: none;
  }

  .timeline-reference-page a,
  .timeline-reference-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .timeline-reference-page a:hover,
  .timeline-reference-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .timeline-reference-page a:focus-visible,
  .timeline-reference-page button:focus-visible,
  .timeline-reference-page input:focus-visible,
  .timeline-reference-page textarea:focus-visible {
    outline:
      4px solid
      rgba(240, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .timeline-reference-shell {
    width:
      min(1380px, 100%);
    margin: 0 auto;
  }

  .timeline-reference-heading {
    text-align: center;
  }

  .timeline-reference-heading > p {
    margin: 0;
    color: #ef6c55;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .timeline-reference-heading h1 {
    margin: 11px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(40px, 5vw, 62px);
    line-height: 1.18;
    letter-spacing: -0.06em;
  }

  .timeline-reference-heading > span {
    display: block;
    margin-top: 12px;
    color: #7b665d;
    font-size:
      clamp(14px, 1.5vw, 19px);
    line-height: 1.7;
  }

  .timeline-reference-status {
    margin-top: 25px;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .timeline-reference-status article {
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

  .timeline-reference-status article > span {
    color: #806c63;
    font-size: 11px;
    font-weight: 850;
  }

  .timeline-reference-status article > strong {
    color: #e46750;
    font-size: 22px;
  }

  .timeline-reference-status article small {
    margin-left: 3px;
    color: #8f7c72;
    font-size: 10px;
  }

  .timeline-reference-upload {
    margin-top: 18px;
    padding: 24px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.5fr)
      minmax(280px, 0.5fr);
    gap: 18px;
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

  .timeline-upload-form {
    min-width: 0;
  }

  .timeline-upload-dropzone {
    position: relative;
    min-height: 245px;
    padding: 24px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border:
      2px dashed
      #f08a74;
    border-radius: 23px;
    background:
      linear-gradient(
        145deg,
        #fffaf6,
        #fff4ed
      );
    cursor: pointer;
  }

  .timeline-upload-dropzone[data-has-file="true"] {
    border-style: solid;
    background: #fffdfb;
  }

  .timeline-upload-file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .timeline-upload-empty {
    text-align: center;
  }

  .timeline-upload-empty > span {
    width: 84px;
    height: 84px;
    margin: 0 auto;
    display: grid;
    place-items: center;
    border-radius: 26px;
    color: #ef6d56;
    background: #ffffff;
    box-shadow:
      0 13px 28px
      rgba(205, 91, 66, 0.12);
  }

  .timeline-upload-empty svg {
    width: 53px;
    height: 53px;
  }

  .timeline-upload-empty strong {
    display: block;
    margin-top: 13px;
    color: #ef6d56;
    font-size: 24px;
    letter-spacing: -0.035em;
  }

  .timeline-upload-empty p {
    margin: 7px 0 0;
    color: #715e55;
    font-size: 13px;
  }

  .timeline-upload-preview {
    position: relative;
    width: 100%;
    min-height: 200px;
    display: grid;
    grid-template-columns:
      minmax(180px, 0.72fr)
      minmax(0, 1.28fr);
    align-items: center;
    gap: 22px;
  }

  .timeline-upload-preview-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1.2 / 1;
    overflow: hidden;
    border-radius: 17px;
    background: #f2ece8;
  }

  .timeline-upload-preview-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .timeline-upload-preview-file {
    display: grid;
    gap: 9px;
    text-align: left;
  }

  .timeline-upload-preview-file strong {
    overflow: hidden;
    font-size: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .timeline-upload-preview-file span {
    color: #907b70;
    font-size: 12px;
  }

  .timeline-upload-preview-file button {
    width: max-content;
    min-height: 38px;
    padding: 0 13px;
    border:
      1px solid
      #e4b7a8;
    border-radius: 11px;
    color: #ba5946;
    background: #ffffff;
    font-size: 11px;
    font-weight: 850;
    cursor: pointer;
  }

  .timeline-upload-fields {
    margin-top: 14px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.2fr)
      minmax(180px, 0.8fr);
    gap: 11px;
  }

  .timeline-upload-field {
    min-width: 0;
    display: grid;
    gap: 7px;
  }

  .timeline-upload-field[data-full="true"] {
    grid-column: 1 / -1;
  }

  .timeline-upload-field label {
    color: #5d493f;
    font-size: 11px;
    font-weight: 900;
  }

  .timeline-upload-field input,
  .timeline-upload-field textarea {
    width: 100%;
    border:
      1px solid
      rgba(142, 99, 78, 0.2);
    border-radius: 13px;
    color: #47352d;
    background: #fffdfb;
    font: inherit;
  }

  .timeline-upload-field input {
    height: 47px;
    padding: 0 13px;
  }

  .timeline-upload-field textarea {
    min-height: 104px;
    padding: 12px 13px;
    resize: vertical;
    line-height: 1.65;
  }

  .timeline-upload-footer {
    margin-top: 13px;
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .timeline-upload-submit {
    min-width: 190px;
    min-height: 50px;
    padding: 0 20px;
    border: 0;
    border-radius: 14px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5e4f
      );
    box-shadow:
      0 13px 28px
      rgba(218, 83, 64, 0.2);
    font-size: 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .timeline-upload-submit:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .timeline-upload-message {
    color: #b85642;
    font-size: 12px;
    font-weight: 800;
  }

  .timeline-reference-upload-help {
    min-width: 0;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-radius: 22px;
    background:
      linear-gradient(
        155deg,
        #fff5de,
        #fffaf2
      );
  }

  .timeline-reference-help-icon {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    border-radius: 19px;
    color: #e26a53;
    background: #ffffff;
    box-shadow:
      0 11px 24px
      rgba(113, 73, 53, 0.08);
  }

  .timeline-reference-help-icon svg {
    width: 50px;
    height: 50px;
  }

  .timeline-reference-upload-help p {
    margin: 17px 0 0;
    color: #df6c54;
    font-size: 11px;
    font-weight: 900;
  }

  .timeline-reference-upload-help h2 {
    margin: 8px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 20px;
    line-height: 1.55;
    letter-spacing: -0.04em;
    word-break: keep-all;
  }

  .timeline-reference-upload-help ul {
    margin: 16px 0 0;
    padding-left: 20px;
    color: #6e5b52;
    font-size: 12px;
    line-height: 1.8;
  }

  .timeline-reference-ready {
    margin-top: 16px;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border:
      1px solid
      #c9d9ad;
    border-radius: 19px;
    background:
      linear-gradient(
        135deg,
        #f3f8e9,
        #fffdf7
      );
  }

  .timeline-reference-ready p {
    margin: 0;
    color: #4f7a3e;
    font-size: 10px;
    font-weight: 900;
  }

  .timeline-reference-ready strong {
    display: block;
    margin-top: 5px;
    font-size: 17px;
    line-height: 1.5;
  }

  .timeline-reference-ready div > span {
    display: block;
    margin-top: 3px;
    color: #75816d;
    font-size: 11px;
    line-height: 1.6;
  }

  .timeline-reference-ready > a {
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

  .timeline-reference-gallery {
    margin-top: 18px;
    padding: 26px;
    border:
      1px solid
      rgba(136, 94, 74, 0.12);
    border-radius: 27px;
    background:
      rgba(255, 255, 255, 0.9);
    box-shadow:
      0 17px 38px
      rgba(91, 59, 44, 0.055);
  }

  .timeline-reference-section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .timeline-reference-section-head p {
    margin: 0;
    color: #ea6b54;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.06em;
  }

  .timeline-reference-section-head h2 {
    margin: 7px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 28px;
    letter-spacing: -0.045em;
  }

  .timeline-reference-section-head div > span {
    display: block;
    margin-top: 6px;
    color: #7b685f;
    font-size: 12px;
    line-height: 1.65;
  }

  .timeline-reference-section-head > strong {
    min-height: 36px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #765c4f;
    background: #fff1e9;
    font-size: 11px;
  }

  .timeline-reference-year-list {
    margin-top: 24px;
    display: grid;
    gap: 30px;
  }

  .timeline-reference-year-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 13px;
  }

  .timeline-reference-year-title h3 {
    margin: 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 24px;
  }

  .timeline-reference-year-title span {
    color: #9a857a;
    font-size: 11px;
  }

  .timeline-reference-photo-grid {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .timeline-reference-photo-card {
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

  .timeline-reference-photo-card[data-complete="true"] {
    border-color: #a8ca9c;
  }

  .timeline-reference-photo-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1.12 / 1;
    overflow: hidden;
    background: #f1ebe7;
  }

  .timeline-reference-photo-image img {
    object-fit: contain;
    transform: scale(1.05);
  }

  .timeline-reference-no-image {
    height: 100%;
    display: grid;
    place-items: center;
    color: #90796d;
    font-size: 11px;
    font-weight: 850;
  }

  .timeline-reference-photo-state {
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

  .timeline-reference-photo-state[data-complete="true"] {
    background: #66885b;
  }

  .timeline-reference-photo-content {
    padding: 14px;
  }

  .timeline-reference-photo-content > time {
    color: #d0624c;
    font-size: 9px;
    font-weight: 850;
  }

  .timeline-reference-photo-content h4 {
    margin: 6px 0 0;
    overflow: hidden;
    font-size: 15px;
    line-height: 1.45;
    letter-spacing: -0.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .timeline-reference-photo-content > p {
    min-height: 39px;
    margin: 6px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #756158;
    font-size: 10px;
    line-height: 1.6;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .timeline-reference-badges {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .timeline-reference-badges > span {
    min-height: 23px;
    padding: 0 7px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #8e620a;
    background: #fff1c9;
    font-size: 8px;
    font-weight: 900;
  }

  .timeline-reference-badges > span[data-ready="true"] {
    color: #347046;
    background: #e8f5e9;
  }

  .timeline-reference-photo-actions {
    margin-top: 11px;
    padding-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(119, 84, 67, 0.09);
  }

  .timeline-reference-photo-actions button {
    min-height: 31px !important;
    padding: 0 10px !important;
    border-radius: 9px !important;
    font-size: 10px !important;
  }

  .timeline-reference-photo-content > small {
    display: block;
    margin-top: 8px;
    color: #a08c82;
    font-size: 8px;
  }

  .timeline-reference-empty {
    margin-top: 21px;
    padding: 21px;
    border:
      1px dashed
      #e5ad9b;
    border-radius: 20px;
    background: #fffaf7;
    text-align: center;
  }

  .timeline-reference-empty > p {
    margin: 0;
    color: #806c62;
    font-size: 12px;
  }

  .timeline-reference-sample-grid {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(6, minmax(0, 1fr));
    gap: 9px;
  }

  .timeline-reference-sample-grid article {
    min-width: 0;
    padding: 5px 5px 8px;
    border:
      1px solid
      rgba(134, 94, 74, 0.12);
    border-radius: 13px;
    background: #ffffff;
    text-align: left;
  }

  .timeline-reference-sample-grid article > div {
    position: relative;
    width: 100%;
    aspect-ratio: 1.08 / 1;
    overflow: hidden;
    border-radius: 9px;
  }

  .timeline-reference-sample-grid img {
    object-fit: cover;
  }

  .timeline-reference-sample-grid strong {
    display: block;
    margin-top: 6px;
    overflow: hidden;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .timeline-reference-sample-grid time {
    display: block;
    margin-top: 2px;
    color: #a28e84;
    font-size: 7px;
  }

  .timeline-reference-empty > a {
    min-height: 42px;
    margin-top: 17px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border-radius: 12px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ec604f
      );
    font-size: 11px;
    font-weight: 900;
  }

  .timeline-reference-footer {
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

  .timeline-reference-footer > a {
    min-height: 53px;
    padding: 0 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    border:
      1px solid
      #d3ae9e;
    border-radius: 14px;
    color: #705448;
    background: #ffffff;
    font-size: 14px;
    font-weight: 900;
  }

  .timeline-reference-footer
  .timeline-reference-next {
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

  @media (max-width: 1100px) {
    .timeline-reference-upload {
      grid-template-columns: 1fr;
    }

    .timeline-reference-upload-help {
      display: grid;
      grid-template-columns:
        68px minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }

    .timeline-reference-upload-help p {
      margin-top: 0;
    }

    .timeline-reference-photo-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .timeline-reference-sample-grid {
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 780px) {
    .timeline-reference-page {
      padding:
        22px
        13px
        38px;
    }

    .timeline-reference-status {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .timeline-reference-upload {
      padding: 15px;
      border-radius: 21px;
    }

    .timeline-upload-preview {
      grid-template-columns: 1fr;
    }

    .timeline-upload-fields {
      grid-template-columns: 1fr;
    }

    .timeline-upload-field[data-full="true"] {
      grid-column: auto;
    }

    .timeline-reference-ready {
      align-items: stretch;
      flex-direction: column;
    }

    .timeline-reference-ready > a {
      justify-content: center;
    }

    .timeline-reference-gallery {
      padding: 18px;
      border-radius: 21px;
    }

    .timeline-reference-photo-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 520px) {
    .timeline-reference-heading h1 {
      font-size: 37px;
    }

    .timeline-reference-heading > span {
      font-size: 13px;
    }

    .timeline-reference-status article {
      padding: 11px;
    }

    .timeline-reference-status article > span {
      font-size: 9px;
    }

    .timeline-reference-status article > strong {
      font-size: 18px;
    }

    .timeline-upload-dropzone {
      min-height: 210px;
      padding: 17px;
      border-radius: 18px;
    }

    .timeline-upload-empty > span {
      width: 69px;
      height: 69px;
      border-radius: 21px;
    }

    .timeline-upload-empty strong {
      font-size: 20px;
    }

    .timeline-upload-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .timeline-upload-submit {
      width: 100%;
    }

    .timeline-reference-upload-help {
      padding: 18px;
      grid-template-columns: 1fr;
    }

    .timeline-reference-section-head {
      align-items: stretch;
      flex-direction: column;
    }

    .timeline-reference-photo-grid {
      grid-template-columns: 1fr;
    }

    .timeline-reference-sample-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .timeline-reference-footer {
      padding: 12px;
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .timeline-reference-page a,
    .timeline-reference-page button {
      transition: none;
    }
  }
`;
