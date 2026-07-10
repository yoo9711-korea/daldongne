'use client';

type Props = {
  questions: string[];
};

export default function AIQuestionCard({ questions }: Props) {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="dash-card" style={{ marginTop: 24 }}>
      <p className="dash-card__label">사진에서 떠오른 질문</p>

      <h2
        style={{
          margin: '8px 0 10px',
          fontFamily: 'Noto Serif KR, serif',
          fontSize: 28,
          lineHeight: 1.35,
          color: 'var(--ink)',
        }}
      >
        부모님께 물어보면 좋은 이야기를 정리했습니다.
      </h2>

      <p
        style={{
          color: 'var(--ink-soft)',
          fontSize: 16,
          lineHeight: 1.7,
          marginTop: 0,
          marginBottom: 18,
        }}
      >
        사진만으로는 알 수 없는 기억이 있습니다. 아래 질문을 바탕으로
        부모님의 이야기를 더 남겨보세요.
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginTop: 16,
        }}
      >
        {questions.map((question, index) => (
          <div
            key={`${question}-${index}`}
            style={{
              padding: 16,
              borderRadius: 12,
              background: '#fffdf8',
              border: '1px solid rgba(182,137,47,.15)',
              fontSize: 16,
              lineHeight: 1.7,
              color: 'var(--ink)',
            }}
          >
            <strong>질문 {index + 1}.</strong> {question}
          </div>
        ))}
      </div>
    </div>
  );
}