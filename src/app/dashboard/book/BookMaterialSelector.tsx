"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import CreateBookDraftButton, {
  type BookDraftBookType,
  type BookDraftLength,
  type BookDraftTone,
} from "./CreateBookDraftButton";

export type BookMaterialItem = {
  id: string;
  kind: "photo" | "story";
  title: string;
  description: string;
  hasStory: boolean;
};

type Props = {
  materials: BookMaterialItem[];
};

const REQUIRED_PHOTO_COUNT = 3;
const RECOMMENDED_STORY_COUNT = 3;

const bookTypeOptions: Array<{
  value: BookDraftBookType;
  label: string;
  coverTitle: string;
  subtitle: string;
}> = [
  {
    value: "PARENT_LIFE",
    label: "부모님 인생책",
    coverTitle: "우리의 소중한 시간",
    subtitle: "삶의 기억과 마음을 담은 이야기",
  },
  {
    value: "FAMILY",
    label: "가족 이야기책",
    coverTitle: "우리 가족의 이야기",
    subtitle: "함께 웃고 자란 날들의 기록",
  },
  {
    value: "BABY",
    label: "성장 기록책",
    coverTitle: "반짝이는 성장의 시간",
    subtitle: "아이의 오늘을 내일에 전하는 기록",
  },
  {
    value: "COUPLE",
    label: "부부 이야기책",
    coverTitle: "우리, 함께 걸어온 길",
    subtitle: "두 사람이 쌓아 온 사랑의 기록",
  },
  {
    value: "TRAVEL",
    label: "여행 기록책",
    coverTitle: "길 위에서 만난 우리",
    subtitle: "함께 떠난 곳과 마음의 기록",
  },
];

const toneOptions: Array<{
  value: BookDraftTone;
  label: string;
}> = [
  {
    value: "warm",
    label: "따뜻한 문체",
  },
  {
    value: "plain",
    label: "담백한 문체",
  },
  {
    value: "letter",
    label: "편지체",
  },
  {
    value: "autobiography",
    label: "자서전 문체",
  },
];

const lengthOptions: Array<{
  value: BookDraftLength;
  label: string;
  pages: number;
}> = [
  {
    value: "short",
    label: "짧은 소책자",
    pages: 32,
  },
  {
    value: "medium",
    label: "보통 분량",
    pages: 48,
  },
  {
    value: "long",
    label: "긴 원고",
    pages: 72,
  },
];

export default function BookMaterialSelector({
  materials,
}: Props) {
  const [selectedIds, setSelectedIds] =
    useState<string[]>(
      materials.map((item) => item.id),
    );

  const [bookType, setBookType] =
    useState<BookDraftBookType>(
      "PARENT_LIFE",
    );

  const [tone, setTone] =
    useState<BookDraftTone>("warm");

  const [length, setLength] =
    useState<BookDraftLength>("medium");

  const [targetBookId, setTargetBookId] =
    useState<string | undefined>();

  useEffect(() => {
    try {
      const savedTargetBookId =
        window.localStorage.getItem(
          "daldongne:book:targetBookId",
        );

      if (savedTargetBookId) {
        setTargetBookId(
          savedTargetBookId,
        );
      } else {
        setTargetBookId(undefined);
      }

      window.localStorage.removeItem(
        "daldongne:book:targetBookId",
      );

      const savedValue =
        window.localStorage.getItem(
          "daldongne:book:selectedMemoryIds",
        );

      if (!savedValue) {
        return;
      }

      const parsed =
        JSON.parse(savedValue);

      if (!Array.isArray(parsed)) {
        window.localStorage.removeItem(
          "daldongne:book:selectedMemoryIds",
        );
        return;
      }

      const materialIdSet =
        new Set(
          materials.map(
            (item) => item.id,
          ),
        );

      const nextSelectedIds =
        parsed.filter(
          (
            id: unknown,
          ): id is string =>
            typeof id === "string" &&
            materialIdSet.has(id),
        );

      if (
        nextSelectedIds.length > 0
      ) {
        setSelectedIds(
          nextSelectedIds,
        );
      }

      window.localStorage.removeItem(
        "daldongne:book:selectedMemoryIds",
      );
    } catch {
      window.localStorage.removeItem(
        "daldongne:book:targetBookId",
      );

      window.localStorage.removeItem(
        "daldongne:book:selectedMemoryIds",
      );
    }
  }, [materials]);

  const selectedSet = useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );

  const selectedMaterials =
    materials.filter((item) =>
      selectedSet.has(item.id),
    );

  const selectedPhotos =
    selectedMaterials.filter(
      (item) =>
        item.kind === "photo",
    );

  const selectedStories =
    selectedMaterials.filter(
      (item) =>
        item.kind === "story" ||
        item.hasStory,
    );

  const selectedPhotoCount =
    selectedPhotos.length;

  const selectedStoryCount =
    selectedStories.length;

  const canCreate =
    selectedPhotoCount >=
    REQUIRED_PHOTO_COUNT;

  const hasEnoughStory =
    selectedStoryCount >=
    RECOMMENDED_STORY_COUNT;

  const activeBookType =
    bookTypeOptions.find(
      (option) =>
        option.value === bookType,
    ) || bookTypeOptions[0];

  const activeLength =
    lengthOptions.find(
      (option) =>
        option.value === length,
    ) || lengthOptions[1];

  const estimatedPages =
    Math.max(
      activeLength.pages,
      Math.min(
        96,
        activeLength.pages +
          Math.max(
            0,
            selectedPhotoCount - 6,
          ) *
            2 +
          Math.max(
            0,
            selectedStoryCount - 5,
          ) *
            2,
      ),
    );

  const chapterItems =
    buildChapterItems(
      selectedMaterials,
    );

  const toggleItem = (
    id: string,
  ) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id,
          )
        : [...current, id],
    );
  };

  const selectAll = () => {
    setSelectedIds(
      materials.map(
        (item) => item.id,
      ),
    );
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  return (
    <section
      id="book-material-selector"
      className="book-builder"
    >
      <style>{bookBuilderStyles}</style>

      <div className="book-builder-preview-grid">
        <article className="book-builder-cover-card">
          <div className="book-builder-cover">
            {selectedPhotos[0] ? (
              <img
                src={`/api/blob/${selectedPhotos[0].id}`}
                alt={
                  selectedPhotos[0].title ||
                  "선택한 표지 사진"
                }
              />
            ) : (
              <img
                src="/dashboard/book-reference-v1/sample-cover.webp"
                alt="달동네 스토리북 표지 예시"
              />
            )}

            <div className="book-builder-cover-overlay">
              <span aria-hidden="true">❦</span>

              <h2>
                {activeBookType.coverTitle}
              </h2>

              <p>
                {activeBookType.subtitle}
              </p>

              <small>
                달동네 스토리북
              </small>
            </div>
          </div>

          <p>
            첫 번째로 선택한 사진이
            표지 미리보기에 사용됩니다.
          </p>
        </article>

        <article className="book-builder-chapters">
          <div className="book-builder-panel-title">
            <span aria-hidden="true">
              <ListIcon />
            </span>

            <div>
              <p>책 구성 미리보기</p>
              <h2>챕터 구성</h2>
            </div>
          </div>

          <div className="book-builder-chapter-list">
            {chapterItems.map(
              (chapter, index) => (
                <article
                  key={`${chapter.title}-${index}`}
                >
                  <strong>
                    {index + 1}.
                  </strong>

                  <div>
                    <h3>
                      {chapter.title}
                    </h3>

                    <p>
                      {chapter.description}
                    </p>
                  </div>

                  <span>
                    {chapter.photoId ? (
                      <img
                        src={`/api/blob/${chapter.photoId}`}
                        alt=""
                      />
                    ) : (
                      <img
                        src={`/dashboard/book-reference-v1/sample-chapter-${index + 1}.webp`}
                        alt=""
                      />
                    )}
                  </span>
                </article>
              ),
            )}
          </div>
        </article>

        <aside className="book-builder-summary">
          <SummaryItem
            icon="photo"
            label="사진"
            value={selectedPhotoCount}
            unit="장"
          />

          <SummaryItem
            icon="story"
            label="이야기"
            value={selectedStoryCount}
            unit="개"
          />

          <SummaryItem
            icon="book"
            label="예상"
            value={estimatedPages}
            unit="쪽"
          />

          <p>
            분량은 선택한 자료와
            원고 길이에 따라 달라질 수
            있습니다.
          </p>
        </aside>
      </div>

      <section className="book-builder-settings">
        <div className="book-builder-section-head">
          <div>
            <p>책의 방향 선택</p>
            <h2>
              어떤 책으로 만들지
              정해주세요
            </h2>
          </div>

          <span>
            선택한 설정은 AI 원고에
            반영됩니다.
          </span>
        </div>

        <div className="book-builder-setting-grid">
          <label>
            <span>책 종류</span>

            <select
              value={bookType}
              onChange={(event) =>
                setBookType(
                  event.target
                    .value as BookDraftBookType,
                )
              }
            >
              {bookTypeOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>문체</span>

            <select
              value={tone}
              onChange={(event) =>
                setTone(
                  event.target
                    .value as BookDraftTone,
                )
              }
            >
              {toneOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>원고 길이</span>

            <select
              value={length}
              onChange={(event) =>
                setLength(
                  event.target
                    .value as BookDraftLength,
                )
              }
            >
              {lengthOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

      <section className="book-builder-materials">
        <div className="book-builder-section-head">
          <div>
            <p>책에 넣을 자료</p>
            <h2>
              사진과 이야기를
              선택해주세요
            </h2>
          </div>

          <div className="book-builder-selection-actions">
            <button
              type="button"
              onClick={selectAll}
            >
              전체 선택
            </button>

            <button
              type="button"
              onClick={clearAll}
            >
              선택 해제
            </button>
          </div>
        </div>

        <div
          className="book-builder-readiness"
          data-ready={
            canCreate
              ? hasEnoughStory
                ? "complete"
                : "possible"
              : "waiting"
          }
        >
          <strong>
            선택한 사진{" "}
            {selectedPhotoCount}장 ·
            선택한 이야기{" "}
            {selectedStoryCount}개
          </strong>

          <span>
            {!canCreate
              ? `책 원고를 시작하려면 사진이 ${REQUIRED_PHOTO_COUNT - selectedPhotoCount}장 더 필요합니다.`
              : !hasEnoughStory
                ? `지금도 원고를 만들 수 있습니다. 이야기를 ${RECOMMENDED_STORY_COUNT - selectedStoryCount}개 더 선택하면 더 풍부해집니다.`
                : "사진과 이야기가 충분합니다. 선택한 자료만 원고에 반영됩니다."}
          </span>
        </div>

        <div className="book-builder-material-grid">
          <MaterialGroup
            title="사진 자료"
            emptyText="선택할 사진이 없습니다."
            items={materials.filter(
              (item) =>
                item.kind === "photo",
            )}
            selectedSet={selectedSet}
            onToggle={toggleItem}
          />

          <MaterialGroup
            title="이야기 자료"
            emptyText="선택할 이야기가 없습니다."
            items={materials.filter(
              (item) =>
                item.kind === "story",
            )}
            selectedSet={selectedSet}
            onToggle={toggleItem}
          />
        </div>
      </section>

      <section className="book-builder-actions">
        <a href="#book-material-selector">
          책 미리보기
        </a>

        <CreateBookDraftButton
          disabled={!canCreate}
          selectedMemoryIds={
            selectedIds
          }
          selectedPhotoCount={
            selectedPhotoCount
          }
          selectedStoryCount={
            selectedStoryCount
          }
          targetBookId={
            targetBookId
          }
          bookType={bookType}
          tone={tone}
          length={length}
        />

        <p>
          원고는 만든 뒤 내 책장에서
          다시 고칠 수 있습니다.
        </p>
      </section>
    </section>
  );
}

function MaterialGroup({
  title,
  emptyText,
  items,
  selectedSet,
  onToggle,
}: {
  title: string;
  emptyText: string;
  items: BookMaterialItem[];
  selectedSet: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="book-builder-material-group">
      <h3>{title}</h3>

      {items.length === 0 ? (
        <p>{emptyText}</p>
      ) : (
        <div>
          {items.map((item) => {
            const selected =
              selectedSet.has(item.id);

            return (
              <label
                key={item.id}
                data-selected={
                  selected
                    ? "true"
                    : "false"
                }
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() =>
                    onToggle(item.id)
                  }
                />

                {item.kind ===
                "photo" ? (
                  <span className="book-builder-material-thumb">
                    <img
                      src={`/api/blob/${item.id}`}
                      alt={
                        item.title ||
                        "선택한 사진"
                      }
                    />
                  </span>
                ) : (
                  <span className="book-builder-story-mark">
                    <StoryMarkIcon />
                  </span>
                )}

                <span className="book-builder-material-copy">
                  <strong>
                    {item.title ||
                      "제목 없는 기록"}
                  </strong>

                  <small>
                    {item.hasStory
                      ? "이야기 포함"
                      : item.kind ===
                          "photo"
                        ? "사진"
                        : "이야기"}
                  </small>

                  <p>
                    {shorten(
                      item.description ||
                        "아직 설명이 없습니다.",
                      90,
                    )}
                  </p>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  unit,
}: {
  icon: "photo" | "story" | "book";
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <article>
      <span aria-hidden="true">
        <SummaryIcon name={icon} />
      </span>

      <div>
        <p>{label}</p>

        <strong>
          {value.toLocaleString()}
          <small>{unit}</small>
        </strong>
      </div>
    </article>
  );
}

function buildChapterItems(
  materials: BookMaterialItem[],
) {
  const fallback = [
    {
      title: "함께한 시작",
      description:
        "이야기의 배경과 처음 기억나는 장면",
    },
    {
      title: "추억이 쌓이는 시간",
      description:
        "함께한 사람과 마음에 남은 사건",
    },
    {
      title: "소소한 행복들",
      description:
        "평범한 일상 속 오래 남은 순간",
    },
    {
      title: "우리의 오늘, 그리고 내일",
      description:
        "지금의 마음과 전하고 싶은 이야기",
    },
  ];

  return fallback.map(
    (item, index) => {
      const material =
        materials[index];

      const photo =
        materials
          .filter(
            (entry) =>
              entry.kind === "photo",
          )[index];

      return {
        title:
          material?.title ||
          item.title,
        description:
          shorten(
            material?.description ||
              item.description,
            52,
          ),
        photoId: photo?.id,
      };
    },
  );
}

function shorten(
  text: string,
  maxLength: number,
) {
  const normalized =
    text.replace(/\s+/g, " ").trim();

  if (
    normalized.length <= maxLength
  ) {
    return normalized;
  }

  return `${normalized
    .slice(0, maxLength)
    .trim()}…`;
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
    >
      <rect
        x="6"
        y="5"
        width="24"
        height="26"
        rx="5"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M12 13h12M12 18h12M12 23h8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StoryMarkIcon() {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
    >
      <path
        d="M7 8h22v19H17l-6 5v-5H7V8Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M12 14h12M12 19h9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SummaryIcon({
  name,
}: {
  name: "photo" | "story" | "book";
}) {
  if (name === "photo") {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
      >
        <path
          d="M6 11h8l2-3h8l2 3h8a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <circle
          cx="20"
          cy="24"
          r="7"
          stroke="currentColor"
          strokeWidth="2.2"
        />
      </svg>
    );
  }

  if (name === "story") {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
      >
        <path
          d="M6 8h28v20H18l-7 6v-6H6V8Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M12 15h16M12 21h11"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
    >
      <path
        d="M4 8c6-1.4 11 .2 16 5v23c-5-4.8-10-6.4-16-5V8ZM36 8c-6-1.4-11 .2-16 5v23c5-4.8 10-6.4 16-5V8Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const bookBuilderStyles = `
  .book-builder,
  .book-builder * {
    box-sizing: border-box;
  }

  .book-builder {
    margin-top: 18px;
  }

  .book-builder-preview-grid {
    display: grid;
    grid-template-columns:
      minmax(280px, 0.8fr)
      minmax(420px, 1.1fr)
      minmax(230px, 0.45fr);
    gap: 18px;
    align-items: stretch;
  }

  .book-builder-cover-card,
  .book-builder-chapters,
  .book-builder-summary,
  .book-builder-settings,
  .book-builder-materials,
  .book-builder-actions {
    border:
      1px solid
      rgba(136, 94, 74, 0.12);
    border-radius: 27px;
    background:
      rgba(255, 255, 255, 0.92);
    box-shadow:
      0 18px 42px
      rgba(92, 61, 47, 0.065);
  }

  .book-builder-cover-card {
    padding: 18px;
  }

  .book-builder-cover {
    position: relative;
    width: 100%;
    min-height: 500px;
    overflow: hidden;
    border-radius: 19px;
    background: #e8ddcf;
    box-shadow:
      0 15px 29px
      rgba(75, 50, 39, 0.16);
  }

  .book-builder-cover > img {
    width: 100%;
    height: 100%;
    min-height: 500px;
    object-fit: cover;
  }

  .book-builder-cover-overlay {
    position: absolute;
    inset: 0;
    padding: 39px 27px;
    display: flex;
    align-items: center;
    flex-direction: column;
    color: #4b392f;
    background:
      linear-gradient(
        180deg,
        rgba(255, 251, 241, 0.91),
        rgba(255, 249, 236, 0.62) 38%,
        rgba(42, 29, 22, 0.05) 62%,
        rgba(42, 29, 22, 0.3)
      );
    text-align: center;
  }

  .book-builder-cover-overlay > span {
    color: #7c9c5b;
    font-size: 35px;
  }

  .book-builder-cover-overlay h2 {
    margin: 14px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size:
      clamp(26px, 3vw, 39px);
    line-height: 1.35;
    letter-spacing: -0.05em;
    word-break: keep-all;
  }

  .book-builder-cover-overlay p {
    margin: 12px 0 0;
    color: #755f52;
    font-size: 12px;
    line-height: 1.7;
  }

  .book-builder-cover-overlay small {
    margin-top: auto;
    color: #ffffff;
    font-size: 11px;
    font-weight: 900;
    text-shadow:
      0 2px 8px
      rgba(0, 0, 0, 0.4);
  }

  .book-builder-cover-card > p {
    margin: 13px 0 0;
    color: #8a756a;
    font-size: 10px;
    line-height: 1.6;
    text-align: center;
  }

  .book-builder-chapters {
    padding: 24px;
  }

  .book-builder-panel-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .book-builder-panel-title > span {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: #e56d56;
    background: #fff0e8;
  }

  .book-builder-panel-title svg {
    width: 29px;
    height: 29px;
  }

  .book-builder-panel-title p {
    margin: 0;
    color: #e56d56;
    font-size: 10px;
    font-weight: 900;
  }

  .book-builder-panel-title h2 {
    margin: 4px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 25px;
    letter-spacing: -0.04em;
  }

  .book-builder-chapter-list {
    margin-top: 18px;
    display: grid;
    gap: 9px;
  }

  .book-builder-chapter-list article {
    min-height: 94px;
    padding: 12px 11px 12px 4px;
    display: grid;
    grid-template-columns:
      43px minmax(0, 1fr) 112px;
    align-items: center;
    gap: 12px;
    border-bottom:
      1px dashed
      rgba(135, 94, 74, 0.18);
  }

  .book-builder-chapter-list article:last-child {
    border-bottom: 0;
  }

  .book-builder-chapter-list article > strong {
    color: #ef6b54;
    font-size: 27px;
    text-align: center;
  }

  .book-builder-chapter-list h3 {
    margin: 0;
    overflow: hidden;
    font-size: 16px;
    line-height: 1.4;
    letter-spacing: -0.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-builder-chapter-list p {
    margin: 5px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #856f65;
    font-size: 10px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .book-builder-chapter-list article > span {
    width: 112px;
    aspect-ratio: 1.55 / 1;
    overflow: hidden;
    border-radius: 10px;
    background: #eee6e0;
  }

  .book-builder-chapter-list img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .book-builder-summary {
    padding: 22px;
    display: grid;
    align-content: start;
    background:
      linear-gradient(
        155deg,
        #fff2e8,
        #fffaf6
      );
  }

  .book-builder-summary article {
    padding: 19px 0;
    display: grid;
    grid-template-columns:
      56px minmax(0, 1fr);
    align-items: center;
    gap: 13px;
    border-bottom:
      1px dashed
      rgba(140, 95, 71, 0.17);
  }

  .book-builder-summary article > span {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #ef6e57;
    background: #ffffff;
    box-shadow:
      0 8px 18px
      rgba(94, 62, 47, 0.07);
  }

  .book-builder-summary svg {
    width: 34px;
    height: 34px;
  }

  .book-builder-summary p {
    margin: 0;
    color: #735b50;
    font-size: 12px;
    font-weight: 850;
  }

  .book-builder-summary strong {
    display: block;
    margin-top: 3px;
    color: #e8614b;
    font-size: 30px;
  }

  .book-builder-summary small {
    margin-left: 4px;
    color: #6d5246;
    font-size: 14px;
  }

  .book-builder-summary > p {
    margin: 17px 0 0;
    color: #826f65;
    font-size: 11px;
    line-height: 1.7;
  }

  .book-builder-settings,
  .book-builder-materials {
    margin-top: 18px;
    padding: 25px;
  }

  .book-builder-section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .book-builder-section-head p {
    margin: 0;
    color: #e56b54;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.06em;
  }

  .book-builder-section-head h2 {
    margin: 7px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 27px;
    line-height: 1.4;
    letter-spacing: -0.045em;
  }

  .book-builder-section-head > span {
    color: #89756b;
    font-size: 11px;
    line-height: 1.6;
  }

  .book-builder-setting-grid {
    margin-top: 19px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .book-builder-setting-grid label {
    display: grid;
    gap: 7px;
  }

  .book-builder-setting-grid label > span {
    color: #5e493f;
    font-size: 11px;
    font-weight: 900;
  }

  .book-builder-setting-grid select {
    width: 100%;
    min-height: 49px;
    padding: 0 13px;
    border:
      1px solid
      rgba(143, 99, 77, 0.22);
    border-radius: 13px;
    color: #4b382f;
    background: #fffdfb;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
  }

  .book-builder-selection-actions {
    display: flex;
    gap: 7px;
  }

  .book-builder-selection-actions button {
    min-height: 38px;
    padding: 0 13px;
    border:
      1px solid #dfb5a5;
    border-radius: 11px;
    color: #b85845;
    background: #ffffff;
    font-size: 10px;
    font-weight: 900;
    cursor: pointer;
  }

  .book-builder-readiness {
    margin-top: 17px;
    padding: 15px 17px;
    border:
      1px solid #e2b2a2;
    border-radius: 15px;
    background: #fff2ed;
  }

  .book-builder-readiness[data-ready="possible"] {
    border-color: #e4c786;
    background: #fff8e5;
  }

  .book-builder-readiness[data-ready="complete"] {
    border-color: #a8c99e;
    background: #eef8ee;
  }

  .book-builder-readiness strong,
  .book-builder-readiness span {
    display: block;
  }

  .book-builder-readiness strong {
    font-size: 13px;
  }

  .book-builder-readiness span {
    margin-top: 5px;
    color: #756158;
    font-size: 11px;
    line-height: 1.6;
  }

  .book-builder-material-grid {
    margin-top: 18px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .book-builder-material-group {
    min-width: 0;
    padding: 17px;
    border:
      1px solid
      rgba(138, 96, 75, 0.12);
    border-radius: 18px;
    background: #fffaf6;
  }

  .book-builder-material-group > h3 {
    margin: 0;
    font-size: 16px;
  }

  .book-builder-material-group > p {
    margin: 13px 0 0;
    color: #876f64;
    font-size: 11px;
  }

  .book-builder-material-group > div {
    margin-top: 13px;
    display: grid;
    gap: 8px;
    max-height: 490px;
    overflow-y: auto;
    padding-right: 3px;
  }

  .book-builder-material-group label {
    min-width: 0;
    padding: 10px;
    display: grid;
    grid-template-columns:
      19px 86px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    border:
      1px solid
      rgba(138, 96, 75, 0.12);
    border-radius: 13px;
    background: #ffffff;
    cursor: pointer;
  }

  .book-builder-material-group label[data-selected="true"] {
    border-color: #e4836e;
    background: #fff0e9;
  }

  .book-builder-material-group input {
    width: 16px;
    height: 16px;
    accent-color: #ed6d56;
  }

  .book-builder-material-thumb,
  .book-builder-story-mark {
    width: 86px;
    height: 68px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 10px;
    background: #f2eae5;
  }

  .book-builder-material-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .book-builder-story-mark {
    color: #df6b54;
    background: #fff0e9;
  }

  .book-builder-story-mark svg {
    width: 35px;
    height: 35px;
  }

  .book-builder-material-copy {
    min-width: 0;
  }

  .book-builder-material-copy strong {
    display: block;
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-builder-material-copy small {
    display: inline-flex;
    margin-top: 4px;
    padding: 3px 7px;
    border-radius: 999px;
    color: #547549;
    background: #edf6e9;
    font-size: 8px;
    font-weight: 900;
  }

  .book-builder-material-copy p {
    margin: 5px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #816d63;
    font-size: 9px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .book-builder-actions {
    margin-top: 18px;
    padding: 20px;
    display: grid;
    grid-template-columns:
      minmax(170px, 0.6fr)
      minmax(300px, 1.4fr);
    gap: 13px;
    align-items: center;
  }

  .book-builder-actions > a {
    min-height: 54px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid #cfae9d;
    border-radius: 14px;
    color: #6f5145;
    background: #ffffff;
    font-size: 14px;
    font-weight: 900;
  }

  .book-builder-actions > button {
    min-height: 54px !important;
    border: 0 !important;
    border-radius: 14px !important;
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #ff7664,
        #ed5e4f
      ) !important;
    box-shadow:
      0 14px 28px
      rgba(218, 82, 63, 0.19) !important;
    font-size: 15px !important;
    font-weight: 900 !important;
  }

  .book-builder-actions > p {
    grid-column: 1 / -1;
    margin: 0;
    color: #8b766b;
    font-size: 10px;
    text-align: center;
  }

  @media (max-width: 1080px) {
    .book-builder-preview-grid {
      grid-template-columns:
        minmax(280px, 0.8fr)
        minmax(420px, 1.2fr);
    }

    .book-builder-summary {
      grid-column: 1 / -1;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
    }

    .book-builder-summary article {
      border-bottom: 0;
      border-right:
        1px dashed
        rgba(140, 95, 71, 0.17);
    }

    .book-builder-summary article:nth-child(3) {
      border-right: 0;
    }

    .book-builder-summary > p {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 800px) {
    .book-builder-preview-grid {
      grid-template-columns: 1fr;
    }

    .book-builder-cover {
      min-height: 560px;
    }

    .book-builder-cover > img {
      min-height: 560px;
    }

    .book-builder-summary {
      grid-column: auto;
    }

    .book-builder-setting-grid,
    .book-builder-material-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .book-builder-cover-card,
    .book-builder-chapters,
    .book-builder-summary,
    .book-builder-settings,
    .book-builder-materials,
    .book-builder-actions {
      border-radius: 20px;
    }

    .book-builder-cover {
      min-height: 470px;
    }

    .book-builder-cover > img {
      min-height: 470px;
    }

    .book-builder-chapters {
      padding: 17px;
    }

    .book-builder-chapter-list article {
      min-height: 82px;
      grid-template-columns:
        32px minmax(0, 1fr) 78px;
      gap: 8px;
    }

    .book-builder-chapter-list article > strong {
      font-size: 21px;
    }

    .book-builder-chapter-list article > span {
      width: 78px;
    }

    .book-builder-summary {
      padding: 17px;
      grid-template-columns: 1fr;
    }

    .book-builder-summary article {
      border-right: 0;
      border-bottom:
        1px dashed
        rgba(140, 95, 71, 0.17);
    }

    .book-builder-summary article:nth-child(3) {
      border-bottom: 0;
    }

    .book-builder-section-head {
      align-items: stretch;
      flex-direction: column;
    }

    .book-builder-selection-actions {
      width: 100%;
    }

    .book-builder-selection-actions button {
      flex: 1;
    }

    .book-builder-material-group label {
      grid-template-columns:
        19px 68px minmax(0, 1fr);
    }

    .book-builder-material-thumb,
    .book-builder-story-mark {
      width: 68px;
      height: 58px;
    }

    .book-builder-actions {
      padding: 13px;
      grid-template-columns: 1fr;
    }

    .book-builder-actions > p {
      grid-column: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .book-builder a,
    .book-builder button {
      transition: none;
    }
  }
`;
