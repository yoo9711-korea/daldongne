'use client';

type Props = {
  questions: string[];
};

export default function AIQuestionCard({
  questions,
}: Props) {
  if (!questions || questions.length === 0) return null;

  return (
    <div
      className="dash-card"
      style={{ marginTop: 24 }}
    >
      <p className="dash-card__label">
        🤖 AI가 추천하는 인터뷰 질문
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 16,
        }}
      >
        {questions.map((q, index) => (
          <div
            key={index}
            style={{
              padding: 14,
              borderRadius: 10,
              background: "#fffdf8",
              border: "1px solid rgba(182,137,47,.15)",
            }}
          >
            <strong>Q{index + 1}.</strong>{" "}
            {q}
          </div>
        ))}
      </div>
    </div>
  );
}