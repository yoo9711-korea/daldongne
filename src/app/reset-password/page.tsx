'use client';

import Link from 'next/link';
import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

const RESET_TOKEN_PATTERN =
  /^[a-f0-9]{64}$/i;

const PASSWORD_LETTER_PATTERN =
  /[A-Za-z]/;

const PASSWORD_NUMBER_PATTERN =
  /[0-9]/;

const PASSWORD_SPECIAL_PATTERN =
  /[^A-Za-z0-9]/;

export default function ResetPasswordPage() {
  const [token, setToken] =
    useState('');

  const [isTokenReady, setIsTokenReady] =
    useState(false);

  const [password, setPassword] =
    useState('');

  const [
    passwordConfirm,
    setPasswordConfirm,
  ] = useState('');

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

  useEffect(() => {
    const searchParams =
      new URLSearchParams(
        window.location.search,
      );

    const receivedToken =
      searchParams.get('token')?.trim() ||
      '';

    setToken(receivedToken);
    setIsTokenReady(true);
  }, []);

  const hasValidToken =
    RESET_TOKEN_PATTERN.test(token);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      isSubmitting ||
      successMessage
    ) {
      return;
    }

    setErrorMessage('');

    if (!hasValidToken) {
      setErrorMessage(
        '비밀번호 재설정 링크가 유효하지 않습니다. 재설정 메일을 다시 요청해 주세요.',
      );
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        '비밀번호는 8자 이상 입력해 주세요.',
      );
      return;
    }

    if (password.length > 72) {
      setErrorMessage(
        '비밀번호는 72자 이하로 입력해 주세요.',
      );
      return;
    }

    if (
      !PASSWORD_LETTER_PATTERN.test(
        password,
      ) ||
      !PASSWORD_NUMBER_PATTERN.test(
        password,
      ) ||
      !PASSWORD_SPECIAL_PATTERN.test(
        password,
      )
    ) {
      setErrorMessage(
        '비밀번호는 영문, 숫자, 특수문자를 각각 1개 이상 포함해 주세요.',
      );
      return;
    }

    if (
      password !== passwordConfirm
    ) {
      setErrorMessage(
        '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        '/api/auth/reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            token,
            password,
            passwordConfirm,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            '비밀번호를 변경하는 중 문제가 발생했습니다.',
        );
      }

      setPassword('');
      setPasswordConfirm('');

      setSuccessMessage(
        data?.message ||
          '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
      );

      /*
       * 사용한 토큰이 주소창과
       * 브라우저 방문 기록에 계속 남지 않도록 제거합니다.
       */
      window.history.replaceState(
        {},
        '',
        '/reset-password?completed=1',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '비밀번호를 변경하는 중 문제가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isTokenReady) {
    return (
      <main
        className="page"
        style={{
          minHeight:
            'calc(100vh - var(--header-h))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            color: 'var(--ink-faint)',
            fontSize: 14,
          }}
        >
          재설정 링크를 확인하고 있습니다.
        </p>
      </main>
    );
  }

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
          새 비밀번호 설정
        </h1>

        <p
          style={{
            margin: '0 0 26px',
            textAlign: 'center',
            color: 'var(--ink-faint)',
            fontSize: 14,
            lineHeight: 1.75,
          }}
        >
          앞으로 로그인할 때 사용할
          <br />
          새 비밀번호를 입력해 주세요.
        </p>

        {!hasValidToken &&
        !successMessage ? (
          <div>
            <div
              role="alert"
              style={{
                padding: '14px 16px',
                border:
                  '1px solid #e7b7ad',
                borderRadius: 14,
                background: '#fff2ef',
                color: '#9b3024',
                fontSize: 13,
                lineHeight: 1.7,
                fontWeight: 700,
              }}
            >
              비밀번호 재설정 링크가
              유효하지 않습니다.
              <br />
              링크가 잘렸거나 만료됐을 수
              있으므로 재설정 메일을 다시
              요청해 주세요.
            </div>

            <div
              style={{
                marginTop: 22,
                textAlign: 'center',
              }}
            >
              <Link
                href="/forgot-password"
                style={linkStyle}
              >
                재설정 메일 다시 요청하기
              </Link>
            </div>
          </div>
        ) : successMessage ? (
          <div>
            <div
              role="status"
              style={{
                padding: '15px 16px',
                border:
                  '1px solid #b8d6bd',
                borderRadius: 14,
                background: '#f0faf1',
                color: '#2f6b3f',
                fontSize: 13,
                lineHeight: 1.75,
                fontWeight: 800,
              }}
            >
              {successMessage}
            </div>

            <Link
              href="/login?passwordReset=1"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 50,
                marginTop: 20,
                border:
                  '1px solid #5a3a18',
                borderRadius: 999,
                background: '#5a3a18',
                color: '#fffaf0',
                fontSize: 15,
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              새 비밀번호로 로그인하기
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'grid',
              gap: 18,
            }}
          >
            <div>
              <label
                htmlFor="reset-password"
                style={labelStyle}
              >
                새 비밀번호
              </label>

              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value,
                  );

                  if (errorMessage) {
                    setErrorMessage('');
                  }
                }}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                placeholder="새 비밀번호를 입력해 주세요"
                disabled={isSubmitting}
                style={inputStyle}
              />

              <p
                style={{
                  margin: '7px 2px 0',
                  color:
                    'var(--ink-faint)',
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                영문, 숫자, 특수문자를
                포함하여 8자 이상 입력해
                주세요.
              </p>
            </div>

            <div>
              <label
                htmlFor="reset-password-confirm"
                style={labelStyle}
              >
                새 비밀번호 확인
              </label>

              <input
                id="reset-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(event) => {
                  setPasswordConfirm(
                    event.target.value,
                  );

                  if (errorMessage) {
                    setErrorMessage('');
                  }
                }}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                placeholder="새 비밀번호를 다시 입력해 주세요"
                disabled={isSubmitting}
                style={inputStyle}
              />
            </div>

            {errorMessage ? (
              <div
                role="alert"
                style={{
                  padding: '13px 15px',
                  border:
                    '1px solid #e7b7ad',
                  borderRadius: 14,
                  background: '#fff2ef',
                  color: '#9b3024',
                  fontSize: 13,
                  lineHeight: 1.65,
                  fontWeight: 700,
                }}
              >
                {errorMessage}
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
                ? '비밀번호 변경 중...'
                : '새 비밀번호 저장'}
            </button>
          </form>
        )}

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
            style={linkStyle}
          >
            로그인 화면으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}

const labelStyle:
  React.CSSProperties = {
    display: 'block',
    marginBottom: 8,
    color: '#3f2c1d',
    fontSize: 14,
    fontWeight: 900,
  };

const inputStyle:
  React.CSSProperties = {
    width: '100%',
    minHeight: 48,
    padding: '0 15px',
    border: '1px solid #d9c5a3',
    borderRadius: 14,
    background: '#ffffff',
    color: '#2f2117',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };

const linkStyle:
  React.CSSProperties = {
    color: '#6b3f18',
    fontSize: 14,
    fontWeight: 900,
    textDecoration: 'underline',
    textUnderlineOffset: 4,
  };