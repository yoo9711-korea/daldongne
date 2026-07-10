const sectionStyle = { marginTop: 34 };

const h2Style = {
  margin: '0 0 12px',
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: '-0.05em',
  color: '#2d1a0b',
};

const pStyle = {
  margin: '8px 0',
  fontSize: 16,
  lineHeight: 1.8,
  color: '#5f442a',
};

const listStyle = {
  margin: '10px 0 0',
  paddingLeft: 22,
  fontSize: 16,
  lineHeight: 1.9,
  color: '#5f442a',
};

export default function TermsPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '72px 20px 96px',
        background: '#f7efe0',
        color: '#2d1a0b',
      }}
    >
      <article
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: '44px 28px',
          borderRadius: 28,
          background: '#fffaf0',
          border: '1px solid #e2d0ac',
          boxShadow: '0 24px 70px rgba(45, 26, 11, 0.12)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 900,
            color: '#a56518',
            letterSpacing: '0.08em',
          }}
        >
          달동네 출판사
        </p>

        <h1
          style={{
            margin: '12px 0 0',
            fontSize: 42,
            lineHeight: 1.2,
            fontWeight: 900,
            letterSpacing: '-0.07em',
            color: '#2d1a0b',
          }}
        >
          이용약관
        </h1>

        <p style={{ marginTop: 18, fontSize: 17, lineHeight: 1.8, color: '#6a4a2b' }}>
          본 이용약관은 달동네 출판사가 제공하는 사진, 이야기, 인터뷰 기록,
          AI 원고 생성, 전자책 미리보기, 책 제작 상담 서비스의 이용 조건과
          절차를 정합니다.
        </p>

        <p style={{ marginTop: 14, fontSize: 14, color: '#8a6a45' }}>
          시행일: 2026년 7월 11일
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. 목적</h2>
          <p style={pStyle}>
            이 약관은 달동네 출판사가 제공하는 서비스의 이용과 관련하여 회사와
            이용자 사이의 권리, 의무, 책임사항 및 서비스 이용 절차를 정하는 것을
            목적으로 합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. 서비스의 내용</h2>
          <p style={pStyle}>달동네 출판사는 다음과 같은 서비스를 제공합니다.</p>
          <ul style={listStyle}>
            <li>사진 및 이야기 등록, 보관, 관리 기능</li>
            <li>인터뷰 답변을 통한 가족 기록 정리 기능</li>
            <li>AI를 활용한 제목, 요약, 목차, 원고 생성 기능</li>
            <li>전자책 미리보기 및 인쇄용 원고 확인 기능</li>
            <li>책 제작 상담 신청 및 진행 안내 기능</li>
            <li>기타 달동네 출판사가 정하는 기억 기록 관련 서비스</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. 회원가입 및 로그인</h2>
          <p style={pStyle}>
            이용자는 소셜 로그인 또는 회사가 제공하는 방식으로 서비스를 이용할 수
            있습니다. 이용자는 본인의 정확한 정보를 사용해야 하며, 타인의 계정이나
            정보를 무단으로 사용해서는 안 됩니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. 이용자의 의무</h2>
          <ul style={listStyle}>
            <li>타인의 개인정보, 사진, 저작물을 무단으로 등록하지 않아야 합니다.</li>
            <li>허위 정보, 불법 정보, 명예훼손성 내용을 등록하지 않아야 합니다.</li>
            <li>서비스 운영을 방해하는 행위를 하지 않아야 합니다.</li>
            <li>본인 또는 가족의 사생활 정보를 등록할 때 신중하게 판단해야 합니다.</li>
            <li>AI가 생성한 결과물을 최종 사용하기 전 직접 확인해야 합니다.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. 사진, 글, 원고에 대한 권리</h2>
          <p style={pStyle}>
            이용자가 등록한 사진, 글, 이야기, 인터뷰 답변의 권리는 원칙적으로
            이용자에게 있습니다. 달동네 출판사는 서비스 제공, 원고 생성, 전자책
            미리보기, 제작 상담 등 이용자가 요청한 목적 범위 안에서 해당 자료를
            사용할 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. AI 생성 결과에 대한 안내</h2>
          <p style={pStyle}>
            AI가 생성한 제목, 요약, 목차, 원고, 문장 표현은 이용자가 제공한
            자료를 바탕으로 자동 생성되는 초안입니다. AI 결과에는 사실과 다른
            내용, 부정확한 표현, 과장된 문장이 포함될 수 있으므로 이용자는
            최종 사용 전 반드시 내용을 검토해야 합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. 제작 상담 및 인쇄 제작</h2>
          <p style={pStyle}>
            책 제작 상담 신청은 실제 인쇄 제작을 확정하는 절차가 아닙니다. 제작
            비용, 기간, 사양, 수정 범위, 배송 방식 등은 상담 과정에서 별도로
            안내될 수 있습니다. 이용자가 최종 견적과 제작 조건에 동의한 경우에
            실제 제작이 진행됩니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. 유료 서비스 및 환불</h2>
          <p style={pStyle}>
            달동네 출판사는 향후 유료 상품 또는 제작 상품을 제공할 수 있습니다.
            유료 서비스의 가격, 결제 방식, 환불 기준은 각 상품 또는 상담 과정에서
            별도로 안내합니다. 인쇄 제작이 시작된 이후에는 제작 진행 단계에 따라
            환불이 제한될 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. 서비스의 변경 및 중단</h2>
          <p style={pStyle}>
            달동네 출판사는 서비스 개선, 시스템 점검, 보안 문제, 외부 서비스
            장애, 운영상 필요에 따라 서비스의 전부 또는 일부를 변경하거나
            일시적으로 중단할 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. 개인정보 보호</h2>
          <p style={pStyle}>
            개인정보의 수집, 이용, 보관, 삭제 등에 관한 사항은 별도의
            개인정보처리방침에 따릅니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. 책임의 제한</h2>
          <p style={pStyle}>
            달동네 출판사는 이용자가 입력한 자료의 정확성, 저작권, 초상권,
            가족 간 권리관계에 대해 사전에 모두 확인할 수 없습니다. 이용자는
            본인이 등록한 자료와 최종 제작물의 사용 권한을 직접 확인해야 합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>12. 약관의 변경</h2>
          <p style={pStyle}>
            본 약관은 서비스 내용, 운영 정책, 관련 법령 변경에 따라 수정될 수
            있습니다. 변경 사항은 서비스 내 공지 또는 본 페이지를 통해 안내합니다.
          </p>
        </section>
      </article>
    </main>
  );
}