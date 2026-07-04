'use client';

interface Props {
  generating: boolean;
  progress: number;
  status: string;
  result: {
    movieId?: string;
    error?: string;
  } | null;
}

export default function MovieProgress({
  generating,
  progress,
  status,
  result,
}: Props) {
  return (
    <>
      {generating && (
        <div className="dash-card" style={{ marginTop: 16 }}>
          <p
            style={{
              fontWeight: 700,
              color: "var(--wine)",
              marginBottom: 16,
            }}
          >
            AI가 추억영상을 제작하고 있습니다...
          </p>

          <div
            style={{
              width: "100%",
              height: 10,
              background: "#ece8df",
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--gold)",
                transition: "width .3s",
              }}
            />
          </div>

          <p
            style={{
              fontSize: 14,
              color: "var(--ink-soft)",
            }}
          >
            {status}
          </p>
        </div>
      )}

      {result && (
        <div className="dash-card" style={{ marginTop: 16 }}>
          {result.error ? (
            <p
              style={{
                color: "#b42318",
              }}
            >
              {result.error}
            </p>
          ) : (
            <>
              <p
                style={{
                  fontWeight: 700,
                  color: "var(--wine)",
                  marginBottom: 10,
                }}
              >
                영상 생성 요청 완료
              </p>

              <p>{status}</p>

              <p
                style={{
                  fontSize: 12,
                  color: "var(--ink-faint)",
                  marginTop: 8,
                }}
              >
                Movie ID : {result.movieId}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}