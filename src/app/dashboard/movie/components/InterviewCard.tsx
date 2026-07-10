'use client';

type Props = {
  questions: string[];
  currentQuestion: number;
  answer: string;
  setAnswer: (value: string) => void;
  answers: string[];
  setAnswers: (value: string[]) => void;
  setCurrentQuestion: (value: number) => void;
};

export default function InterviewCard({
  questions,
  currentQuestion,
  answer,
  setAnswer,
  answers,
  setAnswers,
  setCurrentQuestion,
}: Props) {
  if (!questions.length) {
    return null;
  }

  async function handleNext() {
    if (!answer.trim()) {
      return;
    }

    const nextAnswers = [...answers];
    nextAnswers[currentQuestion] = answer;
    setAnswers(nextAnswers);

    try {
      const res = await fetch('/api/interview/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questions[currentQuestion],
          answer,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        alert('이야기를 저장하지 못했습니다.');
        return;
      }

      setAnswer('');

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }

      if (json.nextQuestion) {
        console.log('NEXT QUESTION:', json.nextQuestion);
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    }
  }

  const isLastQuestion = currentQuestion >= questions.length - 1;

  return (
    <div className="dash-card" style={{ marginTop: 24 }}>
      <p className="dash-card__label">사진에 얽힌 이야기 남기기</p>

      <h2
        style={{
          margin: '8px 0 10px',
          fontFamily: 'Noto Serif KR, serif',
          fontSize: 28,
          lineHeight: 1.35,
          color: 'var(--ink)',
        }}
      >
        이 사진을 보면 어떤 기억이 떠오르나요?
      </h2>

      <p
        style={{
          color: 'var(--ink-soft)',
          fontSize: 16,
          lineHeight: 1.7,
          marginTop: 0,
          marginBottom: 18,
        }}
      >
        아래 질문에 짧게 답해도 괜찮습니다. 남겨주신 이야기는 책과 추억 영상에
        담을 수 있는 소중한 재료가 됩니다.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: 18,
          borderRadius: 14,
          background: '#fffdf8',
          border: '1px solid rgba(182,137,47,.15)',
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.8,
          color: 'var(--ink)',
        }}
      >
        {questions[currentQuestion]}
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={5}
        placeholder="사진을 보며 떠오르는 이야기, 부모님께 들은 기억, 가족이 꼭 남기고 싶은 장면을 적어주세요."
        style={{
          width: '100%',
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,.15)',
          background: 'var(--paper)',
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          lineHeight: 1.7,
          resize: 'vertical',
        }}
      />

      <button
        className="btn btn-primary"
        style={{ marginTop: 20 }}
        onClick={handleNext}
      >
        {isLastQuestion ? '이야기 저장하기' : '다음 이야기로 넘어가기'}
      </button>
    </div>
  );
}