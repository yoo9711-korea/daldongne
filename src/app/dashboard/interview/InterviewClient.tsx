'use client';

import { useState } from 'react';
import DeleteMemoryButton from '@/components/memory/DeleteMemoryButton';
import EditMemoryButton from '@/components/memory/EditMemoryButton';


type AnswerItem = {
  id: string;
  title: string;
  description: string;
};

type Props = {
  answers: AnswerItem[];
  submitAnswer: (formData: FormData) => Promise<void>;
};

export default function InterviewClient({ answers, submitAnswer }: Props) {
  const [storyTitle, setStoryTitle] = useState('');
  const [answer, setAnswer] = useState('');
  const [editedText, setEditedText] = useState('');
  const [mode, setMode] = useState('warm');
  const [isEditing, setIsEditing] = useState(false);

  const handleAiEdit = async () => {
    if (isEditing) return;

    const text = answer.trim();

    if (!text) {
      alert('먼저 이야기를 입력해 주세요.');
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
        alert(result.message || 'AI가 이야기를 다듬지 못했습니다.');
        return;
      }

      setEditedText(result.editedText);
    } catch {
      alert('AI로 이야기를 다듬는 중 오류가 발생했습니다.');
    } finally {
      setIsEditing(false);
    }
  };

  const useEditedText = () => {
    if (!editedText.trim()) return;
    setAnswer(editedText);
  };

  return (
    <section
      style={{
        marginTop: 28,
        display: 'grid',
        gap: 24,
      }}
    >
      <div
        style={{
          padding: 28,
          borderRadius: 28,
          background: '#fffaf0',
          border: '1px solid #e4cda3',
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
          자유 이야기 작성
        </p>

        <h2
          style={{
            margin: '10px 0 0',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 30,
            lineHeight: 1.35,
            letterSpacing: '-0.04em',
            color: '#24170f',
          }}
        >
          사진 없이도 남기고 싶은 이야기를 적어보세요
        </h2>

        <p
          style={{
            margin: '12px 0 0',
            fontSize: 16,
            lineHeight: 1.75,
            color: '#6b5a46',
          }}
        >
          가족에게 남기고 싶은 기억, 부모님 이야기, 우리들의 지난 시간,
          꼭 책에 넣고 싶은 장면을 자유롭게 기록할 수 있습니다.
        </p>

        <form
          action={submitAnswer}
          style={{
            marginTop: 22,
          }}
        >
          <input
            type="hidden"
            name="question"
            value={storyTitle.trim() || '우리들의 자유 이야기'}
          />

          <label
            style={{
              display: 'block',
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 900,
              color: '#4a3828',
            }}
          >
            이야기 제목
          </label>

          <input
            value={storyTitle}
            onChange={(event) => setStoryTitle(event.target.value)}
            placeholder="예: 아버지가 늘 하시던 말, 우리 가족의 첫 여행"
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

          <label
            style={{
              display: 'block',
              marginTop: 18,
              marginBottom: 8,
              fontSize: 14,
              fontWeight: 900,
              color: '#4a3828',
            }}
          >
            원래 이야기
          </label>

          <textarea
            name="answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="기억나는 대로 편하게 적어보세요. 문장이 완벽하지 않아도 괜찮습니다."
            style={{
              width: '100%',
              minHeight: 220,
              resize: 'vertical',
              padding: 18,
              borderRadius: 20,
              border: '1px solid #d6b778',
              background: '#fffdf6',
              color: '#24170f',
              fontSize: 16,
              lineHeight: 1.8,
              outline: 'none',
            }}
          />

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
              marginTop: 18,
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
                minHeight: 44,
                padding: '0 20px',
                borderRadius: 999,
                border: '1px solid #24170f',
                background: isEditing ? '#b8a68f' : '#24170f',
                color: '#fffaf0',
                fontSize: 15,
                fontWeight: 900,
                cursor: isEditing ? 'not-allowed' : 'pointer',
              }}
            >
              {isEditing ? 'AI가 다듬는 중...' : 'AI로 다듬기'}
            </button>

            <button
              type="button"
              onClick={useEditedText}
              disabled={!editedText.trim()}
              style={subButtonStyle(!editedText.trim())}
            >
              다듬은 글을 입력칸에 반영
            </button>

            <button
              type="submit"
              disabled={!answer.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 22px',
                borderRadius: 999,
                border: '1px solid #c18a23',
                background: answer.trim() ? '#f3d28a' : '#eadcc5',
                color: answer.trim() ? '#24170f' : '#9f927e',
                fontSize: 15,
                fontWeight: 900,
                cursor: answer.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              이야기 저장하기
            </button>
          </div>
        </form>

        {editedText ? (
          <div
            style={{
              marginTop: 24,
              padding: 22,
              borderRadius: 22,
              border: '1px solid #e4cda3',
              background: '#f7eddc',
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
              AI가 다듬은 이야기
            </p>

            <p
              style={{
                margin: '12px 0 0',
                whiteSpace: 'pre-line',
                fontSize: 16,
                lineHeight: 1.85,
                color: '#3b2b1d',
              }}
            >
              {editedText}
            </p>
          </div>
        ) : null}
      </div>

      <div
        style={{
          padding: 28,
          borderRadius: 28,
          background: '#fffaf0',
          border: '1px solid #e4cda3',
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
          남겨진 이야기
        </p>

        <h2
          style={{
            margin: '8px 0 0',
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 28,
            lineHeight: 1.35,
            letterSpacing: '-0.04em',
            color: '#24170f',
          }}
        >
          지금까지 {answers.length}개의 이야기가 저장되었습니다
        </h2>

        {answers.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gap: 14,
              marginTop: 20,
            }}
          >
            {answers.map((item) => (
              <article
                key={item.id}
                style={{
                  padding: 20,
                  borderRadius: 22,
                  background: '#f7eddc',
                  border: '1px solid #ead7b7',
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
                  {displayStoryTitle(item.title)}
                </p>

                <p
                  style={{
                    margin: '10px 0 0',
                    whiteSpace: 'pre-line',
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: '#4a3828',
                  }}
                >
                  {item.description}
                </p>

           <div
  style={{
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  }}
>
  <EditMemoryButton
    memoryId={item.id}
    initialTitle={displayStoryTitle(item.title)}
    initialDescription={item.description || ''}
    label="이야기 수정"
  />

  <DeleteMemoryButton memoryId={item.id} label="이야기 삭제" />
</div>
              </article>
            ))}
          </div>
        ) : (
          <p
            style={{
              margin: '18px 0 0',
              fontSize: 15,
              lineHeight: 1.75,
              color: '#6b5a46',
            }}
          >
            아직 저장된 이야기가 없습니다. 첫 이야기를 남겨보세요.
          </p>
        )}
      </div>
    </section>
  );
}

function displayStoryTitle(title: string) {
  return title.replace(/^AI 인터뷰:/, '이야기:');
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