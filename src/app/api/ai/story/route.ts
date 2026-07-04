import { NextRequest, NextResponse } from "next/server";
import { generateStory } from "@/lib/ai/story/story-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const story = await generateStory({
      photos: body.photos ?? [],
      analysis: body.analysis ?? [],
      interviews: body.interviews ?? [],
    });

    return NextResponse.json(story);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Story generation failed.",
      },
      {
        status: 500,
      }
    );
  }
}