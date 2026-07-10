'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

export default function StoryPhotoUploadBox() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [story, setStory] = useState('');
  const [editedStory, setEditedStory] = useState('');
  const [mode, setMode] = useState('warm');
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return '';

    return URL.createObjectURL(file);
  }, [file]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      event.target.value = '';
      setFile(null);
      return;
    }

    if (selectedFile.size > 8 * 1024 * 1024) {
      alert('사진 용량은 8MB 이하만 가능합니다.');
      event.target.value = '';
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleAiEdit = async () => {
    if (isEditing) return;

    const text = story.trim();

    if (!text) {
      alert('AI로 다듬을 사진 이야기를 먼저 입력해 주세요.');
      return;
    }

    setIsEditing(true);

    try {
      const response = await fetch('/api/ai/edit-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          mode,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        editedText?: string;
        message?: string;
      };

      if (!response.ok || !result.ok || !result.editedText) {
        alert(result.message || 'AI가 사진 이야기를 다듬지 못했습니다.');
        return;
      }

      setEditedStory(result.editedText);
    } catch {
      alert('AI로 사진 이야기를 다듬는 중 오류가 발생했습니다.');
    } finally {
      setIsEditing(false);
    }
  };

  const useEditedStory = () => {
    if (!editedStory.trim()) return;

    setStory(editedStory);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUploading) return;

    if (!file) {
      alert('업로드할 사진을 선택해 주세요.');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedStory = story.trim();

    if (trimmedTitle.length > 30 && trimmedStory.length === 0) {
      alert(
        '사진 제목에 긴 이야기가 들어간 것 같습니다.\n\n사진 제목은 짧게 쓰고, 자세한 이야기는 아래의 “이 사진에 담긴 이야기” 칸에 적어주세요.',
      );
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', trimmedTitle);
      formData.append('occurredAt', occurredAt);
      formData.append('story', trimmedStory);

      const response = await fetch('/api/story-photo/upload', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        alert(result.message || '사진을 저장하지 못했습니다.');
        return;
      }

      alert(result.message || '사진과 이야기를 저장했습니다.');

      setFile(null);
      setTitle('');
      setOccurredAt('');
      setStory('');
      setEditedStory('');

      const fileInput = document.getElementById(
        'story-photo-file',
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = '';
      }

      router.refresh();
    } catch {
      alert('사진을 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
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
        사진과 이야기 남기기
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
        사진 한 장에 이야기를 붙여 보관합니다
      </h2>

      <p
        style={{
          margin: '12px 0 0',
          fontSize: 16,
          lineHeight: 1.75,
          color: '#6b5a46',
        }}
      >
        사진을 올리고 그 사진에 담긴 기억을 함께 적어두면, 나중에 책 원고를
        만들 때 사진과 이야기가 함께 사용됩니다.
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: 22 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 0.8fr) minmax(0, 1.2fr)',
            gap: 20,
            alignItems: 'stretch',
          }}
        >
          <label
            htmlFor="story-photo-file"
            style={{
              display: 'flex',
              minHeight: 300,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              borderRadius: 26,
              border: '2px dashed #d6b778',
              background: '#f7eddc',
              cursor: 'pointer',
              overflow: 'hidden',
              color: '#5a3a18',
              textAlign: 'center',
              padding: 18,
            }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="업로드 미리보기"
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: 300,
                  objectFit: 'cover',
                  borderRadius: 20,
                }}
              />
            ) : (
              <>
                <span
                  style={{
                    fontSize: 42,
                    lineHeight: 1,
                  }}
                >
                  ＋
                </span>

                <strong
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                  }}
                >
                  사진 선택하기
                </strong>

                <span
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#7a674f',
                  }}
                >
                  JPG, PNG, WEBP 이미지
                  <br />
                  최대 8MB까지 업로드할 수 있습니다.
                </span>
              </>
            )}

            <input
              id="story-photo-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 900,
                color: '#4a3828',
              }}
            >
              사진 제목
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={40}
              placeholder="예: 광운대학교 논술시험을 마치고"
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                borderRadius: 16,
                border: '1px solid #d6b778',
                background: '#fffdf6',
                color: '#24170f',
                fontSize: 15,
                outline: 'none',
              }}
            />

            <p
              style={{
                margin: '6px 0 0',
                fontSize: 12,
                lineHeight: 1.6,
                color: '#8a806f',
              }}
            >
              제목은 짧게 적어주세요. 자세한 기억은 아래 이야기 칸에 적는 것이
              좋습니다. {title.length}/40
            </p>

            <label
              style={{
                display: 'block',
                marginTop: 16,
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 900,
                color: '#4a3828',
              }}
            >
              기억 날짜
            </label>

            <input
              type="date"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                borderRadius: 16,
                border: '1px solid #d6b778',
                background: '#fffdf6',
                color: '#24170f',
                fontSize: 15,
                outline: 'none',
              }}
            />

            <p
              style={{
                margin: '6px 0 0',
                fontSize: 12,
                lineHeight: 1.6,
                color: '#8a806f',
              }}
            >
              정확한 날짜를 모르면 비워두어도 됩니다. 다만 오래된 사진은
              대략적인 날짜를 넣으면 책 원고가 시간 순서대로 더 잘 정리됩니다.
            </p>

            <label
              style={{
                display: 'block',
                marginTop: 16,
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 900,
                color: '#4a3828',
              }}
            >
              이 사진에 담긴 이야기
            </label>

            <textarea
              value={story}
              onChange={(event) => setStory(event.target.value)}
              placeholder="이 사진을 찍은 날의 마음, 상황, 함께 있던 사람, 기억나는 장면을 적어주세요. 예: 시험 전에는 많이 떨렸지만, 끝나고 나니 마음이 한결 가벼웠습니다."
              style={{
                width: '100%',
                minHeight: 178,
                resize: 'vertical',
                padding: 16,
                borderRadius: 18,
                border: '1px solid #d6b778',
                background: '#fffdf6',
                color: '#24170f',
                fontSize: 15,
                lineHeight: 1.75,
                outline: 'none',
              }}
            />

            <p
              style={{
                margin: '6px 0 0',
                fontSize: 12,
                lineHeight: 1.6,
                color: '#8a806f',
              }}
            >
              이 칸에 적은 내용이 나중에 책 원고의 중요한 재료가 됩니다.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setMode('warm')}
                style={modeButtonStyle(mode === 'warm')}
              >
                따뜻하게
              </button>

              <button
                type="button"
                onClick={() => setMode('book')}
                style={modeButtonStyle(mode === 'book')}
              >
                책 원고처럼
              </button>

              <button
                type="button"
                onClick={() => setMode('letter')}
                style={modeButtonStyle(mode === 'letter')}
              >
                편지처럼
              </button>

              <button
                type="button"
                onClick={() => setMode('short')}
                style={modeButtonStyle(mode === 'short')}
              >
                짧고 담백하게
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 14,
              }}
            >
              <button
                type="button"
                onClick={handleAiEdit}
                disabled={isEditing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 42,
                  padding: '0 18px',
                  borderRadius: 999,
                  border: '1px solid #24170f',
                  background: isEditing ? '#b8a68f' : '#24170f',
                  color: '#fffaf0',
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: isEditing ? 'not-allowed' : 'pointer',
                }}
              >
                {isEditing ? 'AI가 다듬는 중...' : '사진 이야기 AI로 다듬기'}
              </button>

              <button
                type="button"
                onClick={useEditedStory}
                disabled={!editedStory.trim()}
                style={subButtonStyle(!editedStory.trim())}
              >
                다듬은 글 반영
              </button>
            </div>

            {editedStory ? (
              <div
                style={{
                  marginTop: 14,
                  padding: 16,
                  borderRadius: 18,
                  border: '1px solid #e4cda3',
                  background: '#f7eddc',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 900,
                    color: '#9a6a24',
                  }}
                >
                  AI가 다듬은 사진 이야기
                </p>

                <p
                  style={{
                    margin: '8px 0 0',
                    whiteSpace: 'pre-line',
                    fontSize: 14,
                    lineHeight: 1.75,
                    color: '#4a3828',
                  }}
                >
                  {editedStory}
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isUploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: 48,
                marginTop: 16,
                padding: '0 20px',
                borderRadius: 999,
                border: '1px solid #c18a23',
                background: isUploading ? '#b8a68f' : '#f3d28a',
                color: '#24170f',
                fontSize: 15,
                fontWeight: 900,
                cursor: isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploading ? '사진 저장 중...' : '사진과 이야기 저장하기'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function modeButtonStyle(active: boolean) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    padding: '0 12px',
    borderRadius: 999,
    border: active ? '1px solid #c18a23' : '1px solid #d6b778',
    background: active ? '#f3d28a' : '#fffaf0',
    color: active ? '#24170f' : '#6b5a46',
    fontSize: 13,
    fontWeight: 900,
    cursor: 'pointer',
  };
}

function subButtonStyle(disabled: boolean) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '0 16px',
    borderRadius: 999,
    border: '1px solid #d6b778',
    background: disabled ? '#eadcc5' : '#fffaf0',
    color: disabled ? '#9f927e' : '#5a3a18',
    fontSize: 14,
    fontWeight: 900,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}