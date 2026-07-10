import Link from 'next/link';

type BookShelfItem = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  href?: string;
};

interface Props {
  books?: BookShelfItem[];
}

const SAMPLE_BOOKS: BookShelfItem[] = [
  {
    id: 'sample-1',
    title: '어머니의 봄날 이야기',
    subtitle: '부모님 인생책',
    status: '완성 예시',
  },
  {
    id: 'sample-2',
    title: '아버지의 첫 월급날',
    subtitle: '가족 기록책',
    status: '완성 예시',
  },
  {
    id: 'sample-3',
    title: '우리 가족의 시간',
    subtitle: '가족 인생책',
    status: '완성 예시',
  },
];

export default function BookShelfView({ books = [] }: Props) {
  const displayBooks = books.length > 0 ? books : SAMPLE_BOOKS;

  return (
    <section
      className="dash-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        marginBottom: 28,
      }}
    >
      <div
        style={{
          padding: '30px 32px 22px',
          background:
            'linear-gradient(135deg, #3a2a1f 0%, #5b3f29 58%, #8a6238 100%)',
          color: '#fff8ec',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            color: '#f0c36a',
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          내 책장
        </p>

        <h2
          style={{
            margin: 0,
            fontFamily: 'Noto Serif KR, serif',
            fontSize: 38,
            lineHeight: 1.35,
            letterSpacing: '-0.04em',
          }}
        >
          완성된 인생책은
          <br />
          이 책장에 꽂아둡니다.
        </h2>

        <p
          style={{
            marginTop: 16,
            maxWidth: 760,
            fontSize: 17,
            lineHeight: 1.75,
            color: 'rgba(255, 248, 236, 0.82)',
          }}
        >
          사진과 이야기가 한 권의 책으로 완성되면,
          가족이 언제든 다시 꺼내볼 수 있도록 내 책장에 보관됩니다.
        </p>
      </div>

      <div
        style={{
          padding: '42px 32px 48px',
          background: 'linear-gradient(180deg, #fff8ec 0%, #efe0c4 100%)',
        }}
      >
        <div
          style={{
            padding: '34px 28px 42px',
            borderRadius: 28,
            background: 'linear-gradient(180deg, #6b4428 0%, #4a2f1d 100%)',
            boxShadow:
              'inset 0 8px 18px rgba(255,255,255,0.08), 0 24px 60px rgba(91,66,43,0.22)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 14,
              minHeight: 260,
              overflowX: 'auto',
              paddingBottom: 12,
            }}
          >
            {displayBooks.map((book, index) => {
              const bookStyle = {
                flex: '0 0 auto',
                width: index % 3 === 0 ? 82 : index % 3 === 1 ? 96 : 76,
                height: index % 3 === 0 ? 230 : index % 3 === 1 ? 250 : 218,
                borderRadius: '10px 10px 5px 5px',
                background:
                  index % 3 === 0
                    ? 'linear-gradient(180deg, #efe0c4 0%, #b98642 100%)'
                    : index % 3 === 1
                      ? 'linear-gradient(180deg, #fff8ec 0%, #8a6238 100%)'
                      : 'linear-gradient(180deg, #d7b06a 0%, #5b3f29 100%)',
                boxShadow:
                  'inset -8px 0 14px rgba(0,0,0,0.18), inset 5px 0 10px rgba(255,255,255,0.18), 0 14px 24px rgba(0,0,0,0.22)',
                border: '1px solid rgba(255,248,236,0.28)',
                position: 'relative' as const,
                writingMode: 'vertical-rl' as const,
                textOrientation: 'mixed' as const,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px 10px',
                color: index % 3 === 1 ? '#33271d' : '#fff8ec',
                fontWeight: 900,
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 18,
                lineHeight: 1.35,
                textDecoration: 'none',
                cursor: book.href ? 'pointer' : 'default',
              };

              if (book.href) {
                return (
                  <Link key={book.id} href={book.href} style={bookStyle}>
                    <span>{book.title}</span>
                  </Link>
                );
              }

              return (
                <article key={book.id} style={bookStyle}>
                  <span>{book.title}</span>
                </article>
              );
            })}
          </div>

          <div
            style={{
              height: 24,
              borderRadius: 10,
              background: 'linear-gradient(180deg, #8a6238 0%, #3a2517 100%)',
              boxShadow: '0 -8px 18px rgba(0,0,0,0.22)',
            }}
          />
        </div>
      </div>
    </section>
  );
}