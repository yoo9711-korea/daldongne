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
            'linear-gradient(135deg, #fff8f3 0%, #fffdfb 55%, #ffede3 100%)',
          color: '#49352b',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            color: '#e4775e',
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
            color: '#725d52',
          }}
        >
          사진과 이야기가 한 권의 책으로 완성되면,
          가족이 언제든 다시 꺼내볼 수 있도록 내 책장에 보관됩니다.
        </p>
      </div>

      <div
        style={{
          padding: '42px 32px 48px',
          background: 'linear-gradient(180deg, #fffdf9 0%, #fff3e9 100%)',
        }}
      >
        <div
          style={{
            padding: '34px 28px 42px',
            borderRadius: 28,
            background: 'linear-gradient(180deg, #fff5ed 0%, #f5d9c7 100%)',
            boxShadow:
              'inset 0 8px 18px rgba(255,255,255,0.62), 0 20px 45px rgba(178,112,76,0.14)',
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
                    ? 'linear-gradient(180deg, #fff1d9 0%, #e7a96f 100%)'
                    : index % 3 === 1
                      ? 'linear-gradient(180deg, #fffdf8 0%, #e9c29a 100%)'
                      : 'linear-gradient(180deg, #ffe6c8 0%, #dc9671 100%)',
                boxShadow:
                  'inset -7px 0 12px rgba(116,69,45,0.12), inset 5px 0 10px rgba(255,255,255,0.5), 0 12px 22px rgba(135,78,48,0.14)',
                border: '1px solid rgba(157,96,65,0.2)',
                position: 'relative' as const,
                writingMode: 'vertical-rl' as const,
                textOrientation: 'mixed' as const,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px 10px',
                color: '#49352b',
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
              background: 'linear-gradient(180deg, #e0a271 0%, #b96f4f 100%)',
              boxShadow: '0 -7px 16px rgba(132,76,47,0.16)',
            }}
          />
        </div>
      </div>
    </section>
  );
}