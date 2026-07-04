import Link from 'next/link';
import { auth } from '@/auth';

export default async function TrialPage() {
  const session = await auth();

  return (
    <main>
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">CHAPTER 6</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>직접 써보는 첫 페이지</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,38px)', marginBottom: 14 }}>
            사진 한 장으로, 책의 첫 페이지를 만들어보세요
          </h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 48 }}>
            사진을 올리고 AI의 질문에 답해보세요. 답을 적용할 때마다, 오른쪽 페이지에 초안이 바로 만들어집니다.
          </p>
          {session?.user ? (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href="/dashboard/interview" className="btn btn--gold">AI 인터뷰 시작하기</Link>
              <Link href="/dashboard/timeline" className="btn btn--ghost-light">Memory Timeline 보기</Link>
            </div>
          ) : (
            <div className="dash-card" style={{ maxWidth: 480 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, marginBottom: 12 }}>
                로그인하면 바로 시작할 수 있어요
              </p>
              <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 20 }}>
                Google, 카카오, 네이버 계정으로 3초만에 가입됩니다.
              </p>
              <Link href="/login" className="btn btn--gold">무료로 시작하기</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}