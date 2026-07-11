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

export default function DataDeletionPage() {
  const adminEmail = process.env.ADMIN_EMAIL ?? '운영자 이메일 준비 중';

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
          데이터 삭제 요청 안내
        </h1>

        <p style={{ marginTop: 18, fontSize: 17, lineHeight: 1.8, color: '#6a4a2b' }}>
          달동네 출판사는 이용자가 등록한 사진, 이야기, 인터뷰 답변, 책 원고,
          제작 상담 정보를 안전하게 관리하며, 이용자의 요청에 따라 삭제 절차를
          진행합니다.
        </p>

        <p style={{ marginTop: 14, fontSize: 14, color: '#8a6a45' }}>
          시행일: 2026년 7월 11일
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. 삭제 요청이 가능한 정보</h2>
          <p style={pStyle}>
            이용자는 본인이 등록하거나 서비스 이용 중 생성된 다음 정보를 삭제 요청할 수 있습니다.
          </p>
          <ul style={listStyle}>
            <li>회원 계정 정보</li>
            <li>등록한 사진 및 사진 설명</li>
            <li>작성한 이야기, 메모, 인터뷰 답변</li>
            <li>AI가 생성한 책 원고, 제목, 요약, 목차</li>
            <li>전자책 미리보기 자료</li>
            <li>제작 상담 신청 정보</li>
            <li>서비스 이용 중 저장된 기타 개인 기록</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. 서비스 안에서 직접 삭제할 수 있는 정보</h2>
          <p style={pStyle}>
            사진, 이야기, 책 원고 등 일부 정보는 서비스 화면에서 이용자가 직접
            삭제할 수 있습니다. 직접 삭제한 정보는 서비스 화면에서 더 이상 표시되지
            않으며, 복구가 어려울 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. 운영자에게 삭제 요청이 필요한 경우</h2>
          <p style={pStyle}>
            계정 전체 삭제, 여러 자료의 일괄 삭제, 제작 상담 정보 삭제, 직접 삭제가
            어려운 데이터 삭제는 운영자에게 요청할 수 있습니다.
          </p>

          <ul style={listStyle}>
            <li>요청 이메일: {adminEmail}</li>
            <li>메일 제목: 달동네 데이터 삭제 요청</li>
            <li>필수 기재 내용: 가입 이메일, 이름, 삭제를 원하는 정보의 범위</li>
            <li>본인 확인을 위해 추가 정보 확인이 필요할 수 있습니다.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. 삭제 처리 절차</h2>
          <ul style={listStyle}>
            <li>이용자가 삭제 요청을 보냅니다.</li>
            <li>운영자가 요청 내용을 확인합니다.</li>
            <li>필요한 경우 본인 확인을 진행합니다.</li>
            <li>삭제 가능한 정보를 확인한 뒤 삭제 처리합니다.</li>
            <li>처리 결과를 이용자에게 안내합니다.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. 삭제 처리 기간</h2>
          <p style={pStyle}>
            삭제 요청은 접수 후 가능한 빠르게 처리합니다. 다만 데이터 범위 확인,
            본인 확인, 시스템 처리 상황에 따라 일정 시간이 필요할 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. 삭제가 제한될 수 있는 정보</h2>
          <p style={pStyle}>
            다음 정보는 관계 법령, 분쟁 대응, 정산, 보안 확인 등 정당한 사유가 있는
            경우 일정 기간 보관될 수 있습니다.
          </p>

          <ul style={listStyle}>
            <li>상담 신청 및 거래 관련 기록</li>
            <li>서비스 부정 이용 방지를 위한 최소한의 기록</li>
            <li>법령상 보관이 필요한 정보</li>
            <li>분쟁 해결을 위해 필요한 최소 범위의 기록</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. 삭제 후 유의사항</h2>
          <ul style={listStyle}>
            <li>삭제된 사진, 이야기, 원고는 복구가 어려울 수 있습니다.</li>
            <li>책 원고에 사용된 원본 자료를 삭제하면 원고 품질이나 표시 내용에 영향을 줄 수 있습니다.</li>
            <li>계정 전체 삭제 시 기존 작업실, 책장, 제작 상담 내역을 이용할 수 없습니다.</li>
            <li>삭제 요청 전 필요한 자료는 이용자가 직접 백업하는 것이 좋습니다.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. 문의</h2>
          <p style={pStyle}>
            데이터 삭제, 계정 삭제, 개인정보 처리와 관련된 문의는 아래 연락처로
            요청할 수 있습니다.
          </p>

          <ul style={listStyle}>
            <li>서비스명: 달동네 출판사</li>
            <li>문의 이메일: {adminEmail}</li>
          </ul>
        </section>
      </article>
    </main>
  );
}