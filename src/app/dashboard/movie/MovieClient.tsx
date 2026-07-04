'use client';
import PhotoSelector from "./components/PhotoSelector";
import AIAnalysisCard from "./components/AIAnalysisCard";
import { useState } from 'react';
import MoviePreview from "./components/MoviePreview";
interface Photo { id: string; url: string; title: string; }
interface Interview { title: string; description: string; }
interface Movie { id: string; title: string; status: string; createdAt: string; }
import AIQuestionCard from "./components/AIQuestionCard";
import InterviewCard from "./components/InterviewCard";
import MovieForm from "./components/MovieForm";
import MovieProgress from "./components/MovieProgress";

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
  emotion: "",
  people: "",
  place: "",
  mood: "",
  description: "",
  questions: [] as string[],
  });

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");

  function togglePhoto(url: string) {
    setSelectedPhotos(prev =>
      prev.includes(url)
        ? prev.filter(u => u !== url)
        : prev.length < 2
          ? [...prev, url]
          : prev
    );
  }

  async function handleGenerate() {
    if (selectedPhotos.length === 0) {
      alert('사진을 최소 1장 선택해주세요.');
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
        setResult({ error: data.error || '영상 생성 실패' });
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
    setCheckStatus('영상 렌더링 중... (1~3분 소요)');
    setCheckStatus("사진 분석 중...");
    setProgress(20);
    setCheckStatus("인터뷰 분석 중...");
    setProgress(40);
    setCheckStatus("스토리 생성 중...");
    setProgress(60);
    setCheckStatus("영상 렌더링 중...");
    setProgress(80);
    setCheckStatus("영상 제작 완료");
    setProgress(100);
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/movie?movieId=${movieId}`);
        const data = await res.json();
        const status = data.movies?.[0]?.status;
        if (status === 'done') {
          setCheckStatus('완료!');
          clearInterval(interval);
        } else if (status === 'error') {
          setCheckStatus('렌더링 실패. 다시 시도해주세요.');
          clearInterval(interval);
        } else {
          setCheckStatus(`렌더링 중... (${status || 'processing'})`);
        }
      } catch {
        clearInterval(interval);
      }
    }, 5000);
  }

  const MODES = [
    { key: 'A', label: '📸 사진 + 캡션', desc: '사진을 분석해 감성 문장을 자동 생성합니다.' },
    { key: 'B', label: '✍️ 사진 + 직접 입력', desc: '원하는 문구를 직접 입력해 영상을 만듭니다.' },
    { key: 'C', label: '🎙 사진 + 인터뷰', desc: '인터뷰 답변을 바탕으로 영상 스크립트를 만듭니다.' },
  ];

  async function analyzePhoto(photoUrl: string) {
  try {
    setCheckStatus("AI 사진 분석 중...");
    setProgress(15);

    const res = await fetch("/api/ai/analyze-photo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: photoUrl,
      }),
    });

    const json = await res.json();

console.log(json);

if (json.success) {

 const data =
  typeof json.result === "string"
    ? JSON.parse(
        json.result
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/, "")
          .trim()
      )
    : json.result;

  console.log(data);

  setAnalysis(data);

  setQuestions(data.questions ?? []);

  const nextRes = await fetch("/api/interview/next-question", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
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
  typeof nextJson.question === "string" &&
  nextJson.question.trim().length > 0
) {
  setAnalysis((prev) => ({
    ...prev,
    questions: [nextJson.question],
  }));
}

  setProgress(30);

  setCheckStatus("사진 분석 완료");

}

  } catch (e) {
    console.error(e);
  }
}

  return (
    <div>
      {/* 모드 선택 */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', color: 'var(--ink-faint)', marginBottom: 14 }}>
          영상 제작 방식 선택
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {MODES.map(m => (
            <div
              key={m.key}
              onClick={() => setMode(m.key as 'A' | 'B' | 'C')}
              style={{
                padding: '18px 16px',
                borderRadius: 3,
                border: mode === m.key
                  ? '2px solid var(--gold)'
                  : '1px solid rgba(34,28,22,.15)',
                background: mode === m.key ? 'rgba(182,137,47,.06)' : 'var(--paper)',
                cursor: 'pointer',
                transition: 'all .2s ease',
              }}
            >
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                {m.label}
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{m.desc}</p>
              {m.key === 'C' && interviews.length === 0 && (
                <p style={{ fontSize: 11.5, color: 'var(--rust, #8C4A2D)', marginTop: 6 }}>
                  ⚠️ 인터뷰 답변이 없습니다
                </p>
              )}
              {m.key === 'C' && interviews.length > 0 && (
                <p style={{ fontSize: 11.5, color: 'var(--wine)', marginTop: 6 }}>
                  ✓ 인터뷰 {interviews.length}개 활용
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
  style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.7fr",
          gap: 32,
          alignItems: "start",
             }}
           >
        {/* 왼쪽: 설정 */}
        <div>
          {/* 사진 선택 */}
        <PhotoSelector
             photos={photos}
             selectedPhotos={selectedPhotos}
             togglePhoto={togglePhoto}
             analyzePhoto={analyzePhoto}
            />      

     <AIAnalysisCard
  analysis={analysis}
/>

<AIQuestionCard
  questions={questions}
/>

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
        {/* 오른쪽: 제작된 영상 목록 */}
    <div>
          <MoviePreview
  generating={generating}
  progress={progress}
  status={checkStatus || "대기중"}
/>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', color: 'var(--ink-faint)', marginBottom: 14 }}>
            제작된 영상 ({movies.length})
          </p>
          {movies.length === 0 ? (
            <div className="dash-card" style={{ textAlign: "center" }}>
  <div style={{ fontSize: 64, marginBottom: 20 }}>
    🎬
  </div>

  <h3 style={{ marginBottom: 20 }}>
   영상 미리보기
  </h3>

  <div
    style={{
      width: "100%",
      height: 8,
      borderRadius: 999,
      background: "#ddd",
      overflow: "hidden",
      marginBottom: 20,
    }}
  >
    <div
      style={{
        width: "0%",
        height: "100%",
        background: "var(--gold)",
      }}
    />
  </div>

  <p style={{ color: "var(--ink-soft)" }}>
    영상을 제작하면
    <br />
    이곳에서 바로 재생됩니다.
  </p>
</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {movies.map(m => (
                <div key={m.id} className="dash-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                        🎬 {m.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                        {new Date(m.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.04em',
                      padding: '4px 10px', borderRadius: 10,
                      background: m.status === 'PUBLISHED' ? 'var(--wine)' : 'rgba(34,28,22,.08)',
                      color: m.status === 'PUBLISHED' ? 'var(--cream)' : 'var(--ink-faint)',
                    }}>
                      {m.status === 'IN_PRODUCTION' ? '제작 중' : m.status === 'PUBLISHED' ? '완성' : '초안'}
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