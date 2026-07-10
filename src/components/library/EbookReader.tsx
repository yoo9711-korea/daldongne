'use client';

import { Children, ReactNode, useMemo, useState } from 'react';

type Props = {
  children: ReactNode;
};

export default function EbookReader({ children }: Props) {
  const pages = useMemo(() => Children.toArray(children), [children]);
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = pages.length;
  const isFirstPage = currentPage <= 0;
  const isLastPage = currentPage >= totalPages - 1;

  const goPrev = () => {
    if (isFirstPage) return;
    setCurrentPage((page) => page - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goNext = () => {
    if (isLastPage) return;
    setCurrentPage((page) => page + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveAsPdf = () => {
    window.print();
  };

  if (totalPages === 0) {
    return null;
  }

  return (
    <section className="ebook-reader">
      <style>{ebookReaderStyles}</style>

      <div className="ebook-reader__toolbar">
        <button
          type="button"
          onClick={goPrev}
          disabled={isFirstPage}
          className="ebook-reader__button"
        >
          이전 페이지
        </button>

        <p className="ebook-reader__page-count">
          {currentPage + 1} / {totalPages}
        </p>

        <button
          type="button"
          onClick={goNext}
          disabled={isLastPage}
          className="ebook-reader__button ebook-reader__button--primary"
        >
          다음 페이지
        </button>

        <button
          type="button"
          onClick={saveAsPdf}
          className="ebook-reader__button ebook-reader__button--pdf"
        >
          PDF로 저장
        </button>
      </div>

      <div className="ebook-reader__page-wrap">{pages[currentPage]}</div>

      <div className="ebook-reader__bottom">
        <button
          type="button"
          onClick={goPrev}
          disabled={isFirstPage}
          className="ebook-reader__button"
        >
          이전
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={isLastPage}
          className="ebook-reader__button ebook-reader__button--primary"
        >
          다음
        </button>

        <button
          type="button"
          onClick={saveAsPdf}
          className="ebook-reader__button ebook-reader__button--pdf"
        >
          PDF로 저장
        </button>
      </div>

      <div className="ebook-reader__print-pages">{pages}</div>
    </section>
  );
}

const ebookReaderStyles = `
  .ebook-reader {
    display: grid;
    gap: 22px;
  }

  .ebook-reader__toolbar,
  .ebook-reader__bottom {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .ebook-reader__bottom {
    margin-top: 4px;
  }

  .ebook-reader__button {
    min-height: 42px;
    padding: 0 18px;
    border-radius: 999px;
    border: 1px solid #d6b778;
    background: #fffaf0;
    color: #4a3828;
    font-size: 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .ebook-reader__button:disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }

  .ebook-reader__button--primary {
    background: #24170f;
    color: #fffaf0;
    border-color: #24170f;
  }

  .ebook-reader__button--pdf {
    background: #f3d28a;
    color: #5a3510;
    border-color: #c18a23;
  }

  .ebook-reader__page-count {
    margin: 0;
    min-width: 80px;
    text-align: center;
    color: #6b5a46;
    font-size: 14px;
    font-weight: 900;
  }

  .ebook-reader__print-pages {
    display: none;
  }

  @media (max-width: 760px) {
    .ebook-reader__toolbar,
    .ebook-reader__bottom {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .ebook-reader__page-count {
      grid-column: 1 / -1;
      order: -1;
      width: 100%;
    }

    .ebook-reader__button {
      width: 100%;
    }

    .ebook-reader__button--pdf {
      grid-column: 1 / -1;
    }
  }

  @media print {
    body {
      background: #ffffff !important;
    }

    .site-nav,
    .ebook-toolbar,
    .ebook-reader__toolbar,
    .ebook-reader__bottom,
    .ebook-reader__page-wrap {
      display: none !important;
    }

    .ebook-main {
      padding: 0 !important;
      background: #ffffff !important;
    }

    .ebook-book,
    .ebook-reader {
      display: block !important;
      max-width: none !important;
      margin: 0 !important;
      gap: 0 !important;
    }

    .ebook-reader__print-pages {
      display: block !important;
    }

    .ebook-reader__print-pages .ebook-page {
      width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 auto !important;
      padding: 22mm 20mm 24mm !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      border: none !important;
      page-break-after: always;
      break-after: page;
    }

    .ebook-reader__print-pages .ebook-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .ebook-reader__print-pages img {
      max-width: 100% !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    @page {
      size: A4;
      margin: 0;
    }
  }
`;