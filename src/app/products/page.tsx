export default function ProductsPage() {
  const books = [
    { id: 'lifebook', name: 'Life Book', desc: '매년 출판되는, 당신의 인생책.', tags: ['연간 시리즈', '명절 선물 추천'], spine: '#6E2A36' },
    { id: 'familybook', name: 'Family Book', desc: '우리 가족이 함께 써 내려가는 이야기.', tags: ['가족 출판'], spine: '#2E3F52' },
    { id: 'couplebook', name: 'Couple Book', desc: '둘만이 알아볼 시간이 한 권의 작품이 됩니다.', tags: ['두 사람의 기록', '서사책'], spine: '#5C3A52' },
    { id: 'babybook', name: 'Baby Book', desc: '아이가 자라는 모든 순간을 기록하는 시리즈.', tags: ['성장 기록', '매년 쓰는 성장 소설'], spine: '#5C6B4F' },
    { id: 'travelbook', name: 'Travel Book', desc: '떠났던 모든 길과 그 길 위의 이야기.', tags: ['여행 기록'], spine: '#8C4A2D' },
    { id: 'clubbook', name: 'Club Book', desc: '동호회·학교·기업을 위한 기념 출판.', tags: ['단체 출판'], spine: '#1F2D3D' },
    { id: 'heritage', name: 'Heritage Edition', desc: '가죽 양장으로 제작되는, 평생 소장판.', tags: ['한정 양장판'], spine: '#B6892F' },
    { id: 'movie', name: '달동네 인생영화', desc: '책에서 태어난, 당신만의 인생영화.', tags: ['Premium 부록 서비스'], spine: '#B6892F', dark: true },
  ];

  return (
    <main>
      <section className="page">
        <div className="page__inner">
          <div className="runninghead">
            <span className="runninghead__chapter">CHAPTER 3</span>
            <span className="runninghead__rule"></span>
            <span style={{ color: 'var(--ink-soft)' }}>작품 시리즈</span>
          </div>
          <div style={{ marginBottom: 'clamp(40px,6vw,64px)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(26px,3.6vw,38px)', marginBottom: 14 }}>
              당신의 삶을 담는 여덟 개의 시리즈
            </h2>
            <p style={{ color: 'var(--ink-soft)' }}>모든 작품은 AI와의 대화에서 시작되어, 한 권의 출판물로 완성됩니다.</p>
          </div>
          <div className="book-grid">
            {books.map((book) => (
              <div
                key={book.id}
                id={`book-${book.id}`}
                style={{
                  background: book.dark ? 'var(--cover)' : 'var(--paper)',
                  border: book.dark ? '1px solid rgba(182,137,47,.4)' : '1px solid rgba(34,28,22,.1)',
                  borderRadius: 2,
                  padding: '22px 20px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 208,
                  transition: 'transform .3s ease, box-shadow .3s ease',
                }}
              >
                <div style={{ height: 5, width: 34, background: book.spine, marginBottom: 18, borderRadius: 1 }}></div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8, color: book.dark ? 'var(--cream)' : 'var(--ink)' }}>
                  {book.name}
                </h3>
                <p style={{ color: book.dark ? 'rgba(238,230,211,.62)' : 'var(--ink-soft)', fontSize: 14, flex: 1, marginBottom: 14 }}>
                  {book.desc}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {book.tags.map(tag => (
                    <span key={tag} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.1em',
                      color: book.dark ? 'var(--gold-soft)' : 'var(--ink-faint)',
                      border: book.dark ? '1px solid rgba(182,137,47,.45)' : '1px solid rgba(34,28,22,.15)',
                      padding: '4px 9px', borderRadius: 20
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}