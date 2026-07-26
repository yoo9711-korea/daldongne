import { Resend } from "resend";

type PaymentCompletedEmailPayload = {
  to: string | null;
  customerName: string | null;
  bookTitle: string;
  orderRecordId: string;
  orderId: string;
  productName: string;
  totalAmount: number;
  paymentMethod: string | null;
  paidAt: Date | null;
};

type ProductionStageEmailPayload = {
  to: string | null;
  customerName: string | null;
  bookTitle: string;
  orderRecordId: string;
  orderId: string;
  stage: string;
  proofFileUrl: string | null;
  shippingCarrier: string | null;
  trackingNumber: string | null;
};

type StageEmailInformation = {
  subject: string;
  title: string;
  description: string;
  actionLabel: string;
};

export async function sendOrderPaymentCompletedEmail(
  payload: PaymentCompletedEmailPayload,
) {
  if (!payload.to) {
    console.warn(
      "[ORDER_PAYMENT_EMAIL_SKIPPED]",
      {
        reason: "CUSTOMER_EMAIL_MISSING",
        orderId: payload.orderId,
      },
    );

    return;
  }

  const orderUrl =
    createOrderUrl(
      payload.orderRecordId,
    );

  const paymentDate =
    payload.paidAt
      ? formatDateTime(
          payload.paidAt,
        )
      : "결제 승인 완료";

  await sendOrderEmail({
    to: payload.to,
    subject:
      `[달동네 스토리] 결제가 완료되었습니다 - ${payload.bookTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.75; color: #3f2d25;">
        <h2 style="margin: 0 0 18px; color: #3f2d25;">
          책 제작 결제가 완료되었습니다.
        </h2>

        <p style="margin: 0 0 18px;">
          ${escapeHtml(
            payload.customerName ||
              "고객",
          )}님, 신청하신 책 제작 결제가 정상적으로 완료되었습니다.
        </p>

        <table style="width: 100%; margin: 22px 0; border-collapse: collapse;">
          <tbody>
            ${createTableRow(
              "책 제목",
              payload.bookTitle,
            )}
            ${createTableRow(
              "상품명",
              payload.productName,
            )}
            ${createTableRow(
              "주문번호",
              payload.orderId,
            )}
            ${createTableRow(
              "결제금액",
              `${payload.totalAmount.toLocaleString(
                "ko-KR",
              )}원`,
            )}
            ${createTableRow(
              "결제수단",
              payload.paymentMethod ||
                "결제수단 확인 중",
            )}
            ${createTableRow(
              "결제일",
              paymentDate,
            )}
          </tbody>
        </table>

        <p style="margin: 24px 0 10px;">
          <a
            href="${escapeHtml(orderUrl)}"
            style="display: inline-block; padding: 13px 20px; border-radius: 999px; background: #e96953; color: #ffffff; text-decoration: none; font-weight: bold;"
          >
            주문·제작 현황 확인
          </a>
        </p>

        <p style="margin-top: 25px; color: #8a756c; font-size: 12px;">
          결제 이후의 원고 검토, 교정, 인쇄와 배송 진행 상태는 주문 현황에서 확인할 수 있습니다.
        </p>
      </div>
    `,
  });
}

export async function sendOrderProductionStageEmail(
  payload: ProductionStageEmailPayload,
) {
  if (!payload.to) {
    console.warn(
      "[ORDER_PRODUCTION_EMAIL_SKIPPED]",
      {
        reason: "CUSTOMER_EMAIL_MISSING",
        orderId: payload.orderId,
        stage: payload.stage,
      },
    );

    return;
  }

  const information =
    getStageEmailInformation(
      payload.stage,
    );

  if (!information) {
    return;
  }

  const orderUrl =
    createOrderUrl(
      payload.orderRecordId,
    );

  const proofUrl =
    resolveFileUrl(
      payload.proofFileUrl,
    );

  const shippingInformation =
    payload.stage === "SHIPPED"
      ? `
        ${createTableRow(
          "택배사",
          payload.shippingCarrier ||
            "택배사 확인 중",
        )}
        ${createTableRow(
          "송장번호",
          payload.trackingNumber ||
            "송장번호 확인 중",
        )}
      `
      : "";

  const proofButton =
    payload.stage === "PROOF_SENT" &&
    proofUrl
      ? `
        <a
          href="${escapeHtml(proofUrl)}"
          style="display: inline-block; margin-right: 8px; padding: 13px 20px; border-radius: 999px; background: #6f5394; color: #ffffff; text-decoration: none; font-weight: bold;"
        >
          교정본 확인하기
        </a>
      `
      : "";

  await sendOrderEmail({
    to: payload.to,
    subject:
      `[달동네 스토리] ${information.subject} - ${payload.bookTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.75; color: #3f2d25;">
        <h2 style="margin: 0 0 18px; color: #3f2d25;">
          ${escapeHtml(
            information.title,
          )}
        </h2>

        <p style="margin: 0 0 18px;">
          ${escapeHtml(
            payload.customerName ||
              "고객",
          )}님, ${escapeHtml(
            information.description,
          )}
        </p>

        <table style="width: 100%; margin: 22px 0; border-collapse: collapse;">
          <tbody>
            ${createTableRow(
              "책 제목",
              payload.bookTitle,
            )}
            ${createTableRow(
              "주문번호",
              payload.orderId,
            )}
            ${createTableRow(
              "현재 제작 단계",
              getProductionStageLabel(
                payload.stage,
              ),
            )}
            ${shippingInformation}
          </tbody>
        </table>

        <p style="margin: 24px 0 10px;">
          ${proofButton}

          <a
            href="${escapeHtml(orderUrl)}"
            style="display: inline-block; padding: 13px 20px; border-radius: 999px; background: #e96953; color: #ffffff; text-decoration: none; font-weight: bold;"
          >
            ${escapeHtml(
              information.actionLabel,
            )}
          </a>
        </p>
      </div>
    `,
  });
}

async function sendOrderEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resendApiKey =
    process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn(
      "[ORDER_EMAIL_SKIPPED]",
      {
        reason:
          "RESEND_API_KEY_MISSING",
        to,
        subject,
      },
    );

    return;
  }

  try {
    const resend =
      new Resend(resendApiKey);

    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "달동네 스토리 <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(
      "[ORDER_EMAIL_SEND_ERROR]",
      {
        to,
        subject,
        error,
      },
    );
  }
}

function getStageEmailInformation(
  stage: string,
): StageEmailInformation | null {
  if (
    stage === "MANUSCRIPT_RECEIVED"
  ) {
    return {
      subject: "원고가 접수되었습니다",
      title: "책 제작 원고가 접수되었습니다.",
      description:
        "보내주신 원고와 사진 자료가 접수되어 제작 준비를 시작했습니다.",
      actionLabel: "제작 현황 확인",
    };
  }

  if (stage === "PROOF_SENT") {
    return {
      subject: "교정본 확인을 부탁드립니다",
      title: "책 교정본이 준비되었습니다.",
      description:
        "교정본을 확인한 뒤 수정할 내용이나 승인 여부를 담당자에게 알려주세요.",
      actionLabel: "주문 현황 확인",
    };
  }

  if (stage === "PRINTING") {
    return {
      subject: "책 인쇄를 시작했습니다",
      title: "책 인쇄 작업을 시작했습니다.",
      description:
        "교정이 끝난 원고를 바탕으로 실제 책 인쇄를 진행하고 있습니다.",
      actionLabel: "인쇄 현황 확인",
    };
  }

  if (stage === "SHIPPED") {
    return {
      subject: "책이 배송을 시작했습니다",
      title: "완성된 책이 배송을 시작했습니다.",
      description:
        "기다려주신 책이 포장을 마치고 배송을 시작했습니다.",
      actionLabel: "배송 현황 확인",
    };
  }

  if (stage === "COMPLETED") {
    return {
      subject: "책 제작이 완료되었습니다",
      title: "책 제작이 모두 완료되었습니다.",
      description:
        "사진과 이야기를 담은 소중한 책의 제작 과정이 모두 완료되었습니다.",
      actionLabel: "완성된 주문 확인",
    };
  }

  return null;
}

function createOrderUrl(
  orderRecordId: string,
) {
  return `${getAppUrl()}/dashboard/orders/${encodeURIComponent(
    orderRecordId,
  )}`;
}

function resolveFileUrl(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${getAppUrl()}${value}`;
  }

  return null;
}

function getAppUrl() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://www.daldongne.kr";

  return appUrl.replace(/\/$/, "");
}

function createTableRow(
  label: string,
  value: string,
) {
  return `
    <tr>
      <td style="width: 130px; padding: 11px; border: 1px solid #ead8cf; background: #fff7f2; font-weight: bold;">
        ${escapeHtml(label)}
      </td>

      <td style="padding: 11px; border: 1px solid #ead8cf;">
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
}

function getProductionStageLabel(
  stage: string,
) {
  const labels:
    Record<string, string> = {
      PREPARING: "제작 준비",
      MANUSCRIPT_RECEIVED:
        "원고 접수",
      REVIEWING: "원고 검토",
      PROOFING: "교정 작업",
      PROOF_SENT: "교정본 전달",
      PROOF_APPROVED:
        "교정 승인",
      PRINT_ORDERED: "인쇄 발주",
      PRINTING: "인쇄 진행",
      SHIPPING_PREPARATION:
        "배송 준비",
      SHIPPED: "배송 중",
      COMPLETED: "제작 완료",
      ON_HOLD: "제작 보류",
    };

  return (
    labels[stage] ||
    "제작 상태 확인 필요"
  );
}

function formatDateTime(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(date);
}

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}