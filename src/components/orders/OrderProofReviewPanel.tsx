import { prisma } from "@/lib/prisma";
import OrderProofReviewActions from "./OrderProofReviewActions";

type LatestReview = {
  responseType: string;
  resolvedAt: Date | null;
};

export default async function OrderProofReviewPanel({
  orderRecordId,
  authorId,
}: {
  orderRecordId: string;
  authorId: string;
}) {
  const order =
    await prisma.bookOrder.findFirst({
      where: {
        id: orderRecordId,
        authorId,
      },
      select: {
        id: true,
        productionStage: true,
        proofFileUrl: true,
        proofSentAt: true,
        proofApprovedAt: true,
        proofReviews: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
          select: {
            id: true,
            proofFileUrl: true,
            proofSentAt: true,
            responseType: true,
            message: true,
            resolvedAt: true,
            createdAt: true,
          },
        },
      },
    });

  if (!order) {
    return null;
  }

  if (
    !order.proofFileUrl &&
    order.proofReviews.length === 0
  ) {
    return null;
  }

  const currentResponse =
    order.proofSentAt
      ? order.proofReviews.find(
          (review) =>
            review.proofSentAt.getTime() ===
            order.proofSentAt?.getTime(),
        )
      : null;

  const latestResponse =
    currentResponse ||
    order.proofReviews[0] ||
    null;

  const canRespond =
    Boolean(
      order.proofFileUrl &&
        order.proofSentAt &&
        String(
          order.productionStage,
        ) === "PROOF_SENT" &&
        !currentResponse,
    );

  const status =
    getCurrentStatus({
      stage: String(
        order.productionStage,
      ),
      latestResponse,
      hasProof: Boolean(
        order.proofFileUrl,
      ),
    });

  return (
    <section className="user-proof-review-panel">
      <style>
        {proofReviewPanelStyles}
      </style>

      <div className="user-proof-review-heading">
        <div>
          <p>
            PROOF REVIEW
          </p>

          <h2>
            교정본 승인·수정 요청
          </h2>

          <span>
            교정본을 확인한 뒤 최종
            승인하거나 수정할 내용을
            사이트에서 바로 전달해 주세요.
          </span>
        </div>

        <strong
          data-status={
            status.tone
          }
        >
          {status.label}
        </strong>
      </div>

      {order.proofFileUrl ? (
        <div className="user-proof-review-current">
          <div>
            <span>
              현재 교정본
            </span>

            <strong>
              {order.proofSentAt
                ? `${formatDateTime(
                    order.proofSentAt,
                  )} 전달`
                : "담당자가 수정 중입니다."}
            </strong>
          </div>

          <a
            href={`/api/orders/${encodeURIComponent(
              order.id,
            )}/proof`}
            target="_blank"
            rel="noreferrer"
          >
            교정본 열기

            <span aria-hidden="true">
              →
            </span>
          </a>
        </div>
      ) : null}

      {canRespond ? (
        <OrderProofReviewActions
          orderRecordId={
            order.id
          }
        />
      ) : (
        <div className="user-proof-review-guidance">
          {status.description}
        </div>
      )}

      {order.proofReviews.length >
      0 ? (
        <div className="user-proof-review-history">
          <h3>
            교정 응답 이력
          </h3>

          <ol>
            {order.proofReviews.map(
              (review) => (
                <li
                  key={
                    review.id
                  }
                >
                  <div>
                    <strong
                      data-response={
                        review.responseType
                      }
                    >
                      {review.responseType ===
                      "APPROVED"
                        ? "최종 승인"
                        : "수정 요청"}
                    </strong>

                    {review.resolvedAt ? (
                      <span>
                        새 교정본 전달로 처리 완료
                      </span>
                    ) : null}
                  </div>

                  <p>
                    {review.message ||
                      (review.responseType ===
                      "APPROVED"
                        ? "교정본을 최종 승인했습니다."
                        : "수정 요청이 접수되었습니다.")}
                  </p>

                  <time>
                    응답{" "}
                    {formatDateTime(
                      review.createdAt,
                    )}

                    {" · "}

                    교정본 전달{" "}
                    {formatDateTime(
                      review.proofSentAt,
                    )}
                  </time>
                </li>
              ),
            )}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function getCurrentStatus({
  stage,
  latestResponse,
  hasProof,
}: {
  stage: string;
  latestResponse:
    | LatestReview
    | null;
  hasProof: boolean;
}) {
  if (
    stage === "PROOF_APPROVED" ||
    latestResponse?.responseType ===
      "APPROVED"
  ) {
    return {
      label: "교정 승인 완료",
      tone: "approved",
      description:
        "교정 승인이 완료되어 현재 교정본이 제작용 최종본으로 확정되었습니다.",
    };
  }

  if (
    latestResponse?.responseType ===
      "CHANGES_REQUESTED" &&
    !latestResponse.resolvedAt
  ) {
    return {
      label: "수정 요청 접수",
      tone: "changes",
      description:
        "수정 요청이 담당자에게 전달되었습니다. 새 교정본이 준비되면 다시 안내됩니다.",
    };
  }

  if (stage === "PROOF_SENT") {
    return {
      label: "고객 확인 대기",
      tone: "waiting",
      description:
        "교정본을 확인한 뒤 승인 또는 수정 요청을 선택해 주세요.",
    };
  }

  if (hasProof) {
    return {
      label: "교정 작업 중",
      tone: "working",
      description:
        "담당자가 교정본을 수정하거나 다음 확인본을 준비하고 있습니다.",
    };
  }

  return {
    label: "교정본 준비 전",
    tone: "working",
    description:
      "교정본이 준비되면 이 화면에서 확인하고 응답할 수 있습니다.",
  };
}

function formatDateTime(
  value: Date,
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
  ).format(value);
}

const proofReviewPanelStyles = `
  .user-proof-review-panel,
  .user-proof-review-panel * {
    box-sizing: border-box;
  }

  .user-proof-review-panel {
    margin-top: 15px;
    padding: 23px;
    border:
      1px solid
      #cbb8dc;
    border-radius: 21px;
    background:
      linear-gradient(
        135deg,
        #fbf8ff,
        #f5effb
      );
    box-shadow:
      0 12px 31px
      rgba(
        97,
        62,
        46,
        0.045
      );
  }

  .user-proof-review-panel a {
    color: inherit;
    text-decoration: none;
  }

  .user-proof-review-heading {
    display: flex;
    align-items: flex-start;
    justify-content:
      space-between;
    gap: 18px;
  }

  .user-proof-review-heading p {
    margin: 0;
    color: #745599;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .user-proof-review-heading h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-display),
      "Noto Serif KR",
      serif;
    font-size: 24px;
    letter-spacing: -0.04em;
  }

  .user-proof-review-heading
  > div
  > span {
    display: block;
    margin-top: 7px;
    color: #806f88;
    font-size: 11px;
    line-height: 1.65;
  }

  .user-proof-review-heading
  > strong {
    min-height: 28px;
    padding: 0 9px;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    border-radius: 999px;
    color: #66527c;
    background: #ebe2f5;
    font-size: 9px;
    font-weight: 900;
  }

  .user-proof-review-heading
  > strong[data-status="approved"] {
    color: #376b49;
    background: #e5f3e8;
  }

  .user-proof-review-heading
  > strong[data-status="changes"] {
    color: #914d42;
    background: #ffe9e5;
  }

  .user-proof-review-heading
  > strong[data-status="waiting"] {
    color: #805c1b;
    background: #fff0c9;
  }

  .user-proof-review-current {
    margin-top: 17px;
    padding: 14px;
    display: flex;
    align-items: center;
    justify-content:
      space-between;
    gap: 15px;
    border:
      1px solid
      #d8cce5;
    border-radius: 14px;
    background:
      rgba(
        255,
        255,
        255,
        0.82
      );
  }

  .user-proof-review-current span,
  .user-proof-review-current strong {
    display: block;
  }

  .user-proof-review-current
  > div
  > span {
    color: #8b7894;
    font-size: 9px;
    font-weight: 900;
  }

  .user-proof-review-current
  > div
  > strong {
    margin-top: 4px;
    font-size: 11px;
  }

  .user-proof-review-current
  > a {
    min-height: 42px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 11px;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #8060a8,
        #68478e
      );
    font-size: 10px;
    font-weight: 900;
  }

  .user-proof-review-guidance {
    margin-top: 14px;
    padding: 13px;
    border:
      1px solid
      #ddd0e9;
    border-radius: 12px;
    color: #725f7e;
    background:
      rgba(
        255,
        255,
        255,
        0.72
      );
    font-size: 10px;
    line-height: 1.65;
  }

  .user-proof-review-history {
    margin-top: 20px;
    padding-top: 17px;
    border-top:
      1px solid
      rgba(
        108,
        79,
        145,
        0.15
      );
  }

  .user-proof-review-history h3 {
    margin: 0;
    font-size: 14px;
  }

  .user-proof-review-history ol {
    margin: 12px 0 0;
    padding: 0;
    display: grid;
    gap: 8px;
    list-style: none;
  }

  .user-proof-review-history li {
    padding: 13px;
    border:
      1px solid
      #ddd2e7;
    border-radius: 13px;
    background:
      rgba(
        255,
        255,
        255,
        0.8
      );
  }

  .user-proof-review-history
  li
  > div {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .user-proof-review-history
  li
  strong,
  .user-proof-review-history
  li
  > div
  > span {
    min-height: 23px;
    padding: 0 7px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
  }

  .user-proof-review-history
  li
  strong {
    color: #8c4a40;
    background: #ffe8e3;
  }

  .user-proof-review-history
  li
  strong[data-response="APPROVED"] {
    color: #376b49;
    background: #e4f2e7;
  }

  .user-proof-review-history
  li
  > div
  > span {
    color: #536a88;
    background: #eaf1fa;
  }

  .user-proof-review-history
  li
  p {
    margin: 8px 0 0;
    color: #66546d;
    font-size: 10px;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .user-proof-review-history
  li
  time {
    display: block;
    margin-top: 7px;
    color: #9a899f;
    font-size: 8px;
  }

  @media (max-width: 620px) {
    .user-proof-review-heading,
    .user-proof-review-current {
      align-items: stretch;
      flex-direction: column;
    }

    .user-proof-review-heading
    > strong,
    .user-proof-review-current
    > a {
      align-self: flex-start;
    }
  }
`;
