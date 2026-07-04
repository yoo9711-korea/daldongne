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

export default function AIAnalysisCard({
  analysis,
}: Props) {
  return (
    <div
      className="dash-card"
      style={{
        marginBottom: 16,
        background: "rgba(182,137,47,.05)",
        border: "1px solid rgba(182,137,47,.15)",
      }}
    >
      <p className="dash-card__label">
        🤖 AI 사진 분석
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 12,
          marginTop: 16,
        }}
      >
        {[
          ["😊", "표정", analysis.emotion],
          ["👨‍👩‍👧", "인물", analysis.people],
          ["📍", "장소", analysis.place],
          ["🎨", "분위기", analysis.mood],
        ].map(([icon, title, value]) => (
          <div
            key={title}
            style={{
              padding: 14,
              borderRadius: 12,
              background: "#fffdf8",
              border: "1px solid rgba(182,137,47,.15)",
            }}
          >
            <div style={{ fontSize: 24 }}>
              {icon}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--ink-faint)",
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
              }}
            >
              {value || "분석 중..."}
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
            background: "#fff",
            lineHeight: 1.8,
          }}
        >
          <strong>📝 추억 설명</strong>

          <p
            style={{
              marginTop: 12,
            }}
          >
            {analysis.description}
          </p>
        </div>
      )}
    </div>
  );
}