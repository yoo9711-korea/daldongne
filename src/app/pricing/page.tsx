import { auth } from '@/auth';
import Link from 'next/link';

const products = [
  {
    title: '디지털 책 원고',
    label: '사진과 이야기를 책 원고로 정리',
    price: '로그인 후 이용',
    description:
      '사진과 이야기를 모아 목차와 책 원고를 만들고, 완성된 원고를 내 책장에서 확인하는 서비스입니다.',
    features: [
      '사진과 이야기 자료 선택',
      '글 다듬기와 목차 구성',
      '책 원고 만들기',
      '책 읽기 화면 제공',
      '인쇄용 원고 확인',
      '내 책장에 원고 저장',
    ],
    notice:
      '실물 인쇄와 배송은 포함되지 않습니다. 완성된 원고를 바탕으로 별도의 제작 상담을 신청할 수 있습니다.',
    action: 'book',
    cta: '책 원고 만들기',
    highlight: false,
  },
  {
    title: '기본 실물 책 제작',
    label: '소프트커버 책 제작',
    price: '99,000원부터',
    description:
      '완성된 원고를 바탕으로 일반적인 소프트커버 책을 제작하는 상품입니다.',
    features: [
      '50~80페이지 기본 기준',
      '기본 소프트커버 제본',
      '사진과 본문 편집 확인',
      '표지와 목차 확인',
      '최종 제작 사양 확인',
      '견적 확정 후 결제',
    ],
    notice:
      '최종 가격은 페이지 수, 인쇄 수량, 용지, 제본과 배송 조건을 확인한 뒤 확정됩니다.',
    action: 'library',
    cta: '제작할 원고 선택',
    highlight: true,
  },
  {
    title: '맞춤형 책 제작',
    label: '선물용·보관용 고급 제작',
    price: '별도 견적',
    description:
      '하드커버, 추가 인쇄, 사람 원고 검수와 표지 보완이 필요한 책을 맞춤 제작합니다.',
    features: [
      '하드커버 선택',
      '사람 원고 검수',
      '표지 디자인 보완',
      '추가 페이지 편집',
      '여러 권 추가 인쇄',
      '맞춤 제작 상담',
    ],
    notice:
      '원고와 원하는 제작 사양을 확인한 뒤 개별 견적을 안내합니다.',
    action: 'library',
    cta: '맞춤 제작 상담',
    highlight: false,
  },
];

const bookTypes = [
  {
    title: '인생 기록책',
    text: '한 사람의 성장 과정과 중요한 삶의 순간을 기록합니다.',
  },
  {
    title: '가족 이야기책',
    text: '가족이 함께 겪은 시간과 서로의 이야기를 한 권에 담습니다.',
  },
  {
    title: '부부 이야기책',
    text: '만남부터 현재까지 부부가 함께한 시간을 기록합니다.',
  },
  {
    title: '성장 기록책',
    text: '아이의 출생과 성장 과정, 가족의 기억을 정리합니다.',
  },
  {
    title: '여행 기록책',
    text: '여행 사진과 그날의 경험을 한 권의 기록으로 남깁니다.',
  },
];

const additionalServices = [
  {
    title: '사람 원고 검수',
    text: '문장의 흐름, 반복 표현과 맞춤법을 사람이 확인합니다.',
  },
  {
    title: '표지 디자인 보완',
    text: '사진과 책의 분위기에 맞게 표지 구성을 보완합니다.',
  },
  {
    title: '추가 페이지 편집',
    text: '기본 분량을 초과하는 사진과 이야기를 추가 편집합니다.',
  },
  {
    title: '추가 인쇄',
    text: '선물이나 가족 보관을 위해 필요한 수량만큼 추가 제작합니다.',
  },
];

const paymentSteps = [
  {
    number: '01',
    title: '책 원고 완성',
    text: '사진과 이야기를 모아 내 책장에 책 원고를 저장합니다.',
  },
  {
    number: '02',
    title: '제작 상담 신청',
    text: '내 책장에서 제작할 원고를 선택하고 원하는 사양을 남깁니다.',
  },
  {
    number: '03',
    title: '제작 사양과 금액 확정',
    text: '페이지, 제본, 수량과 배송 조건을 확인해 최종 견적을 안내합니다.',
  },
  {
    number: '04',
    title: '결제',
    text: '최종 견적을 확인한 뒤 카드 또는 제공되는 결제수단으로 결제합니다.',
  },
  {
    number: '05',
    title: '책 제작과 배송',
    text: '결제가 완료되면 제작을 시작하고 진행 상태를 내 책장에서 확인합니다.',
  },
];

export default async function PricingPage() {
  const session = await auth();

  const bookHref = session?.user
    ? '/dashboard/book'
    : '/login?callbackUrl=/dashboard/book';

  const libraryHref = session?.user
    ? '/dashboard/library'
    : '/login?callbackUrl=/dashboard/library';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f7eddc',
        color: '#271a12',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 1240,
          margin: '0 auto',
          padding: '70px 24px 90px',
          boxSizing: 'border-box',
        }}
      >
        <section
          style={{
            padding: '46px 40px',
            borderRadius: 34,
            background:
              'linear-gradient(135deg, #302017 0%, #563923 100%)',
            color: '#fffaf0',
            boxShadow: '0 24px 60px rgba(57, 35, 20, 0.18)',
          }}
        >
          <p
            style={{
              margin: '0 0 14px',
              color: '#f0c36a',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            달동네 출판사 상품 안내
          </p>

          <h1
            style={{
              margin: 0,
              maxWidth: 900,
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 'clamp(38px, 6vw, 64px)',
              lineHeight: 1.16,
              letterSpacing: '-0.05em',
            }}
          >
            원고 만들기부터
            <br />
            실물 책 제작까지
          </h1>

          <p
            style={{
              margin: '22px 0 0',
              maxWidth: 820,
              color: 'rgba(255, 250, 240, 0.84)',
              fontSize: 18,
              lineHeight: 1.8,
            }}
          >
            디지털 책 원고와 실물 책 제작은 서로 다른
            상품입니다. 먼저 사진과 이야기로 원고를 만든 뒤,
            원하는 경우 제작 상담과 결제를 거쳐 실물 책으로
            제작할 수 있습니다.
          </p>
        </section>

        <section
          style={{
            marginTop: 34,
          }}
        >
          <div
            style={{
              marginBottom: 22,
            }}
          >
            <p
              style={{
                margin: 0,
                color: '#8a5a2c',
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              상품 종류
            </p>

            <h2
              style={{
                margin: '8px 0 0',
                fontFamily: 'Noto Serif KR, serif',
                fontSize: 34,
                letterSpacing: '-0.04em',
              }}
            >
              필요한 단계에 맞는 상품을 선택하세요
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 18,
            }}
          >
            {products.map((product) => {
              const href =
                product.action === 'book'
                  ? bookHref
                  : libraryHref;

              return (
                <article
                  key={product.title}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 28,
                    borderRadius: 28,
                    border: product.highlight
                      ? '2px solid #a86c2d'
                      : '1px solid #dfc9a4',
                    background: product.highlight
                      ? '#fff8e9'
                      : '#fffdf7',
                    boxShadow: product.highlight
                      ? '0 18px 45px rgba(117, 73, 28, 0.16)'
                      : '0 12px 30px rgba(75, 48, 27, 0.08)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#95642e',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {product.label}
                  </p>

                  <h2
                    style={{
                      margin: '10px 0 0',
                      fontFamily: 'Noto Serif KR, serif',
                      fontSize: 29,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {product.title}
                  </h2>

                  <strong
                    style={{
                      display: 'block',
                      marginTop: 13,
                      color: '#6f421b',
                      fontSize: 24,
                    }}
                  >
                    {product.price}
                  </strong>

                  <p
                    style={{
                      margin: '16px 0 0',
                      color: '#675445',
                      fontSize: 15,
                      lineHeight: 1.75,
                    }}
                  >
                    {product.description}
                  </p>

                  <ul
                    style={{
                      margin: '22px 0 0',
                      padding: 0,
                      listStyle: 'none',
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    {product.features.map((feature) => (
                      <li
                        key={feature}
                        style={{
                          paddingBottom: 10,
                          borderBottom: '1px solid #eadcc6',
                          color: '#44362b',
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}
                      >
                        ✓ {feature}
                      </li>
                    ))}
                  </ul>

                  <p
                    style={{
                      margin: '20px 0 0',
                      padding: 14,
                      borderRadius: 14,
                      background: '#f6ead6',
                      color: '#76583d',
                      fontSize: 13,
                      lineHeight: 1.65,
                    }}
                  >
                    {product.notice}
                  </p>

                  <Link
                    href={href}
                    style={{
                      marginTop: 'auto',
                      paddingTop: 24,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 48,
                      borderRadius: 14,
                      background: product.highlight
                        ? '#6e421d'
                        : '#2d2119',
                      color: '#fffaf0',
                      textDecoration: 'none',
                      fontSize: 15,
                      fontWeight: 900,
                    }}
                  >
                    {product.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section
          style={{
            marginTop: 34,
            padding: 30,
            borderRadius: 28,
            background: '#fffdf7',
            border: '1px solid #dfc9a4',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#8a5a2c',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            책 내용 종류
          </p>

          <h2
            style={{
              margin: '8px 0 0',
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 32,
              letterSpacing: '-0.04em',
            }}
          >
            어떤 이야기를 담을지 선택합니다
          </h2>

          <p
            style={{
              margin: '13px 0 0',
              color: '#6c5847',
              lineHeight: 1.75,
            }}
          >
            아래 항목은 결제 상품이 아니라 책에 담을 이야기의
            종류입니다.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              marginTop: 22,
            }}
          >
            {bookTypes.map((type) => (
              <article
                key={type.title}
                style={{
                  padding: 20,
                  borderRadius: 20,
                  background: '#f7eddd',
                  border: '1px solid #e6d2b2',
                }}
              >
                <strong
                  style={{
                    display: 'block',
                    fontSize: 18,
                  }}
                >
                  {type.title}
                </strong>

                <p
                  style={{
                    margin: '9px 0 0',
                    color: '#6d5846',
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  {type.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 34,
            padding: 30,
            borderRadius: 28,
            background: '#fff8e9',
            border: '1px solid #dfc28f',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#8a5a2c',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            추가 서비스
          </p>

          <h2
            style={{
              margin: '8px 0 0',
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 32,
              letterSpacing: '-0.04em',
            }}
          >
            필요한 항목만 견적에 추가합니다
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              marginTop: 22,
            }}
          >
            {additionalServices.map((service) => (
              <article
                key={service.title}
                style={{
                  padding: 20,
                  borderRadius: 20,
                  background: '#fffdf8',
                  border: '1px solid #e6d2b2',
                }}
              >
                <strong
                  style={{
                    display: 'block',
                    fontSize: 18,
                  }}
                >
                  {service.title}
                </strong>

                <p
                  style={{
                    margin: '9px 0 0',
                    color: '#6d5846',
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  {service.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 34,
            padding: 34,
            borderRadius: 30,
            background: '#2c2119',
            color: '#fffaf0',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#f0c36a',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.08em',
            }}
          >
            제작과 결제 절차
          </p>

          <h2
            style={{
              margin: '8px 0 0',
              fontFamily: 'Noto Serif KR, serif',
              fontSize: 34,
              letterSpacing: '-0.04em',
            }}
          >
            최종 견적을 확인한 뒤 결제합니다
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 14,
              marginTop: 24,
            }}
          >
            {paymentSteps.map((step) => (
              <article
                key={step.number}
                style={{
                  padding: 20,
                  borderRadius: 20,
                  border:
                    '1px solid rgba(255, 255, 255, 0.14)',
                  background:
                    'rgba(255, 255, 255, 0.06)',
                }}
              >
                <span
                  style={{
                    color: '#f0c36a',
                    fontSize: 13,
                    fontWeight: 900,
                  }}
                >
                  {step.number}
                </span>

                <strong
                  style={{
                    display: 'block',
                    marginTop: 8,
                    fontSize: 18,
                  }}
                >
                  {step.title}
                </strong>

                <p
                  style={{
                    margin: '9px 0 0',
                    color: 'rgba(255, 250, 240, 0.76)',
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  {step.text}
                </p>
              </article>
            ))}
          </div>

          <p
            style={{
              margin: '24px 0 0',
              padding: 16,
              borderRadius: 16,
              background: 'rgba(240, 195, 106, 0.12)',
              color: '#f7dfae',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            결제 전에는 최종 금액, 제작 사양, 인쇄 수량과
            배송 조건을 확인할 수 있습니다. 견적이 확정되지 않은
            상태에서는 결제를 요청하지 않습니다.
          </p>
        </section>
      </section>
    </main>
  );
}