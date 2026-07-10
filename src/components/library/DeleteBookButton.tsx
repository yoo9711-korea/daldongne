'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  bookId: string;
  redirectTo?: string;
};

export default function DeleteBookButton({ bookId, redirectTo }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm(
      '이 책을 삭제할까요?\n삭제하면 복구할 수 없습니다.',
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/book/${bookId}`, {
        method: 'DELETE',
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        alert(result.message || '책을 삭제하지 못했습니다.');
        return;
      }

      alert('책이 삭제되었습니다.');

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch {
      alert('책을 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 42,
        padding: '0 18px',
        borderRadius: 999,
        border: '1px solid #b33a2f',
        background: isDeleting ? '#d8b8b4' : '#fff5f3',
        color: '#9f2f25',
        fontSize: 14,
        fontWeight: 900,
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {isDeleting ? '삭제 중...' : '책 삭제'}
    </button>
  );
}