'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ProductionRequestStatus =
  | 'REQUESTED'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

type Props = {
  requestId: string;
  currentStatus: string;
};

const STATUS_OPTIONS: {
  value: ProductionRequestStatus;
  label: string;
}[] = [
  { value: 'REQUESTED', label: '상담 신청 접수' },
  { value: 'CONTACTED', label: '고객 연락 완료' },
  { value: 'IN_PROGRESS', label: '제작 상담 진행 중' },
  { value: 'COMPLETED', label: '상담 완료' },
  { value: 'CANCELED', label: '취소' },
];

export default function ProductionRequestStatusButton({
  requestId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleChangeStatus = async (status: ProductionRequestStatus) => {
    if (isSaving) return;

    if (status === currentStatus) {
      return;
    }

    const option = STATUS_OPTIONS.find((item) => item.value === status);
    const label = option?.label || status;

    const ok = window.confirm(`상담 상태를 "${label}" 상태로 변경할까요?`);

    if (!ok) return;

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/admin/production-requests/${requestId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        alert(result.message || '상담 상태를 변경하지 못했습니다.');
        return;
      }

      alert(result.message || '상담 상태를 변경했습니다.');
      router.refresh();
    } catch {
      alert('상담 상태를 변경하는 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 14,
      }}
    >
      {STATUS_OPTIONS.map((option) => {
        const active = option.value === currentStatus;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChangeStatus(option.value)}
            disabled={isSaving || active}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 34,
              padding: '0 12px',
              borderRadius: 999,
              border: active ? '1px solid #24170f' : '1px solid #d6b778',
              background: active ? '#24170f' : '#fffaf0',
              color: active ? '#fffaf0' : '#5a3a18',
              fontSize: 13,
              fontWeight: 900,
              cursor: isSaving || active ? 'not-allowed' : 'pointer',
              opacity: isSaving && !active ? 0.65 : 1,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}