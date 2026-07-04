'use client';

interface Props {
  mode: 'A' | 'B' | 'C';
  title: string;
  name: string;
  customText: string;
  interviewsCount: number;
  generating: boolean;

  setTitle: (v: string) => void;
  setName: (v: string) => void;
  setCustomText: (v: string) => void;

  onGenerate: () => void;
}

export default function MovieForm({
  mode,
  title,
  name,
  customText,
  interviewsCount,
  generating,
  setTitle,
  setName,
  setCustomText,
  onGenerate,
}: Props) {
  return (
    <>
      <div className="dash-card" style={{ marginBottom: 16 }}>
        <p className="dash-card__label">영상 제목</p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 우리 가족의 이야기"
          style={{
            width: '100%',
            height: 44,
            border: '1px solid rgba(34,28,22,.18)',
            borderRadius: 2,
            padding: '0 12px',
          }}
        />
      </div>

      <div className="dash-card" style={{ marginBottom: 16 }}>
        <p className="dash-card__label">주인공 이름</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 김민수"
          style={{
            width: '100%',
            height: 44,
            border: '1px solid rgba(34,28,22,.18)',
            borderRadius: 2,
            padding: '0 12px',
          }}
        />
      </div>

      {mode === 'B' && (
        <div className="dash-card" style={{ marginBottom: 16 }}>
          <p className="dash-card__label">영상 문구</p>

          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            style={{
              width: '100%',
              minHeight: 120,
              padding: 12,
              border: '1px solid rgba(34,28,22,.18)',
            }}
          />
        </div>
      )}

      {mode === 'C' && (
        <div className="dash-card" style={{ marginBottom: 16 }}>
          <p className="dash-card__label">
            저장된 인터뷰 {interviewsCount}개 사용
          </p>
        </div>
      )}

      <button
        className="btn btn--gold"
        disabled={generating}
        onClick={onGenerate}
        style={{
          width: '100%',
          height: 60,
          fontSize: 20,
        }}
      >
        {generating ? '영상 생성 중...' : '추억영상 만들기'}
      </button>
    </>
  );
}