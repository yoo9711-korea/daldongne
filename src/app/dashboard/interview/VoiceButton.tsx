'use client';

import { useState, useRef } from 'react';

interface VoiceButtonProps {
  onTranscribed: (text: string) => void;
}

export default function VoiceButton({ onTranscribed }: VoiceButtonProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setStatus('processing');
        stream.getTracks().forEach(t => t.stop());

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) throw new Error('변환 실패');
          const data = await res.json();
          onTranscribed(data.text);
        } catch (err) {
          alert('음성 인식에 실패했습니다. 다시 시도해주세요.');
        } finally {
          setStatus('idle');
        }
      };

      mediaRecorder.start();
      setStatus('recording');
    } catch (err) {
      alert('마이크 권한을 허용해주세요.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  const labels = {
    idle: '🎙 음성으로 답하기',
    recording: '⏹ 녹음 중... 클릭해서 완료',
    processing: '⏳ 변환 중...',
  };

  const colors = {
    idle: 'var(--wine)',
    recording: '#e53e3e',
    processing: 'var(--ink-faint)',
  };

  return (
    <button
      type="button"
      onClick={status === 'recording' ? stopRecording : startRecording}
      disabled={status === 'processing'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        border: `1px solid ${colors[status]}`,
        color: colors[status],
        borderRadius: 20,
        padding: '8px 16px',
        fontSize: 13.5,
        fontFamily: 'var(--font-body)',
        cursor: status === 'processing' ? 'not-allowed' : 'pointer',
        transition: 'all .2s ease',
        animation: status === 'recording' ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }}
    >
      {status === 'recording' && (
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#e53e3e', display: 'inline-block',
        }} />
      )}
      {labels[status]}
    </button>
  );
}