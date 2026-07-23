'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { FormEvent } from 'react';

type Props = {
  bookId: string;
  initialTitle: string;
  initialSubtitle?: string | null;
  initialSummary?: string | null;
  initialCoverText?: string | null;
  initialContent?: string | null;
};

type LocalBookDraft = {
  title: string;
  subtitle: string;
  summary: string;
  coverText: string;
  content: string;
  savedAt: string;
};

export default function EditBookDraftButton({
  bookId,
  initialTitle,
  initialSubtitle = '',
  initialSummary = '',
  initialCoverText = '',
  initialContent = '',
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);
  const [
    localSavedAt,
    setLocalSavedAt,
  ] = useState<string | null>(null);

  const [title, setTitle] =
    useState(initialTitle);
  const [subtitle, setSubtitle] =
    useState(initialSubtitle || '');
  const [summary, setSummary] =
    useState(initialSummary || '');
  const [coverText, setCoverText] =
    useState(initialCoverText || '');
  const [content, setContent] =
    useState(initialContent || '');

  const localDraftKey =
    `daldongne-book-draft:${bookId}`;

  const editorFormId =
    `book-draft-editor-form-${bookId}`;

  const hasUnsavedChanges =
    title.trim() !==
      initialTitle.trim() ||
    subtitle.trim() !==
      (initialSubtitle || '').trim() ||
    summary.trim() !==
      (initialSummary || '').trim() ||
    coverText.trim() !==
      (initialCoverText || '').trim() ||
    content.trim() !==
      (initialContent || '').trim();

  const resetToServerBook = () => {
    setTitle(initialTitle);
    setSubtitle(initialSubtitle || '');
    setSummary(initialSummary || '');
    setCoverText(initialCoverText || '');
    setContent(initialContent || '');
    setLocalSavedAt(null);
  };

  const openEditor = () => {
    const localDraft =
      readLocalBookDraft(localDraftKey);

    const draftIsDifferent =
      localDraft &&
      (
        localDraft.title.trim() !==
          initialTitle.trim() ||
        localDraft.subtitle.trim() !==
          (
            initialSubtitle || ''
          ).trim() ||
        localDraft.summary.trim() !==
          (
            initialSummary || ''
          ).trim() ||
        localDraft.coverText.trim() !==
          (
            initialCoverText || ''
          ).trim() ||
        localDraft.content.trim() !==
          (
            initialContent || ''
          ).trim()
      );

    if (
      localDraft &&
      draftIsDifferent
    ) {
      const savedDate =
        formatLocalDraftDate(
          localDraft.savedAt,
        );

      const recover =
        window.confirm(
          `저장하지 못한 임시 원고가 있습니다.\n임시저장 시간: ${savedDate}\n\n이 내용을 복구할까요?`,
        );

      if (recover) {
        setTitle(localDraft.title);
        setSubtitle(
          localDraft.subtitle,
        );
        setSummary(localDraft.summary);
        setCoverText(
          localDraft.coverText,
        );
        setContent(localDraft.content);
        setLocalSavedAt(
          localDraft.savedAt,
        );
        setIsOpen(true);
        return;
      }
    }

    clearLocalBookDraft(localDraftKey);
    resetToServerBook();
    setIsOpen(true);
  };

  const closeEditor =
    useCallback(() => {
      if (isSaving) {
        return;
      }

      if (hasUnsavedChanges) {
        const confirmed =
          window.confirm(
            '저장하지 않은 수정 내용이 있습니다.\n\n저장하지 않고 편집창을 닫을까요?',
          );

        if (!confirmed) {
          return;
        }
      }

      clearLocalBookDraft(
        localDraftKey,
      );
      setLocalSavedAt(null);
      setIsOpen(false);
    }, [
      isSaving,
      hasUnsavedChanges,
      localDraftKey,
    ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    const handleKeyboardShortcut = (
      event: KeyboardEvent,
    ) => {
      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key.toLowerCase() === 's'
      ) {
        event.preventDefault();

        if (
          !isSaving &&
          hasUnsavedChanges
        ) {
          const editorForm =
            document.getElementById(
              editorFormId,
            ) as HTMLFormElement | null;

          editorForm?.requestSubmit();
        }

        return;
      }

      if (event.key === 'Escape') {
        closeEditor();
      }
    };

    const handleBeforeUnload = (
      event: BeforeUnloadEvent,
    ) => {
      if (
        !hasUnsavedChanges ||
        isSaving
      ) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener(
      'keydown',
      handleKeyboardShortcut,
    );
    window.addEventListener(
      'beforeunload',
      handleBeforeUnload,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyboardShortcut,
      );
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload,
      );
    };
  }, [
    isOpen,
    isSaving,
    hasUnsavedChanges,
    closeEditor,
    editorFormId,
  ]);

  useEffect(() => {
    if (!isOpen || isSaving) {
      return;
    }

    if (!hasUnsavedChanges) {
      clearLocalBookDraft(
        localDraftKey,
      );
      setLocalSavedAt(null);
      return;
    }

    const timeoutId =
      window.setTimeout(() => {
        const savedAt =
          new Date().toISOString();

        const localDraft:
          LocalBookDraft = {
            title,
            subtitle,
            summary,
            coverText,
            content,
            savedAt,
          };

        try {
          window.localStorage.setItem(
            localDraftKey,
            JSON.stringify(
              localDraft,
            ),
          );
          setLocalSavedAt(savedAt);
        } catch {
          // 브라우저 저장소를 사용할 수 없으면
          // 서버 저장 기능은 유지합니다.
        }
      }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isOpen,
    isSaving,
    hasUnsavedChanges,
    localDraftKey,
    title,
    subtitle,
    summary,
    coverText,
    content,
  ]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (!title.trim()) {
      alert('책 제목을 입력해 주세요.');
      return;
    }

    if (!content.trim()) {
      alert('책 본문을 입력해 주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/book/${encodeURIComponent(
          bookId,
        )}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            subtitle:
              subtitle.trim(),
            summary: summary.trim(),
            coverText:
              coverText.trim(),
            content: content.trim(),
          }),
        },
      );

      const result =
        (await response.json()) as {
          ok?: boolean;
          message?: string;
        };

      if (
        !response.ok ||
        !result.ok
      ) {
        alert(
          result.message ||
            '책 원고를 저장하지 못했습니다.',
        );
        return;
      }

      clearLocalBookDraft(
        localDraftKey,
      );
      setLocalSavedAt(null);

      alert(
        result.message ||
          '책 원고를 저장했습니다.',
      );

      setIsOpen(false);
      router.refresh();
    } catch {
      alert(
        '책 원고를 저장하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="book-draft-editor-open"
      >
        원고 직접 수정
      </button>

      {isOpen ? (
        <div
          className="book-draft-editor-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="책 원고 직접 수정"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditor();
            }
          }}
        >
          <form
            id={editorFormId}
            className="book-draft-editor-form"
            onSubmit={handleSubmit}
          >
            <div className="book-draft-editor-header">
              <div>
                <p>원고 편집실</p>
                <h2>원고 직접 수정</h2>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={isSaving}
                aria-label="원고 편집 창 닫기"
                className="book-draft-editor-close"
              >
                ×
              </button>
            </div>

            <p className="book-draft-editor-guide">
              제목부터 본문까지 직접 수정할
              수 있습니다. 서버에 저장하기 전
              변경 내용은 이 브라우저에 자동으로
              임시 저장됩니다. Ctrl+S를 누르면
              서버에 즉시 저장됩니다.
            </p>

            <div
              className="book-draft-autosave-status"
              aria-live="polite"
            >
              {isSaving ? (
                <>
                  <span aria-hidden="true">
                    ●
                  </span>
                  서버에 원고를 저장하는
                  중입니다.
                </>
              ) : localSavedAt ? (
                <>
                  <span aria-hidden="true">
                    ✓
                  </span>
                  임시저장 완료:{' '}
                  {formatLocalDraftDate(
                    localSavedAt,
                  )}
                </>
              ) : hasUnsavedChanges ? (
                '변경 내용을 잠시 후 임시 저장합니다.'
              ) : (
                '현재 서버 원고와 동일합니다.'
              )}
            </div>

            <div className="book-draft-editor-fields">
              <label>
                <span>책 제목</span>
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  maxLength={120}
                  required
                />
                <small>
                  {title.length}/120
                </small>
              </label>

              <label>
                <span>부제</span>
                <input
                  value={subtitle}
                  onChange={(event) =>
                    setSubtitle(
                      event.target.value,
                    )
                  }
                  maxLength={200}
                />
                <small>
                  {subtitle.length}/200
                </small>
              </label>

              <label className="is-full">
                <span>책 소개</span>
                <textarea
                  value={summary}
                  onChange={(event) =>
                    setSummary(
                      event.target.value,
                    )
                  }
                  maxLength={2000}
                  rows={5}
                />
                <small>
                  {summary.length}/2,000
                </small>
              </label>

              <label className="is-full">
                <span>표지 문구</span>
                <textarea
                  value={coverText}
                  onChange={(event) =>
                    setCoverText(
                      event.target.value,
                    )
                  }
                  maxLength={500}
                  rows={4}
                />
                <small>
                  {coverText.length}/500
                </small>
              </label>

              <label className="is-full">
                <span>책 본문</span>
                <textarea
                  value={content}
                  onChange={(event) =>
                    setContent(
                      event.target.value,
                    )
                  }
                  maxLength={200000}
                  rows={20}
                  required
                  className="book-draft-content-input"
                />
                <small>
                  {content.length.toLocaleString(
                    'ko-KR',
                  )}
                  /200,000
                </small>
              </label>
            </div>

            <div className="book-draft-editor-actions">
              <button
                type="button"
                onClick={closeEditor}
                disabled={isSaving}
                className="is-cancel"
              >
                취소
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="is-save"
              >
                {isSaving
                  ? '저장 중...'
                  : '수정 내용 저장'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <style>{`
        .book-draft-editor-open {
          min-height: 46px;
          padding: 0 22px;
          border: 1px solid #d88770;
          border-radius: 999px;
          background: #ef8268;
          color: #ffffff;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .book-draft-editor-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          background:
            rgba(54, 34, 24, 0.58);
          backdrop-filter: blur(5px);
        }

        .book-draft-editor-form {
          width: min(920px, 100%);
          max-height: calc(100vh - 40px);
          padding: 26px;
          overflow-y: auto;
          border: 1px solid #efc9b8;
          border-radius: 26px;
          background: #fffdfb;
          box-shadow:
            0 28px 80px
            rgba(75, 42, 27, 0.25);
          color: #49352b;
        }

        .book-draft-editor-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .book-draft-editor-header p {
          margin: 0;
          color: #db765c;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .book-draft-editor-header h2 {
          margin: 6px 0 0;
          color: #49352b;
          font-size: 30px;
        }

        .book-draft-editor-close {
          width: 42px;
          height: 42px;
          border: 1px solid #efd1c2;
          border-radius: 50%;
          background: #fff4ee;
          color: #744c3d;
          font-size: 25px;
          cursor: pointer;
        }

        .book-draft-editor-guide {
          margin: 18px 0 10px;
          padding: 14px 16px;
          border-radius: 15px;
          background: #fff3ec;
          color: #725d52;
          font-size: 13px;
          line-height: 1.7;
        }

        .book-draft-autosave-status {
          min-height: 34px;
          margin-bottom: 18px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #ead9cf;
          border-radius: 12px;
          background: #fffdfb;
          color: #7d685e;
          font-size: 12px;
          font-weight: 800;
        }

        .book-draft-autosave-status span {
          color: #56805b;
        }

        .book-draft-editor-fields {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .book-draft-editor-fields label {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #5d4439;
          font-size: 13px;
          font-weight: 900;
        }

        .book-draft-editor-fields
        label.is-full {
          grid-column: 1 / -1;
        }

        .book-draft-editor-fields input,
        .book-draft-editor-fields textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dfc2b4;
          border-radius: 14px;
          background: #ffffff;
          color: #49352b;
          font-family:
            'Pretendard',
            'Noto Sans KR',
            sans-serif;
          font-size: 14px;
          line-height: 1.7;
          outline: none;
        }

        .book-draft-editor-fields input {
          height: 46px;
          padding: 0 14px;
        }

        .book-draft-editor-fields textarea {
          padding: 13px 14px;
          resize: vertical;
        }

        .book-draft-editor-fields
        input:focus,
        .book-draft-editor-fields
        textarea:focus {
          border-color: #e3876e;
          box-shadow:
            0 0 0 3px
            rgba(227, 135, 110, 0.12);
        }

        .book-draft-editor-fields small {
          align-self: flex-end;
          color: #a18a7f;
          font-size: 11px;
          font-weight: 700;
        }

        .book-draft-content-input {
          min-height: 420px;
          font-family:
            'Noto Serif KR',
            serif !important;
          font-size: 15px !important;
          line-height: 1.95 !important;
        }

        .book-draft-editor-actions {
          margin-top: 22px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .book-draft-editor-actions button {
          min-height: 44px;
          padding: 0 20px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .book-draft-editor-actions
        button.is-cancel {
          border: 1px solid #ddc5b9;
          background: #ffffff;
          color: #654b40;
        }

        .book-draft-editor-actions
        button.is-save {
          border: 1px solid #df7157;
          background: #ed7e63;
          color: #ffffff;
        }

        .book-draft-editor-actions
        button:disabled,
        .book-draft-editor-close:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        @media (max-width: 700px) {
          .book-draft-editor-overlay {
            padding: 10px;
            align-items: flex-start;
          }

          .book-draft-editor-form {
            max-height:
              calc(100vh - 20px);
            padding: 20px 15px;
            border-radius: 22px;
          }

          .book-draft-editor-header h2 {
            font-size: 25px;
          }

          .book-draft-editor-fields {
            grid-template-columns: 1fr;
          }

          .book-draft-editor-fields
          label.is-full {
            grid-column: auto;
          }

          .book-draft-content-input {
            min-height: 340px;
          }

          .book-draft-editor-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .book-draft-editor-actions button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

function readLocalBookDraft(
  key: string,
): LocalBookDraft | null {
  try {
    const raw =
      window.localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const value =
      JSON.parse(raw) as
        Partial<LocalBookDraft>;

    const isValid =
      typeof value.title ===
        'string' &&
      typeof value.subtitle ===
        'string' &&
      typeof value.summary ===
        'string' &&
      typeof value.coverText ===
        'string' &&
      typeof value.content ===
        'string' &&
      typeof value.savedAt ===
        'string';

    if (!isValid) {
      clearLocalBookDraft(key);
      return null;
    }

    return value as LocalBookDraft;
  } catch {
    clearLocalBookDraft(key);
    return null;
  }
}

function clearLocalBookDraft(
  key: string,
) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 브라우저 저장소를 사용할 수 없으면 무시합니다.
  }
}

function formatLocalDraftDate(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '시간 확인 필요';
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}
