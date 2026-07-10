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
        <p className="dash-card__label">추억 영상 제목</p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 어머니의 봄날 이야기"
          style={{
            width: '100%',
            height: 48,
            border: '1px solid rgba(34,28,22,.18)',
            borderRadius: 10,
            padding: '0 14px',
            background: 'var(--paper)',
            fontSize: 16,
          }}
        />
      </div>

      <div className="dash-card" style={{ marginBottom: 16 }}>
        <p className="dash-card__label">영상에 넣을 이름</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 어머니, 아버지, 우리 가족"
          style={{
            width: '100%',
            height: 48,
            border: '1px solid rgba(34,28,22,.18)',
            borderRadius: 10,
            padding: '0 14px',
            background: 'var(--paper)',
            fontSize: 16,
          }}
        />
      </div>

      {mode === 'B' && (
        <div className="dash-card" style={{ marginBottom: 16 }}>
          <p className="dash-card__label">영상에 담을 문장</p>

          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: 16,
              lineHeight: 1.7,
              marginTop: 0,
              marginBottom: 12,
            }}
          >
            사진과 함께 보여주고 싶은 문장을 직접 적어주세요.
          </p>

          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="예: 그때는 가난했지만, 우리 가족은 참 따뜻했습니다."
            style={{
              width: '100%',
              minHeight: 130,
              padding: 14,
              borderRadius: 10,
              border: '1px solid rgba(34,28,22,.18)',
              background: 'var(--paper)',
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              lineHeight: 1.7,
              resize: 'vertical',
            }}
          />
        </div>
      )}

      {mode === 'C' && (
        <div className="dash-card" style={{ marginBottom: 16 }}>
          <p className="dash-card__label">남겨둔 이야기 활용</p>

          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: 16,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            이야기 남기기에 저장된 답변 {interviewsCount}개를 바탕으로
            추억 영상 문구를 만듭니다.
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
        {generating ? '추억 영상 만드는 중...' : '추억 영상 만들기'}
      </button>
    </>
  );
}