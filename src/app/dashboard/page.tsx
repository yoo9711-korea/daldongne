import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

const REQUIRED_PHOTO_COUNT = 3;
const REQUIRED_STORY_COUNT = 3;

type ActionIconName = "photo" | "story" | "book" | "order";

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
      take: 3,
      select: {
        id: true,
        title: true,
        type: true,
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

  const photoReady = photoCount >= REQUIRED_PHOTO_COUNT;

  const storyReady = storyCount >= REQUIRED_STORY_COUNT;

  const nextAction = getNextAction({
    photoCount,
    storyCount,
    bookCount,
    activeProductionBookCount,
  });

  const displayName = user?.name || session.user.name || "달동네 회원";

  const actionCards: {
    number: string;
    icon: ActionIconName;
    title: string;
    description: string;
    count: string;
    status: string;
    href: string;
    buttonLabel: string;
    tone: string;
    ready: boolean;
  }[] = [
    {
      number: "01",
      icon: "photo",
      title: "사진 올리기",
      description: "기억하고 싶은 사진을 내 공간에 모아보세요.",
      count: `${photoCount}장`,
      status: photoReady
        ? "책 만들기 기본 준비 완료"
        : `${Math.max(REQUIRED_PHOTO_COUNT - photoCount, 0)}장 더 필요`,
      href: "/dashboard/timeline",
      buttonLabel: "사진 관리",
      tone: "coral",
      ready: photoReady,
    },
    {
      number: "02",
      icon: "story",
      title: "이야기 쓰기",
      description: "사진을 보며 떠오르는 기억을 짧게 남겨보세요.",
      count: `${storyCount}개`,
      status: storyReady
        ? "풍부한 원고 준비 완료"
        : `${Math.max(REQUIRED_STORY_COUNT - storyCount, 0)}개 더 권장`,
      href: "/dashboard/interview",
      buttonLabel: "이야기 관리",
      tone: "apricot",
      ready: storyReady,
    },
    {
      number: "03",
      icon: "book",
      title: "책 만들기",
      description: "모아 둔 사진과 이야기를 책 원고로 정리하세요.",
      count: `${bookCount}권`,
      status: photoReady ? "지금 원고 만들기 가능" : "사진 3장부터 준비",
      href: "/dashboard/book",
      buttonLabel: "책 원고 만들기",
      tone: "sage",
      ready: bookCount > 0,
    },
    {
      number: "04",
      icon: "order",
      title: "검토·주문",
      description: "원고를 확인하고 관리자 검토와 제작 상담을 신청하세요.",
      count:
        activeProductionBookCount > 0
          ? `${activeProductionBookCount}권 진행`
          : "진행 없음",
      status: bookCount > 0 ? "내 책장에서 신청 가능" : "책 원고를 먼저 만들기",
      href: "/dashboard/library",
      buttonLabel: "내 책장 보기",
      tone: "sky",
      ready: activeProductionBookCount > 0,
    },
  ];

  return (
    <main className="simple-dashboard">
      <style>{dashboardStyles}</style>

      <div className="simple-dashboard-shell">
        <section className="simple-dashboard-hero">
          <div className="simple-dashboard-welcome">
            <p className="simple-dashboard-kicker">나의 기록 작업실</p>

            <h1>
              {displayName}님,
              <br />
              오늘은 무엇을 남길까요?
            </h1>

            <p className="simple-dashboard-intro">
              사진 한 장부터 시작해도 충분합니다. 모인 사진과 이야기는 한 권의
              책 원고로 이어집니다.
            </p>
          </div>

          <div className="simple-dashboard-next">
            <span className="simple-dashboard-next-label">
              지금 하면 좋은 일
            </span>

            <strong>{nextAction.title}</strong>

            <p>{nextAction.description}</p>

            <Link
              href={nextAction.href}
              className="simple-dashboard-next-button"
            >
              {nextAction.buttonLabel}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className="simple-dashboard-section">
          <div className="simple-dashboard-section-head">
            <div>
              <p>빠른 시작</p>
              <h2>네 가지만 기억하세요</h2>
            </div>

            <span>사진 → 이야기 → 책 → 주문</span>
          </div>

          <div className="simple-dashboard-actions">
            {actionCards.map((card) => (
              <article
                key={card.number}
                className="simple-dashboard-action"
                data-tone={card.tone}
              >
                <div className="simple-dashboard-action-top">
                  <span className="simple-dashboard-icon">
                    <ActionIcon name={card.icon} />
                  </span>

                  <span className="simple-dashboard-number">{card.number}</span>
                </div>

                <h3>{card.title}</h3>
                <p>{card.description}</p>

                <div className="simple-dashboard-count">
                  <strong>{card.count}</strong>
                  <span>
                    {card.ready ? "✓ " : ""}
                    {card.status}
                  </span>
                </div>

                <Link href={card.href} className="simple-dashboard-action-link">
                  {card.buttonLabel}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="simple-dashboard-summary">
          <SummaryItem
            label="전체 기록"
            value={memoryCount}
            unit="개"
            href="/dashboard/timeline"
          />

          <SummaryItem
            label="모은 사진"
            value={photoCount}
            unit="장"
            href="/dashboard/timeline"
          />

          <SummaryItem
            label="남긴 이야기"
            value={storyCount}
            unit="개"
            href="/dashboard/interview"
          />

          <SummaryItem
            label="만든 책"
            value={bookCount}
            unit="권"
            href="/dashboard/library"
          />
        </section>

        <section className="simple-dashboard-lower">
          <article className="simple-dashboard-panel">
            <div className="simple-dashboard-panel-head">
              <div>
                <p>최근 기록</p>
                <h2>최근에 남긴 사진과 이야기</h2>
              </div>

              <Link href="/dashboard/timeline">전체 보기</Link>
            </div>

            {recentMemories.length > 0 ? (
              <div className="simple-dashboard-recent">
                {recentMemories.map((memory) => (
                  <Link
                    key={memory.id}
                    href="/dashboard/timeline"
                    className="simple-dashboard-recent-item"
                  >
                    <span
                      className="simple-dashboard-memory-icon"
                      data-type={String(memory.type)}
                    >
                      {String(memory.type) === "PHOTO"
                        ? "사진"
                        : getMemoryTypeLabel(String(memory.type))}
                    </span>

                    <span className="simple-dashboard-memory-copy">
                      <strong>{memory.title || "제목 없는 기록"}</strong>
                      <small>
                        {formatDate(memory.occurredAt || memory.createdAt)}
                      </small>
                    </span>

                    <span
                      className="simple-dashboard-recent-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="simple-dashboard-empty">
                <span>
                  <ActionIcon name="photo" />
                </span>
                <strong>아직 남긴 기록이 없습니다</strong>
                <p>첫 번째 사진을 올리면 이곳에서 바로 확인할 수 있습니다.</p>
                <Link href="/dashboard/timeline">첫 사진 올리기</Link>
              </div>
            )}
          </article>

          <aside className="simple-dashboard-panel simple-dashboard-side">
            <div className="simple-dashboard-panel-head">
              <div>
                <p>내 공간</p>
                <h2>필요할 때 바로 이동하세요</h2>
              </div>
            </div>

            <div className="simple-dashboard-side-links">
              <SideLink
                href="/dashboard/library"
                title="내 책장"
                description={`${bookCount}권의 원고와 책 확인`}
              />

              <SideLink
                href="/dashboard/family"
                title="함께 쓰는 공간"
                description={`${familyCount}곳의 공유 공간 확인`}
              />

              <SideLink
                href="/dashboard/account"
                title="내 정보"
                description={
                  user?.email || session.user.email || "계정 정보 확인"
                }
              />

              {user?.role === "ADMIN" ? (
                <SideLink
                  href="/admin"
                  title="관리자 화면"
                  description="회원·책·제작 상담 관리"
                  admin
                />
              ) : null}
            </div>

            <p className="simple-dashboard-help">
              완벽한 글보다 지금 기억나는 한 문장이 더 중요합니다.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SummaryItem({
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
    <Link href={href} className="simple-dashboard-summary-item">
      <span>{label}</span>
      <strong>
        {value.toLocaleString()}
        <small>{unit}</small>
      </strong>
    </Link>
  );
}

function SideLink({
  href,
  title,
  description,
  admin = false,
}: {
  href: string;
  title: string;
  description: string;
  admin?: boolean;
}) {
  return (
    <Link
      href={href}
      className="simple-dashboard-side-link"
      data-admin={admin ? "true" : "false"}
    >
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <b aria-hidden="true">→</b>
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
      description: "사진이 모이면 책의 장면과 시간의 흐름을 만들기 쉬워집니다.",
      href: "/dashboard/timeline",
      buttonLabel: "사진 올리기",
    };
  }

  if (storyCount < REQUIRED_STORY_COUNT && bookCount === 0) {
    return {
      title: "기본 책 원고를 만들 수 있습니다.",
      description: `지금도 원고를 만들 수 있습니다. 이야기를 ${
        REQUIRED_STORY_COUNT - storyCount
      }개 더 남기면 내용이 더욱 풍부해집니다.`,
      href: "/dashboard/book",
      buttonLabel: "책 원고 만들기",
    };
  }

  if (bookCount === 0) {
    return {
      title: "첫 번째 책 원고를 만들어보세요.",
      description:
        "지금까지 모은 사진과 이야기를 읽기 좋은 원고로 정리할 수 있습니다.",
      href: "/dashboard/book",
      buttonLabel: "첫 책 원고 만들기",
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
  return title.startsWith("AI 인터뷰") || title.includes("AI 인터뷰 -");
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
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function ActionIcon({ name }: { name: ActionIconName }) {
  if (name === "photo") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M6 9.5h4.2l1.8-2.7h8l1.8 2.7H26a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle
          cx="16"
          cy="17.5"
          r="5"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path
          d="M25 13h.01"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "story") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M7 5h14a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Z"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path
          d="m12 21 1.1-4.1L21 9l2 2-7.9 7.9L12 21Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 24.5h10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "book") {
    return (
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <path
          d="M4 7.5c4.8-1 8.8.1 12 3.2v16C12.8 23.6 8.8 22.5 4 23.5v-16Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M28 7.5c-4.8-1-8.8.1-12 3.2v16c3.2-3.1 7.2-4.2 12-3.2v-16Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M16 10.7v16" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M6 8h20v16H6V8Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M10 5v6M22 5v6M6 13h20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="m11.5 19 3 3 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const dashboardStyles = `
  .simple-dashboard {
    min-height: 100vh;
    padding: 28px;
    color: #3f3029;
    background:
      radial-gradient(
        circle at 5% 2%,
        rgba(255, 220, 203, 0.48),
        transparent 24rem
      ),
      radial-gradient(
        circle at 95% 32%,
        rgba(218, 241, 229, 0.48),
        transparent 25rem
      ),
      linear-gradient(
        180deg,
        #fffdfb,
        #fff9f5
      );
    font-family:
      var(--font-daldongne-sans),
      Arial,
      sans-serif;
  }

  .simple-dashboard *,
  .simple-dashboard *::before,
  .simple-dashboard *::after {
    box-sizing: border-box;
  }

  .simple-dashboard a {
    transition:
      transform 180ms ease,
      box-shadow 180ms ease,
      border-color 180ms ease;
  }

  .simple-dashboard a:hover {
    transform: translateY(-2px);
  }

  .simple-dashboard a:focus-visible {
    outline:
      4px solid
      rgba(244, 111, 93, 0.24);
    outline-offset: 3px;
  }

  .simple-dashboard-shell {
    width: 100%;
    max-width: 1380px;
    margin: 0 auto;
  }

  .simple-dashboard-hero {
    padding: 36px;
    display: grid;
    grid-template-columns:
      minmax(0, 1fr)
      minmax(330px, 0.72fr);
    align-items: center;
    gap: 34px;
    overflow: hidden;
    border:
      1px solid
      rgba(220, 145, 110, 0.2);
    border-radius: 32px;
    background:
      radial-gradient(
        circle at 92% 8%,
        rgba(255, 220, 151, 0.4),
        transparent 20rem
      ),
      linear-gradient(
        135deg,
        #fff7f1,
        #ffffff 55%,
        #fff2e9
      );
    box-shadow:
      0 19px 48px
      rgba(142, 87, 58, 0.08);
  }

  .simple-dashboard-kicker {
    margin: 0 0 12px;
    color: #d3614d;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .simple-dashboard-welcome h1 {
    margin: 0;
    font-family:
      var(--font-daldongne-serif),
      Batang,
      serif;
    font-size: clamp(36px, 4.3vw, 56px);
    font-weight: 600;
    line-height: 1.22;
    letter-spacing: -0.05em;
    word-break: keep-all;
  }

  .simple-dashboard-intro {
    max-width: 650px;
    margin: 16px 0 0;
    color: #756158;
    font-size: 16px;
    line-height: 1.78;
    word-break: keep-all;
  }

  .simple-dashboard-next {
    padding: 23px;
    border:
      1px solid
      rgba(218, 135, 96, 0.19);
    border-radius: 24px;
    background:
      rgba(255, 255, 255, 0.8);
    box-shadow:
      0 13px 30px
      rgba(129, 79, 53, 0.07);
  }

  .simple-dashboard-next-label {
    display: block;
    color: #d76550;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.04em;
  }

  .simple-dashboard-next strong {
    display: block;
    margin-top: 8px;
    font-size: 21px;
    line-height: 1.45;
    word-break: keep-all;
  }

  .simple-dashboard-next p {
    margin: 7px 0 0;
    color: #78665d;
    font-size: 13px;
    line-height: 1.7;
    word-break: keep-all;
  }

  .simple-dashboard-next-button {
    min-height: 48px;
    margin-top: 17px;
    padding: 0 17px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 15px;
    background:
      linear-gradient(
        135deg,
        #fa826e,
        #ed6552
      );
    color: #ffffff;
    font-size: 14px;
    font-weight: 900;
    text-decoration: none;
    box-shadow:
      0 12px 23px
      rgba(220, 91, 68, 0.19);
  }

  .simple-dashboard-section {
    margin-top: 22px;
    padding: 28px;
    border:
      1px solid
      rgba(138, 93, 72, 0.11);
    border-radius: 30px;
    background:
      rgba(255, 255, 255, 0.75);
    box-shadow:
      0 15px 38px
      rgba(101, 68, 51, 0.045);
  }

  .simple-dashboard-section-head,
  .simple-dashboard-panel-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
  }

  .simple-dashboard-section-head p,
  .simple-dashboard-panel-head p {
    margin: 0;
    color: #cf654f;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  .simple-dashboard-section-head h2,
  .simple-dashboard-panel-head h2 {
    margin: 7px 0 0;
    font-family:
      var(--font-daldongne-serif),
      Batang,
      serif;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.04em;
  }

  .simple-dashboard-section-head > span {
    padding: 9px 13px;
    border-radius: 999px;
    background: #fff2e9;
    color: #a55d48;
    font-size: 12px;
    font-weight: 850;
    white-space: nowrap;
  }

  .simple-dashboard-actions {
    margin-top: 22px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 13px;
  }

  .simple-dashboard-action {
    position: relative;
    min-width: 0;
    min-height: 305px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border:
      1px solid
      rgba(135, 91, 70, 0.11);
    border-radius: 23px;
    background: #ffffff;
    box-shadow:
      0 12px 26px
      rgba(91, 62, 48, 0.045);
  }

  .simple-dashboard-action::after {
    position: absolute;
    right: -38px;
    bottom: -48px;
    width: 135px;
    height: 135px;
    border-radius: 50%;
    content: '';
    opacity: 0.5;
  }

  .simple-dashboard-action[data-tone='coral']::after {
    background: #ffe0d6;
  }

  .simple-dashboard-action[data-tone='apricot']::after {
    background: #ffedc5;
  }

  .simple-dashboard-action[data-tone='sage']::after {
    background: #dff2e7;
  }

  .simple-dashboard-action[data-tone='sky']::after {
    background: #deedf8;
  }

  .simple-dashboard-action-top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .simple-dashboard-icon {
    width: 59px;
    height: 59px;
    display: grid;
    place-items: center;
    border-radius: 18px;
  }

  .simple-dashboard-icon svg {
    width: 30px;
    height: 30px;
  }

  .simple-dashboard-action[data-tone='coral']
  .simple-dashboard-icon {
    background: #fff0ea;
    color: #d25d49;
  }

  .simple-dashboard-action[data-tone='apricot']
  .simple-dashboard-icon {
    background: #fff7e5;
    color: #b87b20;
  }

  .simple-dashboard-action[data-tone='sage']
  .simple-dashboard-icon {
    background: #edf8f1;
    color: #478168;
  }

  .simple-dashboard-action[data-tone='sky']
  .simple-dashboard-icon {
    background: #eef7fc;
    color: #4d7891;
  }

  .simple-dashboard-number {
    color: rgba(93, 65, 53, 0.3);
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .simple-dashboard-action h3 {
    position: relative;
    z-index: 1;
    margin: 17px 0 0;
    font-size: 20px;
    line-height: 1.4;
  }

  .simple-dashboard-action > p {
    position: relative;
    z-index: 1;
    margin: 7px 0 13px;
    color: #77665d;
    font-size: 13px;
    line-height: 1.65;
    word-break: keep-all;
  }

  .simple-dashboard-count {
    position: relative;
    z-index: 1;
    margin-top: auto;
    padding: 11px 12px;
    border-radius: 14px;
    background:
      rgba(248, 245, 242, 0.9);
  }

  .simple-dashboard-count strong {
    display: block;
    font-size: 19px;
    line-height: 1.3;
  }

  .simple-dashboard-count span {
    display: block;
    margin-top: 2px;
    color: #7d6c63;
    font-size: 10px;
    font-weight: 750;
    line-height: 1.5;
  }

  .simple-dashboard-action-link {
    position: relative;
    z-index: 1;
    min-height: 44px;
    margin-top: 10px;
    padding: 0 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border:
      1px solid
      rgba(149, 99, 76, 0.14);
    border-radius: 14px;
    background: #fffdfb;
    color: #60483d;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
  }

  .simple-dashboard-action-link > span {
    color: #d45d49;
    font-size: 17px;
  }

  .simple-dashboard-summary {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .simple-dashboard-summary-item {
    min-width: 0;
    padding: 17px 19px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border:
      1px solid
      rgba(133, 90, 69, 0.1);
    border-radius: 18px;
    background:
      rgba(255, 255, 255, 0.8);
    color: #665047;
    text-decoration: none;
    box-shadow:
      0 9px 22px
      rgba(94, 64, 49, 0.035);
  }

  .simple-dashboard-summary-item > span {
    font-size: 12px;
    font-weight: 800;
  }

  .simple-dashboard-summary-item strong {
    color: #44332c;
    font-size: 23px;
  }

  .simple-dashboard-summary-item small {
    margin-left: 3px;
    color: #856f64;
    font-size: 11px;
  }

  .simple-dashboard-lower {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      minmax(0, 1.25fr)
      minmax(310px, 0.75fr);
    gap: 16px;
    align-items: start;
  }

  .simple-dashboard-panel {
    padding: 26px;
    border:
      1px solid
      rgba(133, 90, 69, 0.11);
    border-radius: 27px;
    background:
      rgba(255, 255, 255, 0.86);
    box-shadow:
      0 14px 35px
      rgba(94, 63, 48, 0.05);
  }

  .simple-dashboard-panel-head {
    align-items: flex-start;
  }

  .simple-dashboard-panel-head h2 {
    font-size: 25px;
  }

  .simple-dashboard-panel-head > a {
    min-height: 36px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid
      rgba(145, 97, 74, 0.16);
    border-radius: 999px;
    color: #a45845;
    font-size: 11px;
    font-weight: 900;
    text-decoration: none;
    white-space: nowrap;
  }

  .simple-dashboard-recent {
    margin-top: 18px;
    display: grid;
    gap: 8px;
  }

  .simple-dashboard-recent-item {
    min-width: 0;
    min-height: 66px;
    padding: 11px 13px;
    display: grid;
    grid-template-columns:
      auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    border:
      1px solid
      rgba(130, 89, 68, 0.09);
    border-radius: 17px;
    background: #fffdfb;
    color: inherit;
    text-decoration: none;
  }

  .simple-dashboard-memory-icon {
    min-width: 48px;
    min-height: 32px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: #eef6fb;
    color: #4e7590;
    font-size: 10px;
    font-weight: 900;
  }

  .simple-dashboard-memory-icon[data-type='PHOTO'] {
    background: #fff1e9;
    color: #bd5c47;
  }

  .simple-dashboard-memory-copy {
    min-width: 0;
  }

  .simple-dashboard-memory-copy strong {
    display: block;
    overflow: hidden;
    color: #49372f;
    font-size: 13px;
    line-height: 1.5;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .simple-dashboard-memory-copy small {
    display: block;
    margin-top: 2px;
    color: #948077;
    font-size: 10px;
  }

  .simple-dashboard-recent-arrow {
    color: #ce6550;
    font-size: 16px;
  }

  .simple-dashboard-empty {
    margin-top: 18px;
    padding: 27px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border:
      1px dashed
      rgba(160, 105, 80, 0.22);
    border-radius: 20px;
    background: #fffaf6;
    text-align: center;
  }

  .simple-dashboard-empty > span {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 17px;
    background: #ffe9df;
    color: #cb5b47;
  }

  .simple-dashboard-empty svg {
    width: 27px;
    height: 27px;
  }

  .simple-dashboard-empty strong {
    margin-top: 12px;
    font-size: 15px;
  }

  .simple-dashboard-empty p {
    margin: 6px 0 0;
    color: #7b685e;
    font-size: 12px;
    line-height: 1.65;
  }

  .simple-dashboard-empty a {
    min-height: 40px;
    margin-top: 13px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
    background: #f0735e;
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
  }

  .simple-dashboard-side-links {
    margin-top: 18px;
    display: grid;
    gap: 8px;
  }

  .simple-dashboard-side-link {
    min-width: 0;
    min-height: 62px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border:
      1px solid
      rgba(134, 91, 70, 0.1);
    border-radius: 16px;
    background: #fffdfb;
    color: #4c3931;
    text-decoration: none;
  }

  .simple-dashboard-side-link span {
    min-width: 0;
  }

  .simple-dashboard-side-link strong,
  .simple-dashboard-side-link small {
    display: block;
  }

  .simple-dashboard-side-link strong {
    font-size: 13px;
    line-height: 1.5;
  }

  .simple-dashboard-side-link small {
    margin-top: 2px;
    overflow: hidden;
    color: #8a756b;
    font-size: 10px;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .simple-dashboard-side-link b {
    color: #cd634e;
    font-size: 16px;
  }

  .simple-dashboard-side-link[data-admin='true'] {
    border-color:
      rgba(98, 74, 62, 0.14);
    background:
      linear-gradient(
        135deg,
        #6e5549,
        #8c6a5a
      );
    color: #ffffff;
  }

  .simple-dashboard-side-link[data-admin='true']
  small,
  .simple-dashboard-side-link[data-admin='true']
  b {
    color:
      rgba(255, 255, 255, 0.8);
  }

  .simple-dashboard-help {
    margin: 17px 0 0;
    padding-top: 15px;
    border-top:
      1px solid
      rgba(132, 90, 69, 0.11);
    color: #715b50;
    font-family:
      var(--font-daldongne-serif),
      Batang,
      serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.7;
    word-break: keep-all;
  }

  @media (max-width: 1100px) {
    .simple-dashboard-actions,
    .simple-dashboard-summary {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 920px) {
    .simple-dashboard-hero,
    .simple-dashboard-lower {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .simple-dashboard {
      padding: 14px;
    }

    .simple-dashboard-hero {
      padding: 23px 18px;
      gap: 23px;
      border-radius: 24px;
    }

    .simple-dashboard-welcome h1 {
      font-size: 34px;
    }

    .simple-dashboard-section,
    .simple-dashboard-panel {
      padding: 19px 16px;
      border-radius: 22px;
    }

    .simple-dashboard-section-head {
      align-items: flex-start;
      flex-direction: column;
      gap: 9px;
    }

    .simple-dashboard-section-head h2,
    .simple-dashboard-panel-head h2 {
      font-size: 24px;
    }

    .simple-dashboard-actions,
    .simple-dashboard-summary {
      grid-template-columns: 1fr;
    }

    .simple-dashboard-action {
      min-height: 0;
    }

    .simple-dashboard-summary-item {
      min-height: 62px;
    }

    .simple-dashboard-panel-head {
      align-items: flex-start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .simple-dashboard *,
    .simple-dashboard *::before,
    .simple-dashboard *::after {
      transition: none !important;
      animation: none !important;
    }
  }
`;
