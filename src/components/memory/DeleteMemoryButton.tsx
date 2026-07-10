'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  memoryId: string;
  label?: string;
};

export default function DeleteMemoryButton({
  memoryId,
  label = '삭제',
}: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    const confirmed = window.confirm(
      '이 기록을 삭제할까요?\n삭제한 기록은 되돌릴 수 없습니다.',
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/memory/${memoryId}`, {
        method: 'DELETE',
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        alert(result.message || '기록을 삭제하지 못했습니다.');
        return;
      }

      alert(result.message || '기록을 삭제했습니다.');
      router.refresh();
    } catch {
      alert('기록을 삭제하는 중 오류가 발생했습니다.');
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
        minHeight: 34,
        padding: '0 12px',
        borderRadius: 999,
        border: '1px solid #d09a8a',
        background: isDeleting ? '#eadcc5' : '#fff7f3',
        color: isDeleting ? '#9f927e' : '#9a3f2e',
        fontSize: 13,
        fontWeight: 900,
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {isDeleting ? '삭제 중...' : label}
    </button>
  );
}