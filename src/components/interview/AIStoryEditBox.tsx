'use client';

import { useState } from 'react';

export default function AIStoryEditBox() {
  const [text, setText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [mode, setMode] = useState('warm');
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async () => {
    if (isLoading) return;

    const trimmedText = text.trim();

    if (!trimmedText) {
      alert('AI로 다듬을 이야기를 먼저 입력해 주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/edit-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmedText,
          mode,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        editedText?: string;
        message?: string;
      };

      if (!response.ok || !result.ok || !result.editedText) {
        alert(result.message || 'AI가 이야기를 다듬지 못했습니다.');
        return;
      }

      setEditedText(result.editedText);
    } catch {
      alert('AI로 이야기를 다듬는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseEditedText = () => {
    if (!editedText.trim()) return;

    setText(editedText);
    alert('다듬어진 이야기를 입력칸에 반영했습니다.');
  };

  const handleCopy = async () => {
    if (!editedText.trim()) return;

    try {
      await navigator.clipboard.writeText(editedText);
      alert('다듬어진 이야기를 복사했습니다.');
    } catch {
      alert('복사에 실패했습니다. 직접 선택해서 복사해 주세요.');
    }
  };

  return (
    <section
      style={{
        marginTop: 28,
        padding: 26,
        borderRadius: 28,
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
        AI 이야기 편집
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
        남긴 이야기를 책 문장처럼 다듬습니다
      </h2>

      <p
        style={{
          margin: '12px 0 0',
          fontSize: 16,
          lineHeight: 1.75,
          color: '#6b5a46',
        }}
      >
        먼저 기억나는 대로 적어보세요. AI가 내용을 새로 지어내지 않고,
        가족이 읽기 좋은 문장으로 정리해 줍니다.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 20,
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
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 18,
          marginTop: 20,
        }}
      >
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
            원래 이야기
          </label>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="예: 그 사진을 찍던 날 시험이 끝나서 마음이 조금 놓였고, 가족과 함께 걸었던 시간이 기억납니다."
            style={{
              width: '100%',
              minHeight: 230,
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
        </div>

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
            AI가 다듬은 이야기
          </label>

          <textarea
            value={editedText}
            onChange={(event) => setEditedText(event.target.value)}
            placeholder="AI가 다듬은 결과가 여기에 표시됩니다."
            style={{
              width: '100%',
              minHeight: 230,
              resize: 'vertical',
              padding: 16,
              borderRadius: 18,
              border: '1px solid #d6b778',
              background: '#f7eddc',
              color: '#24170f',
              fontSize: 15,
              lineHeight: 1.75,
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 18,
        }}
      >
        <button
          type="button"
          onClick={handleEdit}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            padding: '0 20px',
            borderRadius: 999,
            border: '1px solid #24170f',
            background: isLoading ? '#b8a68f' : '#24170f',
            color: '#fffaf0',
            fontSize: 15,
            fontWeight: 900,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'AI가 다듬는 중...' : 'AI로 다듬기'}
        </button>

        <button
          type="button"
          onClick={handleUseEditedText}
          disabled={!editedText.trim()}
          style={subButtonStyle(!editedText.trim())}
        >
          다듬은 글을 입력칸에 반영
        </button>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!editedText.trim()}
          style={subButtonStyle(!editedText.trim())}
        >
          다듬은 글 복사
        </button>
      </div>

      <p
        style={{
          margin: '14px 0 0',
          fontSize: 13,
          lineHeight: 1.7,
          color: '#8a806f',
        }}
      >
        이 기능은 먼저 문장을 다듬는 보조 도구입니다. 저장 전에는 내용을 꼭
        직접 확인해 주세요.
      </p>
    </section>
  );
}

function modeButtonStyle(active: boolean) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    padding: '0 14px',
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
    minHeight: 44,
    padding: '0 18px',
    borderRadius: 999,
    border: '1px solid #d6b778',
    background: disabled ? '#eadcc5' : '#fffaf0',
    color: disabled ? '#9f927e' : '#5a3a18',
    fontSize: 14,
    fontWeight: 900,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}