'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

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

  const hasRequest = Boolean(existingStatus);
  const isCanceledRequest = existingStatus === 'CANCELED';
  const canCancel =
    Boolean(existingRequestId) &&
    existingStatus !== 'COMPLETED' &&
    existingStatus !== 'CANCELED';

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(defaultName || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [email, setEmail] = useState(defaultEmail || '');
  const [message, setMessage] = useState(
    defaultMessage ||
      (isCanceledRequest
        ? '취소했던 제작 상담을 다시 신청하고 싶습니다.'
        : hasRequest
          ? '기존 제작 상담 신청 내용을 수정하고 싶습니다.'
          : '이 원고로 책 제작 상담을 신청하고 싶습니다.'),
  );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

    if (isSubmitting) return;

    if (!bookId) {
      alert('상담 신청할 책을 찾을 수 없습니다.');
      return;
    }

        if (!phone.trim() && !email.trim()) {
      alert('연락처 또는 이메일 중 하나는 입력해 주세요.');
      return;
    }

    if (!privacyAgreed) {
      alert('개인정보 수집·이용에 동의해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/book/production-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        alert(result.message || '제작 상담 신청을 접수하지 못했습니다.');
        return;
      }

      alert(
        result.message ||
          '제작 상담 신청이 접수되었습니다.\n\n관리자가 원고와 요청 내용을 확인한 뒤 연락드릴 수 있도록 준비하겠습니다.\n\n그동안 사진과 이야기를 더 추가하면 책의 완성도가 높아집니다.',
      );

      setIsOpen(false);
      router.refresh();
    } catch {
      alert('제작 상담 신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (isSubmitting) return;

    if (!existingRequestId) {
      alert('취소할 상담 신청을 찾을 수 없습니다.');
      return;
    }

    const ok = window.confirm(
      '제작 상담 신청을 취소할까요?\n\n취소하면 책 상태는 원고 초안으로 돌아갑니다.',
    );

    if (!ok) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/book/production-request/${existingRequestId}/cancel`,
        {
          method: 'PATCH',
        },
      );

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        alert(result.message || '제작 상담 신청을 취소하지 못했습니다.');
        return;
      }

      alert(
        result.message ||
          '제작 상담 신청이 취소되었습니다.\n\n책 상태는 원고 초안으로 돌아갑니다.\n\n다시 제작 상담이 필요하면 책 상세 페이지에서 다시 신청할 수 있습니다.',
      );

      setIsOpen(false);
      router.refresh();
    } catch {
      alert('제작 상담 신청을 취소하는 중 오류가 발생했습니다.');
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
      `}</style>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 46,
          padding: '0 22px',
          borderRadius: 999,
          border: hasRequest ? '1px solid #c18a23' : '1px solid #24170f',
          background: hasRequest ? '#f3d28a' : '#24170f',
          color: hasRequest ? '#24170f' : '#fffaf0',
          fontSize: 15,
          fontWeight: 900,
          cursor: 'pointer',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {isCanceledRequest
          ? '제작 상담 다시 신청하기'
          : hasRequest
            ? '상담 신청 내용 수정하기'
            : '제작 상담 신청하기'}
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
            background: 'rgba(36, 23, 15, 0.48)',
            overflowY: 'auto',
            animation: 'daldongneModalFadeIn 0.22s ease-out',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              width: 'min(760px, 100%)',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 28,
              borderRadius: 28,
              border: '1px solid #e4cda3',
              background: '#fffaf0',
              boxShadow: '0 24px 70px rgba(0, 0, 0, 0.28)',
              animation: 'daldongneModalPopIn 0.28s ease-out',
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
              책 제작 상담
            </p>

            <h2
              style={{
                margin: '8px 0 10px',
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 28,
                lineHeight: 1.35,
                letterSpacing: '-0.04em',
                color: '#24170f',
              }}
            >
              {isCanceledRequest
                ? '취소했던 제작 상담을 다시 신청합니다'
                : hasRequest
                  ? '제작 상담 신청 내용을 다시 남깁니다'
                  : '이 원고를 책으로 만들기 위한 상담을 신청합니다'}
            </h2>

            {hasRequest ? (
              <p
                style={{
                  margin: '0 0 14px',
                  display: 'inline-flex',
                  minHeight: 32,
                  alignItems: 'center',
                  padding: '0 12px',
                  borderRadius: 999,
                  border: '1px solid #d6b778',
                  background: '#f7eddc',
                  color: '#5a3a18',
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                현재 상태: {getProductionRequestStatusLabel(existingStatus)}
              </p>
            ) : null}

            <p
              style={{
                margin: '0 0 20px',
                fontSize: 15,
                lineHeight: 1.7,
                color: '#6b5a46',
              }}
            >
              연락처 또는 이메일을 남겨주시면 관리자가 원고와 요청 내용을 확인한 뒤 연락드립니다.
              상담 전까지 사진과 이야기를 더 추가하면 책의 완성도가 높아집니다.
            </p>

            <section style={infoBoxStyle}>
              <h3 style={infoTitleStyle}>제작 진행 과정</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {productionSteps.map((step, index) => (
                  <div
                    key={step}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 14,
                      background: '#fffdf6',
                      border: '1px solid #e1c99f',
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#4a3828',
                      lineHeight: 1.35,
                    }}
                  >
                    <div style={{ color: '#9a6a24', marginBottom: 4 }}>
                      {index + 1}
                    </div>
                    {step}
                  </div>
                ))}
              </div>
            </section>

            <section style={infoBoxStyle}>
              <h3 style={infoTitleStyle}>예상 제작 기간</h3>
              <p style={infoTextStyle}>
                상담 1~3일 → 편집 3~7일 → 인쇄 5~7일 → 배송 2~3일 정도가 기본 흐름입니다.
                실제 기간은 사진 수, 페이지 수, 수정 횟수, 인쇄 사양에 따라 달라질 수 있습니다.
              </p>
            </section>

            <section style={infoBoxStyle}>
              <h3 style={infoTitleStyle}>더 좋은 책을 위해 준비하면 좋은 자료</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {preparationItems.map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 999,
                      background: '#fffdf6',
                      border: '1px solid #e1c99f',
                      color: '#4a3828',
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>
            </section>

            <label style={labelStyle}>이름</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 유재상"
              style={inputStyle}
            />

            <label style={labelStyle}>연락처</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="예: 010-0000-0000"
              style={inputStyle}
            />

            <label style={labelStyle}>이메일</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="예: example@email.com"
              style={inputStyle}
            />

            <label style={labelStyle}>요청 내용</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              style={{
                width: '100%',
                minHeight: 130,
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

                       <label
              style={{
                marginTop: 18,
                padding: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                borderRadius: 16,
                border: '1px solid #ead7b4',
                background: '#fff8eb',
                color: '#4a3828',
                fontSize: 14,
                lineHeight: 1.7,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(event) => setPrivacyAgreed(event.target.checked)}
                style={{
                  marginTop: 4,
                  width: 18,
                  height: 18,
                  flexShrink: 0,
                }}
              />

              <span>
                제작 상담 접수를 위해 이름, 연락처, 이메일, 요청 내용을 수집·이용하는
                것에 동의합니다. 상담 정보는 제작 상담 및 고객 연락 목적으로 사용됩니다.{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#6b3f18',
                    fontWeight: 900,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  개인정보처리방침 보기
                </a>
              </span>
            </label>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                lineHeight: 1.6,
                color: '#8a806f',
              }}
            >
              연락처 또는 이메일 중 하나는 반드시 입력해 주세요.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 20,
                flexWrap: 'wrap',
              }}
            >
              {canCancel ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 42,
                    padding: '0 18px',
                    borderRadius: 999,
                    border: '1px solid #b65335',
                    background: '#fffaf0',
                    color: '#9f3f24',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  상담 신청 취소
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
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
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                닫기
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 42,
                  padding: '0 20px',
                  borderRadius: 999,
                  border: '1px solid #24170f',
                  background: isSubmitting ? '#b8a68f' : '#24170f',
                  color: '#fffaf0',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting
                  ? '신청 중...'
                  : isCanceledRequest
                    ? '상담 다시 신청'
                    : hasRequest
                      ? '상담 내용 다시 접수'
                      : '상담 신청 접수'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

const labelStyle = {
  display: 'block',
  marginTop: 14,
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 900,
  color: '#4a3828',
};

const inputStyle = {
  width: '100%',
  height: 46,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid #d6b778',
  background: '#fffdf6',
  color: '#24170f',
  fontSize: 15,
  outline: 'none',
};

const infoBoxStyle = {
  margin: '16px 0',
  padding: 18,
  borderRadius: 18,
  border: '1px solid #e1c99f',
  background: '#f7eddc',
};

const infoTitleStyle = {
  margin: '0 0 12px',
  fontSize: 16,
  fontWeight: 900,
  color: '#4a3828',
};

const infoTextStyle = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.75,
  color: '#6b5a46',
};

function getProductionRequestStatusLabel(status: string | null) {
  if (status === 'REQUESTED') return '상담 신청 접수';
  if (status === 'CONTACTED') return '고객 연락 완료';
  if (status === 'IN_PROGRESS') return '제작 상담 진행 중';
  if (status === 'COMPLETED') return '상담 완료';
  if (status === 'CANCELED') return '상담 취소';

  return '상담 상태 확인 필요';
}