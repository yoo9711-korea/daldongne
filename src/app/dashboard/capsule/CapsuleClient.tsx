'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface LockedCapsule {
  id: string;
  title: string;
  openAt: string;
  isPrivate: boolean;
  daysLeft: number;
}

interface OpenedCapsule {
  id: string;
  title: string;
  message: string;
  openAt: string;
  openedAt: string | null;
  isPrivate: boolean;
}

interface Props {
  locked: LockedCapsule[];
  opened: OpenedCapsule[];
  createCapsule: (formData: FormData) => Promise<void>;
}

export default function CapsuleClient({ locked, opened, createCapsule }: Props) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<OpenedCapsule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      await createCapsule(formData);

      setShowForm(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => setShowForm(!showForm)} className="btn btn--gold">
          {showForm ? '✕ 닫기' : '+ 미래 편지 남기기'}
        </button>
      </div>

      {showForm && (
        <div className="dash-card" style={{ marginBottom: 32, maxWidth: 620 }}>
          <p className="dash-card__label">새 미래 편지</p>

          <h2
            style={{
              margin: '8px 0 16px',
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 30,
              lineHeight: 1.35,
              color: 'var(--ink)',
            }}
          >
            가족에게 전하고 싶은 마음을 남겨보세요.
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
            지금 전하지 못한 말, 가족이 꼭 읽었으면 하는 마음을 정해진 날까지
            소중히 보관합니다.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  letterSpacing: '.06em',
                  color: 'var(--ink-faint)',
                  marginBottom: 8,
                }}
              >
                편지 제목
              </label>

              <input
                type="text"
                name="title"
                required
                placeholder="예: 엄마에게 꼭 전하고 싶은 말"
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

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  letterSpacing: '.06em',
                  color: 'var(--ink-faint)',
                  marginBottom: 8,
                }}
              >
                열어볼 날짜
              </label>

              <input
                type="date"
                name="openAt"
                required
                min={minDate}
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

              <p
                style={{
                  fontSize: 13,
                  color: 'var(--ink-faint)',
                  lineHeight: 1.6,
                  marginTop: 6,
                }}
              >
                이 날짜가 지나면 편지를 열어볼 수 있습니다.
              </p>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  letterSpacing: '.06em',
                  color: 'var(--ink-faint)',
                  marginBottom: 8,
                }}
              >
                가족에게 전하고 싶은 마음
              </label>

              <textarea
                name="message"
                required
                placeholder="가족에게 남기고 싶은 말, 고마웠던 마음, 꼭 전하고 싶은 이야기를 적어주세요."
                style={{
                  width: '100%',
                  minHeight: 150,
                  border: '1px solid rgba(34,28,22,.18)',
                  borderRadius: 10,
                  padding: 14,
                  background: 'var(--paper)',
                  fontSize: 16,
                  lineHeight: 1.7,
                  fontFamily: 'var(--font-body)',
                  resize: 'vertical',
                }}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              <input type="checkbox" name="isPrivate" value="true" />
              <span style={{ color: 'var(--ink-soft)' }}>
                나만 보기로 보관하기
              </span>
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn btn--gold btn--sm"
                disabled={submitting}
              >
                {submitting ? '보관 중...' : '편지 보관하기'}
              </button>

              <button
                type="button"
                className="btn btn--ghost-light btn--sm"
                onClick={() => setShowForm(false)}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: 40 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            marginBottom: 16,
          }}
        >
          그날까지 보관 중 ({locked.length})
        </h2>

        {locked.length === 0 ? (
          <div className="dash-card">
            <p
              style={{
                color: 'var(--ink-faint)',
                fontSize: 16,
                lineHeight: 1.7,
              }}
            >
              아직 보관 중인 미래 편지가 없습니다.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {locked.map((capsule) => (
              <div
                key={capsule.id}
                style={{
                  background: 'var(--cover)',
                  color: 'var(--cream)',
                  borderRadius: 16,
                  padding: '24px 20px',
                  border: '1px solid rgba(182,137,47,.3)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    letterSpacing: '.1em',
                    color: 'var(--gold-soft)',
                    marginBottom: 10,
                  }}
                >
                  {capsule.isPrivate ? '나만 보기' : '가족 공유'} · 그날까지 보관 중
                </p>

                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 12,
                    color: 'var(--cream)',
                    lineHeight: 1.4,
                  }}
                >
                  {capsule.title}
                </h3>

                <p
                  style={{
                    fontSize: 15,
                    color: 'rgba(238,230,211,.66)',
                    marginBottom: 6,
                  }}
                >
                  열어볼 날짜: {new Date(capsule.openAt).toLocaleDateString('ko-KR')}
                </p>

                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 17,
                    color: 'var(--gold-soft)',
                    margin: 0,
                  }}
                >
                  {capsule.daysLeft > 0
                    ? `D-${capsule.daysLeft}`
                    : '곧 열어볼 수 있어요'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            marginBottom: 16,
          }}
        >
          이제 열어볼 수 있어요 ({opened.length})
        </h2>

        {opened.length === 0 ? (
          <div className="dash-card">
            <p
              style={{
                color: 'var(--ink-faint)',
                fontSize: 16,
                lineHeight: 1.7,
              }}
            >
              아직 열어볼 수 있는 미래 편지가 없습니다.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {opened.map((capsule) => (
              <div
                key={capsule.id}
                className="dash-card"
                style={{
                  cursor: 'pointer',
                  border: '1px solid rgba(182,137,47,.2)',
                }}
                onClick={() => setSelectedCapsule(capsule)}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    letterSpacing: '.1em',
                    color: 'var(--gold)',
                    marginBottom: 10,
                  }}
                >
                  {capsule.isPrivate ? '나만 보기' : '가족 공유'} · 이제 열어볼 수 있어요
                </p>

                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 8,
                    lineHeight: 1.4,
                  }}
                >
                  {capsule.title}
                </h3>

                <p
                  style={{
                    fontSize: 15,
                    color: 'var(--ink-faint)',
                  }}
                >
                  {new Date(capsule.openAt).toLocaleDateString('ko-KR')} 열림
                </p>

                <p
                  style={{
                    fontSize: 15,
                    color: 'var(--wine)',
                    marginTop: 6,
                    fontWeight: 700,
                  }}
                >
                  클릭해서 읽기 →
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCapsule && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26,22,17,.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 24,
          }}
          onClick={() => setSelectedCapsule(null)}
        >
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: 18,
              padding: 'clamp(28px,4vw,48px)',
              maxWidth: 620,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '.1em',
                color: 'var(--gold)',
                marginBottom: 16,
              }}
            >
              미래 편지 · {new Date(selectedCapsule.openAt).toLocaleDateString('ko-KR')} 열림
            </p>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 30,
                lineHeight: 1.35,
                marginBottom: 24,
              }}
            >
              {selectedCapsule.title}
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                lineHeight: 1.9,
                color: 'var(--ink-soft)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {selectedCapsule.message}
            </p>

            <button
              onClick={() => setSelectedCapsule(null)}
              className="btn btn--ghost-light btn--sm"
              style={{ marginTop: 32 }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}