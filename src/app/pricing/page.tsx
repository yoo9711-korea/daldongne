import Link from 'next/link';

const plans = [
  {
    title: '인생책 제작',
    label: '한 번에 책으로 만들기',
    price: '99,000원부터',
    description:
      '사진과 이야기가 준비되어 있다면, 달동네 AI가 목차와 원고를 정리해 한 권의 인생책으로 제작합니다.',
    features: [
      '사진 50장 이하 기준',
      'AI 사진 분석',
      'AI 글 다듬기',
      'AI 목차 추천',
      '50~80페이지 기본 책 제작',
      '기본 인쇄와 택배비 포함',
    ],
    notice: '사진 50장 초과, 80페이지 초과, 하드커버, 사람 검수는 추가 비용이 발생할 수 있습니다.',
    href: '/dashboard/book',
    cta: '인생책 만들기',
    highlight: true,
  },
  {
    title: '월간기록 구독',
    label: '매달 기록하고 1년에 한 권',
    price: '월 9,900원부터',
    description:
      '매달 사진과 이야기를 조금씩 남기면, 달동네가 그 기록을 모아 1년에 한 번 인생책으로 제작합니다.',
    features: [
      '매달 사진과 이야기 저장',
      'AI 글 다듬기',
      '월간 기억 정리',
      '12개월 유지 시 기본 인생책 1권 제작',
      '사진 50장 이하 기준',
      '기본 인쇄와 택배비 포함',
    ],
    notice: '실물 엽서 발송, 사람 검수, 제작 상담, 하드커버는 선택 옵션입니다.',
    href: '/dashboard/book',
    cta: '월간기록 시작하기',
    highlight: false,
  },
];

const options = [
  {
    title: '월간 엽서 발송',
    price: '+ 월 5,000원',
    text: '매달 마음에 드는 사진 1장을 엽서로 제작해 발송합니다.',
  },
  {
    title: '사람 검수',
    price: '+ 50,000원부터',
    text: 'AI가 만든 원고의 어색한 문장, 반복 표현, 흐름을 사람이 확인합니다.',
  },
  {
    title: '제작 상담',
    price: '+ 50,000원부터',
    text: '부모님 인생책, 가족 기록책처럼 방향 설정이 필요한 경우 상담을 진행합니다.',
  },
  {
    title: '하드커버 변경',
    price: '+ 50,000원부터',
    text: '선물용 고급 사양으로 제작하고 싶을 때 선택합니다.',
  },
];

export default function PricingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8f3ea',
        color: '#2b2118',
      }}
    >
      <section
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '72px 20px 48px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: '8px 14px',
            borderRadius: '999px',
            background: '#eadcc8',
            color: '#6b4a2b',
            fontSize: '14px',
            fontWeight: 800,
            marginBottom: '20px',
          }}
        >
          달동네 출판사 요금 안내
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            lineHeight: 1.12,
            letterSpacing: '-0.04em',
            margin: '0 0 20px',
          }}
        >
          한 번에 만들거나,
          <br />
          매달 조금씩 남기거나.
        </h1>

        <p
          style={{
            maxWidth: '760px',
            fontSize: '20px',
            lineHeight: 1.7,
            color: '#6b5a49',
            margin: '0 0 34px',
          }}
        >
          달동네는 사진과 이야기를 모아 한 권의 인생책으로 제작합니다.
          지금 바로 책으로 만들 수도 있고, 매달 기록을 쌓아 1년에 한 번
          책으로 남길 수도 있습니다.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '22px',
            marginBottom: '54px',
          }}
        >
          {plans.map((plan) => (
            <article
              key={plan.title}
              style={{
                background: plan.highlight ? '#2b2118' : '#fffaf3',
                color: plan.highlight ? '#fff8ec' : '#2b2118',
                border: plan.highlight ? '1px solid #2b2118' : '1px solid #eadcc8',
                borderRadius: '28px',
                padding: '34px',
                boxShadow: '0 18px 48px rgba(43, 33, 24, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '560px',
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: '0 0 10px',
                    color: plan.highlight ? '#f0c36a' : '#9a6a3a',
                    fontSize: '15px',
                    fontWeight: 900,
                  }}
                >
                  {plan.label}
                </p>

                <h2
                  style={{
                    margin: '0 0 14px',
                    fontSize: '34px',
                    letterSpacing: '-0.04em',
                    fontFamily: 'Noto Serif KR, serif',
                  }}
                >
                  {plan.title}
                </h2>

                <p
                  style={{
                    margin: '0 0 20px',
                    fontSize: '32px',
                    fontWeight: 950,
                    color: plan.highlight ? '#fff' : '#3a2a1c',
                  }}
                >
                  {plan.price}
                </p>

                <p
                  style={{
                    margin: '0 0 24px',
                    color: plan.highlight ? '#eadcc8' : '#6b5a49',
                    lineHeight: 1.7,
                    fontSize: '17px',
                  }}
                >
                  {plan.description}
                </p>

                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: plan.highlight ? '#fff4df' : '#4f4032',
                    lineHeight: 1.9,
                    fontSize: '16px',
                  }}
                >
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <p
                  style={{
                    margin: '24px 0 0',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: plan.highlight ? 'rgba(255,255,255,0.1)' : '#f0e4d2',
                    color: plan.highlight ? '#eadcc8' : '#6b5a49',
                    lineHeight: 1.6,
                    fontSize: '14px',
                  }}
                >
                  {plan.notice}
                </p>
              </div>

              <Link
                href={plan.href}
                style={{
                  marginTop: '28px',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '15px 18px',
                  borderRadius: '16px',
                  background: plan.highlight ? '#f0c36a' : '#6b4a2b',
                  color: plan.highlight ? '#241b14' : '#fff',
                  textDecoration: 'none',
                  fontWeight: 900,
                  fontSize: '16px',
                }}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <section
          style={{
            padding: '34px',
            borderRadius: '28px',
            background: '#fffaf3',
            border: '1px solid #eadcc8',
            marginBottom: '28px',
          }}
        >
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: '32px',
              letterSpacing: '-0.03em',
              fontFamily: 'Noto Serif KR, serif',
            }}
          >
            선택 옵션
          </h2>

          <p
            style={{
              margin: '0 0 24px',
              color: '#6b5a49',
              fontSize: '17px',
              lineHeight: 1.7,
            }}
          >
            기본 제작 외에 필요한 항목만 선택할 수 있습니다.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            {options.map((option) => (
              <div
                key={option.title}
                style={{
                  padding: '22px',
                  borderRadius: '20px',
                  background: '#f8f0e4',
                  border: '1px solid #eadcc8',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px',
                    fontSize: '20px',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {option.title}
                </h3>

                <p
                  style={{
                    margin: '0 0 12px',
                    color: '#8a5a25',
                    fontSize: '18px',
                    fontWeight: 900,
                  }}
                >
                  {option.price}
                </p>

                <p
                  style={{
                    margin: 0,
                    color: '#6b5a49',
                    lineHeight: 1.65,
                    fontSize: '15px',
                  }}
                >
                  {option.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            padding: '32px',
            borderRadius: '24px',
            background: '#2b2118',
            color: '#fff',
          }}
        >
          <h2
            style={{
              margin: '0 0 12px',
              fontSize: '30px',
              letterSpacing: '-0.03em',
            }}
          >
            가격 기준
          </h2>

          <p
            style={{
              margin: 0,
              maxWidth: '820px',
              color: '#eadcc8',
              fontSize: '18px',
              lineHeight: 1.7,
            }}
          >
            표시된 가격은 사진 50장 이하, 50~80페이지, 기본 소프트커버,
            기본 인쇄와 택배비 포함 기준입니다. 사진 수, 페이지 수, 하드커버,
            사람 검수, 추가 상담 여부에 따라 제작 금액이 달라질 수 있습니다.
          </p>
        </section>
      </section>
    </main>
  );
}