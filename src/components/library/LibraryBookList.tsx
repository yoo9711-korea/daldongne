'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useMemo,
  useState,
} from 'react';
import type { CSSProperties } from 'react';

type LibraryBook = {
  id: string;
  type: string;
  title: string;
  status: string;
  summary: string | null;
  pageCount: number | null;
  basedPhotoCount: number | null;
  basedStoryCount: number | null;
    createdAt?: string | null;
  hasProductionRequest?: boolean;
  productionRequestStatus?: string | null;
};

type Props = {
  books: LibraryBook[];
};

const TYPE_LABEL: Record<string, string> = {
  LIFE_BOOK: '인생 기록책',
  FAMILY_BOOK: '가족 이야기책',
  COUPLE_BOOK: '부부 이야기책',
  BABY_BOOK: '성장 기록책',
  TRAVEL_BOOK: '여행 기록책',
  AI_MOVIE: 'AI 영상',
};

const TYPE_SPINE: Record<string, string> = {
  LIFE_BOOK: '#c8666e',
  FAMILY_BOOK: '#607f9b',
  COUPLE_BOOK: '#9b6785',
  BABY_BOOK: '#71835e',
  TRAVEL_BOOK: '#bb6f4b',
  AI_MOVIE: '#b88a2f',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '원고 초안',
  IN_PRODUCTION: '제작 진행 중',
  PUBLISHED: '완성',
};

export default function LibraryBookList({
  books,
}: Props) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const selectedCount =
    selectedIds.length;

  const allSelected = useMemo(() => {
    return (
      books.length > 0 &&
      books.every((book) =>
        selectedIds.includes(book.id),
      )
    );
  }, [books, selectedIds]);

  const toggleBook = (
    bookId: string,
  ) => {
    setSelectedIds((current) =>
      current.includes(bookId)
        ? current.filter(
            (id) => id !== bookId,
          )
        : [...current, bookId],
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(
      books.map((book) => book.id),
    );
  };

  const handleBulkDelete =
    async () => {
      if (isDeleting) {
        return;
      }

      if (selectedIds.length === 0) {
        alert(
          '삭제할 책을 먼저 선택해 주세요.',
        );
        return;
      }

      const confirmed =
        window.confirm(
          `선택한 책 ${selectedIds.length}권을 삭제할까요?\n삭제한 책은 복구할 수 없습니다.`,
        );

      if (!confirmed) {
        return;
      }

      setIsDeleting(true);

      try {
        const response = await fetch(
          '/api/book/bulk-delete',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              bookIds: selectedIds,
            }),
          },
        );

        const result =
          (await response.json()) as {
            ok?: boolean;
            message?: string;
            deletedCount?: number;
          };

        if (
          !response.ok ||
          !result.ok
        ) {
          alert(
            result.message ||
              '선택한 책을 삭제하지 못했습니다.',
          );
          return;
        }

        alert(
          result.message ||
            `선택한 책 ${
              result.deletedCount ??
              selectedIds.length
            }권을 삭제했습니다.`,
        );

        setSelectedIds([]);
        router.refresh();
      } catch {
        alert(
          '책을 삭제하는 중 오류가 발생했습니다.',
        );
      } finally {
        setIsDeleting(false);
      }
    };

  if (books.length === 0) {
    return <EmptyLibrary />;
  }

  return (
    <div>
      <style>{`
        .library-toolbar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .library-book-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(270px, 1fr));
          gap: 18px;
          align-items: stretch;
        }

        .library-card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        @media (max-width: 700px) {
          .library-toolbar {
            align-items: stretch;
          }

          .library-toolbar-group {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }

          .library-toolbar-group button {
            width: 100%;
          }

          .library-book-grid {
            grid-template-columns: 1fr;
          }

          .library-card-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div
        className="library-toolbar"
        style={{
          marginBottom: 18,
          padding: 16,
          borderRadius: 20,
          background: '#f7eddc',
          border:
            '1px solid #e4cda3',
        }}
      >
        <div
          className="library-toolbar-group"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={toggleAll}
            style={toolbarButtonStyle(
              '#fffaf0',
              '#4a3828',
            )}
          >
            {allSelected
              ? '전체 선택 해제'
              : '전체 선택'}
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedIds([])
            }
            disabled={
              selectedCount === 0
            }
            style={toolbarButtonStyle(
              selectedCount === 0
                ? '#eee1ca'
                : '#fffaf0',
              selectedCount === 0
                ? '#9f927e'
                : '#4a3828',
            )}
          >
            선택 해제
          </button>
        </div>

        <div
          className="library-toolbar-group"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 38,
              padding: '0 11px',
              color: '#6b5a46',
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            선택한 책 {selectedCount}권
          </span>

          <button
            type="button"
            onClick={
              handleBulkDelete
            }
            disabled={
              selectedCount === 0 ||
              isDeleting
            }
            style={{
              ...toolbarButtonStyle(
                selectedCount === 0 ||
                  isDeleting
                  ? '#ead6d2'
                  : '#fff5f3',
                selectedCount === 0 ||
                  isDeleting
                  ? '#a58a86'
                  : '#9f2f25',
              ),
              border:
                '1px solid #c96b61',
            }}
          >
            {isDeleting
              ? '삭제 중...'
              : '선택 삭제'}
          </button>
        </div>
      </div>

      <div className="library-book-grid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            selected={selectedIds.includes(
              book.id,
            )}
            onToggle={() =>
              toggleBook(book.id)
            }
          />
        ))}

        <Link
          href="/dashboard/book"
          style={newBookCardStyle()}
        >
          <span
            style={{
              width: 52,
              height: 52,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent:
                'center',
              borderRadius: 999,
              background: '#eb8268',
              color: '#fff8ec',
              fontSize: 30,
              lineHeight: 1,
            }}
          >
            +
          </span>

          <strong
            style={{
              color: '#49352b',
              fontFamily:
                'Noto Serif KR, serif',
              fontSize: 22,
              lineHeight: 1.4,
            }}
          >
            새 책 원고 만들기
          </strong>

          <span
            style={{
              maxWidth: 230,
              color: '#6b5845',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            모아 둔 사진과 이야기를
            선택해 새로운 책 원고를
            만듭니다.
          </span>
        </Link>
      </div>
    </div>
  );
}

function BookCard({
  book,
  selected,
  onToggle,
}: {
  book: LibraryBook;
  selected: boolean;
  onToggle: () => void;
}) {
  const spine =
    TYPE_SPINE[book.type] ||
    '#c8666e';

  return (
    <article
      style={{
        position: 'relative',
        minHeight: 365,
        display: 'flex',
        flexDirection: 'column',
        justifyContent:
          'space-between',
        gap: 18,
        padding: 22,
        borderRadius: 24,
        background:
          'linear-gradient(145deg, #ffffff 0%, #fff7f1 100%)',
        borderLeft: `8px solid ${spine}`,
        outline: selected
          ? '4px solid #d6a43b'
          : '1px solid rgba(198,139,106,0.2)',
        boxShadow: selected
          ? '0 16px 34px rgba(222, 126, 91, 0.19)'
          : '0 14px 30px rgba(132, 79, 48, 0.08)',
        color: '#49352b',
        overflow: 'hidden',
      }}
    >
      <label
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 10px',
          borderRadius: 999,
          background: selected
            ? '#f3d28a'
            : '#fff1e9',
          color: selected
            ? '#3b260e'
            : '#6a4a3c',
          fontSize: 11,
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          style={{
            width: 16,
            height: 16,
            cursor: 'pointer',
          }}
        />

        선택
      </label>

      <div>
        <p
          style={{
            margin: 0,
            paddingRight: 82,
            color: '#d86f55',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          {TYPE_LABEL[book.type] ||
            '책 원고'}
        </p>

        <h3
          style={{
            margin: '16px 0 0',
            color: '#49352b',
            fontFamily:
              'Noto Serif KR, serif',
            fontSize: 22,
            lineHeight: 1.45,
            letterSpacing: '-0.04em',
            wordBreak: 'break-word',
          }}
        >
          {book.title}
        </h3>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
            marginTop: 13,
          }}
        >
          <span
            style={statusBadgeStyle(
              book.status,
            )}
          >
            {STATUS_LABEL[
              book.status
            ] || '상태 확인 필요'}
          </span>

          <span
            style={productionBadgeStyle(
              book,
            )}
          >
            {getProductionLabel(book)}
          </span>
        </div>

        {book.createdAt ? (
          <p
            style={{
              margin: '11px 0 0',
              color: '#90786c',
              fontSize: 11,
            }}
          >
            생성일{' '}
            {formatDate(
              book.createdAt,
            )}
          </p>
        ) : null}

        <p
          style={{
            margin: '15px 0 0',
            minHeight: 70,
            color: '#6f594e',
            fontSize: 13,
            lineHeight: 1.75,
            wordBreak: 'break-word',
          }}
        >
          {getBookSummaryLabel(
            book.summary,
          )}
        </p>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
          }}
        >
          <span
            style={sourceBadgeStyle()}
          >
            {getBookSourceLabel(
              book.basedPhotoCount,
              book.basedStoryCount,
            )}
          </span>

          <span
            style={pageBadgeStyle()}
          >
            {getPageCountLabel(
              book.pageCount,
            )}
          </span>
        </div>

        <div
          className="library-card-actions"
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop:
              '1px solid rgba(198, 139, 106, 0.2)',
          }}
        >
          <Link
            href={`/dashboard/library/${book.id}`}
            style={detailButtonStyle(
              spine,
            )}
          >
            {getBookActionLabel(
              book.pageCount,
            )}
          </Link>

          <Link
            href={`/dashboard/library/${book.id}/print`}
            style={printButtonStyle(
              spine,
            )}
          >
            인쇄용 원고
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyLibrary() {
  return (
    <div
      style={{
        padding: 28,
        borderRadius: 24,
        border:
          '1px dashed #c9ad7b',
        background: '#f7eddc',
      }}
    >
      <h3
        style={{
          margin: 0,
          color: '#49352b',
          fontFamily:
            'Noto Serif KR, serif',
          fontSize: 25,
          lineHeight: 1.45,
        }}
      >
        아직 내 책장에 저장된
        책이 없습니다.
      </h3>

      <p
        style={{
          margin: '10px 0 0',
          maxWidth: 720,
          color: '#6b5845',
          fontSize: 14,
          lineHeight: 1.75,
        }}
      >
        사진을 모으고 이야기를
        남긴 뒤 책 원고 만들기
        화면에서 첫 번째 책을
        만들어보세요.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginTop: 20,
        }}
      >
        <EmptyStepLink
          number={1}
          title="사진 모으기"
          description="책에 사용할 사진을 올립니다."
          href="/dashboard/timeline"
        />

        <EmptyStepLink
          number={2}
          title="이야기 남기기"
          description="사진과 삶의 이야기를 기록합니다."
          href="/dashboard/interview"
        />

        <EmptyStepLink
          number={3}
          title="책 원고 만들기"
          description="자료를 골라 책 원고를 만듭니다."
          href="/dashboard/book"
        />
      </div>
    </div>
  );
}

function EmptyStepLink({
  number,
  title,
  description,
  href,
}: {
  number: number;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 16,
        borderRadius: 17,
        border:
          '1px solid rgba(91, 66, 43, 0.12)',
        background: '#fffaf1',
        color: '#49352b',
        textDecoration: 'none',
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 999,
          background: '#eb8268',
          color: '#fff8ec',
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {number}
      </span>

      <strong
        style={{
          display: 'block',
          marginTop: 10,
          fontSize: 16,
        }}
      >
        {title}
      </strong>

      <span
        style={{
          display: 'block',
          marginTop: 5,
          color: '#6b5845',
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {description}
      </span>
    </Link>
  );
}

function toolbarButtonStyle(
  background: string,
  color: string,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    padding: '0 14px',
    borderRadius: 999,
    border:
      '1px solid #d6b778',
    background,
    color,
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

function statusBadgeStyle(
  status: string,
): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 25,
    padding: '0 9px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 900,
  };

  if (status === 'PUBLISHED') {
    return {
      ...base,
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  if (
    status === 'IN_PRODUCTION'
  ) {
    return {
      ...base,
      background: '#efe6ff',
      color: '#62438a',
    };
  }

  return {
    ...base,
    background: '#fff1c7',
    color: '#83540d',
  };
}

function productionBadgeStyle(
  book: LibraryBook,
): CSSProperties {
  const colors =
    getProductionBadgeColors(book);

  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 25,
    padding: '0 9px',
    borderRadius: 999,
    background:
      colors.background,
    color: colors.color,
    fontSize: 10,
    fontWeight: 900,
  };
}

function getProductionBadgeColors(
  book: LibraryBook,
) {
  if (
    book.status === 'PUBLISHED'
  ) {
    return {
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  if (
    book.status ===
    'IN_PRODUCTION'
  ) {
    return {
      background: '#efe6ff',
      color: '#62438a',
    };
  }

  if (
    book.productionRequestStatus ===
    'REQUESTED'
  ) {
    return {
      background: '#fff1c7',
      color: '#83540d',
    };
  }

  if (
    book.productionRequestStatus ===
    'CONTACTED'
  ) {
    return {
      background: '#e4f2ff',
      color: '#245d8c',
    };
  }

  if (
    book.productionRequestStatus ===
    'IN_PROGRESS'
  ) {
    return {
      background: '#efe6ff',
      color: '#62438a',
    };
  }

  if (
    book.productionRequestStatus ===
    'COMPLETED'
  ) {
    return {
      background: '#e3f4e5',
      color: '#2f6b38',
    };
  }

  if (
    book.productionRequestStatus ===
    'CANCELED'
  ) {
    return {
      background: '#f2eeee',
      color: '#776868',
    };
  }

  if (
    book.hasProductionRequest
  ) {
    return {
      background: '#e4f2ff',
      color: '#245d8c',
    };
  }

  return {
    background:
      '#f3ece7',
    color: '#806c62',
  };
}

function sourceBadgeStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 28,
    padding: '0 10px',
    borderRadius: 999,
    background: '#fff1d8',
    color: '#8a5a1f',
    fontSize: 11,
    fontWeight: 900,
  };
}

function pageBadgeStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 28,
    padding: '0 10px',
    borderRadius: 999,
    background:
      '#f3ece7',
    color: '#806c62',
    fontSize: 11,
    fontWeight: 900,
  };
}

function detailButtonStyle(
  spine: string,
): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 39,
    padding: '0 12px',
    borderRadius: 999,
    background: '#fffaf0',
    border:
      '1px solid #efd2c4',
    color: spine,
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

function printButtonStyle(
  spine: string,
): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 39,
    padding: '0 12px',
    borderRadius: 999,
    background: spine,
    border: `1px solid ${spine}`,
    color: '#fffaf0',
    fontSize: 12,
    fontWeight: 900,
    textDecoration: 'none',
    textAlign: 'center',
  };
}

function newBookCardStyle(): CSSProperties {
  return {
    minHeight: 365,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 24,
    border:
      '1px dashed #c9ad7b',
    background: '#f7eddc',
    color: '#49352b',
    textDecoration: 'none',
  };
}

function getProductionLabel(
  book: LibraryBook,
) {
  if (
    book.status === 'PUBLISHED'
  ) {
    return '제작 완료';
  }

  if (
    book.status ===
    'IN_PRODUCTION'
  ) {
    return '제작 진행 중';
  }

  if (
    book.productionRequestStatus ===
    'REQUESTED'
  ) {
    return '상담 신청 접수';
  }

  if (
    book.productionRequestStatus ===
    'CONTACTED'
  ) {
    return '고객 연락 완료';
  }

  if (
    book.productionRequestStatus ===
    'IN_PROGRESS'
  ) {
    return '제작 상담 진행 중';
  }

  if (
    book.productionRequestStatus ===
    'COMPLETED'
  ) {
    return '상담 완료';
  }

  if (
    book.productionRequestStatus ===
    'CANCELED'
  ) {
    return '상담 취소';
  }

  if (
    book.hasProductionRequest
  ) {
    return '상담 신청됨';
  }

  return '제작 상담 가능';
}


function getPageCountLabel(
  pageCount:
    | number
    | null
    | undefined,
) {
  if (
    !pageCount ||
    pageCount <= 0
  ) {
    return '분량 미정';
  }

  return `${pageCount}쪽`;
}

function getBookSummaryLabel(
  summary:
    | string
    | null
    | undefined,
) {
  if (
    !summary ||
    summary.trim().length === 0
  ) {
    return '아직 책 소개가 정리되지 않았습니다. 책 상세 화면에서 원고를 다시 정리하면 소개 문구도 함께 갱신됩니다.';
  }

  if (summary.length <= 100) {
    return summary;
  }

  return `${summary
    .slice(0, 100)
    .trim()}...`;
}

function getBookSourceLabel(
  photoCount:
    | number
    | null
    | undefined,
  storyCount:
    | number
    | null
    | undefined,
) {
  const photos =
    photoCount ?? 0;

  const stories =
    storyCount ?? 0;

  if (
    photos === 0 &&
    stories === 0
  ) {
    return '선택 자료 확인 필요';
  }

  return `사진 ${photos}장 · 이야기 ${stories}개`;
}

function getBookActionLabel(
  pageCount:
    | number
    | null
    | undefined,
) {
  if (
    !pageCount ||
    pageCount <= 0
  ) {
    return '원고 정리하기';
  }

  return '책 상세 보기';
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

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