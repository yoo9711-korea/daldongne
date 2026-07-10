// src/app/dashboard/capsule/page.tsx
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import CapsuleClient from './CapsuleClient';

export default async function CapsulePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  await prisma.timeCapsule.updateMany({
    where: {
      authorId: session.user.id,
      status: 'LOCKED',
      openAt: { lte: new Date() },
    },
    data: {
      status: 'OPENED',
      openedAt: new Date(),
    },
  });

  const capsules = await prisma.timeCapsule.findMany({
    where: {
      authorId: session.user.id,
    },
    orderBy: {
      openAt: 'asc',
    },
  });

  const locked = capsules
    .filter((capsule) => capsule.status === 'LOCKED')
    .map((capsule) => ({
      id: capsule.id,
      title: capsule.title,
      openAt: capsule.openAt.toISOString(),
      isPrivate: capsule.isPrivate,
      daysLeft: Math.max(
        0,
        Math.ceil((capsule.openAt.getTime() - Date.now()) / 86400000),
      ),
    }));

  const opened = capsules
    .filter((capsule) => capsule.status === 'OPENED')
    .map((capsule) => ({
      id: capsule.id,
      title: capsule.title,
      message: capsule.message,
      openAt: capsule.openAt.toISOString(),
      openedAt: capsule.openedAt?.toISOString() ?? null,
      isPrivate: capsule.isPrivate,
    }));

  async function createCapsule(formData: FormData): Promise<void> {
    'use server';

    const session = await auth();

    if (!session?.user?.id) {
      redirect('/login');
    }

    const title = String(formData.get('title') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const openAt = String(formData.get('openAt') || '');
    const isPrivate = formData.get('isPrivate') === 'true';

    if (!title || !message || !openAt) {
      return;
    }

    await prisma.timeCapsule.create({
      data: {
        title,
        message,
        openAt: new Date(openAt),
        isPrivate,
        authorId: session.user.id,
      },
    });

    revalidatePath('/dashboard/capsule');
  }

  return (
    <main className="page">
      <div className="runninghead">
        <span className="runninghead__chapter">LETTER</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>미래 편지함</span>
      </div>

      <h1 className="dash-greeting">가족에게 전할 말을 남깁니다</h1>

      <p
        style={{
          color: 'var(--ink-soft)',
          marginBottom: 40,
          fontSize: 18,
          lineHeight: 1.75,
          maxWidth: 760,
        }}
      >
        지금 전하지 못한 마음, 훗날 가족이 꼭 읽었으면 하는 말,
        인생책에 함께 남기고 싶은 편지를 정해진 날까지 보관합니다.
        시간이 지나 열리는 편지는 가족에게 더 깊은 추억이 될 수 있습니다.
      </p>

      <CapsuleClient
        locked={locked}
        opened={opened}
        createCapsule={createCapsule}
      />
    </main>
  );
}