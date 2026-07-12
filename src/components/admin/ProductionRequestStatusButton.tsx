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
  const [savingStatus, setSavingStatus] =
    useState<ProductionRequestStatus | null>(null);

  const handleChangeStatus = async (
    status: ProductionRequestStatus,
  ) => {
    if (isSaving || status === currentStatus) {
      return;
    }

    const option = STATUS_OPTIONS.find(
      (item) => item.value === status,
    );

    const label = option?.label || status;
    const confirmMessage = getConfirmMessage(status, label);
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setSavingStatus(status);

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

      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !result?.ok) {
        window.alert(
          result?.message ||
            '상담 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }

      window.alert(
        result.message || `상담 상태를 "${label}"로 변경했습니다.`,
      );

      router.refresh();
    } catch {
      window.alert(
        '상담 상태를 변경하는 중 오류가 발생했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSaving(false);
      setSavingStatus(null);
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop: '1px solid #ead7b7',
      }}
    >
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 13,
          fontWeight: 900,
          color: '#8a806f',
        }}
      >
        상담 상태 변경
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {STATUS_OPTIONS.map((option) => {
          const active = option.value === currentStatus;
          const saving = savingStatus === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChangeStatus(option.value)}
              disabled={isSaving || active}
              aria-pressed={active}
              style={getButtonStyle(
                option.value,
                active,
                isSaving,
              )}
            >
              {saving ? '변경 중...' : option.label}
            </button>
          );
        })}
      </div>

      {isSaving ? (
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 13,
            color: '#8a806f',
          }}
        >
          상태를 저장하고 이메일 알림을 발송하고 있습니다.
        </p>
      ) : null}
    </div>
  );
}

function getConfirmMessage(
  status: ProductionRequestStatus,
  label: string,
) {
  if (status === 'COMPLETED') {
    return [
      `상담 상태를 "${label}"로 변경할까요?`,
      '',
      '책 상태가 완성으로 변경되고 고객에게 완료 안내 이메일이 발송됩니다.',
    ].join('\n');
  }

  if (status === 'CANCELED') {
    return [
      `상담 상태를 "${label}"로 변경할까요?`,
      '',
      '책 상태가 원고 초안으로 되돌아가고 고객에게 취소 안내 이메일이 발송됩니다.',
    ].join('\n');
  }

  return [
    `상담 상태를 "${label}"로 변경할까요?`,
    '',
    '변경된 상태는 고객에게 이메일로 안내됩니다.',
  ].join('\n');
}

function getButtonStyle(
  status: ProductionRequestStatus,
  active: boolean,
  isSaving: boolean,
) {
  const statusColors: Record<
    ProductionRequestStatus,
    {
      background: string;
      color: string;
      border: string;
    }
  > = {
    REQUESTED: {
      background: '#fff1c7',
      color: '#83540d',
      border: '#eac66f',
    },
    CONTACTED: {
      background: '#e4f2ff',
      color: '#245d8c',
      border: '#9fc9e8',
    },
    IN_PROGRESS: {
      background: '#efe6ff',
      color: '#62438a',
      border: '#c8b1e8',
    },
    COMPLETED: {
      background: '#e3f4e5',
      color: '#2f6b38',
      border: '#9dcca4',
    },
    CANCELED: {
      background: '#f2eeee',
      color: '#776868',
      border: '#d8cccc',
    },
  };

  const colors = statusColors[status];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    padding: '0 14px',
    borderRadius: 999,
    border: active
      ? '2px solid #24170f'
      : `1px solid ${colors.border}`,
    background: active ? '#24170f' : colors.background,
    color: active ? '#fffaf0' : colors.color,
    fontSize: 13,
    fontWeight: 900,
    cursor: isSaving || active ? 'not-allowed' : 'pointer',
    opacity: isSaving && !active ? 0.6 : 1,
    transition: 'opacity 0.15s ease',
  };
}