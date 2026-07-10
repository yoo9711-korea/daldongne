'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export type BookDraftBookType =
  | 'PARENT_LIFE'
  | 'FAMILY'
  | 'BABY'
  | 'COUPLE'
  | 'TRAVEL';

export type BookDraftTone =
  | 'warm'
  | 'plain'
  | 'letter'
  | 'autobiography';

export type BookDraftLength = 'short' | 'medium' | 'long';

type Props = {
  disabled?: boolean;
  selectedMemoryIds?: string[];
  targetBookId?: string;
  bookType?: BookDraftBookType;
  tone?: BookDraftTone;
  length?: BookDraftLength;
};

const bookTypeLabelMap: Record<BookDraftBookType, string> = {
  PARENT_LIFE: '부모님 인생책',
  FAMILY: '가족 이야기책',
  BABY: '성장 기록책',
  COUPLE: '부부 이야기책',
  TRAVEL: '여행 기록책',
};

const toneLabelMap: Record<BookDraftTone, string> = {
  warm: '따뜻한 문체',
  plain: '담백한 문체',
  letter: '편지체',
  autobiography: '자서전 문체',
};

const lengthLabelMap: Record<BookDraftLength, string> = {
  short: '짧은 소책자',
  medium: '보통 분량',
  long: '긴 원고',
};

export default function CreateBookDraftButton({
  disabled = false,
  selectedMemoryIds = [],
  targetBookId,
  bookType = 'PARENT_LIFE',
  tone = 'warm',
  length = 'medium',
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (disabled || isLoading) return;

    const confirmed = window.confirm(
      [
        '선택한 자료로 AI 책 원고를 만들까요?',
        '',
        `책 종류: ${bookTypeLabelMap[bookType]}`,
        `문체: ${toneLabelMap[tone]}`,
        `분량: ${lengthLabelMap[length]}`,
      ].join('\n'),
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);

      const res = await fetch('/api/book/create-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
                body: JSON.stringify({
          selectedMemoryIds,
          targetBookId,
          bookType,
          tone,
          length,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            '책 원고를 만드는 중 문제가 발생했습니다.',
        );
      }

      if (!data?.bookId) {
        throw new Error('생성된 책 ID를 찾을 수 없습니다.');
      }

      router.push(`/dashboard/library/${data.bookId}`);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : '책 원고를 만드는 중 문제가 발생했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 46,
        padding: '0 22px',
        borderRadius: 999,
        border: '1px solid #5a3a18',
        background: disabled || isLoading ? '#d8cdbb' : '#5a3a18',
        color: '#fffaf0',
        fontSize: 15,
        fontWeight: 900,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.65 : 1,
      }}
    >
      {isLoading ? 'AI 원고 만드는 중...' : 'AI로 책 원고 만들기'}
    </button>
  );
}