"use client";

import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useState,
} from "react";

type ProductApplicationAdminNoteProps = {
  applicationId: string;
  initialNote: string;
  updatedAt: string | null;
};

type AdminNoteResponse = {
  ok?: boolean;
  message?: string;
  application?: {
    adminNote?: string | null;
    adminNoteUpdatedAt?: string | null;
  };
};

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

export default function ProductApplicationAdminNote({
  applicationId,
  initialNote,
  updatedAt,
}: ProductApplicationAdminNoteProps) {
  const router = useRouter();

  const [note, setNote] =
    useState(initialNote);

  const [savedNote, setSavedNote] =
    useState(initialNote);

  const [isSaving, setIsSaving] =
    useState(false);

  const [feedback, setFeedback] =
    useState<Feedback>(null);

  const hasChanged =
    note.trim() !== savedNote.trim();

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      isSaving ||
      !hasChanged
    ) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/product-applications/${encodeURIComponent(
          applicationId,
        )}/note`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            note,
          }),
        },
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as
          | AdminNoteResponse
          | null;

      if (
        !response.ok ||
        !data?.ok
      ) {
        setFeedback({
          type: "error",
          text:
            data?.message ||
            "관리자 메모를 저장하지 못했습니다.",
        });
        return;
      }

      const nextSavedNote =
        data.application?.adminNote ||
        "";

      setNote(nextSavedNote);
      setSavedNote(nextSavedNote);

      setFeedback({
        type: "success",
        text:
          data.message ||
          "관리자 내부 메모가 저장되었습니다.",
      });

      router.refresh();
    } catch (error) {
      console.error(
        "[PRODUCT_APPLICATION_ADMIN_NOTE_FORM_ERROR]",
        error,
      );

      setFeedback({
        type: "error",
        text:
          "관리자 메모 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      isSaving ||
      !savedNote
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "저장된 관리자 내부 메모를 삭제하시겠습니까?",
      );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/admin/product-applications/${encodeURIComponent(
          applicationId,
        )}/note`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            note: "",
          }),
        },
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as
          | AdminNoteResponse
          | null;

      if (
        !response.ok ||
        !data?.ok
      ) {
        setFeedback({
          type: "error",
          text:
            data?.message ||
            "관리자 메모를 삭제하지 못했습니다.",
        });
        return;
      }

      setNote("");
      setSavedNote("");

      setFeedback({
        type: "success",
        text:
          data.message ||
          "관리자 내부 메모가 삭제되었습니다.",
      });

      router.refresh();
    } catch (error) {
      console.error(
        "[PRODUCT_APPLICATION_ADMIN_NOTE_DELETE_ERROR]",
        error,
      );

      setFeedback({
        type: "error",
        text:
          "관리자 메모 삭제 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (
      isSaving ||
      !hasChanged
    ) {
      return;
    }

    setNote(savedNote);
    setFeedback(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="admin-note-panel"
    >
      <header className="admin-note-header">
        <div className="admin-note-title-area">
          <span className="admin-note-icon">
            <NoteIcon />
          </span>

          <div>
            <span>
              INTERNAL NOTE
            </span>

            <h3>
              관리자 내부 메모
            </h3>

            <p>
              고객 화면에는 표시되지
              않는 운영용 기록입니다.
            </p>
          </div>
        </div>

        <div className="admin-note-meta">
          {hasChanged ? (
            <strong>
              저장하지 않은 변경
            </strong>
          ) : (
            <span>
              저장된 상태
            </span>
          )}

          {updatedAt ? (
            <small>
              마지막 저장 {updatedAt}
            </small>
          ) : null}
        </div>
      </header>

      <label className="admin-note-field">
        <span>
          상담·처리 기록
        </span>

        <textarea
          value={note}
          onChange={(event) => {
            setNote(
              event.target.value,
            );
            setFeedback(null);
          }}
          maxLength={5000}
          placeholder="고객 연락 결과, 확인할 내용, 다음 처리 일정 등을 입력하세요."
        />
      </label>

      <div className="admin-note-footer">
        <div className="admin-note-count">
          <span>
            입력 글자 수
          </span>

          <strong>
            {note.length.toLocaleString(
              "ko-KR",
            )}
            /5,000
          </strong>
        </div>

        <div className="admin-note-actions">
          {hasChanged ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="admin-note-reset"
            >
              변경 취소
            </button>
          ) : null}

          {savedNote ? (
            <button
              type="button"
              onClick={() =>
                void handleDelete()
              }
              disabled={isSaving}
              className="admin-note-delete"
            >
              메모 삭제
            </button>
          ) : null}

          <button
            type="submit"
            disabled={
              isSaving ||
              !hasChanged
            }
            className="admin-note-save"
          >
            {isSaving ? (
              <>
                <span
                  className="admin-note-spinner"
                  aria-hidden="true"
                />
                저장 중...
              </>
            ) : (
              <>
                <SaveIcon />
                메모 저장
              </>
            )}
          </button>
        </div>
      </div>

      {feedback ? (
        <div
          role="status"
          aria-live="polite"
          data-type={
            feedback.type
          }
          className="admin-note-feedback"
        >
          <span aria-hidden="true">
            {feedback.type ===
            "success"
              ? "✓"
              : "!"}
          </span>

          <p>
            {feedback.text}
          </p>
        </div>
      ) : null}

      <style>
        {adminNoteStyles}
      </style>
    </form>
  );
}

function NoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 4h14v16H5V4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 4h12l2 2v14H5V4Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />

      <path
        d="M8 4v6h8V4M8 20v-6h8v6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const adminNoteStyles = `
  .admin-note-panel,
  .admin-note-panel * {
    box-sizing: border-box;
  }

  .admin-note-panel {
    margin-top: 16px;
    padding: 17px;
    border:
      1px solid
      rgba(126, 83, 63, 0.16);
    border-radius: 18px;
    background:
      linear-gradient(
        145deg,
        #fffaf5,
        #fffdfb
      );
    box-shadow:
      0 10px 26px
      rgba(76, 47, 34, 0.055);
  }

  .admin-note-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .admin-note-title-area {
    min-width: 0;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .admin-note-icon {
    width: 35px;
    height: 35px;
    padding: 9px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 11px;
    color: #b85e4d;
    background: #fff0e9;
  }

  .admin-note-icon svg {
    width: 100%;
    height: 100%;
  }

  .admin-note-title-area
  > div > span {
    display: block;
    color: #d3624e;
    font-size: 8.4px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .admin-note-title-area h3 {
    margin: 4px 0 0;
    color: #4f362d;
    font-size: 15.6px;
    letter-spacing: -0.035em;
  }

  .admin-note-title-area p {
    margin: 4px 0 0;
    color: #92796d;
    font-size: 9.6px;
    line-height: 1.6;
  }

  .admin-note-meta {
    display: grid;
    justify-items: end;
    gap: 4px;
    flex: 0 0 auto;
  }

  .admin-note-meta strong,
  .admin-note-meta > span {
    min-height: 27px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 8.4px;
    font-weight: 900;
  }

  .admin-note-meta strong {
    color: #965248;
    background: #fff0ed;
  }

  .admin-note-meta > span {
    color: #497457;
    background: #edf7f0;
  }

  .admin-note-meta small {
    color: #a08b80;
    font-size: 7.2px;
  }

  .admin-note-field {
    margin-top: 14px;
    display: block;
  }

  .admin-note-field > span {
    display: block;
    margin-bottom: 6px;
    color: #6b5146;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-note-field textarea {
    width: 100%;
    min-height: 132px;
    padding: 12px 13px;
    display: block;
    border:
      1px solid #d8c2b6;
    border-radius: 12px;
    color: #3f2d26;
    background: #ffffff;
    font: inherit;
    font-size: 10.8px;
    line-height: 1.75;
    resize: vertical;
    outline: none;
    box-shadow:
      inset 0 1px 3px
      rgba(76, 47, 34, 0.025);
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .admin-note-field textarea::placeholder {
    color: #b4a29a;
  }

  .admin-note-field textarea:focus {
    border-color: #cd806f;
    box-shadow:
      0 0 0 4px
      rgba(226, 112, 91, 0.12);
  }

  .admin-note-footer {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .admin-note-count {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #a08b80;
    font-size: 8.4px;
  }

  .admin-note-count strong {
    color: #74594e;
    font-size: 8.4px;
  }

  .admin-note-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .admin-note-actions button {
    min-height: 36px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 10px;
    font: inherit;
    font-size: 9.6px;
    font-weight: 900;
    cursor: pointer;
    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      opacity 150ms ease;
  }

  .admin-note-actions button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .admin-note-actions button:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 2px;
  }

  .admin-note-actions button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .admin-note-reset {
    border:
      1px solid #d7c2b8;
    color: #73594f;
    background: #ffffff;
  }

  .admin-note-delete {
    border:
      1px solid #d9aaa4;
    color: #964b43;
    background: #fff2f0;
  }

  .admin-note-save {
    border:
      1px solid #744037;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #82483d,
        #6e382f
      );
    box-shadow:
      0 7px 15px
      rgba(103, 51, 43, 0.12);
  }

  .admin-note-save:hover:not(:disabled) {
    box-shadow:
      0 10px 19px
      rgba(103, 51, 43, 0.17);
  }

  .admin-note-save svg {
    width: 13px;
    height: 13px;
  }

  .admin-note-spinner {
    width: 12px;
    height: 12px;
    border:
      2px solid
      rgba(255, 255, 255, 0.38);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation:
      admin-note-spin 700ms
      linear infinite;
  }

  .admin-note-feedback {
    margin-top: 11px;
    padding: 10px 11px;
    display: grid;
    grid-template-columns:
      22px minmax(0, 1fr);
    align-items: start;
    gap: 8px;
    border:
      1px solid #a9cfb3;
    border-radius: 11px;
    color: #2f6743;
    background: #edf8f0;
  }

  .admin-note-feedback[data-type="error"] {
    border-color: #e0b0aa;
    color: #8d4039;
    background: #fff1ef;
  }

  .admin-note-feedback > span {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #ffffff;
    background: #57936a;
    font-size: 9.6px;
    font-weight: 900;
  }

  .admin-note-feedback[data-type="error"]
  > span {
    background: #bd655b;
  }

  .admin-note-feedback p {
    margin: 1px 0 0;
    font-size: 8.4px;
    font-weight: 800;
    line-height: 1.7;
  }

  @keyframes admin-note-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 620px) {
    .admin-note-header,
    .admin-note-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-note-meta {
      justify-items: start;
    }

    .admin-note-actions {
      width: 100%;
    }

    .admin-note-actions button {
      flex: 1 1 auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-note-actions button {
      transition: none;
    }

    .admin-note-spinner {
      animation: none;
    }
  }
`;
