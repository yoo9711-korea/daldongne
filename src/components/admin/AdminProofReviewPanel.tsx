import { prisma } from "@/lib/prisma";
import Link from "next/link";

type Props = {
  orderRecordId: string;
};

export default async function AdminProofReviewPanel({
  orderRecordId,
}: Props) {
  const reviews =
    await prisma.bookOrderProofReview.findMany({
      where: {
        orderId: orderRecordId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      select: {
        id: true,
        proofFileUrl: true,
        proofSentAt: true,
        responseType: true,
        message: true,
        resolvedAt: true,
        resolvedById: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

  const pendingChangeRequest =
    reviews.find(
      (review) =>
        review.responseType ===
          "CHANGES_REQUESTED" &&
        !review.resolvedAt,
    );

  return (
    <section className="admin-proof-review-panel">
      <style>
        {adminProofReviewStyles}
      </style>

      <div className="admin-proof-review-heading">
        <div>
          <p>
            CUSTOMER PROOF REVIEW
          </p>

          <h2>
            고객 교정 응답
          </h2>

          <span>
            고객이 제출한 교정 승인과
            수정 요청을 교정본 회차별로
            확인합니다.
          </span>
        </div>

        <Link
          href={`/admin/proof-reviews?orderId=${encodeURIComponent(
            orderRecordId,
          )}`}
        >
          전체 교정 응답
        </Link>
      </div>

      {pendingChangeRequest ? (
        <div className="admin-proof-review-pending">
          <div>
            <strong>
              수정 요청 처리 대기
            </strong>

            <span>
              고객 요청을 확인하고
              수정된 교정본을 다시
              전달해 주세요.
            </span>
          </div>

          <p>
            {pendingChangeRequest.message ||
              "고객이 수정 요청을 제출했습니다."}
          </p>

          <small>
            수정된 교정본 파일 주소를
            등록한 뒤 제작 단계를
            ‘교정본 전달’로 변경하면
            이전 수정 요청을 처리 완료로
            전환할 수 있습니다.
          </small>
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div className="admin-proof-review-list">
          {reviews.map(
            (review) => (
              <article
                key={review.id}
                data-pending={
                  review.responseType ===
                    "CHANGES_REQUESTED" &&
                  !review.resolvedAt
                    ? "true"
                    : "false"
                }
              >
                <div className="admin-proof-review-item-heading">
                  <div>
                    <strong
                      data-response={
                        review.responseType
                      }
                    >
                      {review.responseType ===
                      "APPROVED"
                        ? "교정 승인"
                        : "수정 요청"}
                    </strong>

                    {review.resolvedAt ? (
                      <span>
                        처리 완료
                      </span>
                    ) : review.responseType ===
                      "CHANGES_REQUESTED" ? (
                      <span data-pending="true">
                        처리 대기
                      </span>
                    ) : null}
                  </div>

                  <time>
                    {formatDateTime(
                      review.createdAt,
                    )}
                  </time>
                </div>

                <p>
                  {review.message ||
                    (review.responseType ===
                    "APPROVED"
                      ? "고객이 교정본을 최종 승인했습니다."
                      : "수정 요청 내용이 없습니다.")}
                </p>

                <div className="admin-proof-review-item-meta">
                  <span>
                    고객{" "}
                    {review.author.name ||
                      review.author.email ||
                      "정보 없음"}
                  </span>

                  <span>
                    교정본 전달{" "}
                    {formatDateTime(
                      review.proofSentAt,
                    )}
                  </span>

                  {review.resolvedAt ? (
                    <span>
                      처리 완료{" "}
                      {formatDateTime(
                        review.resolvedAt,
                      )}
                    </span>
                  ) : null}

                  <a
                    href={
                      review.proofFileUrl
                    }
                    target={
                      review.proofFileUrl.startsWith(
                        "http",
                      )
                        ? "_blank"
                        : undefined
                    }
                    rel="noreferrer"
                  >
                    해당 교정본 열기
                  </a>
                </div>
              </article>
            ),
          )}
        </div>
      ) : (
        <div className="admin-proof-review-empty">
          아직 고객이 제출한 교정
          승인이나 수정 요청이 없습니다.
        </div>
      )}
    </section>
  );
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

const adminProofReviewStyles = `
  .admin-proof-review-panel,
  .admin-proof-review-panel * {
    box-sizing: border-box;
  }

  .admin-proof-review-panel {
    margin-top: 15px;
    padding: 22px;
    border:
      1px solid
      rgba(
        128,
        83,
        61,
        0.12
      );
    border-radius: 21px;
    background: #ffffff;
    box-shadow:
      0 12px 31px
      rgba(
        97,
        62,
        46,
        0.045
      );
  }

  .admin-proof-review-panel a {
    color: inherit;
    text-decoration: none;
  }

  .admin-proof-review-heading {
    display: flex;
    align-items: flex-end;
    justify-content:
      space-between;
    gap: 16px;
  }

  .admin-proof-review-heading p {
    margin: 0;
    color: #79559a;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.09em;
  }

  .admin-proof-review-heading h2 {
    margin: 5px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 23px;
    letter-spacing: -0.04em;
  }

  .admin-proof-review-heading
  > div
  > span {
    display: block;
    margin-top: 6px;
    color: #8b756a;
    font-size: 9px;
    line-height: 1.65;
  }

  .admin-proof-review-heading
  > a {
    min-height: 39px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    border:
      1px solid
      #d3b6df;
    border-radius: 10px;
    color: #684b80;
    background: #ffffff;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-proof-review-pending {
    margin-top: 16px;
    padding: 16px;
    border:
      1px solid
      #e5b4aa;
    border-radius: 14px;
    background:
      linear-gradient(
        135deg,
        #fff0ed,
        #fff8f5
      );
  }

  .admin-proof-review-pending
  > div {
    display: flex;
    align-items: center;
    justify-content:
      space-between;
    gap: 12px;
  }

  .admin-proof-review-pending strong {
    color: #9a4d42;
    font-size: 12px;
  }

  .admin-proof-review-pending
  > div
  > span {
    color: #9a746d;
    font-size: 8px;
  }

  .admin-proof-review-pending p {
    margin: 10px 0 0;
    color: #714d47;
    font-size: 11px;
    line-height: 1.75;
    white-space: pre-wrap;
  }

  .admin-proof-review-pending small {
    display: block;
    margin-top: 9px;
    padding-top: 9px;
    border-top:
      1px dashed
      rgba(
        153,
        76,
        65,
        0.2
      );
    color: #98736c;
    font-size: 8px;
    line-height: 1.65;
  }

  .admin-proof-review-list {
    margin-top: 16px;
    display: grid;
    gap: 9px;
  }

  .admin-proof-review-list article {
    padding: 14px;
    border:
      1px solid
      #eadfd9;
    border-radius: 14px;
    background: #fffcfa;
  }

  .admin-proof-review-list
  article[data-pending="true"] {
    border-color: #e5b3a9;
    background: #fff6f3;
  }

  .admin-proof-review-item-heading {
    display: flex;
    align-items: center;
    justify-content:
      space-between;
    gap: 12px;
  }

  .admin-proof-review-item-heading
  > div {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .admin-proof-review-item-heading
  strong,
  .admin-proof-review-item-heading
  span {
    min-height: 24px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-proof-review-item-heading
  strong {
    color: #914d42;
    background: #ffe9e5;
  }

  .admin-proof-review-item-heading
  strong[data-response="APPROVED"] {
    color: #39704b;
    background: #e6f3e9;
  }

  .admin-proof-review-item-heading
  span {
    color: #526a88;
    background: #e9f1fb;
  }

  .admin-proof-review-item-heading
  span[data-pending="true"] {
    color: #8d5b16;
    background: #fff0c9;
  }

  .admin-proof-review-item-heading
  time {
    color: #9a8479;
    font-size: 8px;
  }

  .admin-proof-review-list
  article
  > p {
    margin: 10px 0 0;
    color: #604a41;
    font-size: 10px;
    line-height: 1.75;
    white-space: pre-wrap;
  }

  .admin-proof-review-item-meta {
    margin-top: 10px;
    padding-top: 9px;
    display: flex;
    flex-wrap: wrap;
    gap: 7px 12px;
    border-top:
      1px solid
      #eee2dc;
    color: #957f75;
    font-size: 8px;
  }

  .admin-proof-review-item-meta
  a {
    color: #704d8c;
    font-weight: 900;
  }

  .admin-proof-review-empty {
    margin-top: 16px;
    padding: 32px;
    border:
      1px dashed
      #d8c1b7;
    border-radius: 14px;
    color: #947d72;
    background: #fffaf7;
    font-size: 9px;
    text-align: center;
  }

  @media (max-width: 650px) {
    .admin-proof-review-heading,
    .admin-proof-review-pending
    > div,
    .admin-proof-review-item-heading {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-proof-review-heading
    > a {
      align-self: flex-start;
    }
  }
`;