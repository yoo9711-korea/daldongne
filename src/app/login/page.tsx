import { signIn } from '@/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="page" style={{ minHeight: 'calc(100vh - var(--header-h))', display: 'flex', alignItems: 'center' }}>
      <div className="auth-card">
        <img src="/brand/icon-mark.png" alt="달동네 출판사" style={{ width: 56, height: 56, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
        <h1>달동네 출판사</h1>
        <p>당신의 기억을, 다음 세대에게.</p>

        <div className="auth-providers">
          <form action={async () => {
            'use server';
            await signIn('google', { redirectTo: callbackUrl || '/dashboard' });
          }}>
            <button type="submit" className="auth-provider-btn">
              Google로 계속하기
            </button>
          </form>

          <form action={async () => {
            'use server';
            await signIn('kakao', { redirectTo: callbackUrl || '/dashboard' });
          }}>
            <button type="submit" className="auth-provider-btn auth-provider-btn--kakao">
              카카오로 계속하기
            </button>
          </form>

          <form action={async () => {
            'use server';
            await signIn('naver', { redirectTo: callbackUrl || '/dashboard' });
          }}>
            <button type="submit" className="auth-provider-btn auth-provider-btn--naver">
              네이버로 계속하기
            </button>
          </form>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--ink-faint)' }}>
          로그인하면 실제 데이터베이스에 계정이 생성됩니다.
        </p>
      </div>
    </main>
  );
}