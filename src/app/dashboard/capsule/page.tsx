import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import CapsuleClient from './CapsuleClient';

export default async function CapsulePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  await prisma.timeCapsule.updateMany({
    where: {
      authorId: session.user.id,
      status: 'LOCKED',
      openAt: { lte: new Date() },
    },
    data: { status: 'OPENED', openedAt: new Date() },
  });

 const capsules = await prisma.timeCapsule.findMany({
  where: { authorId: session.user.id },
  orderBy: { openAt: 'asc' },
});

const locked = capsules
  .filter(c => c.status === 'LOCKED')
  .map(c => ({
    id: c.id,
    title: c.title,
    openAt: c.openAt.toISOString(),
    isPrivate: c.isPrivate,
    daysLeft: Math.ceil((c.openAt.getTime() - Date.now()) / 86400000),
  }));
  const opened = capsules
    .filter(c => c.status === 'OPENED')
    .map(c => ({
      id: c.id,
      title: c.title,
      message: c.message,
      openAt: c.openAt.toISOString(),
      openedAt: c.openedAt?.toISOString() ?? null,
      isPrivate: c.isPrivate,
    }));

  async function createCapsule(formData: FormData): Promise<void> {
    'use server';
    const session = await auth();
    if (!session?.user) return;

    const title = String(formData.get('title') || '').trim();
    const message = String(formData.get('message') || '').trim();
    const openAt = String(formData.get('openAt') || '');
    const isPrivate = formData.get('isPrivate') === 'true';

    if (!title || !message || !openAt) return;

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
        <span className="runninghead__chapter">TIME CAPSULE</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>타임캡슐</span>
      </div>
      <h1 className="dash-greeting">미래의 나에게, 또는 가족에게</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 40 }}>
        지금 이 순간을 봉인해두세요. 정해진 날이 되면 자동으로 공개됩니다.
      </p>
      <CapsuleClient
        locked={locked}
        opened={opened}
        createCapsule={createCapsule}
      />
    </main>
  );
}