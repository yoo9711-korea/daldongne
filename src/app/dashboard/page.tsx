import { auth } from "@/auth";
import UserOrderDashboardPanel from "@/components/orders/UserOrderDashboardPanel";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const REQUIRED_PHOTO_COUNT = 3;
const REQUIRED_STORY_COUNT = 3;

const heroPhotos = [
  {
    src: "/dashboard/reference-home-v1/hero-family.webp",
    alt: "함께 웃고 있는 어르신 부부",
    className: "dashboard-home-collage-family",
  },
  {
    src: "/dashboard/reference-home-v1/hero-child.webp",
    alt: "환하게 웃는 아이",
    className: "dashboard-home-collage-child",
  },
  {
    src: "/dashboard/reference-home-v1/hero-man.webp",
    alt: "따뜻한 차를 들고 있는 청년",
    className: "dashboard-home-collage-man",
  },
  {
    src: "/dashboard/reference-home-v1/hero-dog.webp",
    alt: "웃고 있는 강아지",
    className: "dashboard-home-collage-dog",
  },
  {
    src: "/dashboard/reference-home-v1/hero-friends.webp",
    alt: "함께 웃는 친구들",
    className: "dashboard-home-collage-friends",
  },
  {
    src: "/dashboard/reference-home-v1/hero-cat.webp",
    alt: "편안히 쉬는 고양이",
    className: "dashboard-home-collage-cat",
  },
];

const sampleMemories = [
  {
    title: "할아버지와 나들이",
    date: "2024.05.04",
    src: "/dashboard/reference-home-v1/sample-1.webp",
  },
  {
    title: "온 가족 저녁 시간",
    date: "2024.05.03",
    src: "/dashboard/reference-home-v1/sample-2.webp",
  },
  {
    title: "우리 강아지랑 산책",
    date: "2024.05.02",
    src: "/dashboard/reference-home-v1/sample-3.webp",
  },
  {
    title: "햇살 좋은 낮잠 시간",
    date: "2024.05.01",
    src: "/dashboard/reference-home-v1/sample-4.webp",
  },
  {
    title: "친구와 수다 데이",
    date: "2024.05.30",
    src: "/dashboard/reference-home-v1/sample-5.webp",
  },
  {
    title: "조용한 하루",
    date: "2024.04.29",
    src: "/dashboard/reference-home-v1/sample-6.webp",
  },
];

const categories = [
  {
    label: "나",
    icon: "person",
    tone: "mint",
  },
  {
    label: "가족",
    icon: "family",
    tone: "sky",
  },
  {
    label: "친구",
    icon: "friends",
    tone: "yellow",
  },
  {
    label: "강아지",
    icon: "dog",
    tone: "rose",
  },
  {
    label: "고양이",
    icon: "cat",
    tone: "blue",
  },
] as const;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    user,
    familyCount,
    memoryCount,
    materialMemories,
    bookCount,
    activeProductionRequests,
    recentMemories,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        role: true,
      },
    }),

    prisma.familyMember.count({
      where: {
        userId,
      },
    }),

    prisma.memory.count({
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
      select: {
        type: true,
        title: true,
        description: true,
        fileUrl: true,
      },
    }),

    prisma.book.count({
      where: {
        authorId: userId,
      },
    }),

    prisma.bookProductionRequest.findMany({
      where: {
        authorId: userId,
        status: {
          in: ["REQUESTED", "CONTACTED", "IN_PROGRESS"],
        },
      },
      select: {
        bookId: true,
      },
    }),

    prisma.memory.findMany({
      where: {
        authorId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        title: true,
        type: true,
        fileUrl: true,
        createdAt: true,
        occurredAt: true,
      },
    }),
  ]);

  const usableMaterialMemories = materialMemories.filter((memory) => {
    const title = memory.title?.trim() || "";
    const description = memory.description?.trim() || "";

    if (memory.type === "PHOTO") {
      return Boolean(memory.fileUrl?.trim());
    }

    if (memory.type === "TEXT") {
      return description.length >= 10 && !isLegacyAiInterviewTitle(title);
    }

    return false;
  });

  const photoCount = usableMaterialMemories.filter(
    (memory) => memory.type === "PHOTO",
  ).length;

  const storyCount = usableMaterialMemories.filter((memory) => {
    const description = memory.description?.trim() || "";

    if (memory.type === "PHOTO") {
      return description.length >= 10;
    }

    return memory.type === "TEXT";
  }).length;

  const activeProductionBookCount = new Set(
    activeProductionRequests.map((request) => request.bookId),
  ).size;

  const nextAction = getNextAction({
    photoCount,
    storyCount,
    bookCount,
    activeProductionBookCount,
  });

  const displayName =
    user?.name ||
    session.user.name ||
    "달동네 회원";

  return (
    <main className="dashboard-home">
      <style>{dashboardHomeStyles}</style>

      <div className="dashboard-home-shell">
      <section
        aria-label="나의 이야기 시작하기"
        style={{
          width: 'min(1216px, calc(100% - 32px))',
          margin: '26px auto 38px',
          overflow: 'hidden',
          border: '1px solid rgba(111, 79, 55, 0.14)',
          borderRadius: 30,
          background: '#fffaf4',
          boxShadow: '0 20px 48px rgba(78, 53, 38, 0.09)',
        }}
      >
        <Link
          href="/dashboard/timeline"
          aria-label="사진과 이야기를 기록하러 가기"
          style={{
            display: 'block',
            width: '100%',
            textDecoration: 'none',
          }}
        >
          <Image
            src="/dashboard/daldongne-dashboard-hero-bluebook-v1.webp"
            alt="꽃이 놓인 따뜻한 공간의 파란색 나의 이야기 책"
            width={3000}
            height={1500}
            priority
            quality={95}
            sizes="(max-width: 760px) calc(100vw - 20px), (max-width: 1280px) calc(100vw - 32px), 1216px"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              objectFit: 'cover',
            }}
          />
        </Link>
      </section>

        <nav
          className="dashboard-home-categories"
          aria-label="기록 주제"
        >
          {categories.map((category) => (
            <Link
              key={category.label}
              href="/dashboard/timeline"
              className="dashboard-home-category"
              data-tone={category.tone}
            >
              <span aria-hidden="true">
                <CategoryIcon name={category.icon} />
              </span>
              <strong>{category.label}</strong>
            </Link>
          ))}
        </nav>

        <section
          className="dashboard-home-primary-actions"
          aria-label="주요 기능"
        >
          <PrimaryAction
  href="/dashboard/timeline"
  title="사진 올리기"
  icon="photo"
  primary
/>

<PrimaryAction
  href="/dashboard/interview"
  title="이야기 쓰기"
  icon="story"
/>

<PrimaryAction
  href="/dashboard/book"
  title="원고 만들기"
  icon="book"
/>
        </section>

        <section className="dashboard-home-summary">
          <SummaryCard
            label="모은 사진"
            value={photoCount}
            unit="장"
            href="/dashboard/timeline"
          />

          <SummaryCard
            label="남긴 이야기"
            value={storyCount}
            unit="개"
            href="/dashboard/interview"
          />

          <SummaryCard
            label="만든 책"
            value={bookCount}
            unit="권"
            href="/dashboard/library"
          />

          <SummaryCard
            label="제작 진행"
            value={activeProductionBookCount}
            unit="권"
            href="/dashboard/library"
          />
        </section>

        <UserOrderDashboardPanel />
        <section className="dashboard-home-workspace">
          <article className="dashboard-home-recent-panel">
            <div className="dashboard-home-section-head">
              <div>
                <p>나의 기억</p>
                <h2>최근 기억</h2>
              </div>

              <Link href="/dashboard/timeline">
                더 보기
                <span aria-hidden="true">›</span>
              </Link>
            </div>

            {recentMemories.length > 0 ? (
              <div className="dashboard-home-memory-grid">
                {recentMemories.map((memory, index) => {
                  const isPhoto =
                    String(memory.type) === "PHOTO" &&
                    Boolean(memory.fileUrl);

                  return (
                    <Link
                      key={memory.id}
                      href="/dashboard/timeline"
                      className="dashboard-home-memory-card"
                    >
                      <span className="dashboard-home-memory-image">
                        {isPhoto ? (
                          <img
                            src={`/api/blob/${memory.id}`}
                            alt={memory.title || "저장된 사진"}
                          />
                        ) : (
                          <Image
                            src={
                              sampleMemories[
                                index % sampleMemories.length
                              ].src
                            }
                            alt=""
                            fill
                            sizes="(max-width: 760px) 42vw, 180px"
                          />
                        )}

                        {!isPhoto ? (
                          <small className="dashboard-home-memory-type">
                            {getMemoryTypeLabel(String(memory.type))}
                          </small>
                        ) : null}
                      </span>

                      <strong>
                        {memory.title ||
                          (isPhoto
                            ? "제목 없는 사진"
                            : "제목 없는 이야기")}
                      </strong>

                      <time>
                        {formatDate(
                          memory.occurredAt ||
                            memory.createdAt,
                        )}
                      </time>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <>
                <p className="dashboard-home-sample-note">
                  아직 기록이 없어 예시 화면을 보여드리고 있어요.
                </p>

                <div className="dashboard-home-memory-grid">
                  {sampleMemories.map((memory) => (
                    <Link
                      key={memory.title}
                      href="/dashboard/timeline"
                      className="dashboard-home-memory-card"
                    >
                      <span className="dashboard-home-memory-image">
                        <Image
                          src={memory.src}
                          alt={memory.title}
                          fill
                          sizes="(max-width: 760px) 42vw, 180px"
                        />

                        <small className="dashboard-home-memory-type">
                          예시
                        </small>
                      </span>

                      <strong>{memory.title}</strong>
                      <time>{memory.date}</time>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </article>

          <aside className="dashboard-home-guide-panel">
            <p className="dashboard-home-guide-kicker">
              지금 하면 좋은 일
            </p>

            <h2>{nextAction.title}</h2>

            <p>{nextAction.description}</p>

            <Link
              href={nextAction.href}
              className="dashboard-home-guide-button"
            >
              {nextAction.buttonLabel}
              <span aria-hidden="true">→</span>
            </Link>

            <div className="dashboard-home-guide-links">
              <Link href="/dashboard/book">
                <span aria-hidden="true">
                  <BookSmallIcon />
                </span>
                원고 만들기
              </Link>

              <Link href="/dashboard/family">
                <span aria-hidden="true">
                  <FamilySmallIcon />
                </span>
                함께 쓰는 공간
                <small>{familyCount}곳</small>
              </Link>

              {user?.role === "ADMIN" ? (
                <Link href="/admin">
                  <span aria-hidden="true">⚙</span>
                  관리자 화면
                </Link>
              ) : null}
            </div>

            <div className="dashboard-home-progress-note">
              <span aria-hidden="true">♡</span>
              <p>
                완벽한 글보다 지금 기억나는
                <br />
                한 문장이 더 중요합니다.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PrimaryAction({
  href,
  title,
  icon,
  primary = false,
}: {
  href: string;
  title: string;
  icon: "photo" | "story" | "book";
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="dashboard-home-primary-action"
      data-primary={primary ? "true" : "false"}
    >
      <span aria-hidden="true">
        <PrimaryActionIcon name={icon} />
      </span>
      <strong>{title}</strong>
    </Link>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  href,
}: {
  label: string;
  value: number;
  unit: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="dashboard-home-summary-card"
    >
      <span>{label}</span>
      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>
    </Link>
  );
}

function getNextAction({
  photoCount,
  storyCount,
  bookCount,
  activeProductionBookCount,
}: {
  photoCount: number;
  storyCount: number;
  bookCount: number;
  activeProductionBookCount: number;
}) {
  if (photoCount < REQUIRED_PHOTO_COUNT) {
    return {
      title: `사진을 ${REQUIRED_PHOTO_COUNT - photoCount}장 더 올려보세요.`,
      description:
        "사진이 모이면 책의 장면과 시간의 흐름을 만들기 쉬워집니다.",
      href: "/dashboard/timeline",
      buttonLabel: "사진 올리기",
    };
  }

  if (storyCount < REQUIRED_STORY_COUNT && bookCount === 0) {
    return {
      title: "기본 원고를 만들 수 있습니다.",
      description: `지금도 원고를 만들 수 있습니다. 이야기를 ${
        REQUIRED_STORY_COUNT - storyCount
      }개 더 남기면 내용이 더욱 풍부해집니다.`,
      href: "/dashboard/book",
      buttonLabel: "원고 만들기",
    };
  }

  if (bookCount === 0) {
    return {
      title: "첫 번째 원고를 만들어보세요.",
      description:
        "지금까지 모은 사진과 이야기를 읽기 좋은 원고로 정리할 수 있습니다.",
      href: "/dashboard/book",
      buttonLabel: "첫 원고 만들기",
    };
  }

  if (activeProductionBookCount > 0) {
    return {
      title: `${activeProductionBookCount}권의 제작 상담이 진행 중입니다.`,
      description:
        "내 책장에서 관리자 검토와 제작 상담 진행 상태를 확인하세요.",
      href: "/dashboard/library",
      buttonLabel: "진행 상태 확인",
    };
  }

  return {
    title: "만든 원고를 확인해보세요.",
    description:
      "내 책장에서 원고를 읽고 수정하거나 제작 검토를 신청할 수 있습니다.",
    href: "/dashboard/library",
    buttonLabel: "내 책장 보기",
  };
}

function isLegacyAiInterviewTitle(title: string) {
  return (
    title.startsWith("AI 인터뷰") ||
    title.includes("AI 인터뷰 -")
  );
}

function getMemoryTypeLabel(type: string) {
  if (type === "PHOTO") {
    return "사진";
  }

  if (type === "TEXT") {
    return "이야기";
  }

  if (type === "VOICE") {
    return "음성";
  }

  if (type === "VIDEO") {
    return "영상";
  }

  return "기록";
}

function formatDate(value: Date | string) {
  const date =
    value instanceof Date ?
      value :
      new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function CategoryIcon({
  name,
}: {
  name:
    | "person"
    | "family"
    | "friends"
    | "dog"
    | "cat";
}) {
  if (name === "person") {
    return (
      <svg viewBox="0 0 42 42" fill="none">
        <circle
          cx="21"
          cy="13"
          r="7"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path
          d="M8 36c0-8 5.2-12 13-12s13 4 13 12"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "family" || name === "friends") {
    return (
      <svg viewBox="0 0 42 42" fill="none">
        <circle
          cx="14"
          cy="14"
          r="5"
          stroke="currentColor"
          strokeWidth="2.1"
        />
        <circle
          cx="29"
          cy="14"
          r="5"
          stroke="currentColor"
          strokeWidth="2.1"
        />
        <path
          d="M4 34c0-6 3.8-10 10-10s10 4 10 10M19 34c0-6 3.8-10 10-10s9 4 9 10"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "dog") {
    return (
      <svg viewBox="0 0 42 42" fill="none">
        <path
          d="M12 15 6 10v10c0 4 2 6 5 7M30 15l6-5v10c0 4-2 6-5 7"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path
          d="M11 21c0-7 4-11 10-11s10 4 10 11v5c0 7-4 11-10 11s-10-4-10-11v-5Z"
          stroke="currentColor"
          strokeWidth="2.1"
        />
        <path
          d="M17 22h.01M25 22h.01M18 29c2 2 4 2 6 0"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 42 42" fill="none">
      <path
        d="m12 15-1-8 7 5M30 15l1-8-7 5"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path
        d="M11 22c0-8 4-12 10-12s10 4 10 12v4c0 7-4 11-10 11s-10-4-10-11v-4Z"
        stroke="currentColor"
        strokeWidth="2.1"
      />
      <path
        d="M17 22h.01M25 22h.01M18 29c2 2 4 2 6 0M8 26H3M34 26h5M8 31H4M34 31h4"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PrimaryActionIcon({
  name,
}: {
  name: "photo" | "story" | "book";
}) {
  if (name === "photo") {
    return (
      <svg viewBox="0 0 42 42" fill="none">
        <path
          d="M7 11h8l2.5-3h8l2.5 3h7a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4Z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle
          cx="21"
          cy="24"
          r="7"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        <path
          d="M34 16h.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "story") {
    return (
      <svg viewBox="0 0 42 42" fill="none">
        <path
          d="m10 31 2-8 17-17 7 7-17 17-9 1Z"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="m25 10 7 7M8 35h25"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 42 42" fill="none">
      <path
        d="M4 9c7-1.5 12.8.2 17 5v23c-4.2-4.8-10-6.5-17-5V9Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M38 9c-7-1.5-12.8.2-17 5v23c4.2-4.8 10-6.5 17-5V9Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HouseLineArt() {
  return (
    <svg viewBox="0 0 460 120" fill="none">
      <path
        d="M0 103c39-6 75-4 108 6 38-11 75-10 111 3 41-13 83-13 126 0 37-10 75-11 115-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M48 97V60l29-21 29 21v37M59 97V67h36v30M73 67v30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M126 99V71l22-17 23 17v28M137 99V77h24v22M193 100V60l25-20 25 20v40M204 100V69h28v31"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M286 101V76l19-15 20 15v25M296 101V82h19v19M357 104V69M344 83c0-15 7-25 13-25s13 10 13 25c0 12-6 21-13 21s-13-9-13-21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M392 103V78M381 87c0-12 6-20 11-20s11 8 11 20c0 9-5 16-11 16s-11-7-11-16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M108 56h17M171 70h18M243 63h13M326 82h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookSmallIcon() {
  return (
    <svg viewBox="0 0 30 30" fill="none">
      <path
        d="M3 6c5-1 9 .3 12 4v16c-3-3.7-7-5-12-4V6ZM27 6c-5-1-9 .3-12 4v16c3-3.7 7-5 12-4V6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FamilySmallIcon() {
  return (
    <svg viewBox="0 0 30 30" fill="none">
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="21" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M2 26c0-6 3-9 8-9s8 3 8 9M13 26c0-6 3-9 8-9s7 3 7 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const dashboardHomeStyles = `
  .dashboard-home,
  .dashboard-home * {
    box-sizing: border-box;
  }

  .dashboard-home {
    min-height: 100vh;
    padding: 28px 24px 54px;
    color: #342b28;
    background:
      radial-gradient(
        circle at 5% 15%,
        rgba(205, 238, 228, 0.55),
        transparent 28rem
      ),
      radial-gradient(
        circle at 87% 5%,
        rgba(255, 238, 204, 0.55),
        transparent 25rem
      ),
      linear-gradient(
        180deg,
        #fffdf8,
        #fffaf4
      );
    font-family:
      var(--font-daldongne-sans),
      "Noto Sans KR",
      sans-serif;
  }

  .dashboard-home a {
    color: inherit;
    text-decoration: none;
  }

  .dashboard-home a,
  .dashboard-home button {
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .dashboard-home a:hover {
    transform: translateY(-2px);
  }

  .dashboard-home a:focus-visible {
    outline:
      4px solid
      rgba(239, 105, 83, 0.22);
    outline-offset: 3px;
  }

  .dashboard-home-shell {
    width:
      min(1320px, 100%);
    margin: 0 auto;
  }

  .dashboard-home-hero {
    position: relative;
    min-height: 430px;
    padding:
      54px
      58px
      42px;
    display: grid;
    grid-template-columns:
      minmax(340px, 0.82fr)
      minmax(520px, 1.18fr);
    align-items: center;
    gap: 30px;
    overflow: hidden;
    border:
      1px solid
      rgba(108, 81, 67, 0.12);
    border-radius: 34px;
    background:
      linear-gradient(
        128deg,
        rgba(255, 253, 247, 0.98),
        rgba(255, 255, 255, 0.96)
      );
    box-shadow:
      0 24px 62px
      rgba(101, 69, 52, 0.08);
  }

  .dashboard-home-hero::after {
    position: absolute;
    left: -10%;
    bottom: -66%;
    width: 63%;
    height: 95%;
    border-radius: 50%;
    background:
      rgba(191, 235, 223, 0.68);
    content: "";
  }

  .dashboard-home-hero-copy {
    position: relative;
    z-index: 2;
    align-self: stretch;
    padding-top: 22px;
  }

  .dashboard-home-kicker {
    margin: 0 0 13px;
    color: #e56b55;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.055em;
  }

  .dashboard-home-hero h1 {
    margin: 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(44px, 5vw, 70px);
    font-weight: 750;
    line-height: 1.16;
    letter-spacing: -0.065em;
    word-break: keep-all;
  }

  .dashboard-home-subtitle {
    margin: 22px 0 0;
    color: #5f5551;
    font-size:
      clamp(18px, 1.75vw, 25px);
    font-weight: 650;
    line-height: 1.58;
    letter-spacing: -0.035em;
    word-break: keep-all;
  }

  .dashboard-home-line-art {
    position: absolute;
    left: -18px;
    bottom: -18px;
    z-index: 1;
    width: 480px;
    color: #75c6b2;
    opacity: 0.72;
  }

  .dashboard-home-line-art svg {
    width: 100%;
    height: auto;
  }

  .dashboard-home-collage {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 345px;
  }

  .dashboard-home-collage-item {
    position: absolute;
    overflow: hidden;
    border:
      6px solid
      rgba(255, 255, 255, 0.98);
    border-radius: 23px;
    background: #ffffff;
    box-shadow:
      0 15px 32px
      rgba(71, 51, 42, 0.15);
  }

  .dashboard-home-collage-item img {
    object-fit: cover;
  }

  .dashboard-home-collage-family {
    left: 4%;
    top: 0;
    width: 42%;
    height: 58%;
    transform: rotate(-4deg);
  }

  .dashboard-home-collage-child {
    left: 40%;
    top: 19%;
    z-index: 3;
    width: 29%;
    height: 48%;
    transform: rotate(3deg);
  }

  .dashboard-home-collage-man {
    right: 1%;
    top: 1%;
    width: 38%;
    height: 58%;
    transform: rotate(4deg);
  }

  .dashboard-home-collage-dog {
    left: 0;
    bottom: 0;
    width: 31%;
    height: 49%;
    transform: rotate(4deg);
  }

  .dashboard-home-collage-friends {
    left: 27%;
    bottom: -1%;
    z-index: 2;
    width: 43%;
    height: 44%;
    transform: rotate(-1deg);
  }

  .dashboard-home-collage-cat {
    right: 3%;
    bottom: -2%;
    width: 31%;
    height: 46%;
    transform: rotate(-5deg);
  }

  .dashboard-home-collage-heart,
  .dashboard-home-collage-spark {
    position: absolute;
    z-index: 5;
    color: #ef9a22;
    font-family: Arial, sans-serif;
    font-size: 46px;
    line-height: 1;
  }

  .dashboard-home-collage-heart {
    left: 5%;
    top: -18px;
    transform: rotate(-12deg);
  }

  .dashboard-home-collage-spark {
    right: 0;
    top: 0;
    color: #79cdb7;
    font-size: 30px;
  }

  .dashboard-home-categories {
    position: relative;
    z-index: 4;
    margin:
      -28px
      32px
      0;
    padding: 18px;
    display: grid;
    grid-template-columns:
      repeat(5, minmax(0, 1fr));
    gap: 14px;
    border:
      1px solid
      rgba(95, 72, 61, 0.1);
    border-radius: 25px;
    background:
      rgba(255, 255, 255, 0.96);
    box-shadow:
      0 17px 37px
      rgba(91, 61, 47, 0.09);
  }

  .dashboard-home-category {
    min-width: 0;
    min-height: 72px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 13px;
    border-radius: 16px;
  }

  .dashboard-home-category > span {
    width: 43px;
    height: 43px;
    flex: 0 0 auto;
  }

  .dashboard-home-category svg {
    width: 100%;
    height: 100%;
  }

  .dashboard-home-category strong {
    font-size: 16px;
    line-height: 1.3;
    white-space: nowrap;
  }

  .dashboard-home-category[data-tone="mint"] {
    color: #174d3d;
    background: #e7f5ef;
  }

  .dashboard-home-category[data-tone="sky"] {
    color: #224d74;
    background: #eaf4fc;
  }

  .dashboard-home-category[data-tone="yellow"] {
    color: #785519;
    background: #fff6d8;
  }

  .dashboard-home-category[data-tone="rose"] {
    color: #8a382d;
    background: #fff0ee;
  }

  .dashboard-home-category[data-tone="blue"] {
    color: #243f78;
    background: #edf4ff;
  }

  .dashboard-home-primary-actions {
    margin-top: 24px;
    padding: 0 70px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .dashboard-home-primary-action {
    min-height: 80px;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    border:
      1px solid
      rgba(123, 89, 70, 0.17);
    border-radius: 18px;
    background:
      rgba(255, 255, 255, 0.88);
    color: #3c302b;
    box-shadow:
      0 10px 26px
      rgba(81, 58, 47, 0.04);
  }

  .dashboard-home-primary-action > span {
    width: 42px;
    height: 42px;
    color: #ef6954;
  }

  .dashboard-home-primary-action svg {
    width: 100%;
    height: 100%;
  }

  .dashboard-home-primary-action strong {
    font-size: 19px;
    letter-spacing: -0.025em;
  }

  .dashboard-home-primary-action[data-primary="true"] {
    border-color: transparent;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #ff7464,
        #ee5d4f
      );
    box-shadow:
      0 15px 30px
      rgba(222, 83, 65, 0.2);
  }

  .dashboard-home-primary-action[data-primary="true"] > span {
    color: #ffffff;
  }

  .dashboard-home-summary {
    margin-top: 18px;
    padding: 0 70px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .dashboard-home-summary-card {
    min-width: 0;
    padding: 15px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border:
      1px solid
      rgba(112, 82, 66, 0.1);
    border-radius: 16px;
    background:
      rgba(255, 255, 255, 0.78);
    box-shadow:
      0 9px 21px
      rgba(80, 55, 44, 0.035);
  }

  .dashboard-home-summary-card > span {
    color: #76655d;
    font-size: 12px;
    font-weight: 800;
  }

  .dashboard-home-summary-card strong {
    color: #3f322d;
    font-size: 22px;
  }

  .dashboard-home-summary-card small {
    margin-left: 3px;
    color: #8f7a70;
    font-size: 11px;
  }

  .dashboard-home-workspace {
    margin-top: 20px;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      310px;
    gap: 18px;
    align-items: stretch;
  }

  .dashboard-home-recent-panel,
  .dashboard-home-guide-panel {
    min-width: 0;
    padding: 26px;
    border:
      1px solid
      rgba(113, 82, 66, 0.11);
    border-radius: 27px;
    background:
      rgba(255, 255, 255, 0.9);
    box-shadow:
      0 16px 35px
      rgba(83, 57, 45, 0.05);
  }

  .dashboard-home-section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .dashboard-home-section-head p {
    margin: 0;
    color: #ef6b55;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.06em;
  }

  .dashboard-home-section-head h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 26px;
    line-height: 1.3;
    letter-spacing: -0.045em;
  }

  .dashboard-home-section-head > a {
    min-height: 36px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    color: #6f5a50;
    font-size: 11px;
    font-weight: 850;
  }

  .dashboard-home-sample-note {
    margin: 14px 0 0;
    color: #9a8277;
    font-size: 11px;
  }

  .dashboard-home-memory-grid {
    margin-top: 18px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 13px;
  }

  .dashboard-home-memory-card {
    min-width: 0;
    padding: 7px 7px 10px;
    overflow: hidden;
    border:
      1px solid
      rgba(111, 81, 65, 0.12);
    border-radius: 17px;
    background: #ffffff;
    box-shadow:
      0 9px 21px
      rgba(77, 53, 43, 0.055);
  }

  .dashboard-home-memory-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1.08 / 1;
    display: block;
    overflow: hidden;
    border-radius: 12px;
    background: #f3eee9;
  }

  .dashboard-home-memory-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dashboard-home-memory-type {
    position: absolute;
    left: 8px;
    top: 8px;
    z-index: 3;
    padding: 5px 7px;
    border-radius: 999px;
    background:
      rgba(255, 255, 255, 0.9);
    color: #d65f4b;
    font-size: 9px;
    font-weight: 900;
  }

  .dashboard-home-memory-card > strong {
    display: block;
    margin-top: 9px;
    overflow: hidden;
    color: #3e332f;
    font-size: 12px;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-home-memory-card > time {
    display: block;
    margin-top: 2px;
    color: #a18e84;
    font-size: 9px;
  }

  .dashboard-home-guide-panel {
    display: flex;
    flex-direction: column;
    background:
      linear-gradient(
        155deg,
        #fff8e4,
        #fffdf8 45%,
        #f1faf4
      );
  }

  .dashboard-home-guide-kicker {
    margin: 0;
    color: #e76d55;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.06em;
  }

  .dashboard-home-guide-panel h2 {
    margin: 10px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 23px;
    line-height: 1.45;
    letter-spacing: -0.04em;
    word-break: keep-all;
  }

  .dashboard-home-guide-panel > p:not(.dashboard-home-guide-kicker) {
    margin: 10px 0 0;
    color: #74635b;
    font-size: 12px;
    line-height: 1.7;
    word-break: keep-all;
  }

  .dashboard-home-guide-button {
    min-height: 52px;
    margin-top: 18px;
    padding: 0 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 15px;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ff7766,
        #eb604f
      );
    font-size: 13px;
    font-weight: 900;
    box-shadow:
      0 14px 27px
      rgba(220, 85, 65, 0.18);
  }

  .dashboard-home-guide-links {
    margin-top: 17px;
    display: grid;
    gap: 8px;
  }

  .dashboard-home-guide-links > a {
    min-height: 49px;
    padding: 9px 12px;
    display: grid;
    grid-template-columns:
      31px minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    border:
      1px solid
      rgba(109, 80, 65, 0.11);
    border-radius: 13px;
    background:
      rgba(255, 255, 255, 0.8);
    color: #55453e;
    font-size: 11px;
    font-weight: 850;
  }

  .dashboard-home-guide-links > a > span {
    width: 27px;
    height: 27px;
    color: #e06853;
  }

  .dashboard-home-guide-links svg {
    width: 100%;
    height: 100%;
  }

  .dashboard-home-guide-links small {
    color: #a18b80;
    font-size: 9px;
  }

  .dashboard-home-progress-note {
    margin-top: auto;
    padding-top: 18px;
    display: flex;
    align-items: flex-start;
    gap: 9px;
    color: #8b735f;
  }

  .dashboard-home-progress-note > span {
    color: #ef745c;
    font-size: 22px;
    line-height: 1;
  }

  .dashboard-home-progress-note p {
    margin: 0;
    font-size: 11px;
    line-height: 1.65;
  }

  @media (max-width: 1080px) {
    .dashboard-home-hero {
      min-height: 390px;
      padding: 42px;
      grid-template-columns:
        minmax(280px, 0.8fr)
        minmax(430px, 1.2fr);
    }

    .dashboard-home-primary-actions,
    .dashboard-home-summary {
      padding:
        0
        24px;
    }

    .dashboard-home-workspace {
      grid-template-columns: 1fr;
    }

    .dashboard-home-guide-panel {
      min-height: 320px;
    }

    .dashboard-home-progress-note {
      margin-top: 22px;
    }
  }

  @media (max-width: 820px) {
    .dashboard-home {
      padding:
        18px
        14px
        40px;
    }

    .dashboard-home-hero {
      min-height: 700px;
      padding:
        34px
        28px
        30px;
      display: block;
      border-radius: 25px;
    }

    .dashboard-home-hero-copy {
      min-height: 245px;
      padding-top: 0;
    }

    .dashboard-home-hero h1 {
      font-size: 46px;
    }

    .dashboard-home-subtitle {
      margin-top: 14px;
      font-size: 18px;
    }

    .dashboard-home-line-art {
      left: -35px;
      bottom: -5px;
      width: 390px;
    }

    .dashboard-home-collage {
      height: 340px;
      margin-top: 16px;
    }

    .dashboard-home-categories {
      margin:
        -20px
        12px
        0;
      padding: 12px;
      gap: 8px;
      overflow-x: auto;
    }

    .dashboard-home-category {
      min-width: 125px;
      min-height: 58px;
      gap: 8px;
    }

    .dashboard-home-category > span {
      width: 34px;
      height: 34px;
    }

    .dashboard-home-category strong {
      font-size: 13px;
    }

    .dashboard-home-primary-actions {
      padding: 0;
      grid-template-columns: 1fr;
      gap: 9px;
    }

    .dashboard-home-primary-action {
      min-height: 62px;
      justify-content: flex-start;
      padding: 10px 20px;
    }

    .dashboard-home-primary-action > span {
      width: 34px;
      height: 34px;
    }

    .dashboard-home-primary-action strong {
      font-size: 16px;
    }

    .dashboard-home-summary {
      padding: 0;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .dashboard-home-memory-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .dashboard-home {
      padding:
        12px
        10px
        32px;
    }

    .dashboard-home-hero {
      min-height: 590px;
      padding:
        26px
        20px
        22px;
      border-radius: 20px;
    }

    .dashboard-home-hero-copy {
      min-height: 205px;
    }

    .dashboard-home-kicker {
      font-size: 10px;
    }

    .dashboard-home-hero h1 {
      font-size: 36px;
    }

    .dashboard-home-subtitle {
      font-size: 15px;
      line-height: 1.55;
    }

    .dashboard-home-line-art {
      width: 310px;
    }

    .dashboard-home-collage {
      height: 285px;
    }

    .dashboard-home-collage-item {
      border-width: 4px;
      border-radius: 15px;
    }

    .dashboard-home-collage-heart {
      font-size: 31px;
    }

    .dashboard-home-collage-spark {
      font-size: 22px;
    }

    .dashboard-home-categories {
      margin:
        -15px
        7px
        0;
      padding: 9px;
      border-radius: 17px;
    }

    .dashboard-home-category {
      min-width: 104px;
      min-height: 47px;
      padding: 7px 10px;
      border-radius: 11px;
    }

    .dashboard-home-category > span {
      width: 28px;
      height: 28px;
    }

    .dashboard-home-category strong {
      font-size: 11px;
    }

    .dashboard-home-primary-actions {
      margin-top: 15px;
    }

    .dashboard-home-summary {
      gap: 7px;
    }

    .dashboard-home-summary-card {
      padding: 12px;
      border-radius: 13px;
    }

    .dashboard-home-summary-card > span {
      font-size: 10px;
    }

    .dashboard-home-summary-card strong {
      font-size: 18px;
    }

    .dashboard-home-workspace {
      margin-top: 12px;
      gap: 12px;
    }

    .dashboard-home-recent-panel,
    .dashboard-home-guide-panel {
      padding: 18px;
      border-radius: 20px;
    }

    .dashboard-home-section-head h2 {
      font-size: 22px;
    }

    .dashboard-home-memory-grid {
      margin-top: 13px;
      gap: 8px;
    }

    .dashboard-home-memory-card {
      padding: 5px 5px 8px;
      border-radius: 13px;
    }

    .dashboard-home-memory-image {
      border-radius: 9px;
    }

    .dashboard-home-memory-card > strong {
      margin-top: 7px;
      font-size: 10px;
    }

    .dashboard-home-memory-card > time {
      font-size: 8px;
    }

    .dashboard-home-guide-panel h2 {
      font-size: 21px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dashboard-home a,
    .dashboard-home button {
      transition: none;
    }
  }
`;
