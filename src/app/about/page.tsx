import Link from 'next/link';

export default function AboutPage() {
  return (
    <main>
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">CHAPTER 1</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>미션</span>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <blockquote style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px,4.6vw,46px)', lineHeight: 1.42, color: 'var(--ink)', maxWidth: 780, margin: '0 auto 30px' }}>
              모든 사람의 삶은<br />한 권의 책이 될 가치가 있다.
            </blockquote>
            <div style={{ width: 46, height: 2, background: 'var(--gold)', margin: '0 auto 30px' }}></div>
            <p style={{ maxWidth: 560, margin: '0 auto', color: 'var(--ink-soft)' }}>
              달동네 출판사는 사진을 저장하는 회사가 아니라, 사람의 삶을 출판하는 회사가 됩니다.
              궁극적으로, 모든 사람이 평생 자신의 서재(Life Library)를 만드는 것이 목표입니다.
            </p>
          </div>
        </div>
      </section>

      <section className="page" style={{ background: 'var(--paper-shade)' }}>
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">CHAPTER 2</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>선물의 이유</span>
          </div>
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,38px)', marginBottom: 14 }}>
              이 책은, 누군가에게 닿기 위해 만들어집니다
            </h2>
            <p style={{ color: 'var(--ink-soft)' }}>받는 사람을 떠올리면, 어떤 챕터부터 시작할지가 보입니다.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { eyebrow: '부모님께', title: '부모님의 인생을,\n책으로 선물하세요', desc: '명절과 생일, 매번 같은 선물이 고민이었다면. 부모님이 살아온 이야기를, 자녀의 손으로 한 권의 책으로 완성해보세요.', href: '/products' },
              { eyebrow: '우리 아이에게', title: '휴대폰 속에 잠든 사진들을,\n매년 한 편의 성장 소설로', desc: '찍기만 하고 다시 보지 않는 사진들. 달동네 출판사가 매년, 아이가 자란 한 해를 한 챕터의 이야기로 엮어드립니다.', href: '/products' },
              { eyebrow: '우리 둘에게', title: '앨범이 아니라,\n두 사람의 역사책', desc: '사진을 나열하는 앨범 대신, 두 사람만이 알아볼 줄거리가 있는 서사책을. 우리의 시간에는 우리만의 이야기가 있습니다.', href: '/products' },
            ].map((item) => (
              <div key={item.eyebrow} className="dash-card" style={{ borderRadius: 3 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--wine)', marginBottom: 14 }}>{item.eyebrow}</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, lineHeight: 1.45, marginBottom: 12, whiteSpace: 'pre-line' }}>{item.title}</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 18 }}>{item.desc}</p>
                <Link href={item.href} className="btn btn--ghost-light btn--sm">작품 보러가기 →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}