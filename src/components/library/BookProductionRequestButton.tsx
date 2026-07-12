'use client';

import {
  useEffect,
  useState,
} from 'react';
import type {
  CSSProperties,
  FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  bookId: string;
  defaultName?: string | null;
  defaultPhone?: string | null;
  defaultEmail?: string | null;
  defaultMessage?: string | null;
  existingRequestId?: string | null;
  existingStatus?: string | null;
};

const productionSteps = [
  '상담 신청',
  '원고 검토',
  '제작 상담',
  '견적 안내',
  '책 편집',
  '인쇄',
  '배송',
];

const preparationItems = [
  '어린 시절 사진',
  '가족사진',
  '기억나는 날짜',
  '사진 속 장소',
  '함께 있었던 사람',
  '짧은 추억 이야기',
];

export default function BookProductionRequestButton({
  bookId,
  defaultName = '',
  defaultPhone = '',
  defaultEmail = '',
  defaultMessage = '',
  existingRequestId = null,
  existingStatus = null,
}: Props) {
  const router = useRouter();

  const hasRequest =
    Boolean(existingStatus);

  const isCanceledRequest =
    existingStatus === 'CANCELED';

  const isCompletedRequest =
    existingStatus === 'COMPLETED';

  const canCancel =
    Boolean(existingRequestId) &&
    !isCompletedRequest &&
    !isCanceledRequest;

  const [isOpen, setIsOpen] =
    useState(false);

  const [name, setName] =
    useState(defaultName || '');

  const [phone, setPhone] =
    useState(defaultPhone || '');

  const [email, setEmail] =
    useState(defaultEmail || '');

  const [message, setMessage] =
    useState(
      defaultMessage ||
        getDefaultMessage(
          hasRequest,
          isCanceledRequest,
          isCompletedRequest,
        ),
    );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [privacyAgreed, setPrivacyAgreed] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === 'Escape' &&
        !isSubmitting
      ) {
        setIsOpen(false);
        setPrivacyAgreed(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [isOpen, isSubmitting]);

  const openModal = () => {
    setPrivacyAgreed(false);
    setIsOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setPrivacyAgreed(false);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!bookId) {
      alert(
        '상담 신청할 책을 찾을 수 없습니다.',
      );
      return;
    }

    if (
      !phone.trim() &&
      !email.trim()
    ) {
      alert(
        '연락처 또는 이메일 중 하나는 입력해 주세요.',
      );
      return;
    }

    if (!privacyAgreed) {
      alert(
        '개인정보 수집·이용에 동의해 주세요.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        '/api/book/production-request',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            bookId,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            message: message.trim(),
          }),
        },
      );

      const result =
        (await response.json()) as {
          ok?: boolean;
          message?: string;
        };

      if (
        !response.ok ||
        !result.ok
      ) {
        alert(
          result.message ||
            '제작 상담 신청을 접수하지 못했습니다.',
        );
        return;
      }

      alert(
        result.message ||
          '제작 상담 신청이 접수되었습니다.',
      );

      setIsOpen(false);
      setPrivacyAgreed(false);
      router.refresh();
    } catch {
      alert(
        '제작 상담 신청 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (isSubmitting) {
      return;
    }

    if (!existingRequestId) {
      alert(
        '취소할 상담 신청을 찾을 수 없습니다.',
      );
      return;
    }

    const confirmed =
      window.confirm(
        '제작 상담 신청을 취소할까요?\n\n취소하면 책 상태는 원고 초안으로 돌아갑니다.',
      );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/book/production-request/${existingRequestId}/cancel`,
        {
          method: 'PATCH',
        },
      );

      const result =
        (await response.json()) as {
          ok?: boolean;
          message?: string;
        };

      if (
        !response.ok ||
        !result.ok
      ) {
        alert(
          result.message ||
            '제작 상담 신청을 취소하지 못했습니다.',
        );
        return;
      }

      alert(
        result.message ||
          '제작 상담 신청이 취소되었습니다.',
      );

      setIsOpen(false);
      setPrivacyAgreed(false);
      router.refresh();
    } catch {
      alert(
        '제작 상담 신청을 취소하는 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes daldongneModalFadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes daldongneModalPopIn {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .production-step-grid {
          display: grid;
          grid-template-columns:
            repeat(7, minmax(0, 1fr));
          gap: 8px;
        }

        .production-preparation-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .production-form-actions {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
        }

        @media (max-width: 720px) {
          .production-request-modal {
            align-items: flex-start !important;
            padding: 12px !important;
          }

          .production-request-form {
            max-height: calc(100vh - 24px) !important;
            padding: 22px 16px !important;
            border-radius: 22px !important;
          }

          .production-step-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .production-preparation-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .production-form-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .production-form-actions button {
            width: 100%;
          }
        }

        @media (max-width: 430px) {
          .production-step-grid,
          .production-preparation-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={openModal}
        style={openButtonStyle(
          hasRequest,
          isCanceledRequest,
        )}
      >
        {getOpenButtonLabel(
          hasRequest,
          isCanceledRequest,
          isCompletedRequest,
        )}
      </button>

      {isOpen ? (
        <div
          className="production-request-modal"
          role="dialog"
          aria-modal="true"
          aria-label="책 제작 상담 신청"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            overflowY: 'auto',
            background:
              'rgba(36, 23, 15, 0.55)',
            animation:
              'daldongneModalFadeIn 0.22s ease-out',
          }}
        >
          <form
            className="production-request-form"
            onSubmit={handleSubmit}
            style={{
              width: 'min(760px, 100%)',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 28,
              borderRadius: 28,
              border:
                '1px solid #e4cda3',
              background: '#fffaf0',
              boxShadow:
                '0 24px 70px rgba(0, 0, 0, 0.28)',
              animation:
                'daldongneModalPopIn 0.28s ease-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'flex-start',
                gap: 14,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: '#9a6a24',
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  책 제작 상담
                </p>

                <h2
                  style={{
                    margin: '8px 0 10px',
                    color: '#24170f',
                    fontFamily:
                      'Noto Serif KR, serif',
                    fontSize: 28,
                    lineHeight: 1.35,
                    letterSpacing:
                      '-0.04em',
                  }}
                >
                  {getModalTitle(
                    hasRequest,
                    isCanceledRequest,
                    isCompletedRequest,
                  )}
                </h2>
              </div>

              <button
                type="button"
                aria-label="상담 창 닫기"
                onClick={closeModal}
                disabled={isSubmitting}
                style={{
                  width: 38,
                  height: 38,
                  flexShrink: 0,
                  borderRadius: 999,
                  border:
                    '1px solid #d6b778',
                  background: '#fffdf6',
                  color: '#5a3a18',
                  fontSize: 22,
                  lineHeight: 1,
                  fontWeight: 900,
                  cursor: isSubmitting
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {hasRequest ? (
              <p
                style={{
                  margin: '0 0 14px',
                  display: 'inline-flex',
                  minHeight: 32,
                  alignItems: 'center',
                  padding: '0 12px',
                  borderRadius: 999,
                  border:
                    '1px solid #d6b778',
                  background: '#f7eddc',
                  color: '#5a3a18',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                현재 상태:{' '}
                {getProductionRequestStatusLabel(
                  existingStatus,
                )}
              </p>
            ) : null}

            <p
              style={{
                margin: '0 0 20px',
                color: '#6b5a46',
                fontSize: 14,
                lineHeight: 1.75,
              }}
            >
              연락처 또는 이메일을
              남겨주시면 관리자가 원고와
              요청 내용을 확인한 뒤
              연락드립니다. 상담 전까지
              사진과 이야기를 더 추가하면
              책의 완성도가 높아집니다.
            </p>

            <section style={infoBoxStyle}>
              <h3 style={infoTitleStyle}>
                제작 진행 과정
              </h3>

              <div className="production-step-grid">
                {productionSteps.map(
                  (step, index) => (
                    <div
                      key={step}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 14,
                        border:
                          '1px solid #e1c99f',
                        background:
                          '#fffdf6',
                        color: '#4a3828',
                        textAlign: 'center',
                        fontSize: 11,
                        fontWeight: 900,
                        lineHeight: 1.4,
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 4,
                          color: '#9a6a24',
                        }}
                      >
                        {index + 1}
                      </div>

                      {step}
                    </div>
                  ),
                )}
              </div>
            </section>

            <section style={infoBoxStyle}>
              <h3 style={infoTitleStyle}>
                예상 제작 기간
              </h3>

              <p style={infoTextStyle}>
                상담 1~3일 → 편집 3~7일
                → 인쇄 5~7일 → 배송
                2~3일 정도가 기본
                흐름입니다. 실제 기간은
                사진 수, 페이지 수, 수정
                횟수와 인쇄 사양에 따라
                달라질 수 있습니다.
              </p>
            </section>

            <section style={infoBoxStyle}>
              <h3 style={infoTitleStyle}>
                더 좋은 책을 위해 준비하면
                좋은 자료
              </h3>

              <div className="production-preparation-grid">
                {preparationItems.map(
                  (item) => (
                    <div
                      key={item}
                      style={{
                        padding:
                          '10px 12px',
                        borderRadius: 999,
                        border:
                          '1px solid #e1c99f',
                        background:
                          '#fffdf6',
                        color: '#4a3828',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      ✓ {item}
                    </div>
                  ),
                )}
              </div>
            </section>

            <label
              htmlFor="production-name"
              style={labelStyle}
            >
              이름
            </label>

            <input
              id="production-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="예: 유재상"
              autoComplete="name"
              maxLength={80}
              style={inputStyle}
            />

            <label
              htmlFor="production-phone"
              style={labelStyle}
            >
              연락처
            </label>

            <input
              id="production-phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value,
                )
              }
              placeholder="예: 010-0000-0000"
              autoComplete="tel"
              maxLength={30}
              style={inputStyle}
            />

            <label
              htmlFor="production-email"
              style={labelStyle}
            >
              이메일
            </label>

            <input
              id="production-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="예: example@email.com"
              autoComplete="email"
              maxLength={160}
              style={inputStyle}
            />

            <label
              htmlFor="production-message"
              style={labelStyle}
            >
              요청 내용
            </label>

            <textarea
              id="production-message"
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value,
                )
              }
              maxLength={2000}
              style={{
                ...inputStyle,
                height: 'auto',
                minHeight: 130,
                padding: 16,
                resize: 'vertical',
                lineHeight: 1.75,
              }}
            />

            <p
              style={{
                margin: '8px 0 0',
                color: '#8a806f',
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              연락처 또는 이메일 중 하나는
              반드시 입력해 주세요.
            </p>

            <label
              style={{
                marginTop: 18,
                padding: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                borderRadius: 16,
                border:
                  '1px solid #ead7b4',
                background: '#fff8eb',
                color: '#4a3828',
                fontSize: 13,
                lineHeight: 1.7,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(event) =>
                  setPrivacyAgreed(
                    event.target.checked,
                  )
                }
                style={{
                  width: 18,
                  height: 18,
                  marginTop: 3,
                  flexShrink: 0,
                }}
              />

              <span>
                제작 상담 접수를 위해 이름,
                연락처, 이메일과 요청 내용을
                수집·이용하는 것에
                동의합니다. 상담 정보는 제작
                상담과 고객 연락 목적으로
                사용됩니다. 달동네 출판사의{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  style={policyLinkStyle}
                >
                  이용약관
                </a>
                {' 및 '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  style={policyLinkStyle}
                >
                  개인정보처리방침
                </a>
                을 확인했습니다.
              </span>
            </label>

            <div
              className="production-form-actions"
              style={{
                marginTop: 20,
              }}
            >
              {canCancel ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  style={actionButtonStyle(
                    '#fffaf0',
                    '#9f3f24',
                    '#b65335',
                    isSubmitting,
                  )}
                >
                  상담 신청 취소
                </button>
              ) : null}

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                style={actionButtonStyle(
                  '#fffaf0',
                  '#5a3a18',
                  '#d6b778',
                  isSubmitting,
                )}
              >
                닫기
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={actionButtonStyle(
                  isSubmitting
                    ? '#b8a68f'
                    : '#24170f',
                  '#fffaf0',
                  '#24170f',
                  isSubmitting,
                )}
              >
                {isSubmitting
                  ? '처리 중...'
                  : getSubmitButtonLabel(
                      hasRequest,
                      isCanceledRequest,
                      isCompletedRequest,
                    )}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function getDefaultMessage(
  hasRequest: boolean,
  isCanceledRequest: boolean,
  isCompletedRequest: boolean,
) {
  if (isCanceledRequest) {
    return '취소했던 제작 상담을 다시 신청하고 싶습니다.';
  }

  if (isCompletedRequest) {
    return '완료된 상담 내용에 추가로 문의하고 싶습니다.';
  }

  if (hasRequest) {
    return '기존 제작 상담 신청 내용을 수정하고 싶습니다.';
  }

  return '이 원고로 책 제작 상담을 신청하고 싶습니다.';
}

function getOpenButtonLabel(
  hasRequest: boolean,
  isCanceledRequest: boolean,
  isCompletedRequest: boolean,
) {
  if (isCanceledRequest) {
    return '제작 상담 다시 신청하기';
  }

  if (isCompletedRequest) {
    return '완료된 상담 내용 보기';
  }

  if (hasRequest) {
    return '상담 신청 내용 확인·수정';
  }

  return '제작 상담 신청하기';
}

function getModalTitle(
  hasRequest: boolean,
  isCanceledRequest: boolean,
  isCompletedRequest: boolean,
) {
  if (isCanceledRequest) {
    return '취소했던 제작 상담을 다시 신청합니다';
  }

  if (isCompletedRequest) {
    return '완료된 제작 상담 내용을 확인합니다';
  }

  if (hasRequest) {
    return '제작 상담 신청 내용을 확인하고 수정합니다';
  }

  return '이 원고를 책으로 만들기 위한 상담을 신청합니다';
}

function getSubmitButtonLabel(
  hasRequest: boolean,
  isCanceledRequest: boolean,
  isCompletedRequest: boolean,
) {
  if (isCanceledRequest) {
    return '상담 다시 신청';
  }

  if (isCompletedRequest) {
    return '추가 문의 접수';
  }

  if (hasRequest) {
    return '상담 내용 다시 접수';
  }

  return '상담 신청 접수';
}

function openButtonStyle(
  hasRequest: boolean,
  isCanceledRequest: boolean,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    padding: '0 22px',
    borderRadius: 999,
    border: hasRequest
      ? '1px solid #c18a23'
      : '1px solid #24170f',
    background: isCanceledRequest
      ? '#fff4df'
      : hasRequest
        ? '#f3d28a'
        : '#24170f',
    color: '#24170f',
    fontSize: 14,
    fontWeight: 900,
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };
}

function actionButtonStyle(
  background: string,
  color: string,
  borderColor: string,
  disabled: boolean,
): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 18px',
    borderRadius: 999,
    border: `1px solid ${borderColor}`,
    background,
    color,
    fontSize: 13,
    fontWeight: 900,
    cursor: disabled
      ? 'not-allowed'
      : 'pointer',
  };
}

const labelStyle: CSSProperties = {
  display: 'block',
  marginTop: 14,
  marginBottom: 8,
  color: '#4a3828',
  fontSize: 13,
  fontWeight: 900,
};

const inputStyle: CSSProperties = {
  width: '100%',
  height: 46,
  boxSizing: 'border-box',
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid #d6b778',
  background: '#fffdf6',
  color: '#24170f',
  fontSize: 14,
  outline: 'none',
};

const infoBoxStyle: CSSProperties = {
  margin: '16px 0',
  padding: 18,
  borderRadius: 18,
  border: '1px solid #e1c99f',
  background: '#f7eddc',
};

const infoTitleStyle: CSSProperties = {
  margin: '0 0 12px',
  color: '#4a3828',
  fontSize: 15,
  fontWeight: 900,
};

const infoTextStyle: CSSProperties = {
  margin: 0,
  color: '#6b5a46',
  fontSize: 13,
  lineHeight: 1.75,
};

const policyLinkStyle: CSSProperties = {
  color: '#6b3f18',
  fontWeight: 900,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};

function getProductionRequestStatusLabel(
  status: string | null,
) {
  if (status === 'REQUESTED') {
    return '상담 신청 접수';
  }

  if (status === 'CONTACTED') {
    return '고객 연락 완료';
  }

  if (status === 'IN_PROGRESS') {
    return '제작 상담 진행 중';
  }

  if (status === 'COMPLETED') {
    return '상담 완료';
  }

  if (status === 'CANCELED') {
    return '상담 취소';
  }

  return '상담 상태 확인 필요';
}