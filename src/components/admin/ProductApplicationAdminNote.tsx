'use client';

import { useRouter } from 'next/navigation';
import {
  type FormEvent,
  useState,
} from 'react';

type ProductApplicationAdminNoteProps = {
  applicationId: string;
  initialNote: string;
  updatedAt: string | null;
};

type AdminNoteResponse = {
  ok?: boolean;
  message?: string;
  application?: {
    adminNote?: string | null;
    adminNoteUpdatedAt?: string | null;
  };
};

export default function ProductApplicationAdminNote({
  applicationId,
  initialNote,
  updatedAt,
}: ProductApplicationAdminNoteProps) {
  const router = useRouter();

  const [note, setNote] =
    useState(initialNote);

  const [savedNote, setSavedNote] =
    useState(initialNote);

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const hasChanged =
    note.trim() !== savedNote.trim();

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      isSaving ||
      !hasChanged
    ) {
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/admin/product-applications/${encodeURIComponent(
          applicationId,
        )}/note`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            note,
          }),
        },
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as
          | AdminNoteResponse
          | null;

      if (
        !response.ok ||
        !data?.ok
      ) {
        setMessage(
          data?.message ||
            '관리자 메모를 저장하지 못했습니다.',
        );
        return;
      }

      const nextSavedNote =
        data.application?.adminNote ||
        '';

      setNote(nextSavedNote);
      setSavedNote(nextSavedNote);

      setMessage(
        data.message ||
          '관리자 내부 메모가 저장되었습니다.',
      );

      router.refresh();
    } catch (error) {
      console.error(
        '[PRODUCT_APPLICATION_ADMIN_NOTE_FORM_ERROR]',
        error,
      );

      setMessage(
        '관리자 메모 저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      isSaving ||
      !savedNote
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        '저장된 관리자 내부 메모를 삭제하시겠습니까?',
      );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/admin/product-applications/${encodeURIComponent(
          applicationId,
        )}/note`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            note: '',
          }),
        },
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as
          | AdminNoteResponse
          | null;

      if (
        !response.ok ||
        !data?.ok
      ) {
        setMessage(
          data?.message ||
            '관리자 메모를 삭제하지 못했습니다.',
        );
        return;
      }

      setNote('');
      setSavedNote('');

      setMessage(
        data.message ||
          '관리자 내부 메모가 삭제되었습니다.',
      );

      router.refresh();
    } catch (error) {
      console.error(
        '[PRODUCT_APPLICATION_ADMIN_NOTE_DELETE_ERROR]',
        error,
      );

      setMessage(
        '관리자 메모 삭제 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 16,
        padding: 17,
        borderRadius: 17,
        border:
          '1px solid #d9c299',
        background: '#fff7e7',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <strong
            style={{
              display: 'block',
              color: '#4a3423',
              fontSize: 13,
            }}
          >
            관리자 내부 메모
          </strong>

          <span
            style={{
              display: 'block',
              marginTop: 4,
              color: '#8a7867',
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            사용자에게 표시되지 않습니다.
          </span>
        </div>

        {updatedAt ? (
          <span
            style={{
              color: '#958473',
              fontSize: 10,
            }}
          >
            마지막 저장 {updatedAt}
          </span>
        ) : null}
      </div>

      <textarea
        value={note}
        onChange={(event) =>
          setNote(event.target.value)
        }
        maxLength={5000}
        placeholder="상담 내용, 연락 결과, 확인할 사항 등을 입력하세요."
        style={{
          width: '100%',
          minHeight: 125,
          marginTop: 12,
          padding: 13,
          boxSizing: 'border-box',
          border:
            '1px solid #d8c3a1',
          borderRadius: 13,
          background: '#fffefb',
          color: '#35251a',
          font: 'inherit',
          fontSize: 13,
          lineHeight: 1.7,
          resize: 'vertical',
          outline: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 10,
        }}
      >
        <span
          style={{
            color: '#918170',
            fontSize: 10,
          }}
        >
          {note.length.toLocaleString(
            'ko-KR',
          )}
          /5,000자
        </span>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {savedNote ? (
            <button
              type="button"
              onClick={() =>
                void handleDelete()
              }
              disabled={isSaving}
              style={{
                minHeight: 39,
                padding: '0 13px',
                borderRadius: 11,
                border:
                  '1px solid #cdaaa5',
                background: '#fff5f3',
                color: '#943f37',
                fontSize: 12,
                fontWeight: 900,
                cursor: isSaving
                  ? 'not-allowed'
                  : 'pointer',
                opacity: isSaving
                  ? 0.65
                  : 1,
              }}
            >
              메모 삭제
            </button>
          ) : null}

          <button
            type="submit"
            disabled={
              isSaving ||
              !hasChanged
            }
            style={{
              minHeight: 39,
              padding: '0 15px',
              borderRadius: 11,
              border: 0,
              background:
                hasChanged
                  ? '#6e421d'
                  : '#b8aa9a',
              color: '#fffaf0',
              fontSize: 12,
              fontWeight: 900,
              cursor:
                isSaving ||
                !hasChanged
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isSaving
              ? '저장 중...'
              : '메모 저장'}
          </button>
        </div>
      </div>

      {message ? (
        <p
          aria-live="polite"
          style={{
            margin: '11px 0 0',
            padding: '10px 12px',
            borderRadius: 11,
            background: '#f1e3cd',
            color: '#684a2f',
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}