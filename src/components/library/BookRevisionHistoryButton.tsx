'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  bookId: string;
};

type BookRevision = {
  id: string;
  title: string;
  summary: string | null;
  pageCount: number | null;
  createdAt: string;
};

type BookRevisionDetail =
  BookRevision & {
    subtitle: string | null;
    coverText: string | null;
    content: string | null;
  };

export default function BookRevisionHistoryButton({
  bookId,
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [restoringId, setRestoringId] =
    useState<string | null>(null);

  const [
    previewLoadingId,
    setPreviewLoadingId,
  ] = useState<string | null>(null);

  const [
    previewRevision,
    setPreviewRevision,
  ] = useState<BookRevisionDetail | null>(
    null,
  );

  const [errorMessage, setErrorMessage] =
    useState('');

  const [revisions, setRevisions] =
    useState<BookRevision[]>([]);

  const isBusy = Boolean(
    restoringId || previewLoadingId,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key !== 'Escape' ||
        isBusy
      ) {
        return;
      }

      if (previewRevision) {
        setPreviewRevision(null);
        return;
      }

      setIsOpen(false);
    };

    window.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [
    isOpen,
    isBusy,
    previewRevision,
  ]);

  const loadRevisions = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/book/${encodeURIComponent(
          bookId,
        )}/revisions`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      );

      const result =
        (await response.json()) as {
          ok?: boolean;
          message?: string;
          revisions?: BookRevision[];
        };

      if (!response.ok || !result.ok) {
        setErrorMessage(
          result.message ||
            '원고 수정 이력을 불러오지 못했습니다.',
        );
        return;
      }

      setRevisions(
        Array.isArray(result.revisions)
          ? result.revisions
          : [],
      );
    } catch {
      setErrorMessage(
        '원고 수정 이력을 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setPreviewRevision(null);
    setErrorMessage('');
    setIsOpen(true);
    void loadRevisions();
  };

  const closeModal = () => {
    if (isBusy) {
      return;
    }

    setPreviewRevision(null);
    setIsOpen(false);
  };

  const loadPreview = async (
    revision: BookRevision,
  ) => {
    if (isBusy) {
      return;
    }

    setPreviewLoadingId(revision.id);
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/book/${encodeURIComponent(
          bookId,
        )}/revisions/${encodeURIComponent(
          revision.id,
        )}`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      );

      const result =
        (await response.json()) as {
          ok?: boolean;
          message?: string;
          revision?: BookRevisionDetail;
        };

      if (
        !response.ok ||
        !result.ok ||
        !result.revision
      ) {
        setErrorMessage(
          result.message ||
            '이전 원고를 불러오지 못했습니다.',
        );
        return;
      }

      setPreviewRevision(
        result.revision,
      );
    } catch {
      setErrorMessage(
        '이전 원고를 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const restoreRevision = async (
    revision: BookRevision,
  ) => {
    if (isBusy) {
      return;
    }

    const confirmed = window.confirm(
      `"${revision.title}" 이전 원고로 복원할까요?\n\n현재 원고도 수정 이력에 자동으로 보관됩니다.`,
    );

    if (!confirmed) {
      return;
    }

    setRestoringId(revision.id);
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/book/${encodeURIComponent(
          bookId,
        )}/revisions`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            revisionId: revision.id,
          }),
        },
      );

      const result =
        (await response.json()) as {
          ok?: boolean;
          message?: string;
        };

      if (!response.ok || !result.ok) {
        setErrorMessage(
          result.message ||
            '이전 원고를 복원하지 못했습니다.',
        );
        return;
      }

      alert(
        result.message ||
          '이전 원고로 복원했습니다.',
      );

      setPreviewRevision(null);
      setIsOpen(false);
      router.refresh();
    } catch {
      setErrorMessage(
        '이전 원고를 복원하는 중 오류가 발생했습니다.',
      );
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="book-revision-open-button"
      >
        수정 이력·복원
      </button>

      {isOpen ? (
        <div
          className="book-revision-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !isBusy
            ) {
              closeModal();
            }
          }}
        >
          <section
            className="book-revision-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-revision-title"
          >
            <div className="book-revision-header">
              <div>
                <p>원고 안전 보관함</p>

                <h2 id="book-revision-title">
                  {previewRevision
                    ? '이전 원고 미리보기'
                    : '수정 이력·복원'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isBusy}
                aria-label="수정 이력 닫기"
              >
                ×
              </button>
            </div>

            <p className="book-revision-guide">
              {previewRevision
                ? '복원하기 전에 제목, 표지 문구와 본문 전체를 확인하세요.'
                : '원고를 저장하기 전 내용이 보관되어 있습니다. 복원해도 현재 원고는 다시 이력에 보관됩니다.'}
            </p>

            {errorMessage ? (
              <p
                className="book-revision-error"
                aria-live="polite"
              >
                {errorMessage}
              </p>
            ) : null}

            {previewLoadingId ? (
              <div className="book-revision-empty">
                이전 원고 전체 내용을
                불러오는 중입니다.
              </div>
            ) : previewRevision ? (
              <RevisionPreview
                revision={previewRevision}
              />
            ) : isLoading ? (
              <div className="book-revision-empty">
                수정 이력을 불러오는 중입니다.
              </div>
            ) : revisions.length === 0 ? (
              <div className="book-revision-empty">
                아직 저장된 수정 이력이 없습니다.
                원고를 한 번 수정하면 이전 내용이
                이곳에 보관됩니다.
              </div>
            ) : (
              <div className="book-revision-list">
                {revisions.map(
                  (revision, index) => (
                    <article
                      key={revision.id}
                      className="book-revision-card"
                    >
                      <div className="book-revision-card-meta">
                        <span>
                          {index === 0
                            ? '가장 최근 이력'
                            : `이전 이력 ${
                                index + 1
                              }`}
                        </span>

                        <time>
                          {formatRevisionDate(
                            revision.createdAt,
                          )}
                        </time>
                      </div>

                      <h3>
                        {revision.title}
                      </h3>

                      <p>
                        {revision.summary ||
                          '책 소개가 없는 원고입니다.'}
                      </p>

                      <div className="book-revision-card-footer">
                        <small>
                          {getPageCountLabel(
                            revision.pageCount,
                          )}
                        </small>

                        <div className="book-revision-card-actions">
                          <button
                            type="button"
                            className="is-preview"
                            onClick={() =>
                              loadPreview(
                                revision,
                              )
                            }
                            disabled={isBusy}
                          >
                            원고 미리보기
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              restoreRevision(
                                revision,
                              )
                            }
                            disabled={isBusy}
                          >
                            {restoringId ===
                            revision.id
                              ? '복원 중...'
                              : '이 원고로 복원'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}

            <div className="book-revision-bottom">
              {previewRevision ? (
                <>
                  <button
                    type="button"
                    className="is-secondary"
                    onClick={() =>
                      setPreviewRevision(null)
                    }
                    disabled={isBusy}
                  >
                    이력 목록으로
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      restoreRevision(
                        previewRevision,
                      )
                    }
                    disabled={isBusy}
                  >
                    {restoringId ===
                    previewRevision.id
                      ? '복원 중...'
                      : '이 원고로 복원'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="is-secondary"
                  onClick={closeModal}
                  disabled={isBusy}
                >
                  닫기
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}

      <style>{`
        .book-revision-open-button {
          min-height: 46px;
          padding: 0 22px;
          border: 1px solid #d88770;
          border-radius: 999px;
          background: #fff8f3;
          color: #9f4f3a;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .book-revision-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(54, 35, 26, 0.42);
          backdrop-filter: blur(6px);
        }

        .book-revision-modal {
          width: min(860px, 100%);
          max-height: calc(100vh - 48px);
          padding: 26px;
          overflow-y: auto;
          border: 1px solid #efd1c2;
          border-radius: 28px;
          background: #fffdfb;
          box-shadow:
            0 28px 80px rgba(78, 43, 27, 0.22);
          color: #49352b;
        }

        .book-revision-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .book-revision-header p {
          margin: 0;
          color: #dc775c;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .book-revision-header h2 {
          margin: 6px 0 0;
          color: #49352b;
          font-size: 28px;
        }

        .book-revision-header > button {
          width: 42px;
          height: 42px;
          border: 1px solid #efd1c2;
          border-radius: 50%;
          background: #fff4ee;
          color: #744c3d;
          font-size: 25px;
          cursor: pointer;
        }

        .book-revision-guide {
          margin: 18px 0;
          padding: 14px 16px;
          border-radius: 16px;
          background: #fff3ec;
          color: #725d52;
          font-size: 13px;
          line-height: 1.7;
        }

        .book-revision-error {
          margin: 14px 0;
          padding: 13px 15px;
          border: 1px solid #f1b6a8;
          border-radius: 14px;
          background: #fff0ed;
          color: #a13d2d;
          font-size: 13px;
          font-weight: 800;
        }

        .book-revision-list {
          display: grid;
          gap: 12px;
        }

        .book-revision-card {
          padding: 18px;
          border: 1px solid #edd6ca;
          border-radius: 18px;
          background:
            linear-gradient(145deg, #ffffff, #fff8f4);
        }

        .book-revision-card-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #9b7565;
          font-size: 11px;
          font-weight: 800;
        }

        .book-revision-card h3 {
          margin: 10px 0 0;
          color: #49352b;
          font-size: 18px;
        }

        .book-revision-card > p {
          margin: 8px 0 0;
          color: #725d52;
          font-size: 13px;
          line-height: 1.65;
        }

        .book-revision-card-footer {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .book-revision-card-footer small {
          color: #9b7565;
          font-weight: 800;
        }

        .book-revision-card-actions,
        .book-revision-bottom {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
        }

        .book-revision-card-actions button,
        .book-revision-bottom button {
          min-height: 40px;
          padding: 0 17px;
          border: 1px solid #dc8067;
          border-radius: 999px;
          background: #ef8268;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .book-revision-card-actions .is-preview,
        .book-revision-bottom .is-secondary {
          border-color: #ddbeb0;
          background: #ffffff;
          color: #704f42;
        }

        .book-revision-card-actions button:disabled,
        .book-revision-bottom button:disabled,
        .book-revision-header button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .book-revision-empty {
          padding: 38px 20px;
          border: 1px dashed #e6bdab;
          border-radius: 18px;
          background: #fff8f4;
          color: #82695d;
          font-size: 13px;
          line-height: 1.7;
          text-align: center;
        }

        .book-revision-preview {
          display: grid;
          gap: 14px;
        }

        .book-revision-preview-meta {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 10px;
          color: #9b7565;
          font-size: 12px;
          font-weight: 800;
        }

        .book-revision-preview-cover,
        .book-revision-preview-summary,
        .book-revision-preview-content {
          padding: 20px;
          border: 1px solid #edd6ca;
          border-radius: 18px;
          background: #ffffff;
        }

        .book-revision-preview-cover {
          background:
            linear-gradient(145deg, #fff6f0, #ffffff);
        }

        .book-revision-preview-label {
          margin: 0 0 8px;
          color: #d56f55;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
        }

        .book-revision-preview h3 {
          margin: 0;
          color: #49352b;
          font-size: 26px;
          line-height: 1.35;
        }

        .book-revision-preview-subtitle {
          margin: 8px 0 0;
          color: #795f53;
          font-size: 15px;
          line-height: 1.6;
        }

        .book-revision-preview-text {
          margin: 0;
          color: #5e493f;
          font-size: 14px;
          line-height: 1.85;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .book-revision-preview-content
        .book-revision-preview-text {
          font-family:
            'Noto Serif KR', serif;
          font-size: 15px;
          line-height: 1.95;
        }

        .book-revision-bottom {
          margin-top: 20px;
        }

        @media (max-width: 700px) {
          .book-revision-overlay {
            padding: 10px;
            align-items: flex-start;
          }

          .book-revision-modal {
            max-height: calc(100vh - 20px);
            padding: 19px 15px;
            border-radius: 22px;
          }

          .book-revision-header h2 {
            font-size: 24px;
          }

          .book-revision-card-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .book-revision-card-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .book-revision-card-actions button {
            width: 100%;
          }

          .book-revision-bottom {
            display: grid;
            grid-template-columns: 1fr;
          }

          .book-revision-preview h3 {
            font-size: 22px;
          }
        }
      `}</style>
    </>
  );
}

function RevisionPreview({
  revision,
}: {
  revision: BookRevisionDetail;
}) {
  return (
    <div className="book-revision-preview">
      <div className="book-revision-preview-meta">
        <time>
          {formatRevisionDate(
            revision.createdAt,
          )}
        </time>

        <span>
          {getPageCountLabel(
            revision.pageCount,
          )}
        </span>
      </div>

      <section className="book-revision-preview-cover">
        <p className="book-revision-preview-label">
          제목과 표지 문구
        </p>

        <h3>{revision.title}</h3>

        {revision.subtitle ? (
          <p className="book-revision-preview-subtitle">
            {revision.subtitle}
          </p>
        ) : null}

        {revision.coverText ? (
          <p className="book-revision-preview-text">
            {revision.coverText}
          </p>
        ) : null}
      </section>

      <section className="book-revision-preview-summary">
        <p className="book-revision-preview-label">
          책 소개
        </p>

        <p className="book-revision-preview-text">
          {revision.summary ||
            '책 소개가 없는 원고입니다.'}
        </p>
      </section>

      <section className="book-revision-preview-content">
        <p className="book-revision-preview-label">
          본문
        </p>

        <p className="book-revision-preview-text">
          {revision.content ||
            '본문 내용이 없는 원고입니다.'}
        </p>
      </section>
    </div>
  );
}

function formatRevisionDate(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '저장 시간 확인 필요';
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

function getPageCountLabel(
  pageCount: number | null,
) {
  if (!pageCount || pageCount <= 0) {
    return '분량 미정';
  }

  return `예상 ${pageCount}쪽`;
}