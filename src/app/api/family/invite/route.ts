import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const { familyId, email, role } = await request.json();

  if (!familyId || !email) {
    return NextResponse.json({ error: '필수 정보가 없습니다.' }, { status: 400 });
  }

  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: session.user.id } },
    include: { family: true },
  });

  if (!membership || membership.role !== 'OWNER') {
    return NextResponse.json({ error: '초대 권한이 없습니다.' }, { status: 403 });
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const invitation = await prisma.familyInvitation.create({
    data: { familyId, email, role: role || 'VIEWER', expiresAt },
  });

  const inviteUrl = `${process.env.AUTH_URL}/family/accept?token=${invitation.token}`;
  const familyName = membership.family.name;
  const inviterName = session.user.name || session.user.email;

  // Resend 클라이언트를 함수 안에서 초기화 (빌드 시점 오류 방지)
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: '달동네 출판사 <onboarding@resend.dev>',
    to: email,
    subject: `${inviterName}님이 "${familyName}" 가족 공간에 초대했습니다`,
    html: `
      <div style="max-width:560px;margin:40px auto;font-family:sans-serif;">
        <div style="background:#1A1611;padding:32px;text-align:center;">
          <h1 style="color:#EFE6D3;font-size:22px;margin:0;">달동네 출판사</h1>
        </div>
        <div style="padding:40px 32px;background:#F8F1E2;">
          <h2 style="color:#221C16;">가족 공간 초대장</h2>
          <p style="color:#5C5246;line-height:1.7;">
            <strong>${inviterName}</strong>님이 <strong>"${familyName}"</strong> 가족 공간에 초대했습니다.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${inviteUrl}" style="background:#B6892F;color:#1A1611;padding:14px 32px;border-radius:2px;text-decoration:none;font-weight:600;">
              초대 수락하기
            </a>
          </div>
          <p style="color:#8A7E6E;font-size:13px;">이 링크는 48시간 후 만료됩니다.</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}