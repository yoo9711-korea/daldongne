import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

async function generateCaptions(mode: string, photos: string[], customText: string, userId: string, openaiKey: string) {
  let caption1 = '지금 이 순간을 기억합니다.';
  let caption2 = '함께한 모든 시간이 소중합니다.';

  if (mode === 'A') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [
          { role: 'system', content: '달동네 출판사 감성 영상 작가입니다. 사진을 보고 따뜻한 한국어 문장 2개를 30자 이내로, 줄바꿈으로 구분해서만 출력하세요.' },
          { role: 'user', content: [
            { type: 'text', text: '이 사진들을 보고 감성 문장 2개를 만들어주세요.' },
            ...photos.map((url: string) => ({ type: 'image_url', image_url: { url, detail: 'low' } })),
          ]},
        ],
      }),
    });
    const data = await res.json();
    const lines = (data.choices?.[0]?.message?.content || '').split('\n').filter(Boolean);
    caption1 = lines[0] || caption1;
    caption2 = lines[1] || caption2;

  } else if (mode === 'B') {
    const parts = customText.split('\n').filter(Boolean);
    caption1 = parts[0] || customText || caption1;
    caption2 = parts[1] || caption2;

  } else if (mode === 'C') {
    const interviews = await prisma.memory.findMany({
      where: { authorId: userId, type: 'TEXT', title: { startsWith: 'AI 인터뷰:' } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    const text = interviews
  .map((i) => i.description ?? "")
  .join(" ");
    if (text) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 200,
          messages: [
            { role: 'system', content: '달동네 출판사 감성 영상 작가입니다. 인터뷰 내용으로 따뜻한 한국어 문장 2개를 30자 이내로, 줄바꿈으로 구분해서만 출력하세요.' },
            { role: 'user', content: `인터뷰:\n${text}\n\n감성 문장 2개를 만들어주세요.` },
          ],
        }),
      });
      const data = await res.json();
      const lines = (data.choices?.[0]?.message?.content || '').split('\n').filter(Boolean);
      caption1 = lines[0] || caption1;
      caption2 = lines[1] || caption2;
    }
  }

  return { caption1, caption2 };
}

function buildScenes(photos: string[], title: string, caption1: string, caption2: string, name: string) {
  return [
    {
      comment: '첫 번째 장면',
      duration: 5,
      elements: [
        { type: 'image', src: photos[0] || '', width: 1920, height: 1080, x: 0, y: 0, duration: 5,
          animations: [{ time: 'start', duration: 5, easing: 'linear', type: 'scale', 'start-scale': 1, 'end-scale': 1.05 }] },
        { type: 'shape', shape: 'rect', width: 1920, height: 320, x: 0, y: 760, 'fill-color': 'rgba(0,0,0,0.6)', duration: 5 },
        { type: 'text', text: title || '우리의 기억', width: 1720, height: 80, x: 100, y: 790,
          'font-family': 'Noto Sans KR', 'font-size': 44, 'font-weight': '700', 'fill-color': '#EFE6D3', duration: 5,
          animations: [{ time: 'start', duration: 1, easing: 'quadratic-out', type: 'slide', direction: 'up' }] },
        { type: 'text', text: caption1, width: 1720, height: 60, x: 100, y: 900,
          'font-family': 'Noto Sans KR', 'font-size': 30, 'fill-color': '#D9B872', duration: 5 },
      ],
    },
    {
      comment: '두 번째 장면',
      duration: 5,
      elements: [
        { type: 'image', src: photos[1] || photos[0] || '', width: 1920, height: 1080, x: 0, y: 0, duration: 5,
          animations: [{ time: 'start', duration: 5, easing: 'linear', type: 'scale', 'start-scale': 1.05, 'end-scale': 1 }] },
        { type: 'shape', shape: 'rect', width: 1920, height: 320, x: 0, y: 760, 'fill-color': 'rgba(0,0,0,0.6)', duration: 5 },
        { type: 'text', text: caption2, width: 1720, height: 100, x: 100, y: 820,
          'font-family': 'Noto Sans KR', 'font-size': 34, 'fill-color': '#EFE6D3', duration: 5,
          animations: [{ time: 'start', duration: 1, easing: 'quadratic-out', type: 'fade' }] },
      ],
    },
    {
      comment: '마무리 장면',
      duration: 4,
      elements: [
        { type: 'shape', shape: 'rect', width: 1920, height: 1080, x: 0, y: 0, 'fill-color': '#1A1611', duration: 4 },
        { type: 'text', text: name || '당신', width: 1720, height: 100, x: 100, y: 380,
          'font-family': 'Noto Sans KR', 'font-size': 60, 'font-weight': '700', 'fill-color': '#EFE6D3',
          'text-align': 'center', duration: 4,
          animations: [{ time: 'start', duration: 1.5, easing: 'quadratic-out', type: 'fade' }] },
        { type: 'text', text: '의 인생영상', width: 1720, height: 80, x: 100, y: 500,
          'font-family': 'Noto Sans KR', 'font-size': 38, 'fill-color': '#D9B872', 'text-align': 'center', duration: 4 },
        { type: 'text', text: '달동네 출판사', width: 1720, height: 50, x: 100, y: 960,
          'font-family': 'Noto Sans KR', 'font-size': 24, 'fill-color': '#8A7E6E', 'text-align': 'center', duration: 4 },
      ],
    },
  ];
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { mode, photos, title, customText, name } = await request.json();

  const { caption1, caption2 } = await generateCaptions(
    mode,
    photos,
    customText,
    session.user.id,
    process.env.OPENAI_API_KEY || ''
  );

  const scenes = buildScenes(photos, title, caption1, caption2, name);

  const j2vRes = await fetch('https://api.json2video.com/v2/movies', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.JSON2VIDEO_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resolution: 'full-hd', quality: 80, scenes }),
  });

  const j2vData = await j2vRes.json();

  if (!j2vRes.ok) {
    return NextResponse.json({ error: '영상 생성 실패', detail: j2vData }, { status: 502 });
  }

  const book = await prisma.book.create({
    data: {
      type: 'AI_MOVIE',
      title: title || '달동네 인생영상',
      status: 'IN_PRODUCTION',
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ success: true, movieId: j2vData.movie, bookId: book.id });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get('movieId');
  if (!movieId) {
    return NextResponse.json({ error: 'movieId가 없습니다.' }, { status: 400 });
  }

  const res = await fetch(`https://api.json2video.com/v2/movies?project=${movieId}`, {
    headers: { 'x-api-key': process.env.JSON2VIDEO_API_KEY || '' },
  });

  const data = await res.json();
  return NextResponse.json(data);
}