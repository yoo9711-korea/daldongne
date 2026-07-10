'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type LibraryBook = {
  id: string;
  type: string;
  title: string;
  status: string;
  summary: string | null;
  pageCount: number | null;
  basedPhotoCount: number | null;
  basedStoryCount: number | null;
};

type Props = {
  books: LibraryBook[];
};

const TYPE_LABEL: Record<string, string> = {
  LIFE_BOOK: '부모님 인생책',
  FAMILY_BOOK: '우리 가족 인생책',
  COUPLE_BOOK: '부부 이야기책',
  BABY_BOOK: '성장 기록책',
  TRAVEL_BOOK: '여행 기록책',
  AI_MOVIE: '추억 영상',
};

const TYPE_SPINE: Record<string, string> = {
  LIFE_BOOK: '#6E2A36',
  FAMILY_BOOK: '#2E3F52',
  COUPLE_BOOK: '#5C3A52',
  BABY_BOOK: '#5C6B4F',
  TRAVEL_BOOK: '#8C4A2D',
  AI_MOVIE: '#B6892F',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '원고 초안',
  IN_PRODUCTION: '제작 준비 중',
  PUBLISHED: '완성',
  ARCHIVED: '보관됨',
};

export default function LibraryBookList({ books }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedCount = selectedIds.length;

  const allSelected = useMemo(() => {
    return books.length > 0 && selectedIds.length === books.length;
  }, [books.length, selectedIds.length]);

  const toggleBook = (bookId: string) => {
    setSelectedIds((current) =>
      current.includes(bookId)
        ? current.filter((id) => id !== bookId)
        : [...current, bookId],
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(books.map((book) => book.id));
  };

  const handleBulkDelete = async () => {
    if (isDeleting) return;

    if (selectedIds.length === 0) {
      alert('삭제할 책을 먼저 선택해 주세요.');
      return;
    }

    const confirmed = window.confirm(
      `선택한 책 ${selectedIds.length}권을 삭제할까요?\n삭제하면 복구할 수 없습니다.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch('/api/book/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookIds: selectedIds,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        deletedCount?: number;
      };

      if (!response.ok || !result.ok) {
        alert(result.message || '책을 삭제하지 못했습니다.');
        return;
      }

      alert(result.message || '선택한 책이 삭제되었습니다.');
      setSelectedIds([]);
      router.refresh();
    } catch {
      alert('책을 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (books.length === 0) {
    return (
      <div
        style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 18,
          background: 'var(--paper-shade)',
          color: 'var(--ink-soft)',
          fontSize: 17,
          lineHeight: 1.75,
        }}
      >
        아직 완성된 책이 없습니다. 먼저 부모님의 사진을 올리고, 기억나는
        이야기를 남겨보세요. 사진과 이야기가 모이면 가족이 오래 간직할
        인생책의 첫 원고가 시작됩니다.
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
          padding: 16,
          borderRadius: 20,
          background: '#f7eddc',
          border: '1px solid #e4cda3',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={toggleAll}
            style={toolbarButtonStyle('#fffaf0', '#4a3828')}
          >
            {allSelected ? '전체 선택 해제' : '전체 선택'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            disabled={selectedCount === 0}
            style={toolbarButtonStyle(
              selectedCount === 0 ? '#eee1ca' : '#fffaf0',
              selectedCount === 0 ? '#9f927e' : '#4a3828',
            )}
          >
            선택 해제
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: '#6b5a46',
            }}
          >
            선택된 책 {selectedCount}권
          </span>

          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedCount === 0 || isDeleting}
            style={{
              ...toolbarButtonStyle(
                selectedCount === 0 || isDeleting ? '#ead6d2' : '#fff5f3',
                selectedCount === 0 || isDeleting ? '#a58a86' : '#9f2f25',
              ),
              border: '1px solid #c96b61',
            }}
          >
            {isDeleting ? '삭제 중...' : '선택 삭제'}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 18,
          alignItems: 'stretch',
        }}
      >
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            selected={selectedIds.includes(book.id)}
            onToggle={() => toggleBook(book.id)}
          />
        ))}

        <Link
          href="/dashboard/timeline"
          style={{
            minHeight: 310,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            gap: 12,
            padding: 24,
            borderRadius: 24,
            border: '1px dashed #c9ad7b',
            background: '#f7eddc',
            textDecoration: 'none',
            color: 'var(--ink-soft)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 36,
              lineHeight: 1,
              color: '#8a6b4d',
            }}
          >
            +
          </p>

          <p
            style={{
              margin: 0,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--ink)',
            }}
          >
            사진부터 모으기
          </p>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 220,
            }}
          >
            사진과 이야기를 모으면 첫 인생책 원고를 만들 수 있습니다.
          </p>
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
  const spine = TYPE_SPINE[book.type] || '#6E2A36';

  return (
    <article
      style={{
        position: 'relative',
        minHeight: 330,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 16,
        padding: 22,
        borderRadius: 24,
        background: '#17110c',
        borderLeft: `8px solid ${spine}`,
        outline: selected ? '4px solid #d6a43b' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: selected
          ? '0 16px 36px rgba(180, 130, 35, 0.28)'
          : '0 14px 30px rgba(60, 38, 18, 0.12)',
        color: '#fffaf0',
        overflow: 'hidden',
      }}
    >
      <label
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 10px',
          borderRadius: 999,
          background: selected ? '#f3d28a' : 'rgba(255, 250, 240, 0.12)',
          color: selected ? '#3b260e' : '#fffaf0',
          fontSize: 12,
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
            paddingRight: 76,
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: '#f3d28a',
          }}
        >
          {TYPE_LABEL[book.type] || '인생책'}
        </p>

        <h3
          style={{
            margin: '16px 0 0',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 22,
            lineHeight: 1.45,
            letterSpacing: '-0.04em',
            color: '#fffaf0',
          }}
        >
          {book.title}
        </h3>

        <p
          style={{
            margin: '10px 0 0',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#b8a68f',
          }}
        >
          {STATUS_LABEL[book.status] || '상태 확인 필요'} ·{' '}
          {getPageCountLabel(book.pageCount)}
        </p>

        <p
          style={{
            marginTop: 16,
            marginBottom: 0,
            fontSize: 14,
            lineHeight: 1.75,
            color: '#c8b79e',
          }}
        >
          {getBookSummaryLabel(book.summary)}
        </p>
      </div>

      <div>
        <p
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            margin: 0,
            padding: '7px 11px',
            borderRadius: 999,
            background: '#fff1d8',
            fontSize: 13,
            fontWeight: 900,
            color: '#8a5a1f',
          }}
        >
          {getBookSourceLabel(book.basedPhotoCount, book.basedStoryCount)}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 8,
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid rgba(255, 250, 240, 0.14)',
          }}
        >
          <Link
            href={`/dashboard/library/${book.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 38,
              padding: '0 14px',
              borderRadius: 999,
              background: '#fffaf0',
              border: '1px solid #fffaf0',
              color: spine,
              fontSize: 13,
              fontWeight: 900,
              textDecoration: 'none',
            }}
          >
            {getBookActionLabel(book.pageCount)} →
          </Link>

          <Link
            href={`/dashboard/library/${book.id}/print`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 38,
              padding: '0 14px',
              borderRadius: 999,
              background: spine,
              border: `1px solid ${spine}`,
              color: '#fffaf0',
              fontSize: 13,
              fontWeight: 900,
              textDecoration: 'none',
            }}
          >
            인쇄용 보기 →
          </Link>
        </div>
      </div>
    </article>
  );
}

function toolbarButtonStyle(background: string, color: string) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    padding: '0 14px',
    borderRadius: 999,
    border: '1px solid #d6b778',
    background,
    color,
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  };
}

function getPageCountLabel(pageCount: number | null | undefined) {
  if (!pageCount || pageCount <= 0) {
    return '원고 다시 정리 필요';
  }

  return `${pageCount}쪽`;
}

function getBookSummaryLabel(summary: string | null | undefined) {
  if (!summary || summary.trim().length === 0) {
    return '아직 책 소개가 정리되지 않았습니다. 책 상세 화면에서 원고 다시 정리하기를 누르면 소개 문구가 채워집니다.';
  }

  if (summary.length <= 90) {
    return summary;
  }

  return `${summary.slice(0, 90).trim()}...`;
}

function getBookSourceLabel(
  photoCount: number | null | undefined,
  storyCount: number | null | undefined,
) {
  const photos = photoCount ?? 0;
  const stories = storyCount ?? 0;

  if (photos === 0 && stories === 0) {
    return '사진과 이야기를 더 모아야 합니다';
  }

  return `사진 ${photos}장 · 이야기 ${stories}개`;
}

function getBookActionLabel(pageCount: number | null | undefined) {
  if (!pageCount || pageCount <= 0) {
    return '원고 정리하러 가기';
  }

  return '책 자세히 보기';
}