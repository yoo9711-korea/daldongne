'use client';

import Link from 'next/link';
import {
  FormEvent,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

const PASSWORD_LETTER_PATTERN =
  /[A-Za-z]/;

const PASSWORD_NUMBER_PATTERN =
  /[0-9]/;

const PASSWORD_SPECIAL_PATTERN =
  /[^A-Za-z0-9]/;

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] =
    useState('');
  const [email, setEmail] =
    useState('');
  const [password, setPassword] =
    useState('');
  const [
    passwordConfirm,
    setPasswordConfirm,
  ] = useState('');
  const [
    agreedToTerms,
    setAgreedToTerms,
  ] = useState(false);

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

    if (name.trim().length < 2) {
      setErrorMessage(
        '이름은 2자 이상 입력해 주세요.',
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

    if (password !== passwordConfirm) {
      setErrorMessage(
        '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
      );
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage(
        '이용약관과 개인정보처리방침에 동의해 주세요.',
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email
              .trim()
              .toLowerCase(),
            password,
            passwordConfirm,
            termsAccepted: true,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            '회원가입 처리 중 문제가 발생했습니다.',
        );
      }

      router.push(
        `/login?registered=1&email=${encodeURIComponent(
          email.trim().toLowerCase(),
        )}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '회원가입 처리 중 문제가 발생했습니다.',
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
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          신규 회원가입
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 28,
            textAlign: 'center',
            color: 'var(--ink-faint)',
            lineHeight: 1.7,
          }}
        >
          사진과 이야기를 모아
          <br />
          우리들의 기록을 시작합니다.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 18,
          }}
        >
          <FormField
            label="이름"
            id="register-name"
          >
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              autoComplete="name"
              required
              minLength={2}
              maxLength={50}
              placeholder="이름을 입력해 주세요"
              disabled={isSubmitting}
              style={inputStyle}
            />
          </FormField>

          <FormField
            label="이메일"
            id="register-email"
          >
            <input
              id="register-email"
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
          </FormField>

          <FormField
            label="비밀번호"
            id="register-password"
            description="영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요."
          >
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              placeholder="비밀번호 8자 이상"
              disabled={isSubmitting}
              style={inputStyle}
            />
          </FormField>

          <FormField
            label="비밀번호 확인"
            id="register-password-confirm"
          >
            <input
              id="register-password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(event) =>
                setPasswordConfirm(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              placeholder="비밀번호를 다시 입력해 주세요"
              disabled={isSubmitting}
              style={inputStyle}
            />
          </FormField>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 14,
              border:
                '1px solid #ead7b7',
              borderRadius: 14,
              background: '#fffaf0',
              cursor: isSubmitting
                ? 'default'
                : 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(event) =>
                setAgreedToTerms(
                  event.target.checked,
                )
              }
              disabled={isSubmitting}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                flexShrink: 0,
              }}
            />

            <span
              style={{
                color: '#5f4c39',
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              달동네 출판사의{' '}
              <Link
                href="/terms"
                target="_blank"
                style={policyLinkStyle}
              >
                이용약관
              </Link>
              과{' '}
              <Link
                href="/privacy"
                target="_blank"
                style={policyLinkStyle}
              >
                개인정보처리방침
              </Link>
              을 확인했으며 이에 동의합니다.
            </span>
          </label>

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
            disabled={
              isSubmitting ||
              !agreedToTerms
            }
            style={{
              minHeight: 50,
              border:
                '1px solid #5a3a18',
              borderRadius: 999,
              background:
                isSubmitting ||
                !agreedToTerms
                  ? '#d8cdbb'
                  : '#5a3a18',
              color: '#fffaf0',
              fontSize: 15,
              fontWeight: 900,
              cursor:
                isSubmitting ||
                !agreedToTerms
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isSubmitting
              ? '가입 처리 중...'
              : '회원가입'}
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
          <p
            style={{
              margin: 0,
              color: 'var(--ink-faint)',
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            이미 가입한 계정이 있나요?
          </p>

          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              marginTop: 10,
              color: '#6b3f18',
              fontSize: 14,
              fontWeight: 900,
              textDecoration: 'underline',
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

function FormField({
  label,
  id,
  description,
  children,
}: {
  label: string;
  id: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          marginBottom: 8,
          color: '#3f2c1d',
          fontSize: 14,
          fontWeight: 900,
        }}
      >
        {label}
      </label>

      {children}

      {description ? (
        <p
          style={{
            margin: '7px 2px 0',
            color: 'var(--ink-faint)',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
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

const policyLinkStyle:
  React.CSSProperties = {
    color: '#6b3f18',
    fontWeight: 900,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  };