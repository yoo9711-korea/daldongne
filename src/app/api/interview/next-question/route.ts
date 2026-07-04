import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateNextQuestion } from "@/lib/ai/interview/question-engine";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const question = await generateNextQuestion({
      userName: session.user.name ?? "",
      photoAnalysis: body.photoAnalysis ?? "",
      previousQuestions: Array.isArray(body.previousQuestions)
        ? body.previousQuestions
        : [],
      previousAnswers: Array.isArray(body.previousAnswers)
        ? body.previousAnswers
        : [],
      maxQuestions:
        typeof body.maxQuestions === "number"
          ? body.maxQuestions
          : 20,
    });

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "다음 질문 생성 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}