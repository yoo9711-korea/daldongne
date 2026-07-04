import Link from 'next/link';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <main>
      {/* 표지 */}
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
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/trial" className="btn btn--gold">무료로 체험하기</Link>
          <Link href="/products" className="btn btn--ghost-dark">작품 살펴보기</Link>
        </div>
      </section>

      {/* 프롤로그 */}
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">PROLOGUE</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>우리가 출발한 이유</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: 'clamp(32px,6vw,80px)' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(19px,2.3vw,25px)', lineHeight: 1.6, color: 'var(--ink-soft)', marginBottom: 22 }}>
                사진은 많다.<br />영상도 많다.<br />그러나<br />삶은 정리되지 않는다.
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(19px,2.3vw,25px)', lineHeight: 1.6, color: 'var(--ink-soft)' }}>
                SNS는 현재를 공유한다.<br />시간이 지나면<br />기록은 묻힌다.
              </p>
            </div>
            <div style={{ borderLeft: '1px solid rgba(110,42,54,.3)', paddingLeft: 'clamp(20px,3vw,32px)' }}>
              <p style={{ color: 'var(--ink-soft)', marginBottom: 18 }}>달동네 출판사는 시간의 축과 관계의 축을 이용하여, 한 사람을 이해하도록 만듭니다.</p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(18px,2vw,21px)', color: 'var(--ink)', marginTop: 26 }}>
                사람은 기억되기 위해 사는 것이 아니다.<br />이해받기 위해 살아간다.
              </p>
              <p style={{ color: 'var(--ink-soft)', marginTop: 16 }}>달동네 출판사는 세대와 세대를 이야기로 연결합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 미션 */}
      <section className="page" style={{ background: 'var(--paper-shade)', textAlign: 'center' }}>
        <div className="page__inner">
          <div className="runninghead" style={{ justifyContent: 'center' }}>
            <span className="runninghead__chapter">MISSION</span>
            <span className="runninghead__rule" style={{ flex: '0 0 60px' }}></span>
          </div>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px,4.6vw,46px)', lineHeight: 1.42, color: 'var(--ink)', maxWidth: 780, margin: '0 auto 30px' }}>
            모든 사람의 삶은<br />한 권의 책이 될 가치가 있다.
          </blockquote>
          <div style={{ width: 46, height: 2, background: 'var(--gold)', margin: '0 auto 30px' }}></div>
          <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--ink-soft)' }}>
            달동네 출판사는 사진을 저장하는 회사가 아니라, 사람의 삶을 출판하는 회사가 됩니다.
          </p>
        </div>
      </section>

      {/* 에필로그 CTA */}
      <section style={{ background: 'var(--cover)', color: 'var(--cream)', padding: 'clamp(70px,11vw,128px) var(--pad)', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(22px,3.6vw,34px)', lineHeight: 1.55, marginBottom: 32 }}>
            <span style={{ color: 'rgba(238,230,211,.5)' }}>달동네 출판사는 사진을 책으로 만드는 회사가 아닙니다.</span><br />
            <span style={{ color: 'var(--gold-soft)' }}>달동네 출판사는 한 사람의 삶을 한 권의 작품으로 만드는 회사입니다.</span>
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/trial" className="btn btn--gold">무료로 시작하기</Link>
            <Link href="/products" className="btn btn--ghost-dark">작품 시리즈 보기</Link>
          </div>
        </div>
      </section>
    </main>
  );
}