'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export type BookDraftBookType =
  | 'PARENT_LIFE'
  | 'FAMILY'
  | 'BABY'
  | 'COUPLE'
  | 'TRAVEL';

export type BookDraftTone =
  | 'warm'
  | 'plain'
  | 'letter'
  | 'autobiography';

export type BookDraftLength = 'short' | 'medium' | 'long';

type Props = {
  disabled?: boolean;
  selectedMemoryIds?: string[];
  selectedPhotoCount?: number;
  selectedStoryCount?: number;
  targetBookId?: string;
  bookType?: BookDraftBookType;
  tone?: BookDraftTone;
  length?: BookDraftLength;
};

const REQUIRED_PHOTO_COUNT = 3;
const RECOMMENDED_STORY_COUNT = 3;

const bookTypeLabelMap: Record<BookDraftBookType, string> = {
  PARENT_LIFE: '부모님 인생책',
  FAMILY: '가족 이야기책',
  BABY: '성장 기록책',
  COUPLE: '부부 이야기책',
  TRAVEL: '여행 기록책',
};

const toneLabelMap: Record<BookDraftTone, string> = {
  warm: '따뜻한 문체',
  plain: '담백한 문체',
  letter: '편지체',
  autobiography: '자서전 문체',
};

const lengthLabelMap: Record<BookDraftLength, string> = {
  short: '짧은 소책자',
  medium: '보통 분량',
  long: '긴 원고',
};

export default function CreateBookDraftButton({
  disabled = false,
  selectedMemoryIds = [],
  selectedPhotoCount,
  selectedStoryCount,
  targetBookId,
  bookType = 'PARENT_LIFE',
  tone = 'warm',
  length = 'medium',
}: Props) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showMaterialModal, setShowMaterialModal] =
    useState(false);
  const [showConfirmModal, setShowConfirmModal] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const hasPhotoCount =
    typeof selectedPhotoCount === 'number';
  const hasStoryCount =
    typeof selectedStoryCount === 'number';

  const photoCount = selectedPhotoCount ?? 0;
  const storyCount = selectedStoryCount ?? 0;

  const missingPhotoCount = hasPhotoCount
    ? Math.max(REQUIRED_PHOTO_COUNT - photoCount, 0)
    : disabled
      ? REQUIRED_PHOTO_COUNT
      : 0;

  const missingStoryCount = hasStoryCount
    ? Math.max(RECOMMENDED_STORY_COUNT - storyCount, 0)
    : 0;

  const photoIsInsufficient =
    disabled ||
    (hasPhotoCount &&
      photoCount < REQUIRED_PHOTO_COUNT);

  const storyIsInsufficient =
    hasStoryCount &&
    storyCount < RECOMMENDED_STORY_COUNT;

  const handleButtonClick = () => {
    if (isLoading) return;

    if (photoIsInsufficient || storyIsInsufficient) {
      setShowMaterialModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleCreate = async () => {
    if (isLoading || photoIsInsufficient) return;

    setShowConfirmModal(false);
    setShowMaterialModal(false);
    setErrorMessage(null);

    try {
      setIsLoading(true);

      const res = await fetch('/api/book/create-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedMemoryIds,
          targetBookId,
          bookType,
          tone,
          length,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            '책 원고를 만드는 중 문제가 발생했습니다.',
        );
      }

      if (!data?.bookId) {
        throw new Error(
          '생성된 책 ID를 찾을 수 없습니다.',
        );
      }

      router.push(`/dashboard/library/${data.bookId}`);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : '책 원고를 만드는 중 문제가 발생했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goToPhotos = () => {
    setShowMaterialModal(false);
    router.push('/dashboard/timeline');
  };

  const goToStories = () => {
    setShowMaterialModal(false);
    router.push('/dashboard/interview');
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 46,
          padding: '0 22px',
          borderRadius: 999,
          border: '1px solid #5a3a18',
          background: isLoading
            ? '#d8cdbb'
            : '#5a3a18',
          color: '#fffaf0',
          fontSize: 15,
          fontWeight: 900,
          cursor: isLoading
            ? 'not-allowed'
            : 'pointer',
          opacity: isLoading ? 0.65 : 1,
        }}
      >
        {isLoading
          ? 'AI 원고 만드는 중...'
          : 'AI로 책 원고 만들기'}
      </button>

      {showMaterialModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="material-modal-title"
          onClick={() => setShowMaterialModal(false)}
          style={overlayStyle}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={modalStyle}
          >
            <button
              type="button"
              aria-label="팝업 닫기"
              onClick={() =>
                setShowMaterialModal(false)
              }
              style={closeButtonStyle}
            >
              ×
            </button>

            <div style={iconStyle}>♡</div>

            <p style={modalLabelStyle}>
              스토리북 자료 안내
            </p>

            <h2
              id="material-modal-title"
              style={modalTitleStyle}
            >
              책을 만들기 위한 자료가
              <br />
              조금 더 필요해요.
            </h2>

            <p style={modalDescriptionStyle}>
              사진과 이야기가 충분할수록
              더 구체적이고 풍성한 원고가
              만들어집니다.
            </p>

            <div style={countBoxStyle}>
              <div style={countRowStyle}>
                <span style={countLabelStyle}>
                  사진
                </span>

                <strong style={countValueStyle}>
                  {hasPhotoCount
                    ? `${photoCount}장 / 필요한 사진 ${REQUIRED_PHOTO_COUNT}장`
                    : '필요한 사진을 확인해 주세요.'}
                </strong>
              </div>

              <div style={countRowStyle}>
                <span style={countLabelStyle}>
                  이야기
                </span>

                <strong style={countValueStyle}>
                  {hasStoryCount
                    ? `${storyCount}개 / 권장 이야기 ${RECOMMENDED_STORY_COUNT}개`
                    : '이야기를 함께 넣으면 더 좋아요.'}
                </strong>
              </div>
            </div>

            {photoIsInsufficient ? (
              <p style={missingTextStyle}>
                사진을{' '}
                <strong>
                  {missingPhotoCount}장
                </strong>{' '}
                더 선택하거나 추가해 주세요.
              </p>
            ) : null}

            {storyIsInsufficient ? (
              <p style={missingTextStyle}>
                이야기를{' '}
                <strong>
                  {missingStoryCount}개
                </strong>{' '}
                더 선택하거나 남기면 더 풍성한
                원고를 만들 수 있습니다.
              </p>
            ) : null}

            <div style={modalActionStyle}>
              {photoIsInsufficient ? (
                <button
                  type="button"
                  onClick={goToPhotos}
                  style={primaryButtonStyle}
                >
                  사진 추가하기
                </button>
              ) : null}

              {storyIsInsufficient ? (
                <button
                  type="button"
                  onClick={goToStories}
                  style={secondaryButtonStyle}
                >
                  이야기 추가하기
                </button>
              ) : null}

              {!photoIsInsufficient &&
              storyIsInsufficient ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowMaterialModal(false);
                    setShowConfirmModal(true);
                  }}
                  style={primaryButtonStyle}
                >
                  지금 원고 만들기
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() =>
                setShowMaterialModal(false)
              }
              style={laterButtonStyle}
            >
              자료를 더 살펴볼게요
            </button>
          </div>
        </div>
      ) : null}

      {showConfirmModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          onClick={() => setShowConfirmModal(false)}
          style={overlayStyle}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={modalStyle}
          >
            <button
              type="button"
              aria-label="팝업 닫기"
              onClick={() =>
                setShowConfirmModal(false)
              }
              style={closeButtonStyle}
            >
              ×
            </button>

            <div style={iconStyle}>♡</div>

            <p style={modalLabelStyle}>
              원고 만들기
            </p>

            <h2
              id="confirm-modal-title"
              style={modalTitleStyle}
            >
              선택한 자료로
              <br />
              책 원고를 만들까요?
            </h2>

            <div style={optionBoxStyle}>
              <OptionRow
                label="책 종류"
                value={bookTypeLabelMap[bookType]}
              />
              <OptionRow
                label="문체"
                value={toneLabelMap[tone]}
              />
              <OptionRow
                label="분량"
                value={lengthLabelMap[length]}
              />
            </div>

            <div style={modalActionStyle}>
              <button
                type="button"
                onClick={handleCreate}
                style={primaryButtonStyle}
              >
                원고 만들기
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowConfirmModal(false)
                }
                style={secondaryButtonStyle}
              >
                다시 확인하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
          onClick={() => setErrorMessage(null)}
          style={overlayStyle}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={modalStyle}
          >
            <button
              type="button"
              aria-label="오류 안내 닫기"
              onClick={() => setErrorMessage(null)}
              style={closeButtonStyle}
            >
              ×
            </button>

            <div style={iconStyle}>!</div>

            <p style={modalLabelStyle}>
              원고 생성 안내
            </p>

            <h2
              id="error-modal-title"
              style={modalTitleStyle}
            >
              원고를 만들지 못했어요.
            </h2>

            <p style={modalDescriptionStyle}>
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              style={primaryButtonStyle}
            >
              확인
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function OptionRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={optionRowStyle}>
      <span style={optionLabelStyle}>{label}</span>
      <strong style={optionValueStyle}>
        {value}
      </strong>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'grid',
  placeItems: 'center',
  padding: 20,
  background: 'rgba(43, 33, 24, 0.52)',
  backdropFilter: 'blur(5px)',
};

const modalStyle: React.CSSProperties = {
  position: 'relative',
  width: 'min(520px, 100%)',
  maxHeight: 'calc(100vh - 40px)',
  overflowY: 'auto',
  padding: '36px 30px 30px',
  border: '1px solid rgba(124, 84, 49, 0.18)',
  borderRadius: 28,
  background:
    'linear-gradient(145deg, #fffdf8 0%, #fff7eb 100%)',
  boxShadow: '0 28px 70px rgba(52, 35, 22, 0.28)',
  textAlign: 'center',
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 16,
  width: 36,
  height: 36,
  border: 0,
  borderRadius: '50%',
  color: '#765d49',
  background: 'rgba(105, 75, 48, 0.08)',
  fontSize: 25,
  lineHeight: 1,
  cursor: 'pointer',
};

const iconStyle: React.CSSProperties = {
  width: 54,
  height: 54,
  margin: '0 auto',
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  color: '#d5745d',
  background: '#fff0e6',
  fontSize: 27,
  fontWeight: 900,
};

const modalLabelStyle: React.CSSProperties = {
  margin: '17px 0 0',
  color: '#a67145',
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: '0.08em',
};

const modalTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#3f3025',
  fontFamily: 'Noto Serif KR, serif',
  fontSize: 'clamp(26px, 5vw, 34px)',
  lineHeight: 1.4,
  letterSpacing: '-0.04em',
  wordBreak: 'keep-all',
};

const modalDescriptionStyle: React.CSSProperties = {
  margin: '14px auto 0',
  maxWidth: 410,
  color: '#715e50',
  fontSize: 15,
  lineHeight: 1.75,
  wordBreak: 'keep-all',
};

const countBoxStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '8px 18px',
  border: '1px solid rgba(132, 91, 55, 0.14)',
  borderRadius: 18,
  background: 'rgba(255, 255, 255, 0.72)',
};

const countRowStyle: React.CSSProperties = {
  minHeight: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 18,
  borderBottom: '1px solid rgba(132, 91, 55, 0.1)',
};

const countLabelStyle: React.CSSProperties = {
  color: '#96714e',
  fontSize: 14,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};

const countValueStyle: React.CSSProperties = {
  color: '#4c392c',
  fontSize: 14,
  lineHeight: 1.5,
  textAlign: 'right',
  wordBreak: 'keep-all',
};

const missingTextStyle: React.CSSProperties = {
  margin: '14px 0 0',
  color: '#765d4b',
  fontSize: 14,
  lineHeight: 1.7,
  wordBreak: 'keep-all',
};

const modalActionStyle: React.CSSProperties = {
  marginTop: 24,
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 10,
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '0 20px',
  border: '1px solid #5a3a18',
  borderRadius: 999,
  color: '#fffaf0',
  background: '#5a3a18',
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: '0 20px',
  border: '1px solid rgba(90, 58, 24, 0.34)',
  borderRadius: 999,
  color: '#6b4728',
  background: '#fffaf2',
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer',
};

const laterButtonStyle: React.CSSProperties = {
  marginTop: 17,
  padding: 4,
  border: 0,
  color: '#8b7768',
  background: 'transparent',
  fontSize: 13,
  fontWeight: 800,
  textDecoration: 'underline',
  textUnderlineOffset: 4,
  cursor: 'pointer',
};

const optionBoxStyle: React.CSSProperties = {
  marginTop: 23,
  padding: '7px 18px',
  border: '1px solid rgba(132, 91, 55, 0.14)',
  borderRadius: 18,
  background: 'rgba(255, 255, 255, 0.72)',
};

const optionRowStyle: React.CSSProperties = {
  minHeight: 46,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 18,
  borderBottom: '1px solid rgba(132, 91, 55, 0.1)',
};

const optionLabelStyle: React.CSSProperties = {
  color: '#96714e',
  fontSize: 14,
  fontWeight: 900,
};

const optionValueStyle: React.CSSProperties = {
  color: '#493629',
  fontSize: 14,
  fontWeight: 900,
  textAlign: 'right',
};