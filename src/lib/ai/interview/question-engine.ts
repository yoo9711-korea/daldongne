import OpenAI from "openai";

export interface InterviewContext {
  userName?: string;
  photoAnalysis?: string;
  previousQuestions: string[];
  previousAnswers: string[];
  maxQuestions?: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateNextQuestion(
  context: InterviewContext
): Promise<string> {
  const maxQuestions = context.maxQuestions ?? 20;

  const history = context.previousQuestions
    .map((q, i) => {
      const answer = context.previousAnswers[i] ?? "";
      return `Q${i + 1}. ${q}\nA${i + 1}. ${answer}`;
    })
    .join("\n\n");

  const prompt = `
당신은 달동네(Memory Platform)의 라이프 인터뷰어입니다.

목표는 사용자의 인생을 기록하기 위한 인터뷰를 진행하는 것입니다.

규칙

1. 반드시 한국어만 사용
2. 한 번에 질문은 하나만
3. 이미 했던 질문은 반복하지 않는다.
4. 이전 답변을 기반으로 자연스럽게 이어간다.
5. 감정을 이끌어내는 질문을 우선한다.
6. 부모, 가족, 친구, 꿈, 실패, 감사, 후회 등을 적절히 포함한다.
7. 질문 길이는 40자 이내.

사용자 이름
${context.userName ?? "사용자"}

사진 분석
${context.photoAnalysis ?? "없음"}

현재까지 인터뷰

${history}

현재 질문 수 : ${context.previousQuestions.length}/${maxQuestions}

다음 질문 하나만 출력하세요.
`;

  const response = await openai.responses.create({
    model: "gpt-5.5",
    input: prompt,
  });

  return response.output_text.trim();
}