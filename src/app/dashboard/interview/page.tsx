// src/app/dashboard/interview/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// 1단계 질문 풀 — 추후 GPT로 동적 질문 생성으로 교체 예정 (TODO 표시)
const QUESTIONS = [
  '오늘은 첫 직장에 들어가던 날 이야기를 들려주실 수 있을까요?',
  '그때 가장 응원해준 사람은 누구였나요?',
  '지금 돌아보면, 그 시절의 나에게 해주고 싶은 말이 있나요?',
];

export default async function InterviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  // 실제 쿼리: 이미 답변한 인터뷰 기록 수로 다음 질문 인덱스를 정한다 (가장 단순한 진행 방식)
  const answeredCount = await prisma.memory.count({
    where: { authorId: userId, type: 'TEXT', title: { startsWith: 'AI 인터뷰:' } },
  });
  const currentIndex = Math.min(answeredCount, QUESTIONS.length - 1);
  const isComplete = answeredCount >= QUESTIONS.length;
  const currentQuestion = QUESTIONS[currentIndex];

  async function submitAnswer(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user) redirect('/login');

    const answer = String(formData.get('answer') || '').trim();
    const question = String(formData.get('question') || '');
    if (!answer) return;

    // 실제 쓰기: Memory(type: TEXT)로 인터뷰 답변을 영구 저장한다.
    await prisma.memory.create({
      data: {
        type: 'TEXT',
        title: `AI 인터뷰: ${question.slice(0, 30)}`,
        description: answer,
        authorId: session.user.id,
        occurredAt: new Date(),
      },
    });
    revalidatePath('/dashboard/interview');
  }

  const recentAnswers = await prisma.memory.findMany({
    where: { authorId: userId, type: 'TEXT', title: { startsWith: 'AI 인터뷰:' } },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">INTERVIEW</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>AI Interview</span>
      </div>

      <h1 className="dash-greeting">말로 들려주세요, 나머지는 AI가 정리합니다</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>
        지금은 텍스트 답변만 저장됩니다. 음성 답변(Whisper 연동)은 다음 단계에서 추가됩니다.
      </p>

      <div className="interview-chat">
        {recentAnswers.map((m) => (
          <div key={m.id}>
            <div className="interview-bubble interview-bubble--ai">
              <p className="interview-bubble__label">AI 인터뷰어</p>
              <p>{m.title?.replace('AI 인터뷰: ', '')}</p>
            </div>
            <div className="interview-bubble interview-bubble--user">
              <p className="interview-bubble__label">나의 답변</p>
              <p>{m.description}</p>
            </div>
          </div>
        ))}

        {isComplete ? (
          <div className="dash-card">
            <p style={{ color: 'var(--ink-soft)' }}>
              준비된 질문에 모두 답해주셨습니다. 이 답변들은 Memory Timeline에서도 확인할 수 있어요.
            </p>
          </div>
        ) : (
          <div className="interview-bubble interview-bubble--ai">
            <p className="interview-bubble__label">AI 인터뷰어</p>
            <p>{currentQuestion}</p>
          </div>
        )}

        {!isComplete && (
          <form action={submitAnswer}>
            <input type="hidden" name="question" value={currentQuestion} />
            <textarea
              name="answer"
              required
              placeholder="이곳에 답변을 적어주세요..."
              style={{
                width: '100%', minHeight: 84, border: '1px solid rgba(34,28,22,.18)',
                borderRadius: 2, padding: 12, background: 'var(--paper)',
                fontFamily: 'var(--font-body)', fontSize: 14.5, marginBottom: 10,
              }}
            />
            <div className="interview-input" style={{ borderTop: 'none', paddingTop: 0, justifyContent: 'flex-end' }}>
              <button type="button" className="interview-mic" title="음성 답변은 다음 단계에서 지원됩니다" disabled>
                🎙
              </button>
              <button type="submit" className="btn btn--gold btn--sm">답변 저장하기</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
