'use client';

import type { CSSProperties } from 'react';
import {
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

type ProductionRequestStatus =
  | 'REQUESTED'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

type BookStatus =
  | 'DRAFT'
  | 'IN_PRODUCTION'
  | 'PUBLISHED';

type Props = {
  requestId: string;
  currentStatus: string;
};

type StatusApiResult = {
  ok?: boolean;
  message?: string;
  requestId?: string;
  previousStatus?: string;
  status?: string;
  statusChanged?: boolean;
  bookId?: string;
  bookStatus?: string;
  activeRequestCount?: number;
  completedRequestCount?: number;
};

const STATUS_OPTIONS: {
  value: ProductionRequestStatus;
  label: string;
}[] = [
  {
    value: 'REQUESTED',
    label: '상담 신청 접수',
  },
  {
    value: 'CONTACTED',
    label: '고객 연락 완료',
  },
  {
    value: 'IN_PROGRESS',
    label: '제작 상담 진행 중',
  },
  {
    value: 'COMPLETED',
    label: '상담 완료',
  },
  {
    value: 'CANCELED',
    label: '상담 취소',
  },
];

export default function ProductionRequestStatusButton({
  requestId,
  currentStatus,
}: Props) {
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] =
    useState<ProductionRequestStatus | null>(
      isProductionRequestStatus(currentStatus)
        ? currentStatus
        : null,
    );

  const [isSaving, setIsSaving] =
    useState(false);

  const [savingStatus, setSavingStatus] =
    useState<ProductionRequestStatus | null>(
      null,
    );

  useEffect(() => {
    if (
      isProductionRequestStatus(
        currentStatus,
      )
    ) {
      setSelectedStatus(
        currentStatus,
      );
    }
  }, [currentStatus]);

  const handleChangeStatus = async (
    status: ProductionRequestStatus,
  ) => {
    if (
      isSaving ||
      status === selectedStatus
    ) {
      return;
    }

    if (!requestId.trim()) {
      window.alert(
        '변경할 상담 신청 정보를 찾을 수 없습니다.',
      );
      return;
    }

    const option =
      STATUS_OPTIONS.find(
        (item) =>
          item.value === status,
      );

    const label =
      option?.label || status;

    const confirmed =
      window.confirm(
        getConfirmMessage(
          status,
          label,
        ),
      );

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
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const result =
        (await response
          .json()
          .catch(
            () => null,
          )) as StatusApiResult | null;

      if (
        !response.ok ||
        !result?.ok
      ) {
        window.alert(
          result?.message ||
            '상담 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }

      const savedStatus =
        isProductionRequestStatus(
          result.status,
        )
          ? result.status
          : status;

      setSelectedStatus(
        savedStatus,
      );

      window.alert(
        getSuccessMessage(
          result,
          label,
        ),
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
        borderTop:
          '1px solid #ead7b7',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#8a806f',
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          상담 상태 변경
        </p>

        <span
          style={{
            display: 'inline-flex',
            minHeight: 30,
            alignItems: 'center',
            padding: '0 11px',
            borderRadius: 999,
            border:
              '1px solid #d9c39e',
            background: '#fff8eb',
            color: '#5a3a18',
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          현재:{' '}
          {getStatusLabel(
            selectedStatus,
          )}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {STATUS_OPTIONS.map(
          (option) => {
            const active =
              option.value ===
              selectedStatus;

            const saving =
              savingStatus ===
              option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  handleChangeStatus(
                    option.value,
                  )
                }
                disabled={
                  isSaving ||
                  active
                }
                aria-pressed={active}
                aria-label={
                  active
                    ? `${option.label}, 현재 상태`
                    : `상담 상태를 ${option.label}로 변경`
                }
                style={getButtonStyle(
                  option.value,
                  active,
                  isSaving,
                )}
              >
                {saving
                  ? '변경 중...'
                  : active
                    ? `✓ ${option.label}`
                    : option.label}
              </button>
            );
          },
        )}
      </div>

      {isSaving ? (
        <p
          role="status"
          style={{
            margin: '10px 0 0',
            color: '#8a806f',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          상담 상태와 책 상태를
          저장하고 있습니다. 고객
          이메일이 등록되어 있으면
          변경 안내도 발송됩니다.
        </p>
      ) : (
        <p
          style={{
            margin: '10px 0 0',
            color: '#968a79',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          책 상태는 같은 책에 연결된
          모든 상담 기록을 기준으로
          자동 계산됩니다.
        </p>
      )}
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
      '이 상담을 완료 처리합니다.',
      '책 상태는 같은 책의 모든 상담 기록을 기준으로 자동 계산됩니다.',
      '고객 이메일이 등록되어 있으면 변경 안내가 발송됩니다.',
    ].join('\n');
  }

  if (status === 'CANCELED') {
    return [
      `상담 상태를 "${label}"로 변경할까요?`,
      '',
      '이 상담 신청을 취소 처리합니다.',
      '다른 진행 중 상담이나 완료 상담이 있으면 책 상태는 원고 초안으로 변경되지 않을 수 있습니다.',
      '고객 이메일이 등록되어 있으면 변경 안내가 발송됩니다.',
    ].join('\n');
  }

  return [
    `상담 상태를 "${label}"로 변경할까요?`,
    '',
    '책 상태는 같은 책의 전체 상담 기록을 기준으로 자동 계산됩니다.',
    '고객 이메일이 등록되어 있으면 변경 안내가 발송됩니다.',
  ].join('\n');
}

function getSuccessMessage(
  result: StatusApiResult,
  fallbackLabel: string,
) {
  const lines: string[] = [];

  lines.push(
    result.message ||
      `상담 상태를 "${fallbackLabel}"로 변경했습니다.`,
  );

  if (
    isProductionRequestStatus(
      result.status,
    )
  ) {
    lines.push(
      `상담 상태: ${getStatusLabel(result.status)}`,
    );
  }

  if (
    isBookStatus(
      result.bookStatus,
    )
  ) {
    lines.push(
      `현재 책 상태: ${getBookStatusLabel(result.bookStatus)}`,
    );
  }

  if (
    typeof result.activeRequestCount ===
    'number'
  ) {
    lines.push(
      `진행 중 상담: ${result.activeRequestCount}건`,
    );
  }

  if (
    typeof result.completedRequestCount ===
    'number'
  ) {
    lines.push(
      `완료 상담: ${result.completedRequestCount}건`,
    );
  }

  return lines.join('\n');
}

function isProductionRequestStatus(
  value: unknown,
): value is ProductionRequestStatus {
  return (
    typeof value === 'string' &&
    STATUS_OPTIONS.some(
      (option) =>
        option.value === value,
    )
  );
}

function isBookStatus(
  value: unknown,
): value is BookStatus {
  return (
    value === 'DRAFT' ||
    value === 'IN_PRODUCTION' ||
    value === 'PUBLISHED'
  );
}

function getStatusLabel(
  status:
    | ProductionRequestStatus
    | null,
) {
  if (!status) {
    return '상태 확인 필요';
  }

  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value === status,
    )?.label ||
    '상태 확인 필요'
  );
}

function getBookStatusLabel(
  status: BookStatus,
) {
  if (status === 'DRAFT') {
    return '원고 초안';
  }

  if (
    status === 'IN_PRODUCTION'
  ) {
    return '제작 진행 중';
  }

  return '완성';
}

function getButtonStyle(
  status: ProductionRequestStatus,
  active: boolean,
  isSaving: boolean,
): CSSProperties {
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

  const colors =
    statusColors[status];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 14px',
    borderRadius: 999,
    border: active
      ? '2px solid #24170f'
      : `1px solid ${colors.border}`,
    background: active
      ? '#24170f'
      : colors.background,
    color: active
      ? '#fffaf0'
      : colors.color,
    fontSize: 13,
    fontWeight: 900,
    cursor:
      isSaving || active
        ? 'not-allowed'
        : 'pointer',
    opacity:
      isSaving && !active
        ? 0.55
        : 1,
    transition:
      'opacity 0.15s ease, transform 0.15s ease',
    whiteSpace: 'nowrap',
  };
}