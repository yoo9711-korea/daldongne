'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BookRevisionMetadataControls from '@/components/library/BookRevisionMetadataControls';

type Props = {
  bookId: string;
};

type BookRevision = {
  id: string;
  title: string;
  summary: string | null;
  pageCount: number | null;
  label: string | null;
  isPinned: boolean;
  createdAt: string;
};

type BookRevisionDetail =
  BookRevision & {
    subtitle: string | null;
    coverText: string | null;
    content: string | null;
  };

type CurrentBookDetail = {
  id: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  coverText: string | null;
  content: string | null;
  pageCount: number | null;
  updatedAt: string;
};

type ViewMode =
  | 'list'
  | 'preview'
  | 'compare';

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
    detailLoadingId,
    setDetailLoadingId,
  ] = useState<string | null>(null);

  const [
    selectedRevision,
    setSelectedRevision,
  ] = useState<BookRevisionDetail | null>(
    null,
  );

  const [
    currentBook,
    setCurrentBook,
  ] = useState<CurrentBookDetail | null>(
    null,
  );

  const [viewMode, setViewMode] =
    useState<ViewMode>('list');

  const [errorMessage, setErrorMessage] =
    useState('');

  const [revisions, setRevisions] =
    useState<BookRevision[]>([]);

  const isBusy = Boolean(
    restoringId || detailLoadingId,
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

      if (viewMode !== 'list') {
        setViewMode('list');
        setSelectedRevision(null);
        setCurrentBook(null);
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
    viewMode,
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
    setViewMode('list');
    setSelectedRevision(null);
    setCurrentBook(null);
    setErrorMessage('');
    setIsOpen(true);
    void loadRevisions();
  };

  const returnToList = () => {
    if (isBusy) {
      return;
    }

    setViewMode('list');
    setSelectedRevision(null);
    setCurrentBook(null);
    setErrorMessage('');
  };

  const closeModal = () => {
    if (isBusy) {
      return;
    }

    setViewMode('list');
    setSelectedRevision(null);
    setCurrentBook(null);
    setIsOpen(false);
  };

  const loadRevisionDetail = async (
    revision: BookRevision,
    nextMode: Exclude<
      ViewMode,
      'list'
    >,
  ) => {
    if (isBusy) {
      return;
    }

    setDetailLoadingId(revision.id);
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
          currentBook?: CurrentBookDetail;
        };

      if (
        !response.ok ||
        !result.ok ||
        !result.revision ||
        !result.currentBook
      ) {
        setErrorMessage(
          result.message ||
            '원고 비교 자료를 불러오지 못했습니다.',
        );
        return;
      }

      setSelectedRevision(
        result.revision,
      );

      setCurrentBook(
        result.currentBook,
      );

      setViewMode(nextMode);
    } catch {
      setErrorMessage(
        '원고 비교 자료를 불러오는 중 오류가 발생했습니다.',
      );
    } finally {
      setDetailLoadingId(null);
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

      setViewMode('list');
      setSelectedRevision(null);
      setCurrentBook(null);
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
                  {viewMode === 'compare'
                    ? '현재 원고와 비교'
                    : viewMode === 'preview'
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
              {viewMode === 'compare'
                ? '왼쪽은 현재 원고, 오른쪽은 선택한 이전 원고입니다. 내용이 달라진 항목은 변경됨으로 표시됩니다.'
                : viewMode === 'preview'
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

            {detailLoadingId ? (
              <div className="book-revision-empty">
                원고 비교 자료를 불러오는
                중입니다.
              </div>
            ) : viewMode === 'compare' &&
              selectedRevision &&
              currentBook ? (
              <RevisionComparison
                currentBook={currentBook}
                revision={selectedRevision}
              />
            ) : viewMode === 'preview' &&
              selectedRevision ? (
              <RevisionPreview
                revision={selectedRevision}
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
                          {formatDate(
                            revision.createdAt,
                          )}
                        </time>
                      </div>

                     <BookRevisionMetadataControls
                        bookId={bookId}
                        revisionId={revision.id}
                        initialLabel={revision.label}
                        isPinned={revision.isPinned}
                        onSaved={() => {
                        void loadRevisions();
                            }}
                         />

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
                            className="is-secondary"
                            onClick={() =>
                              loadRevisionDetail(
                                revision,
                                'preview',
                              )
                            }
                            disabled={isBusy}
                          >
                            원고 미리보기
                          </button>

                          <button
                            type="button"
                            className="is-compare"
                            onClick={() =>
                              loadRevisionDetail(
                                revision,
                                'compare',
                              )
                            }
                            disabled={isBusy}
                          >
                            현재 원고와 비교
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
              {selectedRevision &&
              currentBook ? (
                <>
                  <button
                    type="button"
                    className="is-secondary"
                    onClick={returnToList}
                    disabled={isBusy}
                  >
                    이력 목록으로
                  </button>

                  {viewMode === 'compare' ? (
                    <button
                      type="button"
                      className="is-secondary"
                      onClick={() =>
                        setViewMode(
                          'preview',
                        )
                      }
                      disabled={isBusy}
                    >
                      이전 원고만 보기
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="is-compare"
                      onClick={() =>
                        setViewMode(
                          'compare',
                        )
                      }
                      disabled={isBusy}
                    >
                      현재 원고와 비교
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      restoreRevision(
                        selectedRevision,
                      )
                    }
                    disabled={isBusy}
                  >
                    {restoringId ===
                    selectedRevision.id
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
          width: min(1180px, 100%);
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

        .book-revision-header,
        .book-revision-card-meta,
        .book-revision-card-footer,
        .book-revision-compare-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .book-revision-header {
          align-items: flex-start;
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

        .book-revision-list,
        .book-revision-preview,
        .book-revision-comparison {
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
          padding: 0 16px;
          border: 1px solid #dc8067;
          border-radius: 999px;
          background: #ef8268;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .book-revision-card-actions .is-secondary,
        .book-revision-bottom .is-secondary {
          border-color: #ddbeb0;
          background: #ffffff;
          color: #704f42;
        }

        .book-revision-card-actions .is-compare,
        .book-revision-bottom .is-compare {
          border-color: #ddad67;
          background: #fff5db;
          color: #8b5a17;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .book-revision-empty {
          padding: 38px 20px;
          border: 1px dashed #e6bdab;
          border-radius: 18px;
          background: #fff8f4;
          color: #82695d;
          text-align: center;
          line-height: 1.7;
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

        .book-revision-preview-section {
          padding: 20px;
          border: 1px solid #edd6ca;
          border-radius: 18px;
          background: #ffffff;
        }

        .book-revision-label {
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

        .book-revision-text {
          margin: 0;
          color: #5e493f;
          font-size: 14px;
          line-height: 1.85;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .book-revision-content-text {
          font-family:
            'Noto Serif KR', serif;
          font-size: 15px;
          line-height: 1.95;
        }

        .book-revision-compare-section {
          padding: 16px;
          border: 1px solid #e3d8d2;
          border-radius: 18px;
          background: #ffffff;
        }

        .book-revision-compare-section.is-changed {
          border-color: #e8a38e;
          box-shadow:
            0 8px 22px rgba(218, 112, 82, 0.08);
        }

        .book-revision-compare-heading h3 {
          margin: 0;
          color: #49352b;
          font-size: 16px;
        }

        .book-revision-change-badge {
          padding: 5px 9px;
          border-radius: 999px;
          background: #fce9e2;
          color: #bd5c43;
          font-size: 11px;
          font-weight: 900;
        }

        .book-revision-change-badge.is-same {
          background: #edf5ed;
          color: #567158;
        }

        .book-revision-compare-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .book-revision-compare-column {
          min-width: 0;
          padding: 16px;
          border-radius: 14px;
          background: #fff8f5;
        }

        .book-revision-compare-column.is-previous {
          background: #f7f9fc;
        }

        .book-revision-compare-column > strong {
          display: block;
          margin-bottom: 9px;
          color: #9b6756;
          font-size: 12px;
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

          .book-revision-card-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .book-revision-card-actions,
          .book-revision-bottom {
            display: grid;
            grid-template-columns: 1fr;
          }

          .book-revision-compare-grid {
            grid-template-columns: 1fr;
          }

          .book-revision-card-actions button,
          .book-revision-bottom button {
            width: 100%;
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
          {formatDate(revision.createdAt)}
        </time>

        <span>
          {getPageCountLabel(
            revision.pageCount,
          )}
        </span>
      </div>

      <section className="book-revision-preview-section">
        <p className="book-revision-label">
          제목
        </p>

        <h3>{revision.title}</h3>
      </section>

      <PreviewSection
        label="부제"
        value={revision.subtitle}
      />

      <PreviewSection
        label="표지 문구"
        value={revision.coverText}
      />

      <PreviewSection
        label="책 소개"
        value={revision.summary}
      />

      <PreviewSection
        label="본문"
        value={revision.content}
        isContent
      />
    </div>
  );
}

function PreviewSection({
  label,
  value,
  isContent = false,
}: {
  label: string;
  value: string | null;
  isContent?: boolean;
}) {
  return (
    <section className="book-revision-preview-section">
      <p className="book-revision-label">
        {label}
      </p>

      <p
        className={[
          'book-revision-text',
          isContent
            ? 'book-revision-content-text'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value || '내용 없음'}
      </p>
    </section>
  );
}

function RevisionComparison({
  currentBook,
  revision,
}: {
  currentBook: CurrentBookDetail;
  revision: BookRevisionDetail;
}) {
  const sections = [
    {
      label: '제목',
      current: currentBook.title,
      previous: revision.title,
      isContent: false,
    },
    {
      label: '부제',
      current: currentBook.subtitle,
      previous: revision.subtitle,
      isContent: false,
    },
    {
      label: '표지 문구',
      current: currentBook.coverText,
      previous: revision.coverText,
      isContent: false,
    },
    {
      label: '책 소개',
      current: currentBook.summary,
      previous: revision.summary,
      isContent: false,
    },
    {
      label: '본문',
      current: currentBook.content,
      previous: revision.content,
      isContent: true,
    },
  ];

  return (
    <div className="book-revision-comparison">
      {sections.map((section) => {
        const changed =
          normalizeText(section.current) !==
          normalizeText(section.previous);

        return (
          <section
            key={section.label}
            className={[
              'book-revision-compare-section',
              changed
                ? 'is-changed'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="book-revision-compare-heading">
              <h3>{section.label}</h3>

              <span
                className={[
                  'book-revision-change-badge',
                  changed
                    ? ''
                    : 'is-same',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {changed
                  ? '변경됨'
                  : '동일'}
              </span>
            </div>

            <div className="book-revision-compare-grid">
              <div className="book-revision-compare-column">
                <strong>
                  현재 원고
                </strong>

                <p
                  className={[
                    'book-revision-text',
                    section.isContent
                      ? 'book-revision-content-text'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {section.current ||
                    '내용 없음'}
                </p>
              </div>

              <div className="book-revision-compare-column is-previous">
                <strong>
                  선택한 이전 원고
                </strong>

                <p
                  className={[
                    'book-revision-text',
                    section.isContent
                      ? 'book-revision-content-text'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {section.previous ||
                    '내용 없음'}
                </p>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function normalizeText(
  value: string | null,
) {
  return (value || '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function formatDate(
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