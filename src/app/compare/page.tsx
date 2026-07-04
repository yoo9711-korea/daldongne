export default function ComparePage() {
  const rows = [
    { old: 'SNS', oldText: '현재를 공유한다', newText: '시간을 연결한다' },
    { old: '포토북', oldText: '사진을 인쇄한다', newText: '삶을 출판한다' },
    { old: '자서전', oldText: '전문작가가 제작한다', newText: 'AI와 함께 누구나 출판한다' },
  ];

  return (
    <main>
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">CHAPTER 5</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>무엇이 다른가</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,38px)', marginBottom: 14 }}>
            당신이 알던 것과는, 다릅니다.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(34,28,22,.1)', marginTop: 48 }}>
            {rows.map((row) => (
              <div key={row.old} style={{
                display: 'grid', gridTemplateColumns: '1fr 56px 1fr',
                alignItems: 'center', gap: 18,
                background: 'var(--paper)', padding: '28px clamp(8px,3vw,28px)',
              }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.12em', color: 'var(--ink-faint)', marginBottom: 6 }}>{row.old}</span>
                  <span style={{ color: 'var(--ink-faint)', fontSize: 15, textDecoration: 'line-through', textDecorationColor: 'rgba(140,74,45,.4)' }}>{row.oldText}</span>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--gold)', fontSize: 18, fontFamily: 'var(--font-mono)' }}>→</div>
                <div>
                  <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.12em', color: 'var(--wine)', marginBottom: 6 }}>달동네 출판사</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--ink)' }}>{row.newText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}