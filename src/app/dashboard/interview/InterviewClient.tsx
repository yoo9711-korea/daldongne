'use client';

import { useState, useRef } from 'react';
import VoiceButton from './VoiceButton';

interface Answer {
  id: string;
  title: string;
  description: string;
}

interface Props {
  answers: Answer[];
  currentQuestion: string | null;
  isComplete: boolean;
  submitAnswer: (formData: FormData) => Promise<void>;
}

export default function InterviewClient({
  answers,
  currentQuestion,
  isComplete,
  submitAnswer,
}: Props) {
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answerText.trim() || !currentQuestion) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('answer', answerText);
    formData.append('question', currentQuestion);
    await submitAnswer(formData);
    setAnswerText('');
    setSubmitting(false);
  }

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 이전 답변들 */}
      {answers.map((a) => (
        <div key={a.id}>
          <div style={{
            background: 'var(--paper-shade)', padding: '16px 18px',
            borderRadius: 3, maxWidth: '85%', alignSelf: 'flex-start',
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.06em', color: 'var(--ink-faint)', marginBottom: 6 }}>AI 인터뷰어</p>
            <p style={{ margin: 0 }}>{a.title.replace('AI 인터뷰: ', '')}</p>
          </div>
          <div style={{
            background: 'var(--cover)', color: 'var(--cream)',
            padding: '16px 18px', borderRadius: 3,
            maxWidth: '85%', marginLeft: 'auto', marginTop: 8,
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.06em', color: 'rgba(238,230,211,.5)', marginBottom: 6 }}>나의 답변</p>
            <p style={{ margin: 0 }}>{a.description}</p>
          </div>
        </div>
      ))}

      {/* 현재 질문 */}
      {isComplete ? (
        <div className="dash-card">
          <p style={{ color: 'var(--ink-soft)' }}>
            모든 질문에 답해주셨습니다 🎉<br />
            이 답변들은 AI Interview에서도 확인할 수 있어요.
          </p>
        </div>
      ) : (
        <>
          <div style={{
            background: 'var(--paper-shade)', padding: '16px 18px',
            borderRadius: 3, maxWidth: '85%',
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.06em', color: 'var(--ink-faint)', marginBottom: 6 }}>AI 인터뷰어</p>
            <p style={{ margin: 0 }}>{currentQuestion}</p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <input type="hidden" name="question" value={currentQuestion || ''} />

            {/* 음성 입력 버튼 */}
            <VoiceButton
              onTranscribed={(text) => setAnswerText(prev => prev ? prev + ' ' + text : text)}
            />

            <textarea
              name="answer"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="이곳에 답변을 적어주세요... 또는 위의 🎙 버튼으로 말씀해주세요."
              required
              style={{
                width: '100%', minHeight: 100,
                border: '1px solid rgba(34,28,22,.18)',
                borderRadius: 2, padding: 12,
                background: 'var(--paper)',
                fontFamily: 'var(--font-body)',
                fontSize: 14.5, resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn--gold btn--sm"
                disabled={submitting || !answerText.trim()}
              >
                {submitting ? '저장 중...' : '답변 저장하기'}
              </button>
            </div>
          </form>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}