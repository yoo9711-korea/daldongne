// src/app/dashboard/interview/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import InterviewClient from './InterviewClient';

const QUESTIONS = [
  '오늘은 첫 직장에 들어가던 날 이야기를 들려주실 수 있을까요?',
  '그때 가장 응원해준 사람은 누구였나요?',
  '지금 돌아보면, 그 시절의 나에게 해주고 싶은 말이 있나요?',
];

export default async function InterviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  const answers = await prisma.memory.findMany({
    where: {
      authorId: userId,
      type: 'TEXT',
      title: { startsWith: 'AI 인터뷰:' },
    },
    orderBy: { createdAt: 'asc' },
  });

  const answeredCount = answers.length;
  const isComplete = answeredCount >= QUESTIONS.length;
  const currentQuestion = isComplete ? null : QUESTIONS[answeredCount];

  async function submitAnswer(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user) redirect('/login');

    const answer = String(formData.get('answer') || '').trim();
    const question = String(formData.get('question') || '');
    if (!answer) return;

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

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">INTERVIEW</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>AI Interview</span>
      </div>

      <h1 className="dash-greeting">말로 들려주세요, 나머지는 AI가 정리합니다</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
        텍스트로 입력하거나, 🎙 버튼을 눌러 음성으로 답할 수 있습니다.
      </p>

      <InterviewClient
        answers={answers.map(a => ({
          id: a.id,
          title: a.title || '',
          description: a.description || '',
        }))}
        currentQuestion={currentQuestion}
        isComplete={isComplete}
        submitAnswer={submitAnswer}
      />
    </main>
  );
}