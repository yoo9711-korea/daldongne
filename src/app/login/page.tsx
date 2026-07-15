import { signIn } from '@/auth';

import CredentialsLoginForm from './CredentialsLoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    registered?: string;
    email?: string;
  }>;
}) {
  const {
    callbackUrl,
    registered,
    email,
  } = await searchParams;

  const safeCallbackUrl =
    callbackUrl?.startsWith('/') &&
    !callbackUrl.startsWith('//')
      ? callbackUrl
      : '/dashboard';

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
            textAlign: 'center',
          }}
        >
          달동네 출판사
        </h1>

        <p
          style={{
            textAlign: 'center',
          }}
        >
          당신의 기억을, 다음 세대에게.
        </p>

        <CredentialsLoginForm
          callbackUrl={safeCallbackUrl}
          initialEmail={email || ''}
          registered={registered === '1'}
        />

        <div className="auth-providers">
          <form
            action={async () => {
              'use server';

              await signIn('google', {
                redirectTo:
                  safeCallbackUrl,
              });
            }}
          >
            <button
              type="submit"
              className="auth-provider-btn"
            >
              Google로 계속하기
            </button>
          </form>

          <form
            action={async () => {
              'use server';

              await signIn('kakao', {
                redirectTo:
                  safeCallbackUrl,
              });
            }}
          >
            <button
              type="submit"
              className="auth-provider-btn auth-provider-btn--kakao"
            >
              카카오로 계속하기
            </button>
          </form>

          <form
            action={async () => {
              'use server';

              await signIn('naver', {
                redirectTo:
                  safeCallbackUrl,
              });
            }}
          >
            <button
              type="submit"
              className="auth-provider-btn auth-provider-btn--naver"
            >
              네이버로 계속하기
            </button>
          </form>
        </div>

        <p
          style={{
            marginTop: 24,
            fontSize: 12,
            lineHeight: 1.7,
            color: 'var(--ink-faint)',
            textAlign: 'center',
          }}
        >
          로그인하면 실제 데이터베이스에
          계정이 생성됩니다.
          <br />
          계속 진행하면{' '}
          <a
            href="/terms"
            style={{
              color: '#6b3f18',
              fontWeight: 900,
              textDecoration:
                'underline',
              textUnderlineOffset: 3,
            }}
          >
            이용약관
          </a>
          {' '}및{' '}
          <a
            href="/privacy"
            style={{
              color: '#6b3f18',
              fontWeight: 900,
              textDecoration:
                'underline',
              textUnderlineOffset: 3,
            }}
          >
            개인정보처리방침
          </a>
          에 동의한 것으로 봅니다.
        </p>
      </div>
    </main>
  );
}