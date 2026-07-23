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

  const [errorMessage, setErrorMessage] =
    useState('');

  const [revisions, setRevisions] =
    useState<BookRevision[]>([]);

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
        event.key === 'Escape' &&
        !restoringId
      ) {
        setIsOpen(false);
      }
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
  }, [isOpen, restoringId]);

  const loadRevisions = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/book/${bookId}/revisions`,
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
    setIsOpen(true);
    void loadRevisions();
  };

  const closeModal = () => {
    if (restoringId) {
      return;
    }

    setIsOpen(false);
  };

  const restoreRevision = async (
    revision: BookRevision,
  ) => {
    if (restoringId) {
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
        `/api/book/${bookId}/revisions`,
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
              !restoringId
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
                  수정 이력·복원
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={Boolean(
                  restoringId,
                )}
                aria-label="수정 이력 닫기"
              >
                ×
              </button>
            </div>

            <p className="book-revision-guide">
              원고를 저장하기 전의 내용이
              보관되어 있습니다. 복원해도 현재
              원고는 다시 이력에 보관됩니다.
            </p>

            {errorMessage ? (
              <p className="book-revision-error">
                {errorMessage}
              </p>
            ) : null}

            {isLoading ? (
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
                      <div>
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

                        <button
                          type="button"
                          onClick={() =>
                            restoreRevision(
                              revision,
                            )
                          }
                          disabled={Boolean(
                            restoringId,
                          )}
                        >
                          {restoringId ===
                          revision.id
                            ? '복원 중...'
                            : '이 원고로 복원'}
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}

            <div className="book-revision-bottom">
              <button
                type="button"
                onClick={closeModal}
                disabled={Boolean(
                  restoringId,
                )}
              >
                닫기
              </button>
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
          width: min(720px, 100%);
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

        .book-revision-card > div:first-child {
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

        .book-revision-card p {
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

        .book-revision-card-footer button,
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

        .book-revision-card-footer button:disabled,
        .book-revision-bottom button:disabled {
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

        .book-revision-bottom {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }

        .book-revision-bottom button {
          border-color: #d8c0b3;
          background: #ffffff;
          color: #60483d;
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

          .book-revision-card-footer button {
            width: 100%;
          }
        }
      `}</style>
    </>
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