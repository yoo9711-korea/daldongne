import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateNextQuestion } from "@/lib/ai/interview/question-engine";

const INTERVIEW_PREFIX = "AI 인터뷰 - ";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    const body = await req.json();

    const memory = await prisma.memory.create({
      data: {
        authorId: session.user.id,
        type: "TEXT",
        title: `${INTERVIEW_PREFIX}${body.question}`,
        description: body.answer,
      },
    });

    const previous = await prisma.memory.findMany({
      where: {
        authorId: session.user.id,
        type: "TEXT",
        title: {
          startsWith: INTERVIEW_PREFIX,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const previousQuestions = previous.map((item) =>
  (item.title ?? "").replace(INTERVIEW_PREFIX, "")
   );

    const previousAnswers = previous.map(
      (item) => item.description ?? ""
    );

    const nextQuestion = await generateNextQuestion({
      userName: session.user.name ?? "",
      previousQuestions,
      previousAnswers,
    });

    return NextResponse.json({
      success: true,
      memory,
      nextQuestion,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}