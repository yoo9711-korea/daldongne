"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const fileRef =
    useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => {
    if (
      !selectedFile ||
      !selectedFile.type.startsWith("image/")
    ) {
      setPreviewUrl("");
      return;
    }

    const objectUrl =
      URL.createObjectURL(selectedFile);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  function chooseFile() {
    fileRef.current?.click();
  }

  function applyFile(file: File | null) {
    setMessage("");
    setSelectedFile(file);

    if (!file || !fileRef.current) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileRef.current.files = transfer.files;
  }

  function handleFileChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    applyFile(
      event.currentTarget.files?.[0] ||
        null,
    );
  }

  function handleDrop(
    event:
      React.DragEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();

    applyFile(
      event.dataTransfer.files?.[0] ||
        null,
    );
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const file =
      fileRef.current?.files?.[0];

    if (!file) {
      setMessage(
        "먼저 사진을 선택해 주세요.",
      );
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData =
        new FormData(form);

      const response = await fetch(
        "/api/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("업로드 실패");
      }

      setMessage(
        "사진을 안전하게 저장했습니다.",
      );

      setSelectedFile(null);
      form.reset();
      router.refresh();
    } catch {
      setMessage(
        "업로드 중 오류가 발생했습니다.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="timeline-upload-form"
      onSubmit={handleSubmit}
    >
      <button
        type="button"
        className="timeline-upload-dropzone"
        data-has-file={
          selectedFile ? "true" : "false"
        }
        onClick={chooseFile}
        onDragOver={(event) =>
          event.preventDefault()
        }
        onDrop={handleDrop}
      >
        <input
          ref={fileRef}
          className="timeline-upload-file-input"
          type="file"
          name="file"
          accept="image/*,video/*,audio/*"
          onChange={handleFileChange}
          required
        />

        {selectedFile ? (
          <span className="timeline-upload-preview">
            <span className="timeline-upload-preview-image">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="선택한 사진 미리보기"
                />
              ) : (
                <span className="timeline-upload-empty">
                  <span aria-hidden="true">
                    <UploadIcon />
                  </span>
                </span>
              )}
            </span>

            <span className="timeline-upload-preview-file">
              <strong>
                {selectedFile.name}
              </strong>

              <span>
                {formatFileSize(
                  selectedFile.size,
                )}
              </span>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();

                  setSelectedFile(null);

                  if (fileRef.current) {
                    fileRef.current.value = "";
                  }
                }}
              >
                다른 파일 선택
              </button>
            </span>
          </span>
        ) : (
          <span className="timeline-upload-empty">
            <span aria-hidden="true">
              <UploadIcon />
            </span>

            <strong>사진 선택하기</strong>

            <p>
              여기를 누르거나 사진을
              끌어다 놓으세요.
            </p>
          </span>
        )}
      </button>

      <div className="timeline-upload-fields">
        <div className="timeline-upload-field">
          <label htmlFor="timeline-title">
            사진 제목
          </label>

          <input
            id="timeline-title"
            type="text"
            name="title"
            placeholder="예: 가족과 함께한 봄날"
          />
        </div>

        <div className="timeline-upload-field">
          <label htmlFor="timeline-date">
            사진 날짜 (선택)
           </label>

          <input
            id="timeline-date"
            type="date"
            name="occurredAt"
          />
        </div>

        <div
          className="timeline-upload-field"
          data-full="true"
        >
          <label htmlFor="timeline-description">
             짧은 사진 설명 (선택)
           </label>

          <textarea
            id="timeline-description"
            name="description"
            placeholder="예: 1980년 봄, 가족과 함께 동네 공원에서 찍은 사진"
          />
        </div>
      </div>

      <div className="timeline-upload-footer">
        <button
          type="submit"
          className="timeline-upload-submit"
          disabled={
            uploading || !selectedFile
          }
        >
          {uploading
            ? "사진 저장 중..."
            : "사진 저장하기"}
        </button>

        {message ? (
          <span className="timeline-upload-message">
            {message}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 58 58" fill="none">
      <rect
        x="8"
        y="10"
        width="39"
        height="35"
        rx="7"
        stroke="currentColor"
        strokeWidth="2.8"
      />
      <circle
        cx="22"
        cy="23"
        r="4"
        fill="currentColor"
        opacity=".72"
      />
      <path
        d="m13 39 11-11 8 8 5-5 9 9"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="45"
        cy="43"
        r="10"
        fill="#FF7664"
      />
      <path
        d="M45 38v10M40 43h10"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size}B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)}KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)}MB`;
}
