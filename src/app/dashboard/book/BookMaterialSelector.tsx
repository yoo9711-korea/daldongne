'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import CreateBookDraftButton, {
  type BookDraftBookType,
  type BookDraftLength,
  type BookDraftTone,
} from './CreateBookDraftButton';

export type BookMaterialItem = {
  id: string;
  kind: 'photo' | 'story';
  title: string;
  description: string;
  hasStory: boolean;
};

type Props = {
  materials: BookMaterialItem[];
};

const REQUIRED_PHOTO_COUNT = 3;
const RECOMMENDED_STORY_COUNT = 3;

export default function BookMaterialSelector({ materials }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    materials.map((item) => item.id),
  );

  const [bookType, setBookType] =
    useState<BookDraftBookType>('PARENT_LIFE');
  const [tone, setTone] = useState<BookDraftTone>('warm');
  const [length, setLength] = useState<BookDraftLength>('medium');
  const [targetBookId, setTargetBookId] = useState<string | undefined>();

  useEffect(() => {
    try {
      const savedTargetBookId = window.localStorage.getItem(
        'daldongne:book:targetBookId',
      );

      if (savedTargetBookId) {
        setTargetBookId(savedTargetBookId);
      } else {
        setTargetBookId(undefined);
      }

      window.localStorage.removeItem('daldongne:book:targetBookId');

      const savedValue = window.localStorage.getItem(
        'daldongne:book:selectedMemoryIds',
      );

      if (!savedValue) return;

      const parsed = JSON.parse(savedValue);

      if (!Array.isArray(parsed)) {
        window.localStorage.removeItem('daldongne:book:selectedMemoryIds');
        return;
      }

      const materialIdSet = new Set(materials.map((item) => item.id));

      const nextSelectedIds = parsed.filter((id: unknown): id is string => {
        return typeof id === 'string' && materialIdSet.has(id);
      });

      if (nextSelectedIds.length > 0) {
        setSelectedIds(nextSelectedIds);
      }

      window.localStorage.removeItem('daldongne:book:selectedMemoryIds');
    } catch {
      window.localStorage.removeItem('daldongne:book:targetBookId');
      window.localStorage.removeItem('daldongne:book:selectedMemoryIds');
    }
  }, [materials]);

  const selectedSet = useMemo(() => {
    return new Set(selectedIds);
  }, [selectedIds]);

  const selectedMaterials = materials.filter((item) => selectedSet.has(item.id));

  const selectedPhotoCount = selectedMaterials.filter((item) => {
    return item.kind === 'photo';
  }).length;

  const selectedStoryCount = selectedMaterials.filter((item) => {
    return item.kind === 'story' || item.hasStory;
  }).length;

  const missingPhotoCount = Math.max(
    REQUIRED_PHOTO_COUNT - selectedPhotoCount,
    0,
  );

  const missingStoryCount = Math.max(
    RECOMMENDED_STORY_COUNT - selectedStoryCount,
    0,
  );

  const canCreate = selectedPhotoCount >= REQUIRED_PHOTO_COUNT;
  const hasEnoughStory = selectedStoryCount >= RECOMMENDED_STORY_COUNT;

  const toggleItem = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  };

  const selectAll = () => {
    setSelectedIds(materials.map((item) => item.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const photoMaterials = materials.filter((item) => item.kind === 'photo');
  const storyMaterials = materials.filter((item) => item.kind === 'story');

  return (
    <section
      id="book-material-selector"
      className="dash-card"
      style={{
        marginBottom: 28,
        border: '1px solid rgba(91, 66, 43, 0.14)',
      }}
    >
      <p className="dash-card__label">책에 넣을 자료 선택</p>

      <h2
        style={{
          margin: '8px 0 0',
          fontFamily: 'Noto Serif KR, serif',
          fontSize: 34,
          lineHeight: 1.35,
          letterSpacing: '-0.04em',
          color: 'var(--ink)',
        }}
      >
        사진 3장이 모이면 이야기를 시작할 수 있습니다
      </h2>

      <p
        style={{
          marginTop: 12,
          color: 'var(--ink-soft)',
          fontSize: 16,
          lineHeight: 1.75,
          maxWidth: 860,
        }}
      >
        사진이 3장 이상이면 AI가 책 원고 초안을 만들 수 있습니다. 이야기가
        부족하면 사진 제목과 기록일을 바탕으로 조심스럽게 초안을 만들고,
        사진에 이야기를 더 붙일수록 원고가 더 좋아집니다.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 20,
          alignItems: 'center',
        }}
      >
        <button type="button" onClick={selectAll} style={smallButtonStyle()}>
          전체 선택
        </button>

        <button type="button" onClick={clearAll} style={smallButtonStyle()}>
          선택 해제
        </button>

        <span
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: canCreate ? '#2f6b3f' : '#9a3f2e',
          }}
        >
          선택한 사진 {selectedPhotoCount}장 · 선택한 이야기 {selectedStoryCount}개
        </span>
      </div>

      {!canCreate ? (
        <div
          style={{
            margin: '14px 0 0',
            padding: '12px 14px',
            borderRadius: 16,
            background: '#fff7f3',
            border: '1px solid #d09a8a',
            color: '#9a3f2e',
            fontSize: 14,
            lineHeight: 1.7,
            fontWeight: 800,
          }}
        >
          <p style={{ margin: 0 }}>
            책 원고를 시작하려면 사진이 최소 3장 필요합니다.
          </p>

          <p style={{ margin: '6px 0 0' }}>
            사진이 {missingPhotoCount}장 부족합니다.
          </p>
        </div>
      ) : !hasEnoughStory ? (
        <div
          style={{
            margin: '14px 0 0',
            padding: '12px 14px',
            borderRadius: 16,
            background: '#fff9e8',
            border: '1px solid #e1bd67',
            color: '#7a4b00',
            fontSize: 14,
            lineHeight: 1.7,
            fontWeight: 800,
          }}
        >
          <p style={{ margin: 0 }}>
            원고를 만들 수 있습니다. 다만 이야기가 {missingStoryCount}개 정도
            더 있으면 책의 내용이 훨씬 좋아집니다.
          </p>

          <p
            style={{
              margin: '6px 0 0',
              color: '#6b5a46',
              fontWeight: 700,
            }}
          >
            지금 만들면 AI가 사진 제목과 기록일을 바탕으로 짧은 초안을
            조심스럽게 작성합니다.
          </p>
        </div>
      ) : (
        <div
          style={{
            margin: '14px 0 0',
            padding: '12px 14px',
            borderRadius: 16,
            background: '#f3fbf5',
            border: '1px solid #9ec9a8',
            color: '#2f6b3f',
            fontSize: 14,
            lineHeight: 1.7,
            fontWeight: 800,
          }}
        >
          사진과 이야기가 충분합니다. 선택한 자료만 AI 원고에 반영됩니다.
        </div>
      )}

      <div
        style={{
          marginTop: 22,
          padding: 18,
          borderRadius: 24,
          border: '1px solid #ead7b7',
          background: '#fffdf6',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 900,
            color: '#24170f',
          }}
        >
          책의 방향 선택
        </h3>

        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            lineHeight: 1.7,
            color: '#6b5a46',
          }}
        >
          같은 사진이라도 어떤 책으로 만들지에 따라 원고의 분위기가 달라집니다.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          <label style={fieldStyle()}>
            <span style={fieldLabelStyle()}>책 종류</span>
            <select
              value={bookType}
              onChange={(event) =>
                setBookType(event.target.value as BookDraftBookType)
              }
              style={selectStyle()}
            >
              <option value="PARENT_LIFE">부모님 인생책</option>
              <option value="FAMILY">가족 이야기책</option>
              <option value="BABY">성장 기록책</option>
              <option value="COUPLE">부부 이야기책</option>
              <option value="TRAVEL">여행 기록책</option>
            </select>
          </label>

          <label style={fieldStyle()}>
            <span style={fieldLabelStyle()}>문체</span>
            <select
              value={tone}
              onChange={(event) =>
                setTone(event.target.value as BookDraftTone)
              }
              style={selectStyle()}
            >
              <option value="warm">따뜻한 문체</option>
              <option value="plain">담백한 문체</option>
              <option value="letter">편지체</option>
              <option value="autobiography">자서전 문체</option>
            </select>
          </label>

          <label style={fieldStyle()}>
            <span style={fieldLabelStyle()}>원고 길이</span>
            <select
              value={length}
              onChange={(event) =>
                setLength(event.target.value as BookDraftLength)
              }
              style={selectStyle()}
            >
              <option value="short">짧은 소책자</option>
              <option value="medium">보통 분량</option>
              <option value="long">긴 원고</option>
            </select>
          </label>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 18,
          marginTop: 24,
        }}
      >
        <MaterialGroup
          title="사진 자료"
          emptyText="선택할 사진이 없습니다."
          items={photoMaterials}
          selectedSet={selectedSet}
          onToggle={toggleItem}
        />

        <MaterialGroup
          title="자유 이야기"
          emptyText="선택할 자유 이야기가 없습니다."
          items={storyMaterials}
          selectedSet={selectedSet}
          onToggle={toggleItem}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 24,
        }}
      >
        
       <CreateBookDraftButton
  disabled={!canCreate}
  selectedMemoryIds={selectedIds}
  selectedPhotoCount={selectedPhotoCount}
  selectedStoryCount={selectedStoryCount}
  targetBookId={targetBookId}
  bookType={bookType}
  tone={tone}
  length={length}
/>

      </div>
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
    <div
      style={{
        minWidth: 0,
        padding: 18,
        borderRadius: 22,
        border: '1px solid #ead7b7',
        background: '#fffaf0',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 900,
          color: '#24170f',
        }}
      >
        {title}
      </h3>

      {items.length === 0 ? (
        <p
          style={{
            margin: '16px 0 0',
            fontSize: 14,
            lineHeight: 1.7,
            color: '#7a6a58',
          }}
        >
          {emptyText}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 12,
            marginTop: 16,
          }}
        >
          {items.map((item) => {
            const selected = selectedSet.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => onToggle(item.id)}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: 14,
                  borderRadius: 18,
                  border: selected ? '1px solid #c18a23' : '1px solid #ead7b7',
                  background: selected ? '#f7eddc' : '#fffdf6',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => onToggle(item.id)}
                  style={{
                    marginTop: 4,
                    width: 16,
                    height: 16,
                    accentColor: '#c18a23',
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {item.kind === 'photo' ? (
                    <span
                      style={{
                        width: 96,
                        height: 72,
                        borderRadius: 14,
                        overflow: 'hidden',
                        background: '#f3ead9',
                        border: '1px solid #ead7b7',
                        flexShrink: 0,
                        display: 'block',
                      }}
                    >
                      <img
                        src={`/api/blob/${item.id}`}
                        alt={item.title || '선택한 사진'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </span>
                  ) : null}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: 15,
                        lineHeight: 1.45,
                        color: '#24170f',
                        wordBreak: 'keep-all',
                      }}
                    >
                      {item.title || '제목 없는 기록'}
                    </strong>

                    {item.hasStory ? (
                      <em
                        style={{
                          display: 'inline-flex',
                          marginTop: 6,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: '#f3d28a',
                          color: '#24170f',
                          fontSize: 12,
                          fontWeight: 900,
                          fontStyle: 'normal',
                        }}
                      >
                        이야기가 붙은 사진
                      </em>
                    ) : null}

                    <span
                      style={{
                        display: 'block',
                        marginTop: 8,
                        fontSize: 13,
                        lineHeight: 1.65,
                        color: '#6b5a46',
                      }}
                    >
                      {item.description || '아직 설명이 없습니다.'}
                    </span>
                  </div>
                </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
  function smallButtonStyle(): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    padding: '0 14px',
    borderRadius: 999,
    border: '1px solid #d6b778',
    background: '#fffaf0',
    color: '#5a3a18',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
  };
}

function fieldStyle(): CSSProperties {
  return {
    display: 'grid',
    gap: 6,
  };
}

function fieldLabelStyle(): CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 900,
    color: '#5a3a18',
  };
}

function selectStyle(): CSSProperties {
  return {
    width: '100%',
    minHeight: 42,
    borderRadius: 14,
    border: '1px solid #d6b778',
    background: '#fffaf0',
    color: '#24170f',
    fontSize: 14,
    fontWeight: 800,
    padding: '0 12px',
    outline: 'none',
  };
}

function makeShortText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trim()}...`;
}