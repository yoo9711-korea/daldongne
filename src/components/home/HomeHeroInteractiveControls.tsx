import { auth } from "@/auth";
import Link from "next/link";

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
    label: "연인",
    icon: "couple",
    tone: "pink",
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

const actions = [
  {
    label: "사진 올리기",
    icon: "photo",
    path: "/dashboard/timeline",
    primary: true,
  },
  {
    label: "이야기 남기기",
    icon: "story",
    path: "/dashboard/interview",
    primary: false,
  },
  {
    label: "내 기억 보기",
    icon: "book",
    path: "/dashboard/library",
    primary: false,
  },
] as const;

export default async function HomeHeroInteractiveControls() {
  const session = await auth();

  const getHref = (path: string) =>
    session?.user
      ? path
      : `/login?callbackUrl=${encodeURIComponent(path)}`;

  return (
    <div
      className="home-hero-live-controls"
      aria-label="달동네 스토리 주요 기능"
    >
      <style>{styles}</style>

      <nav
        className="home-hero-live-categories"
        aria-label="기록할 대상 선택"
      >
        {categories.map((category) => (
          <Link
            key={category.label}
            href={getHref("/dashboard/timeline")}
            className="home-hero-live-category"
            data-tone={category.tone}
            aria-label={`${category.label}에 관한 사진과 기억 기록하기`}
          >
            <span aria-hidden="true">
              <HeroControlIcon name={category.icon} />
            </span>
            <strong>{category.label}</strong>
          </Link>
        ))}
      </nav>

      <nav
        className="home-hero-live-actions"
        aria-label="주요 기록 기능"
      >
        {actions.map((action) => (
          <Link
            key={action.label}
            href={getHref(action.path)}
            className="home-hero-live-action"
            data-primary={action.primary ? "true" : "false"}
          >
            <span aria-hidden="true">
              <HeroControlIcon name={action.icon} />
            </span>
            <strong>{action.label}</strong>
          </Link>
        ))}
      </nav>

      <nav
        className="home-hero-live-mobile"
        aria-label="모바일 주요 기록 기능"
      >
        {actions.map((action) => (
          <Link
            key={action.label}
            href={getHref(action.path)}
            data-primary={action.primary ? "true" : "false"}
          >
            <span aria-hidden="true">
              <HeroControlIcon name={action.icon} />
            </span>
            <strong>{action.label}</strong>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function HeroControlIcon({
  name,
}: {
  name:
    | "person"
    | "family"
    | "friends"
    | "couple"
    | "dog"
    | "cat"
    | "photo"
    | "story"
    | "book";
}) {
  if (name === "person") {
    return (
      <svg viewBox="0 0 48 48" role="img">
        <circle cx="24" cy="14" r="7" />
        <path d="M12 41v-8c0-7 5-12 12-12s12 5 12 12v8" />
      </svg>
    );
  }

  if (name === "family") {
    return (
      <svg viewBox="0 0 56 48" role="img">
        <circle cx="28" cy="12" r="6" />
        <circle cx="12" cy="18" r="5" />
        <circle cx="44" cy="18" r="5" />
        <path d="M18 42v-8c0-7 4-12 10-12s10 5 10 12v8" />
        <path d="M3 42v-6c0-6 4-10 9-10 3 0 5 1 7 4" />
        <path d="M53 42v-6c0-6-4-10-9-10-3 0-5 1-7 4" />
      </svg>
    );
  }

  if (name === "friends") {
    return (
      <svg viewBox="0 0 56 48" role="img">
        <circle cx="18" cy="14" r="6" />
        <circle cx="38" cy="14" r="6" />
        <path d="M7 42v-8c0-7 4-12 11-12s11 5 11 12v8" />
        <path d="M27 42v-8c0-7 4-12 11-12s11 5 11 12v8" />
      </svg>
    );
  }

  if (name === "couple") {
    return (
      <svg viewBox="0 0 56 48" role="img">
        <circle cx="17" cy="15" r="6" />
        <circle cx="39" cy="15" r="6" />
        <path d="M7 42v-8c0-7 4-12 10-12s10 5 10 12v8" />
        <path d="M29 42v-8c0-7 4-12 10-12s10 5 10 12v8" />
        <path d="M28 10c-4-6-11 0 0 8 11-8 4-14 0-8Z" />
      </svg>
    );
  }

  if (name === "dog") {
    return (
      <svg viewBox="0 0 52 48" role="img">
        <path d="M13 14 5 10l2 14c0 11 8 18 19 18s19-7 19-18l2-14-8 4" />
        <path d="M17 16c3-3 15-3 18 0v10c0 7-4 11-9 11s-9-4-9-11Z" />
        <circle cx="20" cy="23" r="1.5" fill="currentColor" />
        <circle cx="32" cy="23" r="1.5" fill="currentColor" />
        <path d="M23 29h6l-3 4Z" />
      </svg>
    );
  }

  if (name === "cat") {
    return (
      <svg viewBox="0 0 52 48" role="img">
        <path d="m10 16 7-8 5 7h8l5-7 7 8v14c0 8-7 13-16 13S10 38 10 30Z" />
        <circle cx="20" cy="25" r="1.5" fill="currentColor" />
        <circle cx="32" cy="25" r="1.5" fill="currentColor" />
        <path d="M23 31h6M15 29H7m8 4H8m29-4h8m-8 4h7" />
      </svg>
    );
  }

  if (name === "photo") {
    return (
      <svg viewBox="0 0 52 48" role="img">
        <rect x="6" y="7" width="35" height="31" rx="3" />
        <circle cx="31" cy="17" r="4" />
        <path d="m9 34 10-11 8 8 6-6 8 9" />
        <path d="M43 30h7M46.5 26.5v7" />
      </svg>
    );
  }

  if (name === "story") {
    return (
      <svg viewBox="0 0 48 48" role="img">
        <path d="m10 34 4-10L34 4l10 10-20 20-10 4Z" />
        <path d="m30 8 10 10M14 24l10 10" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 52 48" role="img">
      <path d="M5 8c8-3 15-1 21 4v30c-6-5-13-7-21-4Z" />
      <path d="M47 8c-8-3-15-1-21 4v30c6-5 13-7 21-4Z" />
      <path d="M26 12v30" />
    </svg>
  );
}

const styles = `
  .home-hero-live-controls,
  .home-hero-live-controls * {
    box-sizing: border-box;
  }

  .home-hero-live-controls {
    position: absolute;
    inset: 0;
    z-index: 6;
    pointer-events: none;
    container-type: inline-size;
  }

  .home-hero-live-categories {
    position: absolute;
    left: 8.8%;
    top: 51.6%;
    width: 60.3%;
    height: 10.8%;
    padding: 0.72cqw;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.62cqw;
    border: 1px solid rgba(107, 84, 66, 0.08);
    border-radius: 1.18cqw;
    background: rgba(255, 255, 255, 0.985);
    box-shadow:
      0 0.3cqw 1.2cqw rgba(82, 58, 45, 0.08);
    pointer-events: auto;
  }

  .home-hero-live-category {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.62cqw;
    border: 1px solid transparent;
    border-radius: 0.72cqw;
    color: #352f2c;
    text-decoration: none;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .home-hero-live-category[data-tone="mint"] {
    color: #1c6b50;
    background: #e5f7ef;
  }

  .home-hero-live-category[data-tone="sky"] {
    color: #275b85;
    background: #e8f4fd;
  }

  .home-hero-live-category[data-tone="yellow"] {
    color: #8a681b;
    background: #fff5cc;
  }

  .home-hero-live-category[data-tone="pink"] {
    color: #a03f61;
    background: #fde9ef;
  }

  .home-hero-live-category[data-tone="rose"] {
    color: #a94d44;
    background: #fff0ec;
  }

  .home-hero-live-category[data-tone="blue"] {
    color: #315c84;
    background: #edf4ff;
  }

  .home-hero-live-category > span {
    width: 2.05cqw;
    height: 2.05cqw;
    flex: 0 0 auto;
  }

  .home-hero-live-category svg,
  .home-hero-live-action svg,
  .home-hero-live-mobile svg {
    width: 100%;
    height: 100%;
    display: block;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .home-hero-live-category strong {
    overflow: hidden;
    color: #302c29;
    font-size: 1.43cqw;
    font-weight: 850;
    line-height: 1;
    white-space: nowrap;
  }

  .home-hero-live-actions {
    position: absolute;
    left: 12.85%;
    top: 64.7%;
    width: 54.25%;
    height: 7.75%;
    display: grid;
    grid-template-columns:
      minmax(0, 1.05fr)
      minmax(0, 1fr)
      minmax(0, 1fr);
    gap: 0.85cqw;
    pointer-events: auto;
  }

  .home-hero-live-action {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.82cqw;
    border: 1px solid rgba(111, 87, 70, 0.18);
    border-radius: 0.7cqw;
    color: #3d3834;
    background: rgba(255, 255, 255, 0.99);
    box-shadow:
      0 0.2cqw 0.7cqw rgba(75, 53, 41, 0.06);
    text-decoration: none;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .home-hero-live-action[data-primary="true"] {
    color: #fff;
    border-color: #fb6558;
    background:
      linear-gradient(
        135deg,
        #ff6c5e,
        #ff5e55
      );
    box-shadow:
      0 0.38cqw 1.1cqw rgba(234, 81, 70, 0.2);
  }

  .home-hero-live-action > span {
    width: 2.05cqw;
    height: 2.05cqw;
    flex: 0 0 auto;
  }

  .home-hero-live-action strong {
    overflow: hidden;
    font-size: 1.23cqw;
    font-weight: 850;
    line-height: 1;
    white-space: nowrap;
  }

  .home-hero-live-category:hover,
  .home-hero-live-action:hover {
    transform: translateY(-0.16cqw);
    border-color: rgba(171, 101, 78, 0.34);
    box-shadow:
      0 0.5cqw 1.4cqw rgba(81, 56, 43, 0.13);
  }

  .home-hero-live-category:focus-visible,
  .home-hero-live-action:focus-visible,
  .home-hero-live-mobile a:focus-visible {
    outline: 0.2cqw solid #df604d;
    outline-offset: 0.18cqw;
  }

  .home-hero-live-mobile {
    display: none;
  }

  @container (max-width: 720px) {
    .home-hero-live-categories,
    .home-hero-live-actions {
      display: none;
    }

    .home-hero-live-mobile {
      position: absolute;
      left: 4%;
      right: 4%;
      bottom: 4%;
      padding: 8px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
      border: 1px solid rgba(111, 87, 70, 0.14);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow:
        0 10px 30px rgba(75, 53, 41, 0.14);
      backdrop-filter: blur(8px);
      pointer-events: auto;
    }

    .home-hero-live-mobile a {
      min-width: 0;
      min-height: 48px;
      padding: 7px 5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      border: 1px solid rgba(111, 87, 70, 0.15);
      border-radius: 10px;
      color: #4a3a33;
      background: #fff;
      text-decoration: none;
    }

    .home-hero-live-mobile a[data-primary="true"] {
      color: #fff;
      border-color: #fb6558;
      background: #ff6358;
    }

    .home-hero-live-mobile span {
      width: 23px;
      height: 23px;
    }

    .home-hero-live-mobile strong {
      overflow: hidden;
      max-width: 100%;
      font-size: 11px;
      font-weight: 850;
      white-space: nowrap;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .home-hero-live-category,
    .home-hero-live-action {
      transition: none;
    }
  }
`;
