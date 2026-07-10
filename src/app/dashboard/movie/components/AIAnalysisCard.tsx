'use client';

type Analysis = {
  emotion: string;
  people: string;
  place: string;
  mood: string;
  description: string;
};

type Props = {
  analysis: Analysis;
};

export default function AIAnalysisCard({ analysis }: Props) {
  const hasAnalysis =
    analysis.emotion ||
    analysis.people ||
    analysis.place ||
    analysis.mood ||
    analysis.description;

  return (
    <div
      className="dash-card"
      style={{
        marginBottom: 16,
        background: 'rgba(182,137,47,.05)',
        border: '1px solid rgba(182,137,47,.15)',
      }}
    >
      <p className="dash-card__label">사진 속 이야기 정리</p>

      <h2
        style={{
          margin: '8px 0 10px',
          fontFamily: 'Noto Serif KR, serif',
          fontSize: 28,
          lineHeight: 1.35,
          color: 'var(--ink)',
        }}
      >
        선택한 사진에서 이야기의 단서를 찾습니다.
      </h2>

      <p
        style={{
          color: 'var(--ink-soft)',
          fontSize: 16,
          lineHeight: 1.7,
          marginTop: 0,
          marginBottom: 20,
        }}
      >
        사진 속 인물, 장소, 분위기를 바탕으로 추억 영상에 담을 문장을 준비합니다.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2,1fr)',
          gap: 12,
          marginTop: 16,
        }}
      >
        {[
          ['😊', '느껴지는 표정', analysis.emotion],
          ['👨‍👩‍👧', '추억 속 인물', analysis.people],
          ['📍', '추억의 장소', analysis.place],
          ['🎨', '장면의 분위기', analysis.mood],
        ].map(([icon, title, value]) => (
          <div
            key={title}
            style={{
              padding: 14,
              borderRadius: 12,
              background: '#fffdf8',
              border: '1px solid rgba(182,137,47,.15)',
            }}
          >
            <div style={{ fontSize: 24 }}>{icon}</div>

            <div
              style={{
                fontSize: 13,
                color: 'var(--ink-faint)',
                marginTop: 8,
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginTop: 4,
                lineHeight: 1.55,
              }}
            >
              {value || (hasAnalysis ? '정리 중...' : '사진을 선택하면 표시됩니다')}
            </div>
          </div>
        ))}
      </div>

      {analysis.description && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            background: '#fff',
            lineHeight: 1.8,
          }}
        >
          <strong>책과 영상에 담을 이야기 단서</strong>

          <p
            style={{
              marginTop: 12,
              color: 'var(--ink-soft)',
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            {analysis.description}
          </p>
        </div>
      )}
    </div>
  );
}