import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { ok: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          message: 'OPENAI_API_KEY가 설정되어 있지 않습니다.',
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
      text?: unknown;
      mode?: unknown;
    };

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const mode = typeof body.mode === 'string' ? body.mode : 'warm';

    if (!text) {
      return NextResponse.json(
        { ok: false, message: '다듬을 이야기를 입력해 주세요.' },
        { status: 400 },
      );
    }

    if (text.length > 3000) {
      return NextResponse.json(
        {
          ok: false,
          message: '한 번에 다듬을 수 있는 글은 3000자까지입니다.',
        },
        { status: 400 },
      );
    }

    const styleGuide = getStyleGuide(mode);

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            '당신은 달동네 출판사의 인생책 편집자입니다. 사용자가 남긴 기억을 과장하지 않고, 따뜻하고 자연스러운 책 문장으로 다듬습니다.',
        },
        {
          role: 'user',
          content: [
            '아래 글을 인생책에 들어갈 이야기 문장으로 다듬어 주세요.',
            '',
            '원칙:',
            '- 사실을 새로 지어내지 마세요.',
            '- 사용자의 말투와 감정을 보존하세요.',
            '- 너무 화려하거나 오글거리는 표현은 피하세요.',
            '- 문단은 2~4개 정도로 나눠 주세요.',
            '- 가족이 읽어도 자연스럽고 따뜻하게 써 주세요.',
            `- 문체 방향: ${styleGuide}`,
            '',
            '원문:',
            text,
          ].join('\n'),
        },
      ],
    });

    const editedText = response.output_text?.trim();

    if (!editedText) {
      return NextResponse.json(
        {
          ok: false,
          message: 'AI가 다듬은 결과를 만들지 못했습니다.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      editedText,
    });
  } catch (error) {
    console.error('[AI_EDIT_STORY_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'AI로 이야기를 다듬는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

function getStyleGuide(mode: string) {
  if (mode === 'short') {
    return '짧고 담백하게, 핵심만 정리';
  }

  if (mode === 'book') {
    return '책 원고처럼 문단감 있게 정리';
  }

  if (mode === 'letter') {
    return '가족에게 보내는 편지처럼 따뜻하게 정리';
  }

  return '따뜻하고 자연스럽게 정리';
}