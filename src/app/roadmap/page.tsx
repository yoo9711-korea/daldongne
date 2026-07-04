import Link from 'next/link';

export default function RoadmapPage() {
  const items = [
    { chapter: 'MOCKUP · 01', title: 'Memory Timeline', desc: '사진·영상·인터뷰가 연도별로 자동 정렬되는 타임라인.', href: '/dashboard/timeline' },
    { chapter: 'MOCKUP · 02', title: 'Life Library', desc: '출판된 책, 영상, 음성을 한 서재에 모아보는 공간.', href: '/dashboard/library' },
    { chapter: 'MOCKUP · 03', title: 'Family Space', desc: '가족을 초대해 함께 기록하고 댓글로 소통하는 공간.', href: '/dashboard/family' },
    { chapter: 'MOCKUP · 04', title: 'AI Interview', desc: '음성으로 답하면 AI가 질문을 이어가며 기록해주는 인터뷰.', href: '/dashboard/interview' },
  ];

  return (
    <main>
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">ROADMAP</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>다음 단계</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,38px)', marginBottom: 14 }}>
            Memory Platform으로 가는 다음 화면들
          </h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 48 }}>로그인하면 실제 데이터와 연결된 기능을 사용할 수 있어요.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {items.map(item => (
              <div key={item.title} className="dash-card" style={{ borderRadius: 3 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--wine)', marginBottom: 14 }}>{item.chapter}</p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 18 }}>{item.desc}</p>
                <Link href={item.href} className="btn btn--ghost-light btn--sm">바로 가기 →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}