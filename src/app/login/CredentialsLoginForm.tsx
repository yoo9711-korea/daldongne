'use client';

import Link from 'next/link';
import {
  FormEvent,
  useState,
} from 'react';
import { signIn } from 'next-auth/react';

type Props = {
  callbackUrl?: string;
  initialEmail?: string;
  registered?: boolean;
};

export default function CredentialsLoginForm({
  callbackUrl = '/dashboard',
  initialEmail = '',
  registered = false,
}: Props) {
  const [email, setEmail] =
    useState(initialEmail);
  const [password, setPassword] =
    useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState('');

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage('');

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        '이메일을 입력해 주세요.',
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        '비밀번호를 입력해 주세요.',
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await signIn(
        'credentials',
        {
          email: normalizedEmail,
          password,
          redirect: false,
          redirectTo:
            callbackUrl || '/dashboard',
        },
      );

      if (
        !result ||
        !result.ok ||
        result.error
      ) {
        setErrorMessage(
          '이메일 또는 비밀번호가 일치하지 않습니다.',
        );
        return;
      }

      window.location.assign(
        result.url || '/dashboard',
      );
    } catch (error) {
      console.error(
        '[CREDENTIAL_LOGIN_ERROR]',
        error,
      );

      setErrorMessage(
        '로그인 처리 중 문제가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 24,
      }}
    >
      {registered ? (
        <div
          role="status"
          style={{
            marginBottom: 18,
            padding: '13px 15px',
            border:
              '1px solid #b8d6bd',
            borderRadius: 14,
            background: '#f0faf1',
            color: '#2f6b3f',
            fontSize: 13,
            lineHeight: 1.65,
            fontWeight: 800,
          }}
        >
          회원가입이 완료되었습니다.
          등록한 이메일과 비밀번호로
          로그인해 주세요.
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: 14,
        }}
      >
        <div>
          <label
            htmlFor="login-email"
            style={{
              display: 'block',
              marginBottom: 7,
              color: '#3f2c1d',
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            이메일
          </label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
            required
            maxLength={254}
            placeholder="example@email.com"
            disabled={isSubmitting}
            style={inputStyle}
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            style={{
              display: 'block',
              marginBottom: 7,
              color: '#3f2c1d',
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            비밀번호
          </label>

          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={72}
            placeholder="비밀번호를 입력해 주세요"
            disabled={isSubmitting}
            style={inputStyle}
          />
        </div>

        {errorMessage ? (
          <div
            role="alert"
            style={{
              padding: '12px 14px',
              border:
                '1px solid #e7b7ad',
              borderRadius: 14,
              background: '#fff2ef',
              color: '#9b3024',
              fontSize: 13,
              lineHeight: 1.6,
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
            minHeight: 48,
            border:
              '1px solid #5a3a18',
            borderRadius: 999,
            background: isSubmitting
              ? '#d8cdbb'
              : '#5a3a18',
            color: '#fffaf0',
            fontSize: 15,
            fontWeight: 900,
            cursor: isSubmitting
              ? 'wait'
              : 'pointer',
          }}
        >
          {isSubmitting
            ? '로그인 중...'
            : '이메일로 로그인'}
        </button>
      </form>

      <div
        style={{
          marginTop: 18,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            color: 'var(--ink-faint)',
            fontSize: 13,
          }}
        >
          처음 방문하셨나요?{' '}
        </span>

        <Link
          href="/register"
          style={{
            color: '#6b3f18',
            fontSize: 13,
            fontWeight: 900,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          신규 회원가입
        </Link>
      </div>

      <div
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '24px 0',
          color: 'var(--ink-faint)',
          fontSize: 12,
        }}
      >
        <span
          style={{
            flex: 1,
            height: 1,
            background: '#ead7b7',
          }}
        />

        또는 소셜 계정으로 로그인

        <span
          style={{
            flex: 1,
            height: 1,
            background: '#ead7b7',
          }}
        />
      </div>
    </div>
  );
}

const inputStyle:
  React.CSSProperties = {
    width: '100%',
    minHeight: 46,
    padding: '0 14px',
    border: '1px solid #d9c5a3',
    borderRadius: 14,
    background: '#ffffff',
    color: '#2f2117',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };