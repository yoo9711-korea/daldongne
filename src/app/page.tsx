// src/app/page.tsx
import Link from 'next/link';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <main>
      <section className="cover">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.28em', color: 'var(--gold-soft)', marginBottom: 24 }}>
          DAL-DONG-NE PUBLISHING
        </p>
        <h1 className="cover__title">
          사진은 추억을 남긴다.<br />
          가장 높은 곳에서, 당신의 기억을<br />
          따뜻하게 맞아 줍니다.
        </h1>
        <p className="cover__subtitle">
          한 사람의 삶을 다음 세대에게 전달하는 Memory Platform.
        </p>
        {session?.user ? (
          <Link href="/dashboard" className="btn btn--gold">내 서재로 이동</Link>
        ) : (
          <Link href="/login" className="btn btn--gold">무료로 시작하기</Link>
        )}
      </section>

      <section className="page" style={{ textAlign: 'center' }}>
        <div className="runninghead" style={{ justifyContent: 'center' }}>
          <span className="runninghead__chapter">FOUNDATION</span>
          <span className="runninghead__rule" style={{ flex: '0 0 60px' }}></span>
          <span style={{ color: 'var(--ink-soft)' }}>1단계: 실제 작동하는 기반</span>
        </div>
        <p style={{ color: 'var(--ink-soft)', maxWidth: 560, margin: '0 auto' }}>
          이 화면은 정적 목업이 아닙니다. 로그인하면 실제로 PostgreSQL에 사용자 정보가
          저장되고, 로그인 상태에 따라 헤더와 이 페이지의 버튼이 실시간으로 바뀝니다.
        </p>
      </section>
    </main>
  );
}
