import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';
import InterviewClient from './InterviewClient';
import StoryPhotoUploadBox from '@/components/interview/StoryPhotoUploadBox';
import DeleteMemoryButton from '@/components/memory/DeleteMemoryButton';
import EditMemoryButton from '@/components/memory/EditMemoryButton';
import PageGuideBox from '@/components/guide/PageGuideBox';

export default async function InterviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [answers, storyPhotos] = await Promise.all([
    prisma.memory.findMany({
      where: {
        authorId: userId,
        type: 'TEXT',
        OR: [
          {
            title: {
              startsWith: '이야기:',
            },
          },
          {
            title: {
              startsWith: 'AI 인터뷰:',
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),

    prisma.memory.findMany({
      where: {
        authorId: userId,
        type: 'PHOTO',
        fileUrl: {
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
    }),
  ]);

  async function submitAnswer(formData: FormData) {
    'use server';

    const session = await auth();

    if (!session?.user?.id) {
      redirect('/login');
    }

    const answer = String(formData.get('answer') || '').trim();
    const question = String(formData.get('question') || '').trim();

    if (!answer) {
      return;
    }

    const title = question || '우리들의 자유 이야기';

    await prisma.memory.create({
      data: {
        type: 'TEXT',
        title: `이야기: ${title.slice(0, 40)}`,
        description: answer,
        authorId: session.user.id,
        occurredAt: new Date(),
      },
    });

    revalidatePath('/dashboard/interview');
    revalidatePath('/dashboard/book');
    revalidatePath('/dashboard/library');
  }

  return (
    <main className="page" style={gridPaperPageStyle()}>
      <div className="runninghead">
        <span className="runninghead__chapter">STORY</span>
        <span className="runninghead__rule"></span>
        <span style={{ color: 'var(--ink-soft)' }}>이야기 남기기</span>
      </div>

      <h1 className="dash-greeting">우리들의 이야기를 기록합니다</h1>

      <p
        style={{
          color: 'var(--ink-soft)',
          marginBottom: 32,
          fontSize: 18,
          lineHeight: 1.75,
          maxWidth: 820,
        }}
      >
        사진과 함께 남기고 싶은 기억, 사진 없이도 오래 간직하고 싶은 이야기를
        기록합니다. AI는 내용을 대신 지어내는 것이 아니라, 사용자가 남긴 문장을
        책에 어울리는 문장으로 다듬는 역할을 합니다.
      </p>

            <PageGuideBox
        label="처음이라면 여기부터 시작하세요"
        title="사진을 올리고, 사진 속 이야기를 남기는 공간입니다"
        description="좋은 글을 쓰려고 애쓰지 않아도 괜찮습니다. 사진을 보며 떠오르는 날짜, 장소, 사람, 짧은 기억만 남겨도 나중에 책 원고의 중요한 재료가 됩니다."
        steps={[
          '책에 남기고 싶은 사진을 올립니다.',
          '사진 제목과 기억 날짜를 입력합니다.',
          '사진 속에 담긴 이야기를 짧게 적습니다.',
          '필요하면 AI로 글을 다듬습니다.',
          '올린 사진과 이야기는 나중에 수정하거나 삭제할 수 있습니다.',
          '자료가 모이면 책 원고 만들기로 이동합니다.',
        ]}
        note="사진을 많이 올리는 것보다 사진마다 짧은 이야기를 함께 남기는 것이 더 좋은 인생책을 만드는 데 도움이 됩니다."
      />

      <StoryPhotoUploadBox />

      <section
        style={{
          marginTop: 28,
          padding: 28,
          borderRadius: 30,
          border: '1px solid #e4cda3',
          background: '#fffaf0',
          boxShadow: '0 14px 34px rgba(80, 55, 20, 0.08)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 900,
            color: '#9a6a24',
          }}
        >
          사진과 함께 남긴 이야기
        </p>

        <h2
          style={{
            margin: '8px 0 0',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 30,
            lineHeight: 1.35,
            letterSpacing: '-0.04em',
            color: '#24170f',
          }}
        >
          사진에 붙인 이야기를 다시 확인합니다
        </h2>

        {storyPhotos.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 18,
              marginTop: 22,
            }}
          >

           {storyPhotos.map((photo) => (
  <article
    key={photo.id}
    style={{
      overflow: 'hidden',
      borderRadius: 24,
      border: '1px solid #ead7b7',
      background: '#f7eddc',
    }}
  >
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 190,
        background: '#eadcc5',
      }}
    >
      <Image
        src={`/api/blob/${photo.id}`}
        alt={photo.title || '이야기 사진'}
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 260px"
        style={{
          objectFit: 'cover',
        }}
      />
    </div>

    <div
      style={{
        padding: 18,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 900,
          color: '#24170f',
        }}
      >
        {photo.title || '이야기 사진'}
      </p>

      <p
        style={{
          margin: '10px 0 0',
          whiteSpace: 'pre-line',
          fontSize: 14,
          lineHeight: 1.75,
          color: '#5f4a35',
        }}
      >
        {photo.description || '아직 이 사진에 대한 이야기가 없습니다.'}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 14,
        }}
      >
        <EditMemoryButton
          memoryId={photo.id}
          initialTitle={photo.title || ''}
          initialDescription={photo.description || ''}
          label="사진 이야기 수정"
        />

        <DeleteMemoryButton memoryId={photo.id} label="사진 삭제" />
      </div>
    </div>
  </article>
))}            

          </div>
        ) : (
          <p
            style={{
              margin: '18px 0 0',
              fontSize: 15,
              lineHeight: 1.75,
              color: '#6b5a46',
            }}
          >
            아직 사진과 함께 남긴 이야기가 없습니다. 위에서 사진을 올리고
            이야기를 적어보세요.
          </p>
        )}
      </section>

      <InterviewClient
        answers={answers.map((answer) => ({
          id: answer.id,
          title: answer.title || '',
          description: answer.description || '',
        }))}
        submitAnswer={submitAnswer}
      />
    </main>
  );
}

function gridPaperPageStyle() {
  return {
    minHeight: '100vh',
    backgroundColor: '#f7eddc',
    backgroundImage: `
      linear-gradient(rgba(154, 106, 36, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(154, 106, 36, 0.08) 1px, transparent 1px),
      linear-gradient(rgba(154, 106, 36, 0.14) 1px, transparent 1px),
      linear-gradient(90deg, rgba(154, 106, 36, 0.14) 1px, transparent 1px)
    `,
    backgroundSize: '24px 24px, 24px 24px, 120px 120px, 120px 120px',
    backgroundPosition: '0 0',
  };
}