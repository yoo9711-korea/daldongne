type TimelineDateValues = {
  manuscriptReceivedAt?: Date | null;
  reviewStartedAt?: Date | null;
  proofSentAt?: Date | null;
  proofApprovedAt?: Date | null;
  printOrderedAt?: Date | null;
  printingCompletedAt?: Date | null;
  shippedAt?: Date | null;
  completedAt?: Date | null;
};

type Props =
  TimelineDateValues & {
    stage: string;
    stageUpdatedAt?: Date | null;
  };

const STEPS = [
  {
    label: "제작 준비",
    description:
      "주문과 제작 사양을 확인합니다.",
  },
  {
    label: "원고 접수",
    description:
      "사진과 원고 자료를 접수합니다.",
  },
  {
    label: "원고 검토",
    description:
      "책의 구성과 내용을 검토합니다.",
  },
  {
    label: "교정 확인",
    description:
      "교정본을 만들고 확인합니다.",
  },
  {
    label: "인쇄",
    description:
      "승인된 원고로 책을 인쇄합니다.",
  },
  {
    label: "배송",
    description:
      "포장 후 고객님께 발송합니다.",
  },
  {
    label: "완료",
    description:
      "책 제작 과정이 완료됩니다.",
  },
];

const STAGE_INDEX:
  Record<string, number> = {
    PREPARING: 0,
    MANUSCRIPT_RECEIVED: 1,
    REVIEWING: 2,
    PROOFING: 3,
    PROOF_SENT: 3,
    PROOF_APPROVED: 3,
    PRINT_ORDERED: 4,
    PRINTING: 4,
    SHIPPING_PREPARATION: 5,
    SHIPPED: 5,
    COMPLETED: 6,
    ON_HOLD: 0,
  };

export default function OrderStatusTimeline({
  stage,
  stageUpdatedAt,
  manuscriptReceivedAt,
  reviewStartedAt,
  proofSentAt,
  proofApprovedAt,
  printOrderedAt,
  printingCompletedAt,
  shippedAt,
  completedAt,
}: Props) {
  const currentIndex =
    STAGE_INDEX[stage] ?? 0;

  const stepDates = [
    stageUpdatedAt,
    manuscriptReceivedAt,
    reviewStartedAt,
    proofApprovedAt ||
      proofSentAt,
    printingCompletedAt ||
      printOrderedAt,
    shippedAt,
    completedAt,
  ];

  return (
    <section className="user-order-timeline">
      <style>
        {timelineStyles}
      </style>

      {stage === "ON_HOLD" ? (
        <div className="user-order-timeline-hold">
          제작이 잠시 보류되었습니다.
          자세한 내용은 담당자에게
          문의해 주세요.
        </div>
      ) : null}

      <ol>
        {STEPS.map(
          (step, index) => {
            const state =
              index < currentIndex
                ? "complete"
                : index ===
                    currentIndex
                  ? "current"
                  : "upcoming";

            return (
              <li
                key={step.label}
                data-state={state}
              >
                <span
                  className="user-order-timeline-marker"
                  aria-hidden="true"
                >
                  {state ===
                  "complete"
                    ? "✓"
                    : index + 1}
                </span>

                <div>
                  <strong>
                    {step.label}
                  </strong>

                  <p>
                    {
                      step.description
                    }
                  </p>

                  {stepDates[
                    index
                  ] ? (
                    <time>
                      {formatDate(
                        stepDates[
                          index
                        ] as Date,
                      )}
                    </time>
                  ) : null}
                </div>
              </li>
            );
          },
        )}
      </ol>
    </section>
  );
}

function formatDate(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(value);
}

const timelineStyles = `
  .user-order-timeline,
  .user-order-timeline * {
    box-sizing: border-box;
  }

  .user-order-timeline ol {
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns:
      repeat(7, minmax(0, 1fr));
    list-style: none;
  }

  .user-order-timeline li {
    position: relative;
    min-width: 0;
    padding: 0 7px;
    text-align: center;
  }

  .user-order-timeline li::before {
    position: absolute;
    top: 19px;
    left: -50%;
    width: 100%;
    height: 3px;
    border-radius: 999px;
    background: #eadbd4;
    content: "";
  }

  .user-order-timeline li:first-child::before {
    display: none;
  }

  .user-order-timeline li[data-state="complete"]::before,
  .user-order-timeline li[data-state="current"]::before {
    background:
      linear-gradient(
        90deg,
        #efa08b,
        #eb7058
      );
  }

  .user-order-timeline-marker {
    position: relative;
    z-index: 1;
    width: 40px;
    height: 40px;
    margin: 0 auto;
    display: grid;
    place-items: center;
    border: 2px solid #e4d4cc;
    border-radius: 50%;
    color: #9d887e;
    background: #ffffff;
    font-size: 13px;
    font-weight: 900;
  }

  .user-order-timeline li[data-state="complete"]
  .user-order-timeline-marker {
    border-color: #73a579;
    color: #ffffff;
    background: #73a579;
  }

  .user-order-timeline li[data-state="current"]
  .user-order-timeline-marker {
    border-color: #eb6c55;
    color: #ffffff;
    background:
      linear-gradient(
        135deg,
        #f4846d,
        #e75e49
      );
    box-shadow:
      0 8px 18px
      rgba(212, 91, 64, 0.22);
  }

  .user-order-timeline li > div {
    margin-top: 11px;
  }

  .user-order-timeline strong {
    display: block;
    color: #513b32;
    font-size: 12px;
  }

  .user-order-timeline p {
    margin: 5px 0 0;
    color: #927c72;
    font-size: 9px;
    line-height: 1.55;
  }

  .user-order-timeline time {
    display: block;
    margin-top: 6px;
    color: #c45e4a;
    font-size: 9px;
    font-weight: 900;
  }

  .user-order-timeline-hold {
    margin-bottom: 17px;
    padding: 13px 15px;
    border: 1px solid #ead29a;
    border-radius: 12px;
    color: #805d1c;
    background: #fff8df;
    font-size: 12px;
    font-weight: 800;
    text-align: center;
  }

  @media (max-width: 900px) {
    .user-order-timeline ol {
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 23px 0;
    }

    .user-order-timeline li:nth-child(5)::before {
      display: none;
    }
  }

  @media (max-width: 560px) {
    .user-order-timeline ol {
      display: block;
    }

    .user-order-timeline li {
      min-height: 82px;
      padding: 0 0 18px;
      display: grid;
      grid-template-columns:
        42px minmax(0, 1fr);
      gap: 13px;
      text-align: left;
    }

    .user-order-timeline li::before {
      top: 40px;
      left: 19px;
      width: 3px;
      height: calc(100% - 17px);
    }

    .user-order-timeline li:nth-child(5)::before {
      display: block;
    }

    .user-order-timeline li:last-child::before {
      display: none;
    }

    .user-order-timeline-marker {
      margin: 0;
    }

    .user-order-timeline li > div {
      margin-top: 1px;
    }

    .user-order-timeline p {
      font-size: 10px;
    }
  }
`;