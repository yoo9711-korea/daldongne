'use client';

import { useState } from 'react';

type Props = {
  bookId: string;
  revisionId: string;
  initialLabel?: string | null;
  isPinned: boolean;
  onSaved: () => void;
};

export default function BookRevisionMetadataControls({
  bookId,
  revisionId,
  initialLabel = '',
  isPinned,
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] =
    useState(false);

  const saveMetadata = async ({
    label,
    nextPinned,
  }: {
    label: string;
    nextPinned: boolean;
  }) => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/book/${encodeURIComponent(
          bookId,
        )}/revisions/${encodeURIComponent(
          revisionId,
        )}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            label,
            isPinned: nextPinned,
          }),
        },
      );

      const result =
        (await response.json()) as {
          ok?: boolean;
          message?: string;
        };

      if (!response.ok || !result.ok) {
        alert(
          result.message ||
            '원고 이력 정보를 저장하지 못했습니다.',
        );
        return;
      }

      alert(
        result.message ||
          '원고 이력 정보를 저장했습니다.',
      );

      onSaved();
    } catch {
      alert(
        '원고 이력 정보를 저장하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLabelChange = () => {
    if (isSaving) {
      return;
    }

    const nextLabel = window.prompt(
      '이 원고 이력의 이름을 입력해 주세요.\n비워 두면 이름이 삭제됩니다.',
      initialLabel || '',
    );

    if (nextLabel === null) {
      return;
    }

    const trimmedLabel =
      nextLabel.trim();

    if (trimmedLabel.length > 60) {
      alert(
        '이력 이름은 60자 이내로 입력해 주세요.',
      );
      return;
    }

    void saveMetadata({
      label: trimmedLabel,
      nextPinned: isPinned,
    });
  };

  const handlePinnedChange = () => {
    if (isSaving) {
      return;
    }

    if (isPinned) {
      const confirmed = window.confirm(
        '중요 버전 고정을 해제할까요?\n\n고정을 해제하면 일반 이력 30개 제한에 포함됩니다.',
      );

      if (!confirmed) {
        return;
      }
    }

    void saveMetadata({
      label: initialLabel || '',
      nextPinned: !isPinned,
    });
  };

 const handleDelete = async () => {
  if (isSaving) {
    return;
  }

  if (isPinned) {
    alert(
      '중요 버전은 삭제할 수 없습니다. 먼저 고정을 해제해 주세요.',
    );
    return;
  }

  const displayName =
    initialLabel ||
    '이름 없는 원고 이력';

  const confirmed = window.confirm(
    `"${displayName}"을 삭제할까요?\n\n삭제한 원고 이력은 다시 복구할 수 없습니다.`,
  );

  if (!confirmed) {
    return;
  }

  setIsSaving(true);

  try {
    const response = await fetch(
      `/api/book/${encodeURIComponent(
        bookId,
      )}/revisions/${encodeURIComponent(
        revisionId,
      )}`,
      {
        method: 'DELETE',
      },
    );

    const result =
      (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

    if (!response.ok || !result.ok) {
      alert(
        result.message ||
          '원고 이력을 삭제하지 못했습니다.',
      );
      return;
    }

    alert(
      result.message ||
        '원고 이력을 삭제했습니다.',
    );

    onSaved();
  } catch {
    alert(
      '원고 이력을 삭제하는 중 오류가 발생했습니다.',
    );
  } finally {
    setIsSaving(false);
  }
};

  return (
    <div className="book-revision-metadata">
      <div className="book-revision-metadata-labels">
        {isPinned ? (
          <span className="book-revision-pinned-badge">
            ★ 중요 버전
          </span>
        ) : null}

        {initialLabel ? (
          <strong>
            {initialLabel}
          </strong>
        ) : (
          <span className="book-revision-no-label">
            이름 없는 이력
          </span>
        )}
      </div>

      <div className="book-revision-metadata-actions">
        <button
          type="button"
          onClick={handleLabelChange}
          disabled={isSaving}
        >
          {initialLabel
            ? '이름 수정'
            : '이름 지정'}
        </button>

        <button
          type="button"
          className={
            isPinned
              ? 'is-unpin'
              : 'is-pin'
          }
          onClick={handlePinnedChange}
          disabled={isSaving}
        >
          {isSaving
            ? '저장 중...'
            : isPinned
              ? '고정 해제'
              : '중요 버전 고정'}
        </button>

       <button
  type="button"
  className="is-delete"
  onClick={handleDelete}
  disabled={isSaving || isPinned}
  title={
    isPinned
      ? '중요 버전 고정을 먼저 해제해 주세요.'
      : '이 원고 이력을 삭제합니다.'
  }
>
  이력 삭제
</button>

      </div>

      <style>{`
        .book-revision-metadata {
          margin-top: 12px;
          padding: 11px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid #ead8ce;
          border-radius: 13px;
          background: #fffdfb;
        }

        .book-revision-metadata-labels,
        .book-revision-metadata-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
        }

        .book-revision-pinned-badge {
          padding: 5px 9px;
          border-radius: 999px;
          background: #fff0bd;
          color: #8d5c12;
          font-size: 11px;
          font-weight: 900;
        }

        .book-revision-metadata-labels strong {
          color: #5c4035;
          font-size: 13px;
        }

        .book-revision-no-label {
          color: #a1887d;
          font-size: 12px;
        }

        .book-revision-metadata-actions button {
          min-height: 34px;
          padding: 0 12px;
          border: 1px solid #dec8bd;
          border-radius: 999px;
          background: #ffffff;
          color: #705247;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .book-revision-metadata-actions
        button.is-pin {
          border-color: #e3bc68;
          background: #fff7dc;
          color: #8b5a17;
        }

        .book-revision-metadata-actions
        button.is-unpin {
          border-color: #d9c9c1;
          background: #f6f1ee;
          color: #705247;
        }

       .book-revision-metadata-actions
        button.is-delete {
        border-color: #e3b7ad;
        background: #fff1ee;
       color: #aa4938;
       }

        .book-revision-metadata-actions
        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        @media (max-width: 700px) {
          .book-revision-metadata {
            align-items: stretch;
            flex-direction: column;
          }

          .book-revision-metadata-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .book-revision-metadata-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}