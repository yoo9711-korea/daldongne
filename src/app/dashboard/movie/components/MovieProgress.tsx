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
              fontWeight: 800,
              color: 'var(--wine)',
              marginBottom: 16,
              fontSize: 18,
              lineHeight: 1.6,
            }}
          >
            사진과 이야기를 추억 영상으로 정리하고 있습니다.
          </p>

          <div
            style={{
              width: '100%',
              height: 10,
              background: '#ece8df',
              borderRadius: 999,
              overflow: 'hidden',
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--gold)',
                transition: 'width .3s',
              }}
            />
          </div>

          <p
            style={{
              fontSize: 15,
              color: 'var(--ink-soft)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {status || '추억 영상 제작을 준비하고 있습니다.'}
          </p>
        </div>
      )}

      {result && (
        <div className="dash-card" style={{ marginTop: 16 }}>
          {result.error ? (
            <div>
              <p
                style={{
                  color: '#b42318',
                  fontWeight: 800,
                  fontSize: 17,
                  lineHeight: 1.6,
                  marginBottom: 8,
                }}
              >
                추억 영상을 만들지 못했습니다.
              </p>

              <p
                style={{
                  color: 'var(--ink-soft)',
                  fontSize: 15,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {result.error}
              </p>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontWeight: 800,
                  color: 'var(--wine)',
                  marginBottom: 10,
                  fontSize: 18,
                  lineHeight: 1.6,
                }}
              >
                추억 영상 제작이 시작되었습니다.
              </p>

              <p
                style={{
                  color: 'var(--ink-soft)',
                  fontSize: 15,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {status || '잠시 후 완성된 영상을 확인할 수 있습니다.'}
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}