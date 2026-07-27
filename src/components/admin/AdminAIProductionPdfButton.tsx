"use client";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  useState,
} from "react";

type AdminAIProductionPdfButtonProps = {
  orderRecordId: string;
  canGenerate: boolean;
  hasPdf: boolean;
};

type PdfResponse = {
  ok?: boolean;
  message?: string;
  alreadyGenerated?: boolean;
  run?: {
    id?: string;
    attempt?: number;
    status?: string;
    currentStep?: string;
    downloadUrl?: string;
  };
};

export default function AdminAIProductionPdfButton({
  orderRecordId,
  canGenerate,
  hasPdf,
}: AdminAIProductionPdfButtonProps) {
  const router =
    useRouter();

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [
    pdfAvailable,
    setPdfAvailable,
  ] = useState(
    hasPdf,
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    isError,
    setIsError,
  ] = useState(false);

  const previewUrl =
    `/internal/ai-book-pdf/${encodeURIComponent(
      orderRecordId,
    )}`;

  const downloadUrl =
    `/api/admin/orders/${encodeURIComponent(
      orderRecordId,
    )}/ai-production/pdf`;

  const handleGenerate =
    async () => {
      if (
        !canGenerate ||
        isGenerating
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          [
            "AI 최종 PDF를 생성할까요?",
            "",
            "다음 작업이 자동으로 진행됩니다.",
            "• A5 책 페이지 렌더링",
            "• 모든 사진과 글꼴 로딩 확인",
            "• 인쇄용 PDF 생성",
            "• 비공개 저장소에 PDF 보관",
            "• 관리자 최종 승인 단계로 이동",
            "",
            "생성 후 반드시 PDF를 내려받아 사진, 글자, 페이지 순서를 확인해 주세요.",
          ].join("\n"),
        );

      if (!confirmed) {
        return;
      }

      setIsGenerating(
        true,
      );

      setMessage("");

      setIsError(
        false,
      );

      try {
        const response =
          await fetch(
            downloadUrl,
            {
              method:
                "POST",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const data =
          (await response
            .json()
            .catch(
              () => null,
            )) as
            | PdfResponse
            | null;

        if (
          !response.ok ||
          !data?.ok
        ) {
          throw new Error(
            data?.message ||
              "최종 PDF를 생성하지 못했습니다.",
          );
        }

        setPdfAvailable(
          true,
        );

        setIsError(
          false,
        );

        setMessage(
          data.alreadyGenerated
            ? "이미 생성된 최종 PDF가 있습니다. 아래 버튼으로 확인해 주세요."
            : data.message ||
                "최종 PDF를 생성했습니다. 관리자 승인 전에 파일을 확인해 주세요.",
        );

        router.refresh();
      } catch (error) {
        setIsError(
          true,
        );

        setMessage(
          error instanceof
          Error
            ? error.message
            : "최종 PDF 생성 중 오류가 발생했습니다.",
        );
      } finally {
        setIsGenerating(
          false,
        );
      }
    };

  const canPreview =
    canGenerate ||
    pdfAvailable;

  return (
    <div className="admin-ai-pdf-button">
      {canGenerate ? (
        <button
          type="button"
          onClick={
            handleGenerate
          }
          disabled={
            isGenerating
          }
        >
          {isGenerating
            ? "최종 PDF 생성 중..."
            : "AI 최종 PDF 생성"}
        </button>
      ) : null}

      {canPreview ? (
        <div className="admin-ai-pdf-links">
          <Link
            href={
              previewUrl
            }
            target="_blank"
            rel="noreferrer"
          >
            A5 페이지 미리보기
          </Link>

          {pdfAvailable ? (
            <a
              href={
                downloadUrl
              }
            >
              최종 PDF 다운로드
            </a>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p
          role={
            isError
              ? "alert"
              : "status"
          }
          data-tone={
            isError
              ? "error"
              : "success"
          }
        >
          {message}
        </p>
      ) : null}

      <style jsx>{`
        .admin-ai-pdf-button {
          display: grid;
          gap: 9px;
        }

        button {
          width: 100%;
          min-height: 46px;
          padding: 0 17px;
          border: 0;
          border-radius: 12px;
          color: #ffffff;
          background:
            linear-gradient(
              135deg,
              #705091,
              #9870b1
            );
          box-shadow:
            0 10px 24px
            rgba(
              99,
              65,
              122,
              0.2
            );
          font: inherit;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            opacity 0.16s ease;
        }

        button:hover:not(
          :disabled
        ) {
          transform:
            translateY(-1px);
        }

        button:disabled {
          color: #9c8b9f;
          background: #e5dfe8;
          box-shadow: none;
          cursor:
            not-allowed;
          opacity: 0.82;
        }

        .admin-ai-pdf-links {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 8px;
        }

        .admin-ai-pdf-links
        :global(a) {
          min-height: 42px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #cbb8d5;
          border-radius: 11px;
          color: #674979;
          background: #ffffff;
          font-size: 9px;
          font-weight: 900;
          text-align: center;
          text-decoration: none;
        }

        .admin-ai-pdf-links
        :global(a:last-child) {
          border-color: transparent;
          color: #ffffff;
          background: #755294;
        }

        p {
          margin: 0;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 9px;
          line-height: 1.7;
          white-space: pre-line;
        }

        p[data-tone="success"] {
          color: #386348;
          background: #e9f5ed;
        }

        p[data-tone="error"] {
          color: #91483f;
          background: #fff0ed;
        }

        @media (
          max-width: 520px
        ) {
          .admin-ai-pdf-links {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>
    </div>
  );
}