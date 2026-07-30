"use client";

import Image from "next/image";
import Link from "next/link";

type ControlItem = {
  label: string;
  href: string;
  tone: "mint" | "blue" | "yellow" | "pink" | "peach";
  icon: "person" | "people" | "heart" | "dog" | "cat";
};

const relationshipItems: ControlItem[] = [
  {
    label: "나",
    href: "/dashboard/timeline",
    tone: "mint",
    icon: "person",
  },
  {
    label: "가족",
    href: "/dashboard/timeline",
    tone: "blue",
    icon: "people",
  },
  {
    label: "친구",
    href: "/dashboard/timeline",
    tone: "yellow",
    icon: "people",
  },
  {
    label: "연인",
    href: "/dashboard/timeline",
    tone: "pink",
    icon: "heart",
  },
  {
    label: "강아지",
    href: "/dashboard/timeline",
    tone: "peach",
    icon: "dog",
  },
  {
    label: "고양이",
    href: "/dashboard/timeline",
    tone: "blue",
    icon: "cat",
  },
];

const actionItems = [
  {
    label: "사진 올리기",
    href: "/dashboard/timeline",
    icon: "photo",
    primary: true,
  },
  {
    label: "이야기 남기기",
    href: "/dashboard/interview",
    icon: "write",
    primary: false,
  },
  {
    label: "내 기억 보기",
    href: "/dashboard/library",
    icon: "book",
    primary: false,
  },
] as const;

export default function HomeHeroInteractiveControls(
  _props: Record<string, unknown>,
) {
  return (
    <div className="storybook-live-hero">
      <style>{styles}</style>
      <nav
        className="storybook-live-relationships storybook-live-relationships--image"
        aria-label="기록할 관계 선택"
      >
        <Image
          src="/home/relationship/relationship-watercolor-v1.webp"
          alt="나, 가족, 친구, 연인, 강아지, 고양이 중 기록할 이야기를 선택하는 수채화 카드"
          fill
          priority
          sizes="(max-width: 820px) 92vw, 89vw"
          className="storybook-live-relationship-image"
        />

        {relationshipItems.map((item, index) => (
          <Link
            key={item.label}
            href={item.href}
            className="storybook-live-relationship-hotspot"
            data-index={index + 1}
            aria-label={`${item.label} 이야기 기록하기`}
          >
            <span className="sr-only">{item.label}</span>
          </Link>
        ))}
      </nav>

      <nav
        className="storybook-live-actions"
        aria-label="달동네 스토리 주요 기능"
      >
        {actionItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="storybook-live-action"
            data-primary={item.primary ? "true" : "false"}
          >
            <ActionIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <section
        className="storybook-live-values"
        aria-label="달동네 스토리 서비스 특징"
      >
        <ValueItem
          icon="shield"
          title="안전하게 보관"
          description="소중한 사진과 이야기를 차곡차곡 지켜드려요"
        />
        <ValueItem
          icon="book"
          title="책으로 제작"
          description="세상에 하나뿐인 스토리북으로 완성해요"
        />
        <ValueItem
          icon="heart"
          title="마음에 남는 선물"
          description="사랑하는 사람과 오래 기억할 이야기를 나눠요"
        />
      </section>
    </div>
  );
}

function ValueItem({
  icon,
  title,
  description,
}: {
  icon: "shield" | "book" | "heart";
  title: string;
  description: string;
}) {
  return (
    <article>
      <ValueIcon name={icon} />
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </article>
  );
}

function ControlIcon({
  name,
}: {
  name: ControlItem["icon"];
}) {
  if (name === "dog") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M9 12 5 8v10l4 2M23 12l4-4v10l-4 2M9 12c1-3 4-5 7-5s6 2 7 5v8c0 5-3 8-7 8s-7-3-7-8v-8Z" />
        <circle cx="13" cy="17" r="1" />
        <circle cx="19" cy="17" r="1" />
        <path d="M14 22c1.3 1 2.7 1 4 0" />
      </svg>
    );
  }

  if (name === "cat") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="m9 11-3-5v14c0 5 4 8 10 8s10-3 10-8V6l-3 5c-2-2-4-3-7-3s-5 1-7 3Z" />
        <circle cx="12" cy="18" r="1" />
        <circle cx="20" cy="18" r="1" />
        <path d="M14 22h4M8 21l-5-1M24 21l5-1" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 27S5 20 5 12c0-4 3-7 7-7 2 0 4 1 5 3 1-2 3-3 5-3 4 0 7 3 7 7 0 8-11 15-13 15Z" />
      </svg>
    );
  }

  if (name === "people") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="11" cy="10" r="4" />
        <circle cx="21" cy="10" r="4" />
        <path d="M4 27v-5c0-4 3-7 7-7s7 3 7 7v5M14 27v-5c0-4 3-7 7-7s7 3 7 7v5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="9" r="5" />
      <path d="M7 28v-7c0-5 4-8 9-8s9 3 9 8v7H7Z" />
    </svg>
  );
}

function ActionIcon({
  name,
}: {
  name: "photo" | "write" | "book";
}) {
  if (name === "write") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="m7 25 3-8L22 5l5 5-12 12-8 3Z" />
        <path d="m18 9 5 5M7 25l5-1-4-4-1 5Z" />
      </svg>
    );
  }

  if (name === "book") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 7c5-2 9-1 12 3v18c-3-4-7-5-12-3V7ZM28 7c-5-2-9-1-12 3v18c3-4 7-5 12-3V7Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="6" width="24" height="20" rx="3" />
      <circle cx="21" cy="12" r="2" />
      <path d="m7 23 6-7 4 4 3-3 5 6M27 3v7M23.5 6.5h7" />
    </svg>
  );
}

function ValueIcon({
  name,
}: {
  name: "shield" | "book" | "heart";
}) {
  if (name === "shield") {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 4c5 4 10 5 15 5v10c0 9-6 15-15 18C11 34 5 28 5 19V9c5 0 10-1 15-5Z" />
        <path d="m13 20 5 5 10-11" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 34S6 25 6 15c0-5 4-9 9-9 3 0 5 1 7 4 2-3 4-4 7-4 5 0 9 4 9 9 0 10-14 19-18 19Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M5 8c6-2 11-1 15 4v23c-4-5-9-6-15-4V8ZM35 8c-6-2-11-1-15 4v23c4-5 9-6 15-4V8Z" />
    </svg>
  );
}

const styles = `
  .storybook-live-hero {
    position: absolute;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    color: #4c352a;
  }

  .storybook-live-relationships {
    position: absolute;
    top: 57%;
    left: 6%;
    right: 6%;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 1.1%;
    padding: 1.1%;
    border: 1px solid rgba(229, 215, 202, 0.92);
    border-radius: 2.2vw;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 18px 45px rgba(93, 62, 43, 0.11);
    pointer-events: auto;
  }

  .storybook-live-relationship {
    min-height: clamp(52px, 5.4vw, 102px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(5px, 0.7vw, 14px);
    border: 1px solid transparent;
    border-radius: clamp(11px, 1.15vw, 22px);
    color: #4c352a;
    text-decoration: none;
    font-size: clamp(14px, 1.35vw, 27px);
    font-weight: 850;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease,
      border-color 160ms ease;
  }

  .storybook-live-relationship svg {
    width: clamp(22px, 2.1vw, 42px);
    height: clamp(22px, 2.1vw, 42px);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .storybook-live-relationship[data-tone="mint"] {
    color: #287c65;
    background: #e7f6ef;
  }

  .storybook-live-relationship[data-tone="blue"] {
    color: #376faa;
    background: #e8f2ff;
  }

  .storybook-live-relationship[data-tone="yellow"] {
    color: #9a701d;
    background: #fff4c8;
  }

  .storybook-live-relationship[data-tone="pink"] {
    color: #b65370;
    background: #ffe9ef;
  }

  .storybook-live-relationship[data-tone="peach"] {
    color: #b85f47;
    background: #ffebe3;
  }

  .storybook-live-relationship:hover,
  .storybook-live-relationship:focus-visible {
    transform: translateY(-3px);
    border-color: currentColor;
    box-shadow: 0 10px 22px rgba(80, 53, 39, 0.12);
    outline: none;
  }

  .storybook-live-actions {
    position: absolute;
    top: 70.3%;
    left: 15.2%;
    right: 15.2%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.7%;
    pointer-events: auto;
  }

  .storybook-live-action {
    min-height: clamp(58px, 5.5vw, 108px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(8px, 1vw, 19px);
    border: 1px solid #e3d7cd;
    border-radius: clamp(12px, 1.15vw, 23px);
    color: #4b3930;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 12px 30px rgba(87, 57, 42, 0.09);
    text-decoration: none;
    font-size: clamp(15px, 1.45vw, 29px);
    font-weight: 900;
    transition:
      transform 160ms ease,
      box-shadow 160ms ease;
  }

  .storybook-live-action[data-primary="true"] {
    color: #fff;
    border-color: #ff6454;
    background: linear-gradient(135deg, #ff6959, #f05c4e);
  }

  .storybook-live-action svg {
    width: clamp(25px, 2.25vw, 45px);
    height: clamp(25px, 2.25vw, 45px);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .storybook-live-action:hover,
  .storybook-live-action:focus-visible {
    transform: translateY(-3px);
    box-shadow: 0 16px 34px rgba(87, 57, 42, 0.15);
    outline: none;
  }

  .storybook-live-values {
    position: absolute;
    left: 7%;
    right: 7%;
    bottom: 3.4%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2.2%;
    padding: 1.6% 2.1%;
    border-radius: clamp(15px, 1.6vw, 30px);
    color: #3d5e51;
    background: linear-gradient(
      135deg,
      rgba(222, 240, 230, 0.96),
      rgba(236, 245, 233, 0.96)
    );
    pointer-events: none;
  }

  .storybook-live-values article {
    display: flex;
    align-items: center;
    gap: clamp(8px, 1vw, 20px);
    min-width: 0;
  }

  .storybook-live-values svg {
    flex: 0 0 auto;
    width: clamp(28px, 2.5vw, 51px);
    height: clamp(28px, 2.5vw, 51px);
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .storybook-live-values strong,
  .storybook-live-values span {
    display: block;
  }

  .storybook-live-values strong {
    font-size: clamp(13px, 1.16vw, 23px);
  }

  .storybook-live-values span {
    margin-top: 4px;
    overflow: hidden;
    color: #678074;
    font-size: clamp(10px, 0.8vw, 16px);
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 820px) {
    .storybook-live-relationships {
      top: 55%;
      left: 4.5%;
      right: 4.5%;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
      padding: 8px;
      border-radius: 16px;
    }

    .storybook-live-relationship {
      min-height: 42px;
      gap: 5px;
      border-radius: 10px;
      font-size: 12px;
    }

    .storybook-live-relationship svg {
      width: 19px;
      height: 19px;
    }

    .storybook-live-actions {
      top: 73.5%;
      left: 5.5%;
      right: 5.5%;
      gap: 7px;
    }

    .storybook-live-action {
      min-height: 45px;
      gap: 5px;
      padding: 5px;
      border-radius: 11px;
      font-size: 11px;
    }

    .storybook-live-action svg {
      width: 19px;
      height: 19px;
    }

    .storybook-live-values {
      left: 4.5%;
      right: 4.5%;
      bottom: 2.4%;
      gap: 5px;
      padding: 8px;
      border-radius: 13px;
    }

    .storybook-live-values article {
      justify-content: center;
      gap: 5px;
      text-align: center;
    }

    .storybook-live-values svg {
      width: 22px;
      height: 22px;
    }

    .storybook-live-values strong {
      font-size: 10px;
    }

    .storybook-live-values span {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .storybook-live-relationships {
      top: 53.5%;
    }

    .storybook-live-actions {
      top: 74.5%;
    }

    .storybook-live-action {
      font-size: 10px;
    }
  }


/* Daldongne relationship card redesign v1 */

  .storybook-live-relationships {
    top: 56.5%;
    left: 5.5%;
    right: 5.5%;
    gap: 0.9%;
    padding: 1%;
    border: 1px solid rgba(126, 90, 69, 0.16);
    border-radius: clamp(20px, 2vw, 38px);
    background:
      radial-gradient(
        circle at 14% 20%,
        rgba(255, 255, 255, 0.96),
        transparent 35%
      ),
      linear-gradient(
        180deg,
        rgba(255, 253, 248, 0.98),
        rgba(248, 240, 230, 0.98)
      );
    box-shadow:
      0 18px 42px rgba(91, 62, 44, 0.11),
      inset 0 1px 0 rgba(255, 255, 255, 0.96);
  }

  .storybook-live-relationship {
    --relationship-accent: #8f725f;
    --relationship-soft: #f4ede6;

    position: relative;
    min-height: clamp(52px, 5.4vw, 102px);
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-items: center;
    justify-content: initial;
    column-gap: clamp(7px, 0.75vw, 15px);
    padding:
      clamp(7px, 0.7vw, 14px)
      clamp(8px, 0.85vw, 17px);
    overflow: hidden;
    border: 1px solid rgba(139, 105, 83, 0.18);
    border-radius: clamp(13px, 1.15vw, 22px);
    color: var(--relationship-accent);
    box-shadow:
      0 8px 20px rgba(83, 56, 40, 0.07),
      inset 0 1px 0 #ffffff;
    font-size: clamp(13px, 1.23vw, 24px);
    font-weight: 850;
    transition:
      transform 170ms ease,
      border-color 170ms ease,
      box-shadow 170ms ease;
  }

  .storybook-live-relationship[data-tone] {
    color: var(--relationship-accent);
    background:
      linear-gradient(
        145deg,
        rgba(255, 255, 255, 0.99),
        rgba(249, 243, 236, 0.98)
      );
  }

  .storybook-live-relationship::before {
    content: "";
    position: absolute;
    top: 0;
    right: 15%;
    left: 15%;
    height: 3px;
    border-radius: 0 0 999px 999px;
    background: var(--relationship-accent);
    opacity: 0.58;
  }

  .storybook-live-relationship svg {
    grid-row: 1 / 3;
    width: clamp(28px, 2.45vw, 48px);
    height: clamp(28px, 2.45vw, 48px);
    padding: clamp(5px, 0.45vw, 9px);
    border: 1px solid rgba(126, 90, 69, 0.11);
    border-radius: 50%;
    color: var(--relationship-accent);
    background: var(--relationship-soft);
    stroke-width: 1.65;
  }

  .storybook-live-relationship > span {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    color: #4c352a;
    line-height: 1.08;
    white-space: nowrap;
  }

  .storybook-live-relationship > span::after {
    content: "";
    margin-top: clamp(3px, 0.3vw, 6px);
    overflow: hidden;
    color: #927d70;
    font-size: clamp(8px, 0.68vw, 13px);
    font-weight: 600;
    letter-spacing: -0.02em;
    text-overflow: ellipsis;
  }

  .storybook-live-relationship:nth-child(1) > span::after {
    content: "나의 오늘";
  }

  .storybook-live-relationship:nth-child(2) > span::after {
    content: "함께한 시간";
  }

  .storybook-live-relationship:nth-child(3) > span::after {
    content: "웃음과 우정";
  }

  .storybook-live-relationship:nth-child(4) > span::after {
    content: "우리의 순간";
  }

  .storybook-live-relationship:nth-child(5) > span::after {
    content: "산책과 교감";
  }

  .storybook-live-relationship:nth-child(6) > span::after {
    content: "포근한 하루";
  }

  .storybook-live-relationship[data-tone="mint"] {
    --relationship-accent: #648675;
    --relationship-soft: #eaf2ed;
  }

  .storybook-live-relationship[data-tone="blue"] {
    --relationship-accent: #6c7f90;
    --relationship-soft: #edf1f3;
  }

  .storybook-live-relationship[data-tone="yellow"] {
    --relationship-accent: #a77b35;
    --relationship-soft: #f8f0df;
  }

  .storybook-live-relationship[data-tone="pink"] {
    --relationship-accent: #a66a72;
    --relationship-soft: #f7ecec;
  }

  .storybook-live-relationship[data-tone="peach"] {
    --relationship-accent: #a96850;
    --relationship-soft: #f8ece6;
  }

  .storybook-live-relationship:hover,
  .storybook-live-relationship:focus-visible {
    transform: translateY(-4px);
    border-color: var(--relationship-accent);
    box-shadow:
      0 14px 28px rgba(80, 53, 39, 0.13),
      inset 0 1px 0 #ffffff;
    outline: none;
  }

  .storybook-live-relationship:active {
    transform: translateY(-1px) scale(0.99);
  }

  @media (max-width: 820px) {
    .storybook-live-relationships {
      top: 55%;
      left: 4.5%;
      right: 4.5%;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
      padding: 8px;
      border-radius: 16px;
    }

    .storybook-live-relationship {
      min-height: 42px;
      grid-template-columns: auto minmax(0, 1fr);
      column-gap: 5px;
      padding: 5px 7px;
      border-radius: 10px;
      font-size: 12px;
    }

    .storybook-live-relationship svg {
      width: 24px;
      height: 24px;
      padding: 4px;
    }

    .storybook-live-relationship > span::after {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .storybook-live-relationships {
      top: 53.5%;
    }

    .storybook-live-relationship {
      padding-right: 5px;
      padding-left: 5px;
      font-size: 11px;
    }

    .storybook-live-relationship svg {
      width: 22px;
      height: 22px;
    }
  }


  /* Daldongne relationship watercolor image v1 */
  .storybook-live-relationships--image {
    top: 55.8%;
    left: 3.2%;
    right: 3.2%;
    height: 24.8%;
    display: block;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: clamp(16px, 1.8vw, 30px);
    background: transparent;
    box-shadow:
      0 15px 36px rgba(78, 54, 38, 0.11);
  }

  .storybook-live-relationship-image {
    object-fit: cover;
    object-position: center;
    pointer-events: none;
    user-select: none;
  }

  .storybook-live-relationship-hotspot {
    position: absolute;
    top: 31%;
    bottom: 4%;
    z-index: 2;
    width: 14.2%;
    border-radius: clamp(10px, 1.3vw, 22px);
    text-decoration: none;
    outline: none;
    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      background 150ms ease;
  }

  .storybook-live-relationship-hotspot[data-index="1"] {
    left: 2.2%;
  }

  .storybook-live-relationship-hotspot[data-index="2"] {
    left: 18.4%;
  }

  .storybook-live-relationship-hotspot[data-index="3"] {
    left: 34.4%;
  }

  .storybook-live-relationship-hotspot[data-index="4"] {
    left: 50.5%;
  }

  .storybook-live-relationship-hotspot[data-index="5"] {
    left: 66.5%;
  }

  .storybook-live-relationship-hotspot[data-index="6"] {
    left: 82.5%;
  }

  .storybook-live-relationship-hotspot:hover,
  .storybook-live-relationship-hotspot:focus-visible {
    transform: translateY(-3px);
    background: rgba(255, 255, 255, 0.12);
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.7);
  }

  .storybook-live-relationship-hotspot:focus-visible {
    outline: 3px solid rgba(169, 112, 37, 0.55);
    outline-offset: -3px;
  }

  @media (max-width: 820px) {
    .storybook-live-relationships--image {
      top: 53.8%;
      left: 2.5%;
      right: 2.5%;
      height: 27.5%;
      border-radius: 13px;
    }

    .storybook-live-relationship-hotspot {
      top: 31%;
      bottom: 4%;
      width: 14.4%;
      border-radius: 9px;
    }
  }

  @media (max-width: 480px) {
    .storybook-live-relationships--image {
      top: 52.8%;
      height: 28.5%;
    }
  }




/* Daldongne relationship controls restore v2 */

  /*
   * 나·가족·친구·연인·강아지·고양이 관계 선택 카드
   */
  .storybook-live-relationships {
    display: grid !important;
    top: 37.5% !important;
    left: 7% !important;
    right: 7% !important;
    z-index: 7 !important;
    grid-template-columns:
      repeat(6, minmax(0, 1fr)) !important;
    gap: clamp(8px, 0.9vw, 16px) !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    pointer-events: auto !important;
  }

  .storybook-live-relationship {
    position: relative !important;
    min-height:
      clamp(76px, 6.7vw, 112px) !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: clamp(6px, 0.6vw, 10px) !important;
    padding:
      clamp(9px, 0.8vw, 14px)
      clamp(6px, 0.7vw, 12px) !important;
    overflow: hidden !important;
    border:
      1px solid
      rgba(137, 101, 78, 0.18) !important;
    border-radius:
      clamp(15px, 1.25vw, 22px) !important;
    color: #4c352a !important;
    background:
      linear-gradient(
        145deg,
        rgba(255, 255, 255, 0.97),
        rgba(252, 247, 240, 0.96)
      ) !important;
    box-shadow:
      0 12px 28px rgba(76, 50, 36, 0.10),
      inset 0 1px 0 rgba(255, 255, 255, 0.96) !important;
    backdrop-filter: blur(10px);
    text-align: center !important;
    text-decoration: none !important;
    font-size:
      clamp(13px, 1.15vw, 21px) !important;
    font-weight: 850 !important;
    transition:
      transform 170ms ease,
      border-color 170ms ease,
      box-shadow 170ms ease !important;
  }

  .storybook-live-relationship::before {
    display: none !important;
  }

  .storybook-live-relationship svg {
    grid-row: auto !important;
    width:
      clamp(31px, 2.65vw, 46px) !important;
    height:
      clamp(31px, 2.65vw, 46px) !important;
    padding:
      clamp(6px, 0.5vw, 9px) !important;
    border:
      1px solid
      rgba(126, 90, 69, 0.11) !important;
    border-radius: 50% !important;
    color: var(
      --relationship-accent,
      #8c6d58
    ) !important;
    background: var(
      --relationship-soft,
      #f4eee8
    ) !important;
    fill: none !important;
    stroke: currentColor !important;
    stroke-width: 1.7 !important;
    stroke-linecap: round !important;
    stroke-linejoin: round !important;
  }

  .storybook-live-relationship > span {
    min-width: 0 !important;
    display: block !important;
    color: #4a342a !important;
    line-height: 1.1 !important;
    text-align: center !important;
    white-space: nowrap !important;
  }

  .storybook-live-relationship > span::after {
    display: none !important;
  }

  .storybook-live-relationship[data-tone="mint"] {
    --relationship-accent: #628473;
    --relationship-soft: #eaf2ed;
  }

  .storybook-live-relationship[data-tone="blue"] {
    --relationship-accent: #667f94;
    --relationship-soft: #edf2f5;
  }

  .storybook-live-relationship[data-tone="yellow"] {
    --relationship-accent: #a27a39;
    --relationship-soft: #f8f0df;
  }

  .storybook-live-relationship[data-tone="pink"] {
    --relationship-accent: #a66c76;
    --relationship-soft: #f8ecee;
  }

  .storybook-live-relationship[data-tone="peach"] {
    --relationship-accent: #a76b53;
    --relationship-soft: #f8ece6;
  }

  .storybook-live-relationship:hover,
  .storybook-live-relationship:focus-visible {
    transform: translateY(-4px) !important;
    border-color:
      var(--relationship-accent) !important;
    box-shadow:
      0 17px 34px rgba(76, 50, 36, 0.15),
      inset 0 1px 0 #ffffff !important;
    outline: none !important;
  }

  .storybook-live-relationship:active {
    transform:
      translateY(-1px)
      scale(0.99) !important;
  }

  /*
   * 실제 기능 버튼 3개
   */
  .storybook-live-actions {
    top: 61.5% !important;
    bottom: auto !important;
    left: 13% !important;
    right: 13% !important;
    z-index: 8 !important;
    grid-template-columns:
      repeat(3, minmax(0, 1fr)) !important;
    gap:
      clamp(9px, 1.2vw, 20px) !important;
    pointer-events: auto !important;
  }

  .storybook-live-action {
    min-height:
      clamp(55px, 5vw, 88px) !important;
    gap:
      clamp(7px, 0.85vw, 15px) !important;
    padding:
      clamp(8px, 0.75vw, 14px)
      clamp(10px, 1vw, 20px) !important;
    border:
      1px solid
      rgba(126, 90, 69, 0.18) !important;
    border-radius:
      clamp(14px, 1.2vw, 22px) !important;
    color: #4a352b !important;
    background:
      rgba(255, 253, 249, 0.97) !important;
    box-shadow:
      0 12px 28px
      rgba(78, 51, 37, 0.11) !important;
    backdrop-filter: blur(12px);
    font-size:
      clamp(14px, 1.25vw, 23px) !important;
    font-weight: 850 !important;
  }

  .storybook-live-action[data-primary="true"] {
    border-color: #f76555 !important;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ff6d5d,
        #ed5a4d
      ) !important;
    box-shadow:
      0 14px 30px
      rgba(221, 83, 66, 0.22) !important;
  }

  .storybook-live-action svg {
    width:
      clamp(24px, 2vw, 38px) !important;
    height:
      clamp(24px, 2vw, 38px) !important;
    flex: 0 0 auto !important;
  }

  /*
   * 메인 이미지의 하단 설명 카드는 숨김
   */
  .storybook-live-values {
    display: none !important;
  }

  @media (max-width: 820px) {
    .storybook-live-relationships {
      top: 40% !important;
      left: 4.5% !important;
      right: 4.5% !important;
      grid-template-columns:
        repeat(3, minmax(0, 1fr)) !important;
      gap: 7px !important;
    }

    .storybook-live-relationship {
      min-height: 51px !important;
      flex-direction: row !important;
      gap: 5px !important;
      padding: 5px 7px !important;
      border-radius: 11px !important;
      font-size: 12px !important;
    }

    .storybook-live-relationship svg {
      width: 25px !important;
      height: 25px !important;
      padding: 4px !important;
    }

    .storybook-live-actions {
      top: 72.5% !important;
      bottom: auto !important;
      left: 4.5% !important;
      right: 4.5% !important;
      gap: 7px !important;
    }

    .storybook-live-action {
      min-height: 44px !important;
      gap: 5px !important;
      padding: 5px 6px !important;
      border-radius: 11px !important;
      font-size: 11px !important;
    }

    .storybook-live-action svg {
      width: 19px !important;
      height: 19px !important;
    }
  }

  @media (max-width: 480px) {
    .storybook-live-relationships {
      top: 39% !important;
      left: 3% !important;
      right: 3% !important;
      gap: 5px !important;
    }

    .storybook-live-relationship {
      min-height: 43px !important;
      gap: 4px !important;
      padding: 4px !important;
      border-radius: 9px !important;
      font-size: 10px !important;
    }

    .storybook-live-relationship svg {
      width: 21px !important;
      height: 21px !important;
      padding: 3px !important;
    }

    .storybook-live-actions {
      top: 73.5% !important;
      left: 3% !important;
      right: 3% !important;
      gap: 5px !important;
    }

    .storybook-live-action {
      min-height: 40px !important;
      padding: 4px !important;
      font-size: 9px !important;
      letter-spacing: -0.04em !important;
    }

    .storybook-live-action svg {
      width: 17px !important;
      height: 17px !important;
    }
  }


/* Daldongne duplicate relationship overlay cleanup v3 */

  /*
   * 메인 배경 이미지 안에 관계 카드와 글자가 이미 있으므로
   * 바깥에 중복 출력되는 실제 관계 버튼만 숨깁니다.
   */
  .storybook-live-relationships {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /*
   * 사진 올리기·이야기 남기기·내 기억 보기 버튼은 유지합니다.
   */
  .storybook-live-actions {
    top: 61.5% !important;
    bottom: auto !important;
    left: 13% !important;
    right: 13% !important;
    z-index: 8 !important;
    grid-template-columns:
      repeat(3, minmax(0, 1fr)) !important;
    gap: clamp(9px, 1.2vw, 20px) !important;
    pointer-events: auto !important;
  }

  .storybook-live-action {
    min-height:
      clamp(55px, 5vw, 88px) !important;
    gap:
      clamp(7px, 0.85vw, 15px) !important;
    padding:
      clamp(8px, 0.75vw, 14px)
      clamp(10px, 1vw, 20px) !important;
    border:
      1px solid
      rgba(126, 90, 69, 0.18) !important;
    border-radius:
      clamp(14px, 1.2vw, 22px) !important;
    color: #4a352b !important;
    background:
      rgba(255, 253, 249, 0.97) !important;
    box-shadow:
      0 12px 28px
      rgba(78, 51, 37, 0.11) !important;
    backdrop-filter: blur(12px);
    font-size:
      clamp(14px, 1.25vw, 23px) !important;
    font-weight: 850 !important;
  }

  .storybook-live-action[data-primary="true"] {
    border-color: #f76555 !important;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ff6d5d,
        #ed5a4d
      ) !important;
    box-shadow:
      0 14px 30px
      rgba(221, 83, 66, 0.22) !important;
  }

  .storybook-live-action svg {
    width:
      clamp(24px, 2vw, 38px) !important;
    height:
      clamp(24px, 2vw, 38px) !important;
    flex: 0 0 auto !important;
  }

  .storybook-live-values {
    display: none !important;
  }

  @media (max-width: 820px) {
    .storybook-live-actions {
      top: 72.5% !important;
      bottom: auto !important;
      left: 4.5% !important;
      right: 4.5% !important;
      gap: 7px !important;
    }

    .storybook-live-action {
      min-height: 44px !important;
      gap: 5px !important;
      padding: 5px 6px !important;
      border-radius: 11px !important;
      font-size: 11px !important;
    }

    .storybook-live-action svg {
      width: 19px !important;
      height: 19px !important;
    }
  }

  @media (max-width: 480px) {
    .storybook-live-actions {
      top: 73.5% !important;
      left: 3% !important;
      right: 3% !important;
      gap: 5px !important;
    }

    .storybook-live-action {
      min-height: 40px !important;
      padding: 4px !important;
      font-size: 9px !important;
      letter-spacing: -0.04em !important;
    }

    .storybook-live-action svg {
      width: 17px !important;
      height: 17px !important;
    }
  }
`;
