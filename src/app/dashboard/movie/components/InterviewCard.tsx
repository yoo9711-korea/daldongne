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
  if (!questions.length) return null;

  async function handleNext() {
    if (!answer.trim()) return;

    const nextAnswers = [...answers];
    nextAnswers[currentQuestion] = answer;
    setAnswers(nextAnswers);

    try {
      const res = await fetch("/api/interview/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questions[currentQuestion],
          answer,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        alert("답변 저장에 실패했습니다.");
        return;
      }

      setAnswer("");

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }

      // 다음 질문은 다음 단계에서 MovieClient 상태와 연결합니다.
      if (json.nextQuestion) {
        console.log("NEXT QUESTION :", json.nextQuestion);
      }
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  }

  return (
    <div
      className="dash-card"
      style={{ marginTop: 24 }}
    >
      <p className="dash-card__label">
        AI 인터뷰
      </p>

      <div
        style={{
          marginTop: 20,
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.8,
        }}
      >
        {questions[currentQuestion]}
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={5}
        placeholder="답변을 입력하세요."
        style={{
          width: "100%",
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,.15)",
          resize: "vertical",
        }}
      />

      <button
        className="btn btn-primary"
        style={{ marginTop: 20 }}
        onClick={handleNext}
      >
        다음 질문
      </button>
    </div>
  );
}