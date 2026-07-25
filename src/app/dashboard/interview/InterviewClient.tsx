"use client";

import DeleteMemoryButton from "@/components/memory/DeleteMemoryButton";
import EditMemoryButton from "@/components/memory/EditMemoryButton";
import Image from "next/image";
import {
  useMemo,
  useState,
} from "react";
import VoiceButton from "./VoiceButton";

type PhotoItem = {
  id: string;
  title: string;
  occurredAt: string | null;
  createdAt: string;
};

type AnswerItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

type Props = {
  photos: PhotoItem[];
  answers: AnswerItem[];
  submitAnswer: (
    formData: FormData,
  ) => Promise<void>;
};

export default function InterviewClient({
  photos,
  answers,
  submitAnswer,
}: Props) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] =
    useState(0);

  const [storyTitle, setStoryTitle] =
    useState("");

  const [whenText, setWhenText] =
    useState("");

  const [peopleText, setPeopleText] =
    useState("");

  const [memoryText, setMemoryText] =
    useState("");

  const [mode, setMode] =
    useState("warm");

  const [isEditing, setIsEditing] =
    useState(false);

  const [isModeModalOpen, setIsModeModalOpen] =
    useState(false);

  const selectedPhoto =
    photos[selectedPhotoIndex] || null;

  const photoDate = useMemo(() => {
    if (!selectedPhoto) {
      return "";
    }

    return formatDate(
      selectedPhoto.occurredAt ||
        selectedPhoto.createdAt,
    );
  }, [selectedPhoto]);

  const movePhoto = (
    direction: -1 | 1,
  ) => {
    if (photos.length < 2) {
      return;
    }

    setSelectedPhotoIndex((current) => {
      const next =
        current + direction;

      if (next < 0) {
        return photos.length - 1;
      }

      if (next >= photos.length) {
        return 0;
      }

      return next;
    });
  };

  const handleAiEdit = async () => {
    if (isEditing) {
      return;
    }

    const text =
      memoryText.trim();

    if (!text) {
      alert(
        "먼저 기억나는 이야기를 입력해 주세요.",
      );
      return;
    }

    setIsEditing(true);

    try {
      const response = await fetch(
        "/api/ai/edit-story",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text,
            mode,
          }),
        },
      );

      const result =
        (await response.json()) as {
          ok?: boolean;
          editedText?: string;
          message?: string;
        };

      if (
        !response.ok ||
        !result.ok ||
        !result.editedText
      ) {
        alert(
          result.message ||
            "AI가 이야기를 다듬지 못했습니다.",
        );
        return;
      }

      setMemoryText(
        result.editedText,
      );
    } catch {
      alert(
        "AI로 이야기를 다듬는 중 오류가 발생했습니다.",
      );
    } finally {
      setIsEditing(false);
    }
  };

  const handleVoiceText = (
    text: string,
  ) => {
    setMemoryText((current) =>
      current.trim()
        ? `${current.trim()}\n${text}`
        : text,
    );
  };

  return (
    <div className="interview-composer">
      <div className="interview-composer-heading">
        <p>사진을 보며 천천히 적어보세요</p>
        <h2>사진 속 이야기를 들려주세요</h2>
      </div>

      <div className="interview-composer-grid">
        <section className="interview-photo-viewer">
          {selectedPhoto ? (
            <>
              <div className="interview-photo-frame">
                <Image
                  src={`/api/blob/${selectedPhoto.id}`}
                  alt={
                    selectedPhoto.title ||
                    "선택한 이야기 사진"
                  }
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 800px) 100vw, 48vw"
                />
              </div>

              <div className="interview-photo-caption">
                <strong>
                  {selectedPhoto.title ||
                    "제목 없는 사진"}
                </strong>

                <span>
                  {photoDate}
                </span>
              </div>

              <div className="interview-photo-navigation">
                <button
                  type="button"
                  onClick={() =>
                    movePhoto(-1)
                  }
                  disabled={
                    photos.length < 2
                  }
                >
                  <span aria-hidden="true">‹</span>
                  이전
                </button>

                <strong>
                  사진{" "}
                  {selectedPhotoIndex + 1} /{" "}
                  {photos.length}
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    movePhoto(1)
                  }
                  disabled={
                    photos.length < 2
                  }
                >
                  다음
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            </>
          ) : (
            <div className="interview-photo-empty">
              <div>
                <Image
                  src="/dashboard/interview-reference-v1/sample-family-story.webp"
                  alt="가족 이야기 작성 예시 사진"
                  fill
                  sizes="(max-width: 800px) 100vw, 48vw"
                />
              </div>

              <strong>
                아직 등록된 사진이 없습니다.
              </strong>

              <p>
                사진 올리기 화면에서 첫
                사진을 등록해 주세요.
              </p>

              <a href="/dashboard/timeline">
                사진 올리기로 이동
              </a>
            </div>
          )}
        </section>

        <section className="interview-question-panel">
          <form action={submitAnswer}>
            <input
              type="hidden"
              name="selectedPhotoTitle"
              value={
                selectedPhoto?.title ||
                ""
              }
            />

            <StoryField
              icon="title"
              label="이 이야기의 제목은 무엇인가요?"
            >
              <input
                type="text"
                name="storyTitle"
                value={storyTitle}
                onChange={(event) =>
                  setStoryTitle(
                    event.target.value,
                  )
                }
                placeholder={
                  selectedPhoto?.title
                    ? `예: ${selectedPhoto.title}의 기억`
                    : "예: 우리 가족의 따뜻한 봄날"
                }
              />
            </StoryField>

            <StoryField
              icon="date"
              label="언제 찍은 사진인가요?"
            >
              <input
                type="text"
                name="whenText"
                value={whenText}
                onChange={(event) =>
                  setWhenText(
                    event.target.value,
                  )
                }
                placeholder={
                  photoDate
                    ? `예: ${photoDate}, 우리 동네에서`
                    : "예: 1980년 봄, 재개발 전 우리 동네에서"
                }
              />
            </StoryField>

            <StoryField
              icon="people"
              label="누구와 함께 있었나요?"
            >
              <input
                type="text"
                name="peopleText"
                value={peopleText}
                onChange={(event) =>
                  setPeopleText(
                    event.target.value,
                  )
                }
                placeholder="예: 할머니, 엄마, 오빠, 나"
              />
            </StoryField>

            <StoryField
              icon="heart"
              label="어떤 기억이 떠오르나요?"
            >
              <textarea
                name="memoryText"
                value={memoryText}
                onChange={(event) =>
                  setMemoryText(
                    event.target.value,
                  )
                }
                placeholder="그날의 분위기, 같이 했던 일, 가장 기억에 남는 순간과 지금의 마음을 적어주세요."
                maxLength={1200}
              />

              <small>
                {memoryText.length} / 1200
              </small>
            </StoryField>

            <div className="interview-writing-tools">
              <VoiceButton
                onTranscribed={
                  handleVoiceText
                }
              />

              <button
                type="button"
                onClick={() =>
                  setIsModeModalOpen(true)
                }
                className="interview-mode-button"
              >
                글 다듬기 방식 ·{" "}
                {getModeLabel(mode)}
              </button>

              <button
                type="button"
                onClick={handleAiEdit}
                disabled={
                  isEditing ||
                  !memoryText.trim()
                }
                className="interview-ai-button"
              >
                {isEditing
                  ? "AI가 다듬는 중..."
                  : "AI로 다듬기"}
              </button>
            </div>

            <button
              type="submit"
              disabled={
                !memoryText.trim()
              }
              className="interview-save-button"
            >
              이야기 저장하기
              <span aria-hidden="true">
                →
              </span>
            </button>
          </form>
        </section>
      </div>

      <section className="interview-saved-stories">
        <div>
          <p>남겨진 이야기</p>

          <h2>
            지금까지{" "}
            {answers.length}개의 이야기가
            저장되었습니다
          </h2>
        </div>

        {answers.length > 0 ? (
          <div className="interview-saved-story-list">
            {answers.map((item) => (
              <article key={item.id}>
                <time>
                  {formatDate(
                    item.createdAt,
                  )}
                </time>

                <h3>
                  {displayStoryTitle(
                    item.title,
                  )}
                </h3>

                <p>
                  {item.description}
                </p>

                <div>
                  <EditMemoryButton
                    memoryId={item.id}
                    initialTitle={
                      displayStoryTitle(
                        item.title,
                      )
                    }
                    initialDescription={
                      item.description ||
                      ""
                    }
                    label="이야기 수정"
                  />

                  <DeleteMemoryButton
                    memoryId={item.id}
                    label="이야기 삭제"
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="interview-saved-empty">
            아직 저장된 이야기가 없습니다.
            첫 이야기를 남겨보세요.
          </p>
        )}
      </section>

      {isModeModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="interview-mode-title"
          className="interview-mode-overlay"
          onClick={() =>
            setIsModeModalOpen(false)
          }
        >
          <div
            className="interview-mode-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              aria-label="글 다듬기 방식 닫기"
              className="interview-mode-close"
              onClick={() =>
                setIsModeModalOpen(false)
              }
            >
              ×
            </button>

            <p>글 다듬기 방식</p>

            <h2 id="interview-mode-title">
              어떤 느낌의 문장으로
              <br />
              다듬어드릴까요?
            </h2>

            <span>
              이야기 내용은 바꾸지 않고
              표현과 문장 흐름만
              정리합니다.
            </span>

            <div>
              <ModeSelectButton
                label="따뜻하게"
                description="정감 있고 편안한 문장으로 다듬습니다."
                active={
                  mode === "warm"
                }
                onClick={() => {
                  setMode("warm");
                  setIsModeModalOpen(
                    false,
                  );
                }}
              />

              <ModeSelectButton
                label="책 원고처럼"
                description="책에 바로 담기 좋은 자연스러운 문장으로 정리합니다."
                active={
                  mode === "book"
                }
                onClick={() => {
                  setMode("book");
                  setIsModeModalOpen(
                    false,
                  );
                }}
              />

              <ModeSelectButton
                label="편지처럼"
                description="누군가에게 마음을 전하는 편지 문체로 다듬습니다."
                active={
                  mode === "letter"
                }
                onClick={() => {
                  setMode("letter");
                  setIsModeModalOpen(
                    false,
                  );
                }}
              />

              <ModeSelectButton
                label="짧고 담백하게"
                description="군더더기를 줄이고 간결한 문장으로 정리합니다."
                active={
                  mode === "short"
                }
                onClick={() => {
                  setMode("short");
                  setIsModeModalOpen(
                    false,
                  );
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <style>{interviewComposerStyles}</style>
    </div>
  );
}

function StoryField({
  icon,
  label,
  children,
}: {
  icon:
    | "title"
    | "date"
    | "people"
    | "heart";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="interview-story-field">
      <span
        className="interview-story-field-icon"
        aria-hidden="true"
      >
        <StoryIcon name={icon} />
      </span>

      <strong>{label}</strong>

      <span className="interview-story-control">
        {children}
      </span>
    </label>
  );
}

function StoryIcon({
  name,
}: {
  name:
    | "title"
    | "date"
    | "people"
    | "heart";
}) {
  if (name === "date") {
    return (
      <svg viewBox="0 0 40 40" fill="none">
        <rect
          x="7"
          y="9"
          width="26"
          height="25"
          rx="5"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path
          d="M12 6v7M28 6v7M7 16h26M13 22h4M23 22h4M13 28h4M23 28h4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "people") {
    return (
      <svg viewBox="0 0 40 40" fill="none">
        <circle
          cx="15"
          cy="14"
          r="6"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <circle
          cx="28"
          cy="15"
          r="5"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path
          d="M5 34c0-7 3.8-11 10-11s10 4 10 11M22 34c0-6 2.7-9 7-9s7 3 7 9"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M20 34 7.5 21.7C1.8 16 5.6 7 13.4 7c3 0 5.2 1.5 6.6 3.6C21.4 8.5 23.6 7 26.6 7c7.8 0 11.6 9 5.9 14.7L20 34Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" fill="none">
      <path
        d="M8 9h24v22H8z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M13 15h14M13 20h14M13 25h9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ModeSelectButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-active={
        active ? "true" : "false"
      }
      onClick={onClick}
      className="interview-mode-option"
    >
      <strong>
        {active ? "✓ " : ""}
        {label}
      </strong>

      <span>{description}</span>
    </button>
  );
}

function getModeLabel(mode: string) {
  switch (mode) {
    case "book":
      return "책 원고처럼";
    case "letter":
      return "편지처럼";
    case "short":
      return "짧고 담백하게";
    default:
      return "따뜻하게";
  }
}

function displayStoryTitle(
  title: string,
) {
  return title
    .replace(
      /^AI 인터뷰:/,
      "이야기:",
    )
    .replace(
      /^이야기 · /,
      "",
    );
}

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(date);
}

const interviewComposerStyles = `
  .interview-composer,
  .interview-composer * {
    box-sizing: border-box;
  }

  .interview-composer-heading {
    text-align: center;
  }

  .interview-composer-heading p {
    margin: 0;
    color: #e86c55;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .interview-composer-heading h2 {
    margin: 8px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(30px, 4vw, 45px);
    line-height: 1.3;
    letter-spacing: -0.055em;
  }

  .interview-composer-grid {
    margin-top: 22px;
    display: grid;
    grid-template-columns:
      minmax(380px, 0.95fr)
      minmax(0, 1.05fr);
    gap: 26px;
    align-items: stretch;
  }

  .interview-photo-viewer {
    min-width: 0;
    padding-right: 25px;
    border-right:
      1px dashed
      rgba(152, 103, 79, 0.23);
  }

  .interview-photo-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 1.34 / 1;
    overflow: hidden;
    border:
      7px solid
      #ffffff;
    border-radius: 19px;
    background: #f2ebe7;
    box-shadow:
      0 15px 32px
      rgba(83, 54, 42, 0.13);
  }

  .interview-photo-frame img {
    object-fit: contain;
  }

  .interview-photo-caption {
    margin-top: 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .interview-photo-caption strong {
    overflow: hidden;
    font-size: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .interview-photo-caption span {
    flex: 0 0 auto;
    color: #9b8479;
    font-size: 10px;
  }

  .interview-photo-navigation {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      110px minmax(0, 1fr) 110px;
    align-items: center;
    gap: 10px;
  }

  .interview-photo-navigation button {
    min-height: 43px;
    border:
      1px solid
      #dcc2b6;
    border-radius: 999px;
    color: #6e5044;
    background: #ffffff;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .interview-photo-navigation button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .interview-photo-navigation strong {
    text-align: center;
    font-size: 14px;
  }

  .interview-photo-empty {
    min-height: 440px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }

  .interview-photo-empty > div {
    position: relative;
    width: 100%;
    aspect-ratio: 1.4 / 1;
    overflow: hidden;
    border-radius: 18px;
  }

  .interview-photo-empty img {
    object-fit: cover;
    filter: saturate(0.82);
    opacity: 0.78;
  }

  .interview-photo-empty > strong {
    margin-top: 14px;
    font-size: 17px;
  }

  .interview-photo-empty > p {
    margin: 6px 0 0;
    color: #816d63;
    font-size: 12px;
  }

  .interview-photo-empty > a {
    min-height: 42px;
    margin-top: 14px;
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
    text-decoration: none;
  }

  .interview-question-panel {
    min-width: 0;
  }

  .interview-question-panel form {
    display: grid;
    gap: 17px;
  }

  .interview-story-field {
    position: relative;
    display: grid;
    grid-template-columns:
      48px minmax(0, 1fr);
    align-items: center;
    column-gap: 14px;
  }

  .interview-story-field-icon {
    width: 48px;
    height: 48px;
    grid-row: 1 / span 2;
    display: grid;
    place-items: center;
    align-self: start;
    border-radius: 15px;
    color: #ef7058;
    background: #fff0e8;
  }

  .interview-story-field-icon svg {
    width: 30px;
    height: 30px;
  }

  .interview-story-field > strong {
    color: #4d382f;
    font-size: 15px;
    line-height: 1.5;
  }

  .interview-story-control {
    position: relative;
    display: block;
    margin-top: 7px;
  }

  .interview-story-control input,
  .interview-story-control textarea {
    width: 100%;
    border:
      1px solid
      rgba(145, 100, 78, 0.28);
    border-radius: 13px;
    color: #49352d;
    background: #fffdfb;
    font: inherit;
  }

  .interview-story-control input {
    height: 49px;
    padding: 0 14px;
  }

  .interview-story-control textarea {
    min-height: 138px;
    padding: 13px 14px 29px;
    resize: vertical;
    line-height: 1.7;
  }

  .interview-story-control > small {
    position: absolute;
    right: 12px;
    bottom: 9px;
    color: #9a877e;
    font-size: 9px;
  }

  .interview-writing-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-left: 62px;
  }

  .interview-writing-tools > button {
    min-height: 42px !important;
    padding: 0 15px !important;
    border-radius: 12px !important;
    font-size: 11px !important;
    font-weight: 900 !important;
  }

  .interview-writing-tools
  > button:first-child {
    border:
      1px solid
      #ef9d87 !important;
    color: #d65d48 !important;
    background:
      #fff9f5 !important;
  }

  .interview-mode-button {
    border:
      1px solid
      #d8b7a8;
    color: #765448;
    background: #ffffff;
    cursor: pointer;
  }

  .interview-ai-button {
    border: 0;
    color: #ffffff;
    background: #4c3931;
    cursor: pointer;
  }

  .interview-ai-button:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  .interview-save-button {
    min-height: 54px;
    margin-left: 62px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
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
      0 14px 28px
      rgba(218, 82, 63, 0.19);
    font-size: 15px;
    font-weight: 900;
    cursor: pointer;
  }

  .interview-save-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .interview-saved-stories {
    margin-top: 26px;
    padding-top: 23px;
    border-top:
      1px solid
      rgba(134, 92, 72, 0.12);
  }

  .interview-saved-stories > div:first-child > p {
    margin: 0;
    color: #e36a53;
    font-size: 10px;
    font-weight: 900;
  }

  .interview-saved-stories > div:first-child > h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 24px;
    line-height: 1.4;
    letter-spacing: -0.04em;
  }

  .interview-saved-story-list {
    margin-top: 15px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 11px;
  }

  .interview-saved-story-list article {
    min-width: 0;
    padding: 16px;
    border:
      1px solid
      rgba(137, 96, 74, 0.13);
    border-radius: 16px;
    background: #fffaf6;
  }

  .interview-saved-story-list time {
    color: #d66550;
    font-size: 9px;
    font-weight: 850;
  }

  .interview-saved-story-list h3 {
    margin: 6px 0 0;
    font-size: 15px;
    line-height: 1.45;
  }

  .interview-saved-story-list p {
    min-height: 61px;
    margin: 7px 0 0;
    display: -webkit-box;
    overflow: hidden;
    white-space: pre-line;
    color: #715d54;
    font-size: 11px;
    line-height: 1.7;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .interview-saved-story-list article > div {
    margin-top: 11px;
    padding-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    border-top:
      1px solid
      rgba(119, 84, 67, 0.09);
  }

  .interview-saved-story-list button {
    min-height: 31px !important;
    padding: 0 10px !important;
    border-radius: 9px !important;
    font-size: 10px !important;
  }

  .interview-saved-empty {
    margin: 14px 0 0;
    padding: 18px;
    border:
      1px dashed
      #ddbaa9;
    border-radius: 14px;
    color: #7c675e;
    background: #fffaf7;
    font-size: 12px;
  }

  .interview-mode-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    padding: 20px;
    display: grid;
    place-items: center;
    background:
      rgba(43, 33, 24, 0.52);
    backdrop-filter: blur(5px);
  }

  .interview-mode-modal {
    position: relative;
    width:
      min(480px, 100%);
    max-height:
      calc(100vh - 40px);
    padding: 36px 28px 28px;
    overflow-y: auto;
    border:
      1px solid
      rgba(124, 84, 49, 0.2);
    border-radius: 27px;
    background:
      linear-gradient(
        145deg,
        #fffdf8,
        #fff5e7
      );
    box-shadow:
      0 28px 70px
      rgba(52, 35, 22, 0.28);
    text-align: center;
  }

  .interview-mode-close {
    position: absolute;
    top: 14px;
    right: 16px;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 50%;
    color: #765d49;
    background:
      rgba(105, 75, 48, 0.08);
    font-size: 25px;
    cursor: pointer;
  }

  .interview-mode-modal > p {
    margin: 0;
    color: #a67145;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .interview-mode-modal > h2 {
    margin: 9px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 29px;
    line-height: 1.4;
    letter-spacing: -0.04em;
  }

  .interview-mode-modal > span {
    display: block;
    margin-top: 12px;
    color: #715e50;
    font-size: 13px;
    line-height: 1.7;
  }

  .interview-mode-modal > div {
    margin-top: 20px;
    display: grid;
    gap: 9px;
  }

  .interview-mode-option {
    width: 100%;
    padding: 14px 16px;
    border:
      1px solid
      rgba(145, 100, 57, 0.2);
    border-radius: 16px;
    color: #3f3025;
    background:
      rgba(255, 255, 255, 0.72);
    text-align: left;
    cursor: pointer;
  }

  .interview-mode-option[data-active="true"] {
    border-color: #e78d73;
    background: #ffe7dc;
  }

  .interview-mode-option strong,
  .interview-mode-option span {
    display: block;
  }

  .interview-mode-option strong {
    font-size: 14px;
  }

  .interview-mode-option span {
    margin-top: 4px;
    color: #786555;
    font-size: 11px;
    line-height: 1.55;
  }

  @media (max-width: 980px) {
    .interview-composer-grid {
      grid-template-columns: 1fr;
    }

    .interview-photo-viewer {
      padding-right: 0;
      padding-bottom: 23px;
      border-right: 0;
      border-bottom:
        1px dashed
        rgba(152, 103, 79, 0.23);
    }
  }

  @media (max-width: 620px) {
    .interview-composer-heading h2 {
      font-size: 31px;
    }

    .interview-story-field {
      grid-template-columns:
        39px minmax(0, 1fr);
      column-gap: 10px;
    }

    .interview-story-field-icon {
      width: 39px;
      height: 39px;
      border-radius: 12px;
    }

    .interview-story-field-icon svg {
      width: 25px;
      height: 25px;
    }

    .interview-story-field > strong {
      font-size: 13px;
    }

    .interview-writing-tools,
    .interview-save-button {
      padding-left: 0;
      margin-left: 0;
    }

    .interview-writing-tools {
      display: grid;
      grid-template-columns: 1fr;
    }

    .interview-writing-tools > button {
      width: 100%;
      justify-content: center;
    }

    .interview-photo-navigation {
      grid-template-columns:
        88px minmax(0, 1fr) 88px;
    }

    .interview-saved-story-list {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .interview-composer button,
    .interview-composer a {
      transition: none;
    }
  }
`;
