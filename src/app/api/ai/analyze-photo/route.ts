import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const PHOTO_ANALYSIS_PROMPT = `
당신은 "달동네"의 추억 기록 AI입니다.

목표는 사진을 단순히 설명하는 것이 아니라,
사용자가 잊고 있던 추억을 자연스럽게 떠올릴 수 있도록 돕는 것입니다.

반드시 한국어만 사용하세요.

사진에서 확실하지 않은 내용은 추측하지 말고
"추정"이라고 표현하세요.

다음 JSON 형식만 반환하세요.

{
  "emotion":"행복",
  "people":"가족",
  "place":"공원",
  "mood":"따뜻한 오후",
  "description":"...",
  "questions":[
    "...",
    "...",
    "...",
    "...",
    "..."
  ]
}
`;

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    emotion: {
      type: "string",
    },
    people: {
      type: "string",
    },
    place: {
      type: "string",
    },
    mood: {
      type: "string",
    },
    description: {
      type: "string",
    },
    questions: {
      type: "array",
      items: {
        type: "string",
      },
      minItems: 5,
      maxItems: 5,
    },
  },
  required: [
    "emotion",
    "people",
    "place",
    "mood",
    "description",
    "questions",
  ],
};

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    if (!body?.imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "imageUrl이 필요합니다.",
        },
        {
          status: 400,
        }
      );
    }

    const origin = new URL(req.url).origin;

    const imageResponse = await fetch(origin + body.imageUrl, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "이미지를 불러올 수 없습니다.",
        },
        {
          status: 400,
        }
      );
    }

    const mime =
      imageResponse.headers.get("content-type") ?? "image/jpeg";

    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    const result = await openai.responses.create({
      model: "gpt-4.1-mini",
      text: {
        format: {
          type: "json_schema",
          name: "photo_analysis",
          schema: ANALYSIS_SCHEMA,
          strict: true,
        },
      },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: PHOTO_ANALYSIS_PROMPT,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
  type: "input_image",
  image_url: `data:${mime};base64,${buffer.toString("base64")}`,
  detail: "auto",
},
          ],
        },
      ],
    });

    const json = JSON.parse(result.output_text);

    return NextResponse.json({
      success: true,
      result: json,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "사진 분석 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}