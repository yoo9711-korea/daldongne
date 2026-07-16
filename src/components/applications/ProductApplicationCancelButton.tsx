'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ApplicationStatus =
  | 'REQUESTED'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

type ProductApplicationCancelButtonProps = {
  applicationId: string;
  currentStatus: ApplicationStatus;
};

type CancelResponse = {
  ok?: boolean;
  message?: string;
  unchanged?: boolean;
  application?: {
    id?: string;
    status?: ApplicationStatus;
  };
};

export default function ProductApplicationCancelButton({
  applicationId,
  currentStatus,
}: ProductApplicationCancelButtonProps) {
  const router = useRouter();

  const [isCanceling, setIsCanceling] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const canCancel =
    currentStatus === 'REQUESTED' ||
    currentStatus === 'CONTACTED';

  const handleCancel = async () => {
    if (
      isCanceling ||
      !canCancel
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        '이 상품 신청을 취소하시겠습니까?\n\n취소 후에는 같은 상품을 다시 신청할 수 있습니다.',
      );

    if (!confirmed) {
      return;
    }

    setIsCanceling(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/product-applications/${encodeURIComponent(
          applicationId,
        )}/cancel`,
        {
          method: 'PATCH',
        },
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as
          | CancelResponse
          | null;

      if (
        !response.ok ||
        !data?.ok
      ) {
        setMessage(
          data?.message ||
            '상품 신청을 취소하지 못했습니다.',
        );
        return;
      }

      setMessage(
        data.message ||
          '상품 신청이 취소되었습니다.',
      );

      router.refresh();
    } catch (error) {
      console.error(
        '[PRODUCT_APPLICATION_CANCEL_BUTTON_ERROR]',
        error,
      );

      setMessage(
        '상품 신청 취소 중 오류가 발생했습니다.',
      );
    } finally {
      setIsCanceling(false);
    }
  };

  if (!canCancel) {
    return null;
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
      <button
        type="button"
        onClick={() =>
          void handleCancel()
        }
        disabled={isCanceling}
        style={{
          minHeight: 42,
          padding: '0 16px',
          borderRadius: 13,
          border:
            '1px solid #cdaaa5',
          background: '#fff5f3',
          color: '#943f37',
          fontSize: 13,
          fontWeight: 900,
          cursor: isCanceling
            ? 'not-allowed'
            : 'pointer',
          opacity: isCanceling
            ? 0.65
            : 1,
        }}
      >
        {isCanceling
          ? '취소 처리 중...'
          : '상품 신청 취소'}
      </button>

      <p
        style={{
          margin: '9px 0 0',
          color: '#8a7867',
          fontSize: 11,
          lineHeight: 1.65,
        }}
      >
        신청 접수 또는 연락 완료 단계까지만
        직접 취소할 수 있습니다.
      </p>

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