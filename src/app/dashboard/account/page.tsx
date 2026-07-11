import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import DeleteAccountButton from '@/components/account/DeleteAccountButton';
import { prisma } from '@/lib/prisma';

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/account');
  }

    const userId = session.user.id;

  if (!userId) {
    redirect('/login?callbackUrl=/dashboard/account');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
    },
  });

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '72px 20px 96px',
        background: '#f7efe0',
        color: '#2d1a0b',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 920,
          margin: '0 auto',
          padding: '44px 28px',
          borderRadius: 28,
          background: '#fffaf0',
          border: '1px solid #e2d0ac',
          boxShadow: '0 24px 70px rgba(45, 26, 11, 0.12)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 900,
            color: '#a56518',
            letterSpacing: '0.08em',
          }}
        >
          계정 관리
        </p>

        <h1
          style={{
            margin: '12px 0 0',
            fontSize: 42,
            lineHeight: 1.2,
            fontWeight: 900,
            letterSpacing: '-0.07em',
            color: '#2d1a0b',
          }}
        >
          내 계정과 데이터를 관리합니다
        </h1>

        <p
          style={{
            marginTop: 18,
            fontSize: 17,
            lineHeight: 1.8,
            color: '#6a4a2b',
          }}
        >
          이곳에서는 달동네 출판사에 로그인한 계정 정보를 확인하고,
          필요한 경우 회원 탈퇴 및 계정 삭제를 요청할 수 있습니다.
        </p>

        <section
          style={{
            marginTop: 34,
            padding: 24,
            borderRadius: 22,
            border: '1px solid #ead7b4',
            background: '#fff8eb',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '-0.05em',
              color: '#2d1a0b',
            }}
          >
            로그인 계정 정보
          </h2>

          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gap: 10,
              fontSize: 16,
              lineHeight: 1.7,
              color: '#5f442a',
            }}
          >
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#2d1a0b' }}>이름:</strong>{' '}
              {user?.name || '이름 정보 없음'}
            </p>

            <p style={{ margin: 0 }}>
              <strong style={{ color: '#2d1a0b' }}>이메일:</strong>{' '}
              {user?.email || '이메일 정보 없음'}
            </p>
          </div>
        </section>

        <section
          style={{
            marginTop: 34,
            padding: 24,
            borderRadius: 22,
            border: '1px solid #e8b5a7',
            background: '#fff3ee',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '-0.05em',
              color: '#8d2c16',
            }}
          >
            회원 탈퇴 / 계정 삭제
          </h2>

          <p
            style={{
              marginTop: 14,
              fontSize: 16,
              lineHeight: 1.8,
              color: '#6b3b2c',
            }}
          >
            계정을 삭제하면 로그인 정보와 함께 사진, 이야기, 책 원고, 상담 신청
            정보가 삭제될 수 있습니다. 삭제된 데이터는 복구하기 어렵습니다.
          </p>

          <ul
            style={{
              margin: '14px 0 0',
              paddingLeft: 22,
              fontSize: 15,
              lineHeight: 1.9,
              color: '#6b3b2c',
            }}
          >
            <li>내 작업실에 저장한 사진과 이야기가 삭제될 수 있습니다.</li>
            <li>내 책장에 저장한 책 원고가 삭제될 수 있습니다.</li>
            <li>제작 상담 신청 정보가 삭제됩니다.</li>
            <li>삭제 후에는 기존 계정으로 작업 내역을 복구하기 어렵습니다.</li>
          </ul>

          <div style={{ marginTop: 24 }}>
            <DeleteAccountButton />
          </div>
        </section>

        <section
          style={{
            marginTop: 34,
            padding: 24,
            borderRadius: 22,
            border: '1px solid #ead7b4',
            background: '#fffdf6',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '-0.05em',
              color: '#2d1a0b',
            }}
          >
            관련 안내
          </h2>

          <p
            style={{
              marginTop: 14,
              fontSize: 16,
              lineHeight: 1.8,
              color: '#5f442a',
            }}
          >
            개인정보 처리, 데이터 삭제 요청, 서비스 이용 조건은 아래 페이지에서
            확인할 수 있습니다.
          </p>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <a
              href="/privacy"
              style={{
                minHeight: 40,
                padding: '0 16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                border: '1px solid #d6b778',
                background: '#fff4df',
                color: '#5a3510',
                fontSize: 14,
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              개인정보처리방침
            </a>

            <a
              href="/terms"
              style={{
                minHeight: 40,
                padding: '0 16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                border: '1px solid #d6b778',
                background: '#fff4df',
                color: '#5a3510',
                fontSize: 14,
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              이용약관
            </a>

            <a
              href="/data-deletion"
              style={{
                minHeight: 40,
                padding: '0 16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                border: '1px solid #d6b778',
                background: '#fff4df',
                color: '#5a3510',
                fontSize: 14,
                fontWeight: 900,
                textDecoration: 'none',
              }}
            >
              데이터 삭제 요청 안내
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}