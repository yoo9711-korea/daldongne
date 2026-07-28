import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import BookMaterialSelector, {
  type BookMaterialItem,
} from "./BookMaterialSelector";

const REQUIRED_PHOTO_COUNT = 3;
const RECOMMENDED_STORY_COUNT = 3;

export default async function BookPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    memoryCount,
    bookCount,
    materialMemories,
  ] = await Promise.all([
    prisma.memory.count({
      where: {
        authorId: userId,
      },
    }),

    prisma.book.count({
      where: {
        authorId: userId,
      },
    }),

    prisma.memory.findMany({
      where: {
        authorId: userId,
        OR: [
          {
            type: "PHOTO",
            fileUrl: {
              not: null,
            },
          },
          {
            type: "TEXT",
            description: {
              not: null,
            },
          },
        ],
      },
      orderBy: [
        {
          occurredAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 100,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        fileUrl: true,
      },
    }),
  ]);

  const usableMemories =
    materialMemories.filter((memory) => {
      const title =
        memory.title?.trim() || "";

      if (
        memory.type === "TEXT" &&
        isLegacyAiInterviewTitle(title)
      ) {
        return false;
      }

      if (memory.type === "PHOTO") {
        return Boolean(memory.fileUrl);
      }

      if (memory.type === "TEXT") {
        return (
          memory.description?.trim().length ??
          0
        ) >= 10;
      }

      return false;
    });

  const photoCount =
    usableMemories.filter(
      (memory) =>
        memory.type === "PHOTO",
    ).length;

  const photoStoryCount =
    usableMemories.filter(
      (memory) =>
        memory.type === "PHOTO" &&
        (memory.description?.trim().length ??
          0) >= 10,
    ).length;

  const writtenStoryCount =
    usableMemories.filter(
      (memory) =>
        memory.type === "TEXT" &&
        Boolean(
          memory.description?.trim(),
        ),
    ).length;

  const storyCount =
    photoStoryCount +
    writtenStoryCount;

  const materials: BookMaterialItem[] =
    usableMemories.map((memory) => {
      const isPhoto =
        memory.type === "PHOTO";

      const description =
        memory.description || "";

      return {
        id: memory.id,
        kind: isPhoto
          ? "photo"
          : "story",
        title: cleanMaterialTitle(
          memory.title || "",
        ),
        description,
        hasStory:
          description.trim().length >= 10,
      };
    });

  const canCreateDraft =
    photoCount >= REQUIRED_PHOTO_COUNT;

  const recommendedReady =
    canCreateDraft &&
    storyCount >=
      RECOMMENDED_STORY_COUNT;

  const missingPhotoCount = Math.max(
    REQUIRED_PHOTO_COUNT - photoCount,
    0,
  );

  const missingStoryCount = Math.max(
    RECOMMENDED_STORY_COUNT -
      storyCount,
    0,
  );

  return (
    <main className="book-reference-page">
      <style>{bookReferenceStyles}</style>

      <div className="book-reference-shell">
        <section className="book-reference-heading">
  <p>원고 만들기 3단계</p>

  <h1>
    모은 사진과 이야기로
    <br className="book-reference-mobile-break" />
    원고를 만들어요
  </h1>

  <span>
    원고에 담을 자료와 문체를 고르면
    AI가 읽기 좋은 초안으로 정리합니다.
    만든 원고는 직접 확인하고 수정할 수 있습니다.
  </span>
</section>

        <section className="book-reference-status">
          <StatusCard
            label="사용 가능한 사진"
            value={photoCount}
            unit="장"
          />

          <StatusCard
            label="사진 속 이야기"
            value={photoStoryCount}
            unit="개"
          />

          <StatusCard
            label="직접 남긴 이야기"
            value={writtenStoryCount}
            unit="개"
          />

          <StatusCard
            label="전체 기록"
            value={memoryCount}
            unit="개"
          />

           <StatusCard
  label="만든 원고"
  value={bookCount}
  unit="개"
/>
</section>

<section
  className="book-reference-ready"
  data-ready={
    recommendedReady
      ? "complete"
      : canCreateDraft
        ? "possible"
        : "waiting"
  }
>
  <div>
    <p>현재 준비 상태</p>

    <strong>
      {recommendedReady
        ? "사진과 이야기가 충분히 준비되었습니다."
        : canCreateDraft
          ? "지금도 기본 원고를 만들 수 있습니다."
          : `사진을 ${missingPhotoCount}장 더 모아주세요.`}
    </strong>

    <span>
      {recommendedReady
        ? "선택한 자료를 바탕으로 더욱 풍부한 원고를 만들 수 있습니다."
        : canCreateDraft
          ? `이야기를 ${missingStoryCount}개 더 쓰면 원고가 더욱 풍부해집니다.`
          : "사진 3장 이상부터 원고 만들기를 시작할 수 있습니다."}
    </span>
  </div>

  {!canCreateDraft ? (
    <Link href="/dashboard/timeline">
      사진 더 모으기
      <span aria-hidden="true">→</span>
    </Link>
  ) : !recommendedReady ? (
    <Link href="/dashboard/interview">
      이야기 더 쓰기
      <span aria-hidden="true">→</span>
    </Link>
  ) : (
    <a href="#book-material-selector">
      원고 구성 시작
      <span aria-hidden="true">↓</span>
    </a>
  )}
</section>

        <BookMaterialSelector
          materials={materials}
        />

        <footer className="book-reference-footer">
          <Link href="/dashboard/interview">
            이전 단계
          </Link>

          <Link href="/dashboard/library">
            내 책장 보기
            <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}

function StatusCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <article>
      <span>{label}</span>

      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>
    </article>
  );
}

function isLegacyAiInterviewTitle(
  title: string,
) {
  return (
    title.startsWith("AI 인터뷰") ||
    title.includes("AI 인터뷰 -")
  );
}

function cleanMaterialTitle(
  title: string,
) {
  return title
    .replace(/^AI 인터뷰:\s*/, "")
    .replace(/^이야기 ·\s*/, "")
    .trim();
}

const bookReferenceStyles = `
  .book-reference-page,
  .book-reference-page * {
    box-sizing: border-box;
  }

  .book-reference-page {
    min-height: 100vh;
    padding: 32px 24px 54px;
    color: #4a342b;
    background:
      radial-gradient(
        circle at 7% 8%,
        rgba(255, 230, 213, 0.58),
        transparent 28rem
      ),
      radial-gradient(
        circle at 94% 13%,
        rgba(233, 244, 225, 0.58),
        transparent 25rem
      ),
      linear-gradient(
        180deg,
        #fffdf8,
        #fff9f3
      );
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .book-reference-page a {
    color: inherit;
    text-decoration: none;
  }

  .book-reference-page a,
  .book-reference-page button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .book-reference-page a:hover,
  .book-reference-page button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .book-reference-page a:focus-visible,
  .book-reference-page button:focus-visible,
  .book-reference-page select:focus-visible,
  .book-reference-page input:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.2);
    outline-offset: 3px;
  }

  .book-reference-shell {
    width:
      min(1380px, 100%);
    margin: 0 auto;
  }

  .book-reference-heading {
    text-align: center;
  }

  .book-reference-heading > p {
    margin: 0;
    color: #ef6c55;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .book-reference-heading h1 {
    margin: 11px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(40px, 5vw, 61px);
    line-height: 1.18;
    letter-spacing: -0.06em;
  }

  .book-reference-heading > span {
    display: block;
    margin-top: 12px;
    color: #7b665d;
    font-size:
      clamp(14px, 1.5vw, 19px);
    line-height: 1.7;
  }

  .book-reference-mobile-break {
    display: none;
  }

  .book-reference-status {
    margin-top: 25px;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 10px;
  }

  .book-reference-status article {
    min-width: 0;
    padding: 14px 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border:
      1px solid
      rgba(135, 94, 74, 0.11);
    border-radius: 15px;
    background:
      rgba(255, 255, 255, 0.82);
    box-shadow:
      0 8px 20px
      rgba(95, 62, 46, 0.035);
  }

  .book-reference-status article > span {
    color: #806c63;
    font-size: 11px;
    font-weight: 850;
  }

  .book-reference-status article > strong {
    color: #e46750;
    font-size: 22px;
  }

  .book-reference-status article small {
    margin-left: 3px;
    color: #8f7c72;
    font-size: 10px;
  }

  .book-reference-ready {
    margin-top: 17px;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border:
      1px solid #d5bda7;
    border-radius: 19px;
    background:
      linear-gradient(
        135deg,
        #fff4e9,
        #fffdf7
      );
  }

  .book-reference-ready[data-ready="complete"] {
    border-color: #c7d8aa;
    background:
      linear-gradient(
        135deg,
        #f3f8e9,
        #fffdf7
      );
  }

  .book-reference-ready[data-ready="waiting"] {
    border-color: #e4b7aa;
    background:
      linear-gradient(
        135deg,
        #fff1ec,
        #fffdf8
      );
  }

  .book-reference-ready p {
    margin: 0;
    color: #d7654f;
    font-size: 10px;
    font-weight: 900;
  }

  .book-reference-ready[data-ready="complete"] p {
    color: #4f7a3e;
  }

  .book-reference-ready strong {
    display: block;
    margin-top: 5px;
    font-size: 17px;
    line-height: 1.5;
  }

  .book-reference-ready div > span {
    display: block;
    margin-top: 3px;
    color: #75816d;
    font-size: 11px;
    line-height: 1.6;
  }

  .book-reference-ready > a {
    min-height: 43px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    gap: 11px;
    flex: 0 0 auto;
    border-radius: 12px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5e4f
      );
    font-size: 12px;
    font-weight: 900;
  }

  .book-reference-footer {
    margin-top: 18px;
    padding: 17px 22px;
    display: grid;
    grid-template-columns:
      minmax(180px, 0.55fr)
      minmax(300px, 1.45fr);
    gap: 14px;
    border:
      1px solid
      rgba(135, 94, 74, 0.12);
    border-radius: 21px;
    background:
      rgba(255, 255, 255, 0.9);
  }

  .book-reference-footer > a {
    min-height: 53px;
    padding: 0 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    border:
      1px solid #d3ae9e;
    border-radius: 14px;
    color: #705448;
    background: #ffffff;
    font-size: 14px;
    font-weight: 900;
  }

  .book-reference-footer > a:last-child {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7765,
        #ed604f
      );
    box-shadow:
      0 13px 27px
      rgba(220, 83, 63, 0.18);
  }

  @media (max-width: 780px) {
    .book-reference-page {
      padding: 22px 13px 38px;
    }

    .book-reference-status {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .book-reference-ready {
      align-items: stretch;
      flex-direction: column;
    }

    .book-reference-ready > a {
      justify-content: center;
    }
  }

  @media (max-width: 560px) {
    .book-reference-mobile-break {
      display: block;
    }

    .book-reference-heading h1 {
      font-size: 37px;
    }

    .book-reference-status article {
      padding: 11px;
    }

    .book-reference-status article > span {
      font-size: 9px;
    }

    .book-reference-status article > strong {
      font-size: 18px;
    }

    .book-reference-footer {
      padding: 12px;
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .book-reference-page a,
    .book-reference-page button {
      transition: none;
    }
  }
`;
