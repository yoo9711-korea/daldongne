// src/app/api/transcribe/route.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const formData = await request.formData();
  const audio = formData.get('audio') as Blob;

  if (!audio) {
    return NextResponse.json({ error: '음성 파일이 없습니다.' }, { status: 400 });
  }

  // OpenAI Whisper로 음성 → 텍스트 변환
  const whisperForm = new FormData();
  whisperForm.append('file', audio, 'recording.webm');
  whisperForm.append('model', 'whisper-1');
  whisperForm.append('language', 'ko'); // 한국어 우선 인식

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: whisperForm,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Whisper error:', err);
    return NextResponse.json({ error: 'Whisper 변환 실패' }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ text: data.text });
}