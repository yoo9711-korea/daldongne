# 달동네 출판사 — Memory Platform (1단계: Foundation)

이 프로젝트는 정적 사이트에서 벗어나, **실제 로그인 + 실제 데이터베이스**를 갖춘
Next.js App Router 기반으로 전환한 1단계 결과물입니다.

지금 이 단계에서 실제로 동작하는 것:
- Google / Kakao 로그인 → 성공 시 PostgreSQL `users` 테이블에 실제 행 생성
- `/dashboard`는 로그인하지 않으면 `/login`으로 자동 리다이렉트 (middleware)
- `/dashboard`는 Prisma로 본인 데이터를 실제 조회해서 렌더링
- **`/dashboard/timeline`** — `Memory` 테이블을 실제로 연도별 그룹핑해서 보여줌
- **`/dashboard/library`** — `Book` 테이블을 실제로 조회 (지금은 빈 서재 — 가짜 데이터 없음)
- **`/dashboard/family`** — Server Action으로 `Family`/`FamilyMember`를 실제 생성·초대 (이메일로 기존 가입자만 초대 가능, OWNER 권한 DB에서 직접 검증)
- **`/dashboard/interview`** — 질문에 답하면 `Memory(type: TEXT)`로 실제 저장되고, Timeline에도 그대로 나타남
- 기존 베이지+블랙+골드 디자인, Noto Serif KR 타이포그래피 그대로 유지

**의도적으로 아직 가짜로 만들지 않은 것**: AI Interview의 음성 답변(🎙 버튼은 비활성화 상태), Family 활동 피드(좋아요/댓글), 미가입자 초대 메일. 이 부분은 버튼만 만들어두고 안 되는 척하지 않고, 코드에 명시적으로 "다음 단계" TODO로 표시해뒀습니다.

## 1. 설치

```bash
npm install
```

## 2. 데이터베이스 준비

PostgreSQL이 필요합니다. 가장 빠른 방법은 [Supabase](https://supabase.com) 또는
[Neon](https://neon.tech)에서 무료 프로젝트를 만들고 Connection String을 받는 것입니다.

```bash
cp .env.local.example .env.local
# .env.local 에 DATABASE_URL 채우기
```

스키마를 DB에 반영:

```bash
npx prisma db push
```

## 3. Auth.js 비밀키 생성

```bash
npx auth secret
# 출력된 값을 .env.local 의 AUTH_SECRET 에 붙여넣기
```

## 4. OAuth 앱 등록

### Google
1. https://console.cloud.google.com/apis/credentials
2. "OAuth 클라이언트 ID 만들기" → 웹 애플리케이션
3. 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`
4. 발급된 Client ID / Secret을 `.env.local`에 입력

### Kakao
1. https://developers.kakao.com → 애플리케이션 추가
2. 카카오 로그인 활성화, Redirect URI: `http://localhost:3000/api/auth/callback/kakao`
3. REST API 키 = `KAKAO_CLIENT_ID`, 카카오 로그인 → 보안 탭에서 Client Secret 발급 = `KAKAO_CLIENT_SECRET`

## 5. 실행

```bash
npm run dev
```

`http://localhost:3000` 접속 → 로그인 → `/dashboard`에서 실제 DB 데이터 확인.

확인하면 좋은 것: 로그인 후 `npx prisma studio`로 DB를 열어보면, `users`, `accounts`,
`sessions` 테이블에 실제 행이 생성되어 있는 걸 직접 확인할 수 있습니다.

## 6. 배포 (Vercel)

1. 이 저장소를 GitHub에 push
2. Vercel에서 Import
3. Vercel 대시보드 → Settings → Environment Variables 에 `.env.local`의
   모든 값을 동일하게 등록 (`DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID` 등)
4. 각 OAuth 앱(Google/Kakao 콘솔)에 운영 도메인의 콜백 URL도 추가 등록
   (`https://내도메인/api/auth/callback/google` 등)
5. Deploy

## 다음 단계 제안 순서

1. ~~Memory Timeline / Life Library / Family Space / AI Interview(텍스트)~~ — 완료, 실제 DB 연동
2. **AI Interview 음성화**: Whisper로 음성 → 텍스트 변환 후 동일한 `Memory(type: TEXT)` 저장 로직 재사용
3. **Cloud Storage 연동**: 사진/영상 실제 업로드 → `Memory.fileUrl`에 저장, Timeline 썸네일에 실제 이미지 표시
4. **Family 활동 피드**: `Memory`에 좋아요/댓글 모델 추가
5. **미가입자 가족 초대**: 이메일 발송 + 초대 토큰(`VerificationToken` 재사용 가능)
6. 이후 Time Capsule, AI Movie, 결제, 관리자 페이지 순으로 확장

각 기능을 만들 때마다 "버튼은 있는데 눌러도 아무 일도 안 일어나는" 상태가 되지 않도록,
반드시 이 Prisma 스키마를 확장하고 실제 쓰기/읽기가 되는 것을 확인한 뒤 다음으로 넘어갑니다.
