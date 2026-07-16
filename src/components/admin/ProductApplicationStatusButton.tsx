'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ApplicationStatus =
  | 'REQUESTED'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

type ProductApplicationStatusButtonProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
};

type StatusResponse = {
  ok?: boolean;
  message?: string;
  application?: {
    status?: ApplicationStatus;
  };
};

const NEXT_STATUS_OPTIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  REQUESTED: [
    'CONTACTED',
    'CANCELED',
  ],
  CONTACTED: [
    'IN_PROGRESS',
    'CANCELED',
  ],
  IN_PROGRESS: [
    'COMPLETED',
    'CANCELED',
  ],
  COMPLETED: [],
  CANCELED: [],
};

export default function ProductApplicationStatusButton({
  applicationId,
  currentStatus,
}: ProductApplicationStatusButtonProps) {
  const router = useRouter();

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const nextStatuses =
    NEXT_STATUS_OPTIONS[currentStatus];

  const changeStatus = async (
    nextStatus: ApplicationStatus,
  ) => {
    if (isUpdating) {
      return;
    }

    if (
      nextStatus === 'CANCELED' &&
      !window.confirm(
        '이 상품 신청을 취소 상태로 변경하시겠습니까?',
      )
    ) {
      return;
    }

    if (
      nextStatus === 'COMPLETED' &&
      !window.confirm(
        '이 상품 신청을 처리 완료로 변경하시겠습니까?',
      )
    ) {
      return;
    }

    setIsUpdating(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/admin/product-applications/${encodeURIComponent(
          applicationId,
        )}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as
          | StatusResponse
          | null;

      if (
        !response.ok ||
        !data?.ok
      ) {
        setMessage(
          data?.message ||
            '신청 상태를 변경하지 못했습니다.',
        );
        return;
      }

      setMessage(
        data.message ||
          '신청 상태가 변경되었습니다.',
      );

      router.refresh();
    } catch (error) {
      console.error(
        '[PRODUCT_APPLICATION_STATUS_BUTTON_ERROR]',
        error,
      );

      setMessage(
        '신청 상태 변경 중 오류가 발생했습니다.',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (nextStatuses.length === 0) {
    return (
      <div
        style={{
          marginTop: 16,
          padding: '13px 14px',
          borderRadius: 14,
          background: '#f3ede5',
          color: '#796b5d',
          fontSize: 12,
          fontWeight: 800,
          lineHeight: 1.6,
          textAlign: 'center',
        }}
      >
        {currentStatus === 'COMPLETED'
          ? '처리가 완료된 신청입니다.'
          : '취소된 신청입니다.'}
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop:
          '1px solid #eadcc6',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#8a5a2c',
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        신청 상태 변경
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 10,
        }}
      >
        {nextStatuses.map(
          (nextStatus) => (
            <button
              key={nextStatus}
              type="button"
              disabled={isUpdating}
              onClick={() =>
                void changeStatus(
                  nextStatus,
                )
              }
              style={{
                minHeight: 40,
                padding: '0 14px',
                borderRadius: 12,
                border:
                  nextStatus ===
                  'CANCELED'
                    ? '1px solid #cdaaa5'
                    : '1px solid #6e421d',
                background:
                  nextStatus ===
                  'CANCELED'
                    ? '#fff5f3'
                    : '#6e421d',
                color:
                  nextStatus ===
                  'CANCELED'
                    ? '#943f37'
                    : '#fffaf0',
                fontSize: 12,
                fontWeight: 900,
                cursor: isUpdating
                  ? 'not-allowed'
                  : 'pointer',
                opacity: isUpdating
                  ? 0.65
                  : 1,
              }}
            >
              {isUpdating
                ? '변경 중...'
                : getStatusButtonLabel(
                    nextStatus,
                  )}
            </button>
          ),
        )}
      </div>

      {message ? (
        <p
          aria-live="polite"
          style={{
            margin: '10px 0 0',
            padding: '10px 12px',
            borderRadius: 12,
            background: '#fff0ed',
            color: '#923c35',
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function getStatusButtonLabel(
  status: ApplicationStatus,
) {
  if (status === 'CONTACTED') {
    return '연락 완료로 변경';
  }

  if (status === 'IN_PROGRESS') {
    return '진행 중으로 변경';
  }

  if (status === 'COMPLETED') {
    return '처리 완료로 변경';
  }

  if (status === 'CANCELED') {
    return '신청 취소';
  }

  return '상태 변경';
}