import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    { name: 'PDF 다운로드', desc: '인쇄 없이, 디지털로 먼저 만나보세요.', price: '39,000', unit: '원 / 1권', features: ['완성된 PDF 파일 제공', 'AI 질문 무제한 답변', '개인 소장용 다운로드'], plan: 'PDF 다운로드', featured: false },
    { name: 'Life Book', desc: '매년 출판되는, 당신의 인생책.', price: '89,000', unit: '원 / 1권', features: ['하드커버 양장 인쇄', '전체 챕터 디자인 편집', '가족 공유 디지털 사본 포함'], plan: 'Life Book', featured: true },
    { name: 'Heritage Edition', desc: '가죽 양장으로 제작되는, 평생 소장판.', price: '189,000', unit: '원 / 1권', features: ['가죽 양장 + 금박 제목', '고급 아트지 인쇄', '전용 보관 케이스 포함'], plan: 'Heritage Edition', featured: false },
    { name: 'Movie Premium', desc: '책에서 태어난, 당신만의 인생영화. (부록)', price: '+59,000', unit: '원 / 책 구매 시 추가', features: ['책 내용 기반 AI 영상 제작', '3~5분 분량 인생영화', '고화질 파일 다운로드'], plan: 'Movie Premium (부록)', featured: false },
  ];

  return (
    <main>
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">CHAPTER 8</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>가격 정책</span>
          </div>
          <div style={{ marginBottom: 'clamp(40px,6vw,64px)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,38px)', marginBottom: 14 }}>
              당신의 삶에 맞는 형태를 고르세요
            </h2>
            <p style={{ color: 'var(--ink-soft)' }}>출판 형태에 따라 구성과 가격이 달라집니다. 모든 가격은 1권 기준입니다.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {plans.map((plan) => (
              <div key={plan.name} style={{
                background: plan.featured ? 'var(--cover)' : 'var(--paper)',
                border: plan.featured ? '1px solid rgba(182,137,47,.45)' : '1px solid rgba(34,28,22,.1)',
                borderRadius: 3, padding: '26px 22px',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
              }}>
                {plan.featured && (
                  <span style={{ position: 'absolute', top: -12, right: 18, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cover)', background: 'var(--gold-soft)', padding: '4px 10px', borderRadius: 20 }}>
                    가장 많이 선택
                  </span>
                )}
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 6, color: plan.featured ? 'var(--cream)' : 'var(--ink)' }}>{plan.name}</p>
                <p style={{ color: plan.featured ? 'rgba(238,230,211,.62)' : 'var(--ink-soft)', fontSize: 13.5, marginBottom: 18 }}>{plan.desc}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: plan.featured ? 'var(--cream)' : 'var(--ink)', marginBottom: 2 }}>
                  {plan.price}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 400, color: plan.featured ? 'rgba(238,230,211,.45)' : 'var(--ink-faint)' }}> {plan.unit}</span>
                </p>
                <ul style={{ margin: '18px 0 22px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1, listStyle: 'none', padding: 0 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: plan.featured ? 'rgba(238,230,211,.62)' : 'var(--ink-soft)', paddingLeft: 16, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: 'var(--gold)' }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/apply?plan=${encodeURIComponent(plan.plan)}`} className={plan.featured ? 'btn btn--gold btn--sm' : 'btn btn--ghost-light btn--sm'}>
                  이 구성으로 신청
                </Link>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 36, color: 'var(--ink-faint)', fontSize: 13 }}>
            · 월 구독으로 매년 자동 출판도 가능합니다 · 기업·학교·동호회는 단체 출판 문의를 이용해주세요
          </p>
        </div>
      </section>
    </main>
  );
}