# 달동네 결제 통합 테스트

## 운영 전 필수 확인

1. 테스트 중에는 클라이언트 키와 시크릿 키가 모두 `test_`로 시작해야 합니다.
2. 토스 개발자센터의 웹훅 URL을 아래 주소로 등록합니다.

`https://www.daldongne.kr/api/payments/webhook`

3. 등록 이벤트
   - `PAYMENT_STATUS_CHANGED`
   - `DEPOSIT_CALLBACK`
   - `CANCEL_STATUS_CHANGED` — 해외 비동기 취소를 사용하는 경우

## 자동 검사

`pnpm test:payment:readiness`

특정 주문과 토스 결제정보를 직접 비교합니다.

`pnpm test:payment:order -- <orderId>`

## 실제 테스트 순서

1. READY 또는 FAILED 상태의 테스트 주문을 엽니다.
2. 카드 테스트 결제를 완료합니다.
3. 주문이 PAID이고 승인금액과 잔액이 주문금액과 같은지 확인합니다.
4. 관리자 주문 상세에서 일부 금액을 부분 환불합니다.
5. 주문이 PARTIALLY_REFUNDED이고 환불금액과 잔액이 맞는지 확인합니다.
6. 남은 잔액을 추가 환불합니다.
7. 주문이 REFUNDED이고 잔액이 0인지 확인합니다.
8. 결제·환불 원장에 승인, 부분 환불, 전액 환불 이벤트가 중복 없이 기록됐는지 확인합니다.
9. `pnpm test:payment:data`와 주문별 비교 명령을 다시 실행합니다.

## 주의

- 라이브 키로 테스트하면 실제 금액이 결제될 수 있습니다.
- 결제 성공 페이지의 승인 요청은 인증 완료 후 10분 안에 처리되어야 합니다.
- 가상계좌 입금 상태는 웹훅을 기준으로 처리하고, 웹훅 본문만 신뢰하지 말고 토스 조회 API 결과를 사용합니다.
