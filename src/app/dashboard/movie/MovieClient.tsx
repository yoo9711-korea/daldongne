'use client';

import { useState } from 'react';
import PhotoSelector from './components/PhotoSelector';
import AIAnalysisCard from './components/AIAnalysisCard';
import AIQuestionCard from './components/AIQuestionCard';
import InterviewCard from './components/InterviewCard';
import MovieForm from './components/MovieForm';
import MovieProgress from './components/MovieProgress';
import MoviePreview from './components/MoviePreview';

interface Photo {
  id: string;
  url: string;
  title: string;
}

interface Interview {
  title: string;
  description: string;
}

interface Movie {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function MovieClient({
  photos,
  interviews,
  userName,
  movies,
}: {
  photos: Photo[];
  interviews: Interview[];
  userName: string;
  movies: Movie[];
}) {
  const [mode, setMode] = useState<'A' | 'B' | 'C'>('A');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [name, setName] = useState(userName);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ movieId?: string; error?: string } | null>(null);
  const [checkStatus, setCheckStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const [analysis, setAnalysis] = useState({
    emotion: '',
    people: '',
    place: '',
    mood: '',
    description: '',
    questions: [] as string[],
  });

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');

  function togglePhoto(url: string) {
    setSelectedPhotos((prev) =>
      prev.includes(url)
        ? prev.filter((u) => u !== url)
        : prev.length < 2
          ? [...prev, url]
          : prev,
    );
  }

  async function handleGenerate() {
    if (selectedPhotos.length === 0) {
      alert('영상에 담을 사진을 최소 1장 선택해주세요.');
      return;
    }

    setGenerating(true);
    setProgress(5);
    setResult(null);

    try {
      const res = await fetch('/api/movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          photos: selectedPhotos,
          title,
          customText,
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.error || '추억 영상 제작 실패' });
      } else {
        setResult({ movieId: data.movieId });
        pollStatus(data.movieId);
      }
    } catch {
      setResult({ error: '오류가 발생했습니다.' });
    } finally {
      setGenerating(false);
    }
  }

  async function pollStatus(movieId: string) {
    setCheckStatus('사진 속 이야기 정리 중...');
    setProgress(20);

    setCheckStatus('남겨둔 이야기 확인 중...');
    setProgress(40);

    setCheckStatus('영상 문구 만드는 중...');
    setProgress(60);

    setCheckStatus('추억 영상 만드는 중...');
    setProgress(80);

    setCheckStatus('추억 영상 제작 완료');
    setProgress(100);

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/movie?movieId=${movieId}`);
        const data = await res.json();
        const status = data.movies?.[0]?.status;

        if (status === 'done') {
          setCheckStatus('완료되었습니다.');
          clearInterval(interval);
        } else if (status === 'error') {
          setCheckStatus('영상 제작에 실패했습니다. 다시 시도해주세요.');
          clearInterval(interval);
        } else {
          setCheckStatus(`추억 영상 제작 중... (${status || 'processing'})`);
        }
      } catch {
        clearInterval(interval);
      }
    }, 5000);
  }

  const MODES = [
    {
      key: 'A',
      label: '사진으로 짧게 만들기',
      desc: '선택한 사진을 바탕으로 따뜻한 영상 문구를 정리합니다.',
    },
    {
      key: 'B',
      label: '직접 문구 넣기',
      desc: '가족에게 전하고 싶은 문장을 직접 넣어 영상을 만듭니다.',
    },
    {
      key: 'C',
      label: '남긴 이야기로 만들기',
      desc: '이야기 남기기에 적어둔 답변을 바탕으로 영상을 만듭니다.',
    },
  ];

  async function analyzePhoto(photoUrl: string) {
    try {
      setCheckStatus('사진 속 이야기 정리 중...');
      setProgress(15);

      const res = await fetch('/api/ai/analyze-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: photoUrl,
        }),
      });

      const json = await res.json();

      console.log(json);

      if (json.success) {
        const data =
          typeof json.result === 'string'
            ? JSON.parse(
                json.result
                  .replace(/^```json\s*/i, '')
                  .replace(/^```\s*/i, '')
                  .replace(/```$/, '')
                  .trim(),
              )
            : json.result;

        console.log(data);

        setAnalysis(data);
        setQuestions(data.questions ?? []);

        const nextRes = await fetch('/api/interview/next-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photoAnalysis: JSON.stringify(data),
            previousQuestions: [],
            previousAnswers: [],
          }),
        });

        const nextJson = await nextRes.json();

        if (
          nextJson.success &&
          typeof nextJson.question === 'string' &&
          nextJson.question.trim().length > 0
        ) {
          setAnalysis((prev) => ({
            ...prev,
            questions: [nextJson.question],
          }));
        }

        setProgress(30);
        setCheckStatus('사진 속 이야기 정리 완료');
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '.08em',
            color: 'var(--ink-faint)',
            marginBottom: 14,
          }}
        >
          추억 영상 제작 방식 선택
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
          }}
        >
          {MODES.map((item) => (
            <div
              key={item.key}
              onClick={() => setMode(item.key as 'A' | 'B' | 'C')}
              style={{
                padding: '18px 16px',
                borderRadius: 12,
                border:
                  mode === item.key
                    ? '2px solid var(--gold)'
                    : '1px solid rgba(34,28,22,.15)',
                background:
                  mode === item.key ? 'rgba(182,137,47,.06)' : 'var(--paper)',
                cursor: 'pointer',
                transition: 'all .2s ease',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 17,
                  marginBottom: 6,
                }}
              >
                {item.label}
              </p>

              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'var(--ink-soft)',
                }}
              >
                {item.desc}
              </p>

              {item.key === 'C' && interviews.length === 0 && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--rust, #8C4A2D)',
                    marginTop: 8,
                  }}
                >
                  아직 남긴 이야기가 없습니다
                </p>
              )}

              {item.key === 'C' && interviews.length > 0 && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--wine)',
                    marginTop: 8,
                  }}
                >
                  남긴 이야기 {interviews.length}개 활용
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 0.7fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        <div>
          <PhotoSelector
            photos={photos}
            selectedPhotos={selectedPhotos}
            togglePhoto={togglePhoto}
            analyzePhoto={analyzePhoto}
          />

          <AIAnalysisCard analysis={analysis} />

          <AIQuestionCard questions={questions} />

          <InterviewCard
            questions={analysis.questions}
            currentQuestion={currentQuestion}
            answer={answer}
            setAnswer={setAnswer}
            answers={answers}
            setAnswers={setAnswers}
            setCurrentQuestion={setCurrentQuestion}
          />

          <MovieForm
            mode={mode}
            title={title}
            name={name}
            customText={customText}
            interviewsCount={interviews.length}
            generating={generating}
            setTitle={setTitle}
            setName={setName}
            setCustomText={setCustomText}
            onGenerate={handleGenerate}
          />

          <MovieProgress
            generating={generating}
            progress={progress}
            status={checkStatus}
            result={result}
          />
        </div>

        <div>
          <MoviePreview
            generating={generating}
            progress={progress}
            status={checkStatus || '대기 중'}
          />

          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '.08em',
              color: 'var(--ink-faint)',
              marginBottom: 14,
            }}
          >
            만든 추억 영상 ({movies.length})
          </p>

          {movies.length === 0 ? (
            <div className="dash-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🎬</div>

              <h3 style={{ marginBottom: 20 }}>추억 영상 미리보기</h3>

              <div
                style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 999,
                  background: '#ddd',
                  overflow: 'hidden',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: '0%',
                    height: '100%',
                    background: 'var(--gold)',
                  }}
                />
              </div>

              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
                추억 영상을 만들면
                <br />
                이곳에서 바로 확인할 수 있습니다.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {movies.map((movie) => (
                <div key={movie.id} className="dash-card">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          fontSize: 17,
                          marginBottom: 4,
                        }}
                      >
                        🎬 {movie.title}
                      </p>

                      <p
                        style={{
                          fontSize: 13,
                          color: 'var(--ink-faint)',
                        }}
                      >
                        {new Date(movie.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>

                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        letterSpacing: '.04em',
                        padding: '5px 11px',
                        borderRadius: 10,
                        background:
                          movie.status === 'PUBLISHED'
                            ? 'var(--wine)'
                            : 'rgba(34,28,22,.08)',
                        color:
                          movie.status === 'PUBLISHED'
                            ? 'var(--cream)'
                            : 'var(--ink-faint)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {movie.status === 'IN_PRODUCTION'
                        ? '제작 중'
                        : movie.status === 'PUBLISHED'
                          ? '완성'
                          : '초안'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}