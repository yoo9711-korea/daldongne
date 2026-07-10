const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'yoo9711@naver.com';

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    console.log(`사용자를 찾지 못했습니다: ${email}`);
    return;
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      role: 'ADMIN',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  console.log('관리자 권한 변경 완료');
  console.log(updatedUser);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });