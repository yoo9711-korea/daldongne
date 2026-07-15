'use client';

import Link from 'next/link';
import {
  type FormEvent,
  useState,
} from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState('');

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) return;

    const normalizedEmail =
      email.trim().toLowerCase();

    setErrorMessage('');
    setSuccessMessage('');

    if (!normalizedEmail) {
      setErrorMessage(
        '이메일을 입력해 주세요.',
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            '비밀번호 재설정 요청 중 문제가 발생했습니다.',
        );
      }

      setSuccessMessage(
        data?.message ||
          '입력한 이메일로 가입된 계정이 있으면 비밀번호 재설정 안내를 보내드립니다.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '비밀번호 재설정 요청 중 문제가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="page"
      style={{
        minHeight:
          'calc(100vh - var(--header-h))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
        paddingBottom: 60,
      }}
    >
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: 480,
        }}
      >
        <img
          src="/brand/icon-mark.png"
          alt="달동네 출판사"
          style={{
            width: 56,
            height: 56,
            objectFit: 'contain',
            margin: '0 auto 16px',
            display: 'block',
          }}
        />

        <h1
          style={{
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          비밀번호 찾기
        </h1>

        <p
          style={{
            margin:
              '0 0 26px',
            textAlign: 'center',
            color:
              'var(--ink-faint)',
            fontSize: 14,
            lineHeight: 1.75,
          }}
        >
          회원가입에 사용한 이메일을
          입력해 주세요.
          <br />
          비밀번호를 다시 설정할 수 있는
          안내를 보내드립니다.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 16,
          }}
        >
          <div>
            <label
              htmlFor="forgot-password-email"
              style={{
                display: 'block',
                marginBottom: 8,
                color: '#3f2c1d',
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              이메일
            </label>

            <input
              id="forgot-password-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(
                  event.target.value,
                );

                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              autoComplete="email"
              required
              maxLength={254}
              placeholder="example@email.com"
              disabled={isSubmitting}
              style={{
                width: '100%',
                minHeight: 48,
                padding: '0 15px',
                border:
                  '1px solid #d9c5a3',
                borderRadius: 14,
                background:
                  '#ffffff',
                color: '#2f2117',
                fontSize: 15,
                outline: 'none',
                boxSizing:
                  'border-box',
              }}
            />
          </div>

          {errorMessage ? (
            <div
              role="alert"
              style={{
                padding:
                  '13px 15px',
                border:
                  '1px solid #e7b7ad',
                borderRadius: 14,
                background:
                  '#fff2ef',
                color: '#9b3024',
                fontSize: 13,
                lineHeight: 1.65,
                fontWeight: 700,
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div
              role="status"
              style={{
                padding:
                  '13px 15px',
                border:
                  '1px solid #b8d6bd',
                borderRadius: 14,
                background:
                  '#f0faf1',
                color: '#2f6b3f',
                fontSize: 13,
                lineHeight: 1.7,
                fontWeight: 800,
              }}
            >
              {successMessage}
              <br />
              메일이 보이지 않으면
              스팸함도 확인해 주세요.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              minHeight: 50,
              border:
                '1px solid #5a3a18',
              borderRadius: 999,
              background:
                isSubmitting
                  ? '#d8cdbb'
                  : '#5a3a18',
              color: '#fffaf0',
              fontSize: 15,
              fontWeight: 900,
              cursor:
                isSubmitting
                  ? 'wait'
                  : 'pointer',
            }}
          >
            {isSubmitting
              ? '메일 요청 중...'
              : '재설정 메일 받기'}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop:
              '1px solid #ead7b7',
            textAlign: 'center',
          }}
        >
          <Link
            href="/login"
            style={{
              color: '#6b3f18',
              fontSize: 14,
              fontWeight: 900,
              textDecoration:
                'underline',
              textUnderlineOffset: 4,
            }}
          >
            로그인 화면으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}