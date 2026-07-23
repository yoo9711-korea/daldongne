'use client';

import { useRouter } from 'next/navigation';
import {
  useEffect,
  useState,
} from 'react';

import type {
  CSSProperties,
  FormEvent,
} from 'react';

type Props = {
  bookId: string;
  initialTitle: string;
  initialSubtitle?: string | null;
  initialSummary?: string | null;
  initialCoverText?: string | null;
  initialContent?: string | null;
};

export default function EditBookDraftButton({
  bookId,
  initialTitle,
  initialSubtitle = '',
  initialSummary = '',
  initialCoverText = '',
  initialContent = '',
}: Props) {
  const router = useRouter();

  const [isOpen, setIsOpen] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [title, setTitle] =
    useState(initialTitle);

  const [subtitle, setSubtitle] =
    useState(initialSubtitle || '');

  const [summary, setSummary] =
    useState(initialSummary || '');

  const [coverText, setCoverText] =
    useState(initialCoverText || '');

  const [content, setContent] =
    useState(initialContent || '');

   const hasUnsavedChanges =
  title.trim() !==
    initialTitle.trim() ||
  subtitle.trim() !==
    (initialSubtitle || '').trim() ||
  summary.trim() !==
    (initialSummary || '').trim() ||
  coverText.trim() !==
    (initialCoverText || '').trim() ||
  content.trim() !==
    (initialContent || '').trim();

  const openEditor = () => {
    setTitle(initialTitle);
    setSubtitle(initialSubtitle || '');
    setSummary(initialSummary || '');
    setCoverText(initialCoverText || '');
    setContent(initialContent || '');
    setIsOpen(true);
  };

  const closeEditor = () => {
  if (isSaving) {
    return;
  }

  if (hasUnsavedChanges) {
    const confirmed = window.confirm(
      '저장하지 않은 수정 내용이 있습니다.\n\n저장하지 않고 편집창을 닫을까요?',
    );

    if (!confirmed) {
      return;
    }
  }

  setIsOpen(false);
};

useEffect(() => {
  if (!isOpen) {
    return;
  }

  const handleEscape = (
    event: KeyboardEvent,
  ) => {
    if (
      event.key !== 'Escape' ||
      isSaving
    ) {
      return;
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        '저장하지 않은 수정 내용이 있습니다.\n\n저장하지 않고 편집창을 닫을까요?',
      );

      if (!confirmed) {
        return;
      }
    }

    setIsOpen(false);
  };

  const handleBeforeUnload = (
    event: BeforeUnloadEvent,
  ) => {
    if (
      !hasUnsavedChanges ||
      isSaving
    ) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  };

  window.addEventListener(
    'keydown',
    handleEscape,
  );

  window.addEventListener(
    'beforeunload',
    handleBeforeUnload,
  );

  return () => {
    window.removeEventListener(
      'keydown',
      handleEscape,
    );

    window.removeEventListener(
      'beforeunload',
      handleBeforeUnload,
    );
  };
}, [
  isOpen,
  isSaving,
  hasUnsavedChanges,
]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (!title.trim()) {
      alert('책 제목을 입력해 주세요.');
      return;
    }

    if (!content.trim()) {
      alert('책 본문을 입력해 주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/book/${bookId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            subtitle: subtitle.trim(),
            summary: summary.trim(),
            coverText: coverText.trim(),
            content: content.trim(),
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
            '책 원고를 저장하지 못했습니다.',
        );
        return;
      }

      alert(
        result.message ||
          '책 원고를 저장했습니다.',
      );

      setIsOpen(false);
      router.refresh();
    } catch {
      alert(
        '책 원고를 저장하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        style={openButtonStyle}
      >
        원고 직접 수정
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="책 원고 직접 수정"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditor();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflowY: 'auto',
            background:
              'rgba(54, 34, 24, 0.58)',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              width: 'min(900px, 100%)',
              maxHeight: '92vh',
              padding: 26,
              overflowY: 'auto',
              borderRadius: 26,
              border:
                '1px solid #efc9b8',
              background: '#fffdfb',
              boxShadow:
                '0 24px 70px rgba(66, 38, 24, 0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'flex-start',
                gap: 16,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: '#d56f55',
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  책 원고 편집
                </p>

                <h2
                  style={{
                    margin: '7px 0 0',
                    color: '#49352b',
                    fontSize: 28,
                    lineHeight: 1.35,
                  }}
                >
                  제목과 본문을 직접 수정합니다
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={isSaving}
                aria-label="원고 편집 창 닫기"
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <p
              style={{
                margin: '12px 0 20px',
                color: '#725d52',
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              저장한 내용은 책 상세,
              전자책, 인쇄용 원고에
              함께 반영됩니다.
            </p>

            <label style={labelStyle}>
              책 제목
            </label>

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              maxLength={120}
              style={inputStyle}
            />

            <label style={labelStyle}>
              부제
            </label>

            <input
              value={subtitle}
              onChange={(event) =>
                setSubtitle(
                  event.target.value,
                )
              }
              maxLength={200}
              style={inputStyle}
            />

            <label style={labelStyle}>
              책 소개
            </label>

            <textarea
              value={summary}
              onChange={(event) =>
                setSummary(
                  event.target.value,
                )
              }
              maxLength={2000}
              style={{
                ...inputStyle,
                minHeight: 110,
                padding: 14,
                resize: 'vertical',
              }}
            />

            <label style={labelStyle}>
              표지 문구
            </label>

            <textarea
              value={coverText}
              onChange={(event) =>
                setCoverText(
                  event.target.value,
                )
              }
              maxLength={500}
              style={{
                ...inputStyle,
                minHeight: 90,
                padding: 14,
                resize: 'vertical',
              }}
            />

            <label style={labelStyle}>
              책 본문
            </label>

            <textarea
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value,
                )
              }
              maxLength={200000}
              style={{
                ...inputStyle,
                minHeight: 360,
                padding: 16,
                resize: 'vertical',
                fontFamily:
                  'Noto Serif KR, serif',
                fontSize: 15,
                lineHeight: 1.85,
              }}
            />

            <div
              style={{
                marginTop: 20,
                display: 'flex',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: 9,
              }}
            >
              <button
                type="button"
                onClick={closeEditor}
                disabled={isSaving}
                style={cancelButtonStyle}
              >
                취소
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={saveButtonStyle}
              >
                {isSaving
                  ? '저장 중...'
                  : '수정 내용 저장'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

const openButtonStyle: CSSProperties = {
  minHeight: 46,
  padding: '0 22px',
  borderRadius: 999,
  border: '1px solid #df8f74',
  background: '#fff3ed',
  color: '#a65f48',
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer',
};

const labelStyle: CSSProperties = {
  display: 'block',
  marginTop: 15,
  marginBottom: 7,
  color: '#49352b',
  fontSize: 13,
  fontWeight: 900,
};

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 46,
  boxSizing: 'border-box',
  padding: '0 14px',
  borderRadius: 13,
  border: '1px solid #dfb5a2',
  background: '#fffaf7',
  color: '#49352b',
  fontSize: 14,
  outline: 'none',
};

const closeButtonStyle: CSSProperties = {
  width: 38,
  height: 38,
  flexShrink: 0,
  borderRadius: 999,
  border: '1px solid #dfb5a2',
  background: '#fff7f2',
  color: '#7f4d3c',
  fontSize: 22,
  fontWeight: 900,
  cursor: 'pointer',
};

const cancelButtonStyle: CSSProperties = {
  minHeight: 43,
  padding: '0 19px',
  borderRadius: 999,
  border: '1px solid #dfb5a2',
  background: '#ffffff',
  color: '#6c4d41',
  fontSize: 13,
  fontWeight: 900,
  cursor: 'pointer',
};

const saveButtonStyle: CSSProperties = {
  minHeight: 43,
  padding: '0 21px',
  borderRadius: 999,
  border: '1px solid #e97861',
  background:
    'linear-gradient(135deg, #f49378, #e97861)',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 900,
  cursor: 'pointer',
};