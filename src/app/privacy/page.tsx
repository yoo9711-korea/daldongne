const sectionStyle = {
  marginTop: 34,
};

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

export default function PrivacyPage() {
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
          개인정보처리방침
        </h1>

        <p
          style={{
            marginTop: 18,
            fontSize: 17,
            lineHeight: 1.8,
            color: '#6a4a2b',
          }}
        >
          달동네 출판사는 사진, 이야기, 인터뷰 기록을 바탕으로 가족의
          기억과 인생책 원고를 만들 수 있도록 서비스를 제공합니다. 본
          개인정보처리방침은 달동네 출판사가 이용자의 개인정보를 어떤
          목적으로 수집·이용하고, 어떻게 보호하는지 안내합니다.
        </p>

        <p
          style={{
            marginTop: 14,
            fontSize: 14,
            color: '#8a6a45',
          }}
        >
          시행일: 2026년 7월 11일
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. 개인정보의 처리 목적</h2>
          <p style={pStyle}>
            달동네 출판사는 다음 목적을 위해 개인정보를 처리합니다.
          </p>
          <ul style={listStyle}>
            <li>회원 로그인 및 본인 식별</li>
            <li>사진, 이야기, 인터뷰 기록 저장 및 관리</li>
            <li>AI 원고 생성, 책 원고 정리, 전자책 미리보기 제공</li>
            <li>제작 상담 신청 접수 및 연락</li>
            <li>서비스 오류 확인, 보안 유지, 부정 이용 방지</li>
            <li>고객 문의 응대 및 공지 전달</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. 처리하는 개인정보 항목</h2>
          <p style={pStyle}>
            서비스 이용 과정에서 다음 정보가 수집 또는 처리될 수 있습니다.
          </p>
          <ul style={listStyle}>
            <li>
              소셜 로그인 정보: 이름, 이메일, 프로필 이미지, 소셜 로그인
              제공자 식별값
            </li>
            <li>
              이용자가 직접 등록한 정보: 사진, 사진 설명, 이야기, 인터뷰
              답변, 원고 작성용 메모
            </li>
            <li>
              제작 상담 정보: 이름, 연락처, 이메일, 상담 내용, 신청한 책
              정보
            </li>
            <li>
              서비스 이용 정보: 접속 기록, 쿠키, 기기 정보, 브라우저 정보,
              오류 기록
            </li>
            <li>
              AI 처리 정보: 이용자가 입력한 사진 설명, 이야기, 인터뷰
              답변, 책 원고 생성 요청 내용
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. 개인정보의 보유 및 이용 기간</h2>
          <ul style={listStyle}>
            <li>회원 정보: 회원 탈퇴 또는 서비스 이용 종료 시까지</li>
            <li>
              사진, 이야기, 인터뷰, 책 원고: 이용자가 삭제하거나 회원 탈퇴
              시까지
            </li>
            <li>
              제작 상담 신청 정보: 상담 완료 후 3년 또는 관련 분쟁 해결
              시까지
            </li>
            <li>
              접속 기록 및 보안 관련 로그: 서비스 안정성 확인을 위해
              필요한 기간 동안 보관
            </li>
            <li>
              관계 법령에 따라 보관이 필요한 정보는 해당 법령에서 정한
              기간 동안 보관
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. 개인정보의 파기</h2>
          <p style={pStyle}>
            개인정보 보유 기간이 지나거나 처리 목적이 달성된 경우에는 해당
            정보를 지체 없이 파기합니다. 전자적 파일은 복구하기 어렵도록
            삭제하고, 출력물은 분쇄 또는 이에 준하는 방법으로 파기합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. 개인정보 처리의 위탁</h2>
          <p style={pStyle}>
            달동네 출판사는 서비스 제공을 위해 다음 외부 서비스를 사용할 수
            있습니다.
          </p>
          <ul style={listStyle}>
            <li>Vercel: 웹사이트 호스팅 및 배포</li>
            <li>클라우드 데이터베이스 제공업체: 서비스 데이터 저장</li>
            <li>Vercel Blob 또는 파일 저장 서비스: 사진 및 첨부 파일 저장</li>
            <li>OpenAI: AI 원고 생성 및 텍스트 분석 기능 제공</li>
            <li>Resend: 이메일 발송 기능 제공</li>
            <li>카카오, 네이버, 구글: 소셜 로그인 기능 제공</li>
            <li>JSON2VIDEO 등 영상 생성 API: 영상 생성 기능 사용 시 처리</li>
          </ul>
          <p style={pStyle}>
            위탁 업무의 내용이나 수탁자가 변경되는 경우 본 방침을 통해
            공개합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. 개인정보의 제3자 제공</h2>
          <p style={pStyle}>
            달동네 출판사는 이용자의 개인정보를 원칙적으로 외부에 제공하지
            않습니다. 다만, 이용자가 사전에 동의한 경우 또는 법령에 따라
            요구되는 경우에는 필요한 범위에서 제공될 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. AI 처리에 관한 안내</h2>
          <p style={pStyle}>
            달동네 출판사는 이용자가 입력한 사진 설명, 이야기, 인터뷰 답변을
            바탕으로 AI 원고, 제목, 요약, 목차, 책 구성안을 생성할 수
            있습니다. 이용자는 민감한 개인정보, 타인의 개인정보, 공개를 원하지
            않는 사생활 정보를 입력하지 않도록 주의해야 합니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. 정보주체의 권리</h2>
          <p style={pStyle}>
            이용자는 언제든지 본인의 개인정보에 대해 열람, 정정, 삭제,
            처리정지, 동의 철회를 요청할 수 있습니다.
          </p>
          <ul style={listStyle}>
            <li>사진 및 이야기 삭제: 서비스 내 삭제 기능 이용</li>
            <li>회원 정보 및 전체 데이터 삭제 요청: 운영자에게 이메일 문의</li>
            <li>제작 상담 정보 정정 또는 삭제 요청: 운영자에게 이메일 문의</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. 쿠키 및 자동 수집 정보</h2>
          <p style={pStyle}>
            달동네 출판사는 로그인 유지, 서비스 보안, 이용 환경 개선을 위해
            쿠키와 접속 정보를 사용할 수 있습니다. 이용자는 브라우저 설정을
            통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 쿠키를
            차단하는 경우 로그인 유지 등 일부 기능이 제한될 수 있습니다.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. 개인정보의 안전성 확보 조치</h2>
          <ul style={listStyle}>
            <li>로그인 기반 접근 제한</li>
            <li>개인정보 접근 권한 최소화</li>
            <li>중요 환경변수의 서버 측 관리</li>
            <li>파일 및 데이터 저장소 접근 제한</li>
            <li>서비스 오류 및 보안 로그 점검</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. 개인정보 보호책임자 및 문의</h2>
          <p style={pStyle}>
            개인정보 관련 문의, 삭제 요청, 권리 행사는 아래 연락처로 요청할 수
            있습니다.
          </p>
          <ul style={listStyle}>
            <li>서비스명: 달동네 출판사</li>
            <li>개인정보 보호책임자: 서비스 운영자</li>
            <li>문의 이메일: {adminEmail}</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>12. 권익침해 구제 방법</h2>
          <p style={pStyle}>
            이용자는 개인정보 침해에 대한 상담이나 신고가 필요한 경우
            개인정보침해신고센터, 개인정보분쟁조정위원회 등 관련 기관에 문의할
            수 있습니다.
          </p>
          <ul style={listStyle}>
            <li>개인정보침해신고센터: 국번 없이 118</li>
            <li>개인정보분쟁조정위원회: 1833-6972</li>
            <li>개인정보보호위원회: 개인정보보호 관련 정책 및 안내 제공</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>13. 개인정보처리방침의 변경</h2>
          <p style={pStyle}>
            본 개인정보처리방침은 법령, 서비스 내용, 개인정보 처리 방식의
            변경에 따라 수정될 수 있습니다. 변경 사항은 서비스 내 공지 또는 본
            페이지를 통해 안내합니다.
          </p>
        </section>
      </article>
    </main>
  );
}