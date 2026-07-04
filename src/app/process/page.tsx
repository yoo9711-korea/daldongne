export default function ProcessPage() {
  const steps = [
    { num: '01', title: 'AI가 질문합니다', desc: '삶의 결정적인 순간들을 하나씩 묻습니다.' },
    { num: '02', title: '당신이 답합니다', desc: '기억나는 대로, 편하게 답하면 됩니다.' },
    { num: '03', title: 'AI가 초안을 작성합니다', desc: '답변을 모아 한 챕터의 글로 엮습니다.' },
    { num: '04', title: '당신이 다듬습니다', desc: '당신의 말투와 감정으로 다시 고칩니다.' },
    { num: '05', title: '한 권의 책이 완성됩니다', desc: '그렇게, 당신만의 작품이 출판됩니다.' },
  ];

  return (
    <main>
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">CHAPTER 4</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>출판이 만들어지는 방법</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,38px)', marginBottom: 14 }}>
            AI는 작가가 아니라, 편집자입니다.
          </h2>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(18px,2.2vw,22px)', color: 'var(--wine)', marginBottom: 48 }}>
            "AI는 질문하고, 당신은 답할 뿐입니다."
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{
                display: 'grid', gridTemplateColumns: '60px 1fr', gap: 24,
                padding: '26px 0',
                borderTop: '1px solid rgba(34,28,22,.1)',
                borderBottom: i === steps.length - 1 ? '1px solid rgba(34,28,22,.1)' : 'none',
                alignItems: 'baseline',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--gold)' }}>{step.num}</span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ color: 'var(--ink-soft)', fontSize: 14.5 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}