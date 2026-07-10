interface Props {
  generating: boolean;
  progress?: number;
  status?: string;
}

export default function MoviePreview({
  generating,
  progress = 0,
  status = '대기 중',
}: Props) {
  return (
    <div className="dash-card">
      <div
        style={{
          aspectRatio: '16 / 9',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#1b1b1b',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          fontSize: 54,
        }}
      >
        🎬
      </div>

      <h3
        style={{
          marginTop: 18,
          marginBottom: 10,
          fontFamily: 'Noto Serif KR, serif',
          fontSize: 26,
          lineHeight: 1.35,
          color: 'var(--ink)',
        }}
      >
        추억 영상 미리보기
      </h3>

      <p
        style={{
          color: 'var(--ink-soft)',
          marginBottom: 18,
          fontSize: 16,
          lineHeight: 1.7,
        }}
      >
        {generating
          ? '사진과 이야기가 추억 영상으로 만들어지고 있습니다.'
          : '추억 영상을 만들면 완성된 결과를 이곳에서 확인할 수 있습니다.'}
      </p>

      <div
        style={{
          width: '100%',
          height: 10,
          background: '#ece8df',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'var(--gold)',
            transition: 'width .5s',
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: 14,
          color: 'var(--ink-soft)',
        }}
      >
        <span>{status}</span>
        <strong>{progress}%</strong>
      </div>
    </div>
  );
}