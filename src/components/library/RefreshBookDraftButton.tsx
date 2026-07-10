'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  label?: string;
  className?: string;
  bookId?: string;
  selectedMemoryIds?: string[];
  [key: string]: unknown;
};

export default function RefreshBookDraftButton({
  label = '원고 다시 정리하기',
  className,
  bookId,
  selectedMemoryIds = [],
}: Props) {
  const router = useRouter();
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = () => {
    const confirmed = window.confirm(
      [
        '원고를 다시 정리하려면 자료 선택 화면으로 이동합니다.',
        '',
        selectedMemoryIds.length > 0
          ? '현재 책에 연결된 사진과 이야기를 자동으로 다시 선택해 둡니다.'
          : '이전 방식으로 만든 책이라 연결 자료가 없습니다. 자료 선택 화면에서 다시 고르면 됩니다.',
        '',
        '사진, 이야기, 책 종류, 문체, 원고 길이를 다시 선택한 뒤 AI 원고를 만들 수 있습니다.',
        '',
        '이동할까요?',
      ].join('\n'),
    );

    if (!confirmed) return;

       if (bookId) {
      window.localStorage.setItem('daldongne:book:targetBookId', bookId);
    } else {
      window.localStorage.removeItem('daldongne:book:targetBookId');
    }

    if (selectedMemoryIds.length > 0) {
      window.localStorage.setItem(
        'daldongne:book:selectedMemoryIds',
        JSON.stringify(selectedMemoryIds),
      );
    } else {
      window.localStorage.removeItem('daldongne:book:selectedMemoryIds');
    }

    setIsMoving(true);
    router.push('/dashboard/book#book-material-selector');
  };

  return (
    <button
      type="button"
      onClick={handleMove}
      disabled={isMoving}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 42,
        padding: '0 18px',
        borderRadius: 999,
        border: '1px solid #d6b778',
        background: '#fff4df',
        color: '#5a3510',
        fontSize: 14,
        fontWeight: 900,
        cursor: isMoving ? 'wait' : 'pointer',
        textDecoration: 'none',
        opacity: isMoving ? 0.65 : 1,
      }}
    >
      {isMoving ? '이동 중...' : label}
    </button>
  );
}