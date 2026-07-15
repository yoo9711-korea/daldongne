import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

type DraftBookType =
  | 'PARENT_LIFE'
  | 'FAMILY'
  | 'BABY'
  | 'COUPLE'
  | 'TRAVEL';

type DraftTone = 'warm' | 'plain' | 'letter' | 'autobiography';

type DraftLength = 'short' | 'medium' | 'long';

type DraftPrismaBookType =
  | 'LIFE_BOOK'
  | 'FAMILY_BOOK'
  | 'BABY_BOOK'
  | 'COUPLE_BOOK'
  | 'TRAVEL_BOOK';

const bookTypeInstructionMap: Record<DraftBookType, string> = {
  PARENT_LIFE:
    '부모님 인생책입니다. 한 사람의 삶을 존중하며, 자녀가 부모님의 시간을 오래 간직할 수 있도록 따뜻하고 품격 있게 구성하세요.',
  FAMILY:
    '가족 이야기책입니다. 가족이 함께 보낸 시간, 관계, 추억, 서로에게 남긴 마음을 중심으로 구성하세요.',
  BABY:
    '성장 기록책입니다. 아이의 성장 과정, 가족의 기다림, 작은 변화와 기쁨을 중심으로 구성하세요.',
  COUPLE:
    '부부 이야기책입니다. 두 사람이 함께 걸어온 시간, 만남, 고마움, 위로, 약속을 중심으로 구성하세요.',
  TRAVEL:
    '여행 기록책입니다. 장소보다 그곳에서 느낀 감정, 함께한 사람, 기억에 남은 순간을 중심으로 구성하세요.',
};

const toneInstructionMap: Record<DraftTone, string> = {
  warm:
    '문체는 따뜻하고 서정적으로 쓰세요. 읽는 사람이 마음이 부드러워지는 느낌이어야 합니다.',
  plain:
    '문체는 담백하고 차분하게 쓰세요. 과장된 표현보다 진심이 느껴지는 문장을 사용하세요.',
  letter:
    '문체는 편지를 쓰듯 다정하게 쓰세요. 누군가에게 마음을 전하는 느낌이 살아야 합니다.',
  autobiography:
    '문체는 자서전처럼 쓰세요. 한 사람의 삶을 돌아보는 흐름으로 품격 있게 구성하세요.',
};

const lengthInstructionMap: Record<DraftLength, string> = {
  short:
    '원고는 짧은 소책자 분량으로 구성하세요. 핵심 장면을 중심으로 간결하게 쓰세요.',
  medium:
    '원고는 보통 분량으로 구성하세요. 사진과 이야기를 균형 있게 반영하세요.',
  long:
    '원고는 긴 원고 분량으로 구성하세요. 장면과 감정을 충분히 풀어내고, 각 이야기를 자세히 연결하세요.',
};

function normalizeBookType(value: unknown): DraftBookType {
  if (
    value === 'PARENT_LIFE' ||
    value === 'FAMILY' ||
    value === 'BABY' ||
    value === 'COUPLE' ||
    value === 'TRAVEL'
  ) {
    return value;
  }

  return 'PARENT_LIFE';
}

function normalizeTone(value: unknown): DraftTone {
  if (
    value === 'warm' ||
    value === 'plain' ||
    value === 'letter' ||
    value === 'autobiography'
  ) {
    return value;
  }

  return 'warm';
}

function normalizeLength(value: unknown): DraftLength {
  if (value === 'short' || value === 'medium' || value === 'long') {
    return value;
  }

  return 'medium';
}

function mapDraftBookTypeToPrismaBookType(
  value: DraftBookType,
): DraftPrismaBookType {
  if (value === 'FAMILY') {
    return 'FAMILY_BOOK';
  }

  if (value === 'BABY') {
    return 'BABY_BOOK';
  }

  if (value === 'COUPLE') {
    return 'COUPLE_BOOK';
  }

  if (value === 'TRAVEL') {
    return 'TRAVEL_BOOK';
  }

  return 'LIFE_BOOK';
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
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

    const userId = session.user.id;
    const body = await request.json().catch(() => null);

    const selectedMemoryIds =
      body && Array.isArray(body.selectedMemoryIds)
        ? body.selectedMemoryIds.filter((id: unknown): id is string => {
            return typeof id === 'string' && id.trim().length > 0;
          })
        : [];

    const targetBookId =
      body && typeof body.targetBookId === 'string'
        ? body.targetBookId.trim()
        : '';
    const bookType = normalizeBookType(body?.bookType);
    const tone = normalizeTone(body?.tone);
    const length = normalizeLength(body?.length);
    const prismaBookType = mapDraftBookTypeToPrismaBookType(bookType);

    const bookDirectionPrompt = [
      '이번 책의 제작 방향은 다음과 같습니다.',
      '',
      `책 종류: ${bookTypeInstructionMap[bookType]}`,
      `문체: ${toneInstructionMap[tone]}`,
      `원고 길이: ${lengthInstructionMap[length]}`,
      '',
      '위 제작 방향을 반드시 반영해서 원고를 작성하세요.',
    ].join('\n');

    const memories = await prisma.memory.findMany({
      where: {
        authorId: userId,
        ...(selectedMemoryIds.length > 0
          ? {
              id: {
                in: selectedMemoryIds,
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const sourceMemories = memories.filter((memory) => {
      const title = memory.title?.trim() || '';

      return !(
        String(memory.type) === 'TEXT' && isLegacyAiInterviewTitle(title)
      );
    });

    const photos = sourceMemories.filter((memory) => {
      return String(memory.type) === 'PHOTO' && Boolean(memory.fileUrl);
    });

    const textStories = sourceMemories.filter((memory) => {
      const description = memory.description?.trim() || '';

      return String(memory.type) === 'TEXT' && description.length >= 10;
    });

    const photoStories = photos.filter((memory) => {
      const description = memory.description?.trim() || '';

      return description.length >= 10;
    });

    const totalStoryCount = textStories.length + photoStories.length;

    if (photos.length < 3) {
      return NextResponse.json(
        {
          ok: false,
          message: '책 원고를 만들려면 사진이 최소 3장 이상 필요합니다.',
        },
        { status: 400 },
      );
    }

    const storySupportPrompt =
      totalStoryCount >= 3
        ? '이야기 자료가 충분합니다. 사용자가 남긴 사진 이야기와 자유 이야기를 시간순 흐름 안에 자연스럽게 녹여 쓰세요.'
        : [
            '이야기 자료가 아직 부족합니다.',
            '사진 제목, 기록일, 짧은 설명을 바탕으로 조심스럽게 원고 초안을 작성하세요.',
            '단, 사용자가 쓰지 않은 구체적인 사건, 감정, 대화, 장소 정보는 사실처럼 지어내지 마세요.',
            '정보가 부족한 사진은 “그날의 기억은 아직 짧게 남아 있지만”, “사진 한 장이 그때의 시간을 조용히 보여줍니다”처럼 자연스럽게 연결하세요.',
            '원고는 완성본처럼 단정하기보다, 사용자가 나중에 이야기를 더 붙일 수 있는 따뜻한 초안처럼 작성하세요.',
          ].join('\n');

    const timelineSourceMemories = [...photos, ...textStories].sort((a, b) => {
      return (
        getMemoryDateTime(a.occurredAt || a.createdAt) -
        getMemoryDateTime(b.occurredAt || b.createdAt)
      );
    });

    const timelineMaterials = timelineSourceMemories
      .slice(0, 60)
      .map((memory, index) => {
        const isPhoto = String(memory.type) === 'PHOTO';
        const description = memory.description?.trim() || '';

        return [
          `시간 자료 ${index + 1}`,
          `자료 종류: ${isPhoto ? '사진 기록' : '글 기록'}`,
          `기록일 참고: ${formatDate(memory.occurredAt || memory.createdAt)}`,
          `제목: ${memory.title || '제목 없음'}`,
          `내용: ${
            description ||
            '사용자가 아직 이 자료에 대한 구체적인 이야기를 남기지 않았습니다.'
          }`,
        ].join('\n');
      })
      .join('\n\n');

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content:
            '당신은 달동네 출판사의 인생책 편집장입니다. 사용자가 남긴 사진과 이야기를 바탕으로, 시간의 흐름을 따라 읽히는 따뜻한 책 원고를 작성합니다. 자료에 없는 사실은 절대 지어내지 않습니다.',
        },
        {
          role: 'user',
          content: [
            '아래 자료를 바탕으로 인생책 원고 초안을 작성해 주세요.',
            '',
            bookDirectionPrompt,
            '',
            storySupportPrompt,
            '',
            '가장 중요한 원칙:',
            '- 원고는 반드시 시간의 흐름을 따라 작성하세요.',
            '- 자료를 “사진 자료”, “사진에 붙인 이야기”, “자유 이야기”처럼 구분해서 설명하지 마세요.',
            '- 아래 자료는 이미 시간순으로 정리되어 있습니다. 가장 오래된 기록에서 시작해 최근 기록으로 자연스럽게 이어가세요.',
            '- 같은 사진의 제목과 설명이 반복되더라도 원고에서는 한 번의 장면으로 자연스럽게 합쳐 쓰세요.',
            '- 같은 사건, 같은 감정, 같은 설명을 여러 장에서 반복하지 마세요.',
            '- 자료에 직접 적혀 있지 않은 과거 사건, 가족관계, 날짜, 나이, 생일, 돌잔치, 직업, 장소, 대화, 감정은 절대 만들지 마세요.',
            '- 단, 사용자가 사진 이야기나 자유 이야기에 직접 적은 과거 사건, 가족관계, 날짜, 장소, 감정은 사용할 수 있습니다.',
            '- 사용자가 직접 적은 과거 기억은 버리지 말고, 현재 사진이 불러온 회상으로 자연스럽게 연결하세요.',
            '- 현재 사진에 담긴 직접 장면과, 그 사진을 보며 떠올린 과거 회상은 반드시 구분해서 작성하세요.',
            '- 과거 회상은 “이 사진을 보니 오래전 그날이 떠오릅니다”, “그 장면은 또 다른 시간을 떠올리게 합니다”처럼 연결하세요.',
            '- 현재 사진의 시간축과 과거 회상을 하나의 실제 연속 사건처럼 섞지 마세요.',
            '- 사용자가 적은 과거 기억을 사용할 때도, 원문에 없는 세부 묘사나 감정은 새로 덧붙이지 마세요.',
            '- “딸”, “아들”, “막내”, “부모님”, “아내”, “남편” 같은 관계 호칭은 사용자가 직접 적은 경우에만 사용하세요.',
            '- 기록일 참고는 실제 촬영일이 아니라 업로드일일 수 있습니다. 실제 날짜처럼 단정하지 마세요.',
            '- 정보가 부족하면 그 빈자리를 소설처럼 채우지 말고, “아직 더 적어볼 수 있는 기억”으로 부드럽게 남겨두세요.',
            '- 번호 목록처럼 딱딱하게 정리하지 말고, 책에 들어가는 산문 형태로 작성하세요.',
            '',
            '출력 형식:',
            '제목: ...',
            '부제: ...',
            '요약: ...',
            '표지문구: ...',
            '본문:',
            '...',
            '',
           '본문 구성 원칙:',
           '- 본문은 숫자 목록이 아니라 시간축 이야기로 작성하세요.',
           '- 시간축은 “사진에 담긴 현재 장면”을 중심으로 잡으세요.',
           '- 사용자가 적은 과거 기억은 현재 장면 사이에 끼워 넣지 말고, 별도의 회상 문단으로 자연스럽게 연결하세요.',
           '- 소제목은 숫자 대신 ## 형식으로 작성하세요.',
           '- 예: ## 프롤로그 — 이 기록을 남기는 이유',
           '- 예: ## 시험장 앞에서 시작된 시간',
           '- 예: ## 사진이 불러온 오래전 기억',
           '- 예: ## 다시 오늘의 장면으로',
           '- 예: ## 남겨질 이야기 — 앞으로 전하고 싶은 마음',
           '- 예: ## 에필로그 — 다시 꺼내 볼 시간',
           '- 단, 실제 자료가 적으면 장 수를 억지로 늘리지 말고 자연스럽게 줄이세요.',
            '',
            '시간순 통합 자료:',
            timelineMaterials || '사용 가능한 자료가 없습니다.',
          ].join('\n'),
        },
      ],
    });

    const aiText = response.output_text?.trim();

    if (!aiText) {
      return NextResponse.json(
        {
          ok: false,
          message: 'AI가 책 원고를 만들지 못했습니다.',
        },
        { status: 500 },
      );
    }

    const parsed = parseBookDraft(aiText);

            const existingBook = targetBookId
      ? await prisma.book.findFirst({
          where: {
            id: targetBookId,
            authorId: userId,
            status: 'DRAFT',
          },
        })
      : null;

        if (targetBookId && !existingBook) {
      return NextResponse.json(
        {
          ok: false,
          message:
            '다시 정리할 책을 찾을 수 없습니다. 이미 제작 중이거나 삭제된 책일 수 있습니다.',
        },
        { status: 404 },
      );
    }

    const bookData = {
      title: parsed.title || '우리들의 이야기',
      subtitle: parsed.subtitle || '사진과 이야기로 엮은 인생책',
      summary:
        parsed.summary ||
        '사진과 이야기를 바탕으로 정리한 책 원고 초안입니다.',
      content: parsed.content || aiText,
      coverText:
        parsed.coverText ||
        '사진은 순간을 남기고, 이야기는 시간을 남깁니다.',
      pageCount: estimatePageCount(parsed.content || aiText),
      basedPhotoCount: photos.length,
      basedStoryCount: totalStoryCount,
    };

       const book = await prisma.$transaction(
      async (tx) => {
        const savedBook = existingBook
          ? await tx.book.update({
              where: {
                id: existingBook.id,
              },
              data: bookData,
            })
          : await tx.book.create({
              data: {
                type: prismaBookType,
                status: 'DRAFT',
                authorId: userId,
                ...bookData,
              },
            });

        await tx.bookMemory.deleteMany({
          where: {
            bookId: savedBook.id,
          },
        });

        await tx.bookMemory.createMany({
          data: timelineSourceMemories.map(
            (memory, index) => ({
              bookId: savedBook.id,
              memoryId: memory.id,
              order: index,
            }),
          ),
          skipDuplicates: true,
        });

        return savedBook;
      },
    );

    return NextResponse.json({
      ok: true,
      bookId: book.id,
      message: 'AI가 책 원고 초안을 만들었습니다.',
    });
               
  } catch (error) {
    console.error('[AI_BOOK_CREATE_DRAFT_ERROR]', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'AI 책 원고를 만드는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}

function isLegacyAiInterviewTitle(title: string) {
  return title.startsWith('AI 인터뷰') || title.includes('AI 인터뷰 -');
}

function parseBookDraft(text: string) {
  const title = pickLineValue(text, '제목');
  const subtitle = pickLineValue(text, '부제');
  const summary = pickLineValue(text, '요약');
  const coverText = pickLineValue(text, '표지문구');

  const bodyIndex = text.indexOf('본문:');
  const content =
    bodyIndex >= 0 ? text.slice(bodyIndex + '본문:'.length).trim() : text.trim();

  return {
    title,
    subtitle,
    summary,
    coverText,
    content,
  };
}

function pickLineValue(text: string, label: string) {
  const lines = text.split('\n');

  const line = lines.find((item) => {
    return item.trim().startsWith(`${label}:`);
  });

  if (!line) {
    return '';
  }

  return line.replace(`${label}:`, '').trim();
}

function estimatePageCount(content: string) {
  const length = content.replace(/\s/g, '').length;

  if (length <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(length / 650));
}

function getMemoryDateTime(date: Date | null | undefined) {
  if (!date) {
    return 0;
  }

  return date.getTime();
}

function formatDate(date: Date | null) {
  if (!date) {
    return '날짜 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}