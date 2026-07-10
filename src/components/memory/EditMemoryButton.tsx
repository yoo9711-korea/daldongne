'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  memoryId: string;
  initialTitle: string;
  initialDescription: string;
  initialOccurredAt?: string | null;
  label?: string;
};

export default function EditMemoryButton({
  memoryId,
  initialTitle,
  initialDescription,
  initialOccurredAt = null,
  label = '수정',
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(cleanEditableTitle(initialTitle));
  const [description, setDescription] = useState(initialDescription);
const [occurredAt, setOccurredAt] = useState(
  toDateInputValue(initialOccurredAt),
);
const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (isSaving) return;

    const trimmedTitle = cleanEditableTitle(title.trim());
    const trimmedDescription = description.trim();

    if (!trimmedTitle && !trimmedDescription) {
      alert('수정할 내용을 입력해 주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/memory/${memoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
  title: trimmedTitle,
  description: trimmedDescription,
  occurredAt: occurredAt.trim(),
}),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        alert(result.message || '기록을 수정하지 못했습니다.');
        return;
      }

      alert(result.message || '기록을 수정했습니다.');
      setIsOpen(false);
      router.refresh();
    } catch {
      alert('기록을 수정하는 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 34,
          padding: '0 12px',
          borderRadius: 999,
          border: '1px solid #d6b778',
          background: '#fffaf0',
          color: '#5a3a18',
          fontSize: 13,
          fontWeight: 900,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>

      {isOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(36, 23, 15, 0.45)',
          }}
        >
          <div
            style={{
              width: 'min(620px, 100%)',
              padding: 26,
              borderRadius: 28,
              background: '#fffaf0',
              border: '1px solid #e4cda3',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.25)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 900,
                color: '#9a6a24',
              }}
            >
              기록 수정
            </p>

            <h2
              style={{
                margin: '8px 0 18px',
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 28,
                lineHeight: 1.35,
                color: '#24170f',
              }}
            >
              제목과 이야기를 수정합니다
            </h2>

            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 900,
                color: '#4a3828',
              }}
            >
              제목
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 아버지가 늘 하시던 말"
              style={{
                width: '100%',
                height: 46,
                padding: '0 14px',
                borderRadius: 14,
                border: '1px solid #d6b778',
                background: '#fffdf6',
                color: '#24170f',
                fontSize: 15,
                outline: 'none',
              }}
            />

            <label
  style={{
    display: 'block',
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 900,
    color: '#4a3828',
  }}
>
  기억 날짜
</label>

<input
  type="date"
  value={occurredAt}
  onChange={(event) => setOccurredAt(event.target.value)}
  style={{
    width: '100%',
    height: 46,
    padding: '0 14px',
    borderRadius: 14,
    border: '1px solid #d6b778',
    background: '#fffdf6',
    color: '#24170f',
    fontSize: 15,
    outline: 'none',
  }}
/>

<p
  style={{
    margin: '6px 0 0',
    fontSize: 12,
    lineHeight: 1.6,
    color: '#8a806f',
  }}
>
  정확한 날짜를 모르면 비워두어도 됩니다. 날짜를 넣으면 책 원고가 시간
  순서대로 더 잘 정리됩니다.
</p>

            <label
              style={{
                display: 'block',
                marginTop: 16,
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 900,
                color: '#4a3828',
              }}
            >
              이야기
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              style={{
                width: '100%',
                minHeight: 190,
                resize: 'vertical',
                padding: 16,
                borderRadius: 16,
                border: '1px solid #d6b778',
                background: '#fffdf6',
                color: '#24170f',
                fontSize: 15,
                lineHeight: 1.75,
                outline: 'none',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 18,
              }}
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSaving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 42,
                  padding: '0 18px',
                  borderRadius: 999,
                  border: '1px solid #d6b778',
                  background: '#fffaf0',
                  color: '#5a3a18',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 42,
                  padding: '0 20px',
                  borderRadius: 999,
                  border: '1px solid #24170f',
                  background: isSaving ? '#b8a68f' : '#24170f',
                  color: '#fffaf0',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {isSaving ? '저장 중...' : '수정 저장'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function cleanEditableTitle(value: string) {
  return value
    .replace(/^이야기:\s*/, '')
    .replace(/^AI 인터뷰:\s*/, '')
    .trim();
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}