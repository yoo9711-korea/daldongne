interface Props {
  generating: boolean;
  progress?: number;
  status?: string;
}

export default function MoviePreview({
  generating,
  progress = 0,
  status = "대기중",
}: Props) {
  return (
    <div className="dash-card">

      <div
        style={{
          aspectRatio: "16 / 9",
          borderRadius: 12,
          overflow: "hidden",
          background: "#1b1b1b",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
          fontSize: 54,
        }}
      >
        🎬
      </div>

      <h3
        style={{
          marginTop: 18,
          marginBottom: 10,
        }}
      >
        추억영상 미리보기
      </h3>

      <p
        style={{
          color: "var(--ink-soft)",
          marginBottom: 18,
        }}
      >
        {generating
          ? "AI가 영상을 제작하고 있습니다."
          : "영상을 제작하면 이곳에서 바로 재생됩니다."}
      </p>

      <div
        style={{
          width: "100%",
          height: 10,
          background: "#ece8df",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "var(--gold)",
            transition: "width .5s",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: "var(--ink-soft)",
        }}
      >
        <span>{status}</span>
        <strong>{progress}%</strong>
      </div>

    </div>
  );
}