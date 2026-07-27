import AdminAIProductionStartButton from "@/components/admin/AdminAIProductionStartButton";
import AdminAIProductionManuscriptButton from "@/components/admin/AdminAIProductionManuscriptButton";
import AdminAIProductionAnalyzeButton from "@/components/admin/AdminAIProductionAnalyzeButton";
import AdminAIProductionPdfButton from "@/components/admin/AdminAIProductionPdfButton";
import AdminAIProductionDecisionPanel from "@/components/admin/AdminAIProductionDecisionPanel";
import { prisma } from "@/lib/prisma";

type AdminAIProductionPanelProps = {
  orderRecordId: string;
};

const ACTIVE_STATUSES = [
  "QUEUED",
  "RUNNING",
  "NEEDS_INPUT",
  "READY_FOR_APPROVAL",
];

export default async function AdminAIProductionPanel({
  orderRecordId,
}: AdminAIProductionPanelProps) {
  const order =
    await prisma.bookOrder.findUnique({
      where: {
        id: orderRecordId,
      },
      select: {
        id: true,
        status: true,
        book: {
          select: {
            title: true,
          },
        },
        aiProductionRuns: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            mode: true,
            status: true,
            currentStep: true,
            attempt: true,
            sourceSnapshot: true,
            qualityReport: true,
            finalPdfUrl: true,
            requiresHumanReview: true,
            humanReviewReason: true,
            adminDecisionNote: true,
            startedAt: true,
            completedAt: true,
            approvedAt: true,
            createdAt: true,
            updatedAt: true,
            issues: {
              orderBy: {
                createdAt: "desc",
              },
              take: 20,
              select: {
                id: true,
                category: true,
                code: true,
                severity: true,
                status: true,
                message: true,
                sourceRef: true,
                suggestedAction: true,
                confidence: true,
                resolvedAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

  if (!order) {
    return null;
  }

  const latestRun =
    order.aiProductionRuns[0] ||
    null;

  const sourceCounts =
    getSourceCounts(
      latestRun?.sourceSnapshot,
    );

  const openIssues =
    latestRun?.issues.filter(
      (issue) =>
        issue.status === "OPEN",
    ) || [];

  const blockerCount =
    openIssues.filter(
      (issue) =>
        issue.severity ===
        "BLOCKER",
    ).length;

  const warningCount =
    openIssues.filter(
      (issue) =>
        issue.severity ===
        "WARNING",
    ).length;

  const infoCount =
    openIssues.filter(
      (issue) =>
        issue.severity ===
        "INFO",
    ).length;

  const hasActiveRun =
    Boolean(
      latestRun &&
        ACTIVE_STATUSES.includes(
          String(
            latestRun.status,
          ),
        ),
    );

    const canAnalyze =
    Boolean(
      latestRun &&
        String(
          latestRun.status,
        ) === "QUEUED" &&
        String(
          latestRun.currentStep,
        ) ===
          "MATERIAL_ANALYSIS",
    );

    const canGenerateManuscript =
    Boolean(
      latestRun &&
        String(
          latestRun.status,
        ) === "RUNNING" &&
        String(
          latestRun.currentStep,
        ) ===
          "MANUSCRIPT_EDITING",
    );

   const canGeneratePdf =
  Boolean(
    latestRun &&
      String(
        latestRun.status,
      ) === "RUNNING" &&
      String(
        latestRun.currentStep,
      ) ===
        "FINAL_PDF" &&
      !latestRun.finalPdfUrl,
  );

const hasFinalPdf =
  Boolean(
    latestRun?.finalPdfUrl,
  );

 const canMakeFinalDecision =
  Boolean(
    latestRun &&
      String(
        latestRun.status,
      ) ===
        "READY_FOR_APPROVAL" &&
      String(
        latestRun.currentStep,
      ) ===
        "ADMIN_APPROVAL" &&
      latestRun.finalPdfUrl,
  );

   const isRework =
    Boolean(
      latestRun &&
        String(
          latestRun.status,
        ) ===
          "REJECTED" &&
        latestRun.adminDecisionNote
          ?.trim(),
    );

  const revisionInstruction =
    isRework
      ? latestRun
          ?.adminDecisionNote
          ?.trim() ||
        null
      : null;

  const isPaid =
    String(order.status) ===
    "PAID";

  const startDisabled =
    !isPaid ||
    hasActiveRun;

  const disabledReason =
    !isPaid
      ? "결제가 완료된 주문에서만 AI 자동 제작을 시작할 수 있습니다."
      : hasActiveRun
        ? "현재 진행 중이거나 승인 대기 중인 AI 제작 작업이 있습니다."
        : null;

  return (
    <section className="admin-ai-production-panel">
      <header>
        <div>
          <p>
            AI BOOK PRODUCTION
          </p>

          <h2>
            AI 자동 제작
          </h2>

          <span>
            원본 사진과 글은 그대로
            보존하고, 복사된 자료를
            이용해 AI 편집·검수·최종
            PDF 제작을 진행합니다.
          </span>
        </div>

        {latestRun ? (
          <strong
            data-status={
              latestRun.status
            }
          >
            {getStatusLabel(
              String(
                latestRun.status,
              ),
            )}
          </strong>
        ) : (
          <strong data-status="NOT_STARTED">
            시작 전
          </strong>
        )}
      </header>

      {latestRun ? (
        <>
          <div className="admin-ai-production-summary">
            <SummaryItem
              label="제작 회차"
              value={`${latestRun.attempt}차`}
            />

            <SummaryItem
              label="현재 단계"
              value={getStepLabel(
                String(
                  latestRun.currentStep,
                ),
              )}
            />

            <SummaryItem
              label="등록 자료"
              value={`${sourceCounts.total}개`}
            />

            <SummaryItem
              label="사진"
              value={`${sourceCounts.photos}장`}
            />

            <SummaryItem
              label="이야기 자료"
              value={`${sourceCounts.itemsWithStory}개`}
            />

            <SummaryItem
              label="검토 필요"
              value={
                latestRun.requiresHumanReview
                  ? "필요"
                  : "없음"
              }
              tone={
                latestRun.requiresHumanReview
                  ? "warning"
                  : "success"
              }
            />
          </div>

          <div className="admin-ai-production-progress">
            <div>
              <span>
                AI 제작 진행 단계
              </span>

              <strong>
                {getStepNumber(
                  String(
                    latestRun.currentStep,
                  ),
                )}
                /8
              </strong>
            </div>

            <div
              className="admin-ai-production-progress-track"
              aria-hidden="true"
            >
              <span
                style={{
                  width: `${getStepProgress(
                    String(
                      latestRun.currentStep,
                    ),
                  )}%`,
                }}
              />
            </div>

            <ol>
              {PRODUCTION_STEPS.map(
                (
                  step,
                  index,
                ) => {
                  const currentNumber =
                    getStepNumber(
                      String(
                        latestRun.currentStep,
                      ),
                    );

                  const stepNumber =
                    index + 1;

                  const state =
                    stepNumber <
                    currentNumber
                      ? "completed"
                      : stepNumber ===
                          currentNumber
                        ? "current"
                        : "waiting";

                  return (
                    <li
                      key={step.value}
                      data-state={
                        state
                      }
                    >
                      <span>
                        {stepNumber}
                      </span>

                      <strong>
                        {step.label}
                      </strong>
                    </li>
                  );
                },
              )}
            </ol>
          </div>

          <div className="admin-ai-production-issue-summary">
            <article data-tone="blocker">
              <span>
                작업 차단
              </span>

              <strong>
                {blockerCount}
              </strong>
            </article>

            <article data-tone="warning">
              <span>
                주의 항목
              </span>

              <strong>
                {warningCount}
              </strong>
            </article>

            <article data-tone="info">
              <span>
                참고 항목
              </span>

              <strong>
                {infoCount}
              </strong>
            </article>
          </div>

          {latestRun.humanReviewReason ? (
            <div className="admin-ai-production-human-review">
              <strong>
                사람의 확인이 필요한
                이유
              </strong>

              <p>
                {
                  latestRun.humanReviewReason
                }
              </p>
            </div>
          ) : null}

          {openIssues.length > 0 ? (
            <div className="admin-ai-production-issues">
              <div className="admin-ai-production-section-heading">
                <div>
                  <span>
                    AI QUALITY ISSUES
                  </span>

                  <strong>
                    미처리 검수 항목
                  </strong>
                </div>

                <em>
                  {openIssues.length}건
                </em>
              </div>

              <div className="admin-ai-production-issue-list">
                {openIssues.map(
                  (issue) => (
                    <article
                      key={issue.id}
                      data-severity={
                        issue.severity
                      }
                    >
                      <div>
                        <strong>
                          {getSeverityLabel(
                            String(
                              issue.severity,
                            ),
                          )}
                        </strong>

                        <span>
                          {
                            issue.code
                          }
                        </span>
                      </div>

                      <p>
                        {
                          issue.message
                        }
                      </p>

                      {issue.suggestedAction ? (
                        <small>
                          권장 처리:{" "}
                          {
                            issue.suggestedAction
                          }
                        </small>
                      ) : null}

                      {issue.sourceRef ? (
                        <em>
                          자료 ID:{" "}
                          {
                            issue.sourceRef
                          }
                        </em>
                      ) : null}
                    </article>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="admin-ai-production-no-issues">
              현재 미처리 검수 항목이
              없습니다.
            </div>
          )}

          <div className="admin-ai-production-dates">
            <DateItem
              label="작업 생성"
              value={
                latestRun.createdAt
              }
            />

            <DateItem
              label="작업 시작"
              value={
                latestRun.startedAt
              }
            />

            <DateItem
              label="AI 작업 완료"
              value={
                latestRun.completedAt
              }
            />

            <DateItem
              label="관리자 승인"
              value={
                latestRun.approvedAt
              }
            />
          </div>

             {latestRun.adminDecisionNote ? (
            <div className="admin-ai-production-admin-note">
              <strong>
                관리자 결정 메모
              </strong>

              <p>
                {
                  latestRun.adminDecisionNote
                }
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="admin-ai-production-empty">
          <strong>
            아직 AI 제작 작업이 없습니다
          </strong>

          <p>
            AI 자동 제작을 시작하면 현재
            책에 연결된 사진과 글을
            복사하여 원본 스냅샷을
            생성합니다.
          </p>
        </div>
      )}
        <div className="admin-ai-production-action">
        {canAnalyze ? (
          <AdminAIProductionAnalyzeButton
            orderRecordId={
              order.id
            }
          />
        ) : null}

        {canGenerateManuscript ? (
          <AdminAIProductionManuscriptButton
            orderRecordId={
              order.id
            }
          />
        ) : null}

        {latestRun &&
        (
          canGeneratePdf ||
          hasFinalPdf
        ) ? (
          <AdminAIProductionPdfButton
            orderRecordId={
              order.id
            }
            canGenerate={
              canGeneratePdf
            }
            hasPdf={
              hasFinalPdf
            }
          />
        ) : null}

        {canMakeFinalDecision ? (
          <AdminAIProductionDecisionPanel
            orderRecordId={
              order.id
            }
          />
        ) : null}

                <AdminAIProductionStartButton
          orderRecordId={
            order.id
          }
          disabled={
            startDisabled
          }
          disabledReason={
            disabledReason
          }
          isRework={
            isRework
          }
          revisionInstruction={
            revisionInstruction
          }
        />

        <p>
          AI가 원본을 영구 삭제하거나
          직접 변경하지 않습니다. 새
          회차를 시작할 때마다 별도의
          스냅샷과 작업 기록이
          생성됩니다.
        </p>
      </div>

      <style>
        {adminAIProductionStyles}
      </style>
    </section>
  );
}

function SummaryItem({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?:
    | "default"
    | "warning"
    | "success";
}) {
  return (
    <article data-tone={tone}>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </article>
  );
}

function DateItem({
  label,
  value,
}: {
  label: string;
  value: Date | null;
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong>
        {formatDateTime(
          value,
        )}
      </strong>
    </div>
  );
}

const PRODUCTION_STEPS = [
  {
    value:
      "MATERIAL_ANALYSIS",
    label: "자료 분석",
  },
  {
    value:
      "OUTLINE_GENERATION",
    label: "목차 구성",
  },
  {
    value:
      "MANUSCRIPT_EDITING",
    label: "원고 편집",
  },
  {
    value:
      "PHOTO_SELECTION",
    label: "사진 선별",
  },
  {
    value:
      "LAYOUT_GENERATION",
    label: "페이지 구성",
  },
  {
    value:
      "QUALITY_CHECK",
    label: "AI 검수",
  },
  {
    value:
      "FINAL_PDF",
    label: "최종 PDF",
  },
  {
    value:
      "ADMIN_APPROVAL",
    label: "관리자 승인",
  },
] as const;

function getSourceCounts(
  value: unknown,
) {
  const emptyCounts = {
    total: 0,
    photos: 0,
    textItems: 0,
    itemsWithStory: 0,
    emptyItems: 0,
  };

  if (!isRecord(value)) {
    return emptyCounts;
  }

  const counts =
    value.counts;

  if (!isRecord(counts)) {
    return emptyCounts;
  }

  return {
    total:
      getSafeNumber(
        counts.total,
      ),
    photos:
      getSafeNumber(
        counts.photos,
      ),
    textItems:
      getSafeNumber(
        counts.textItems,
      ),
    itemsWithStory:
      getSafeNumber(
        counts.itemsWithStory,
      ),
    emptyItems:
      getSafeNumber(
        counts.emptyItems,
      ),
  };
}

function getStatusLabel(
  status: string,
) {
  const labels:
    Record<string, string> = {
      QUEUED: "작업 대기",
      RUNNING: "AI 제작 중",
      NEEDS_INPUT:
        "자료 확인 필요",
      READY_FOR_APPROVAL:
        "최종 승인 대기",
      APPROVED:
        "관리자 승인 완료",
      REJECTED:
        "관리자 반려",
      FAILED:
        "AI 제작 실패",
    };

  return (
    labels[status] ||
    status
  );
}

function getStepLabel(
  step: string,
) {
  return (
    PRODUCTION_STEPS.find(
      (item) =>
        item.value === step,
    )?.label ||
    step
  );
}

function getStepNumber(
  step: string,
) {
  const index =
    PRODUCTION_STEPS.findIndex(
      (item) =>
        item.value === step,
    );

  return index >= 0
    ? index + 1
    : 1;
}

function getStepProgress(
  step: string,
) {
  return Math.round(
    (getStepNumber(step) /
      PRODUCTION_STEPS.length) *
      100,
  );
}

function getSeverityLabel(
  severity: string,
) {
  const labels:
    Record<string, string> = {
      INFO: "참고",
      WARNING: "주의",
      BLOCKER: "작업 차단",
    };

  return (
    labels[severity] ||
    severity
  );
}

function getSafeNumber(
  value: unknown,
) {
  return typeof value ===
      "number" &&
    Number.isFinite(value)
    ? value
    : 0;
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function formatDateTime(
  value: Date | null,
) {
  if (!value) {
    return "아직 없음";
  }

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

const adminAIProductionStyles = `
  .admin-ai-production-panel,
  .admin-ai-production-panel * {
    box-sizing: border-box;
  }

  .admin-ai-production-panel {
    margin-top: 18px;
    padding: 23px;
    border: 1px solid #dfd0e9;
    border-radius: 22px;
    color: #4f3b46;
    background:
      linear-gradient(
        145deg,
        #fffaff,
        #ffffff
      );
    box-shadow:
      0 15px 38px
      rgba(
        87,
        52,
        106,
        0.06
      );
  }

  .admin-ai-production-panel
  > header {
    display: flex;
    align-items: flex-start;
    justify-content:
      space-between;
    gap: 18px;
  }

  .admin-ai-production-panel
  > header p {
    margin: 0;
    color: #7a5596;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.1em;
  }

  .admin-ai-production-panel
  > header h2 {
    margin: 6px 0 0;
    font-family:
      var(--font-daldongne-serif),
      "Noto Serif KR",
      serif;
    font-size: 25px;
    letter-spacing: -0.045em;
  }

  .admin-ai-production-panel
  > header span {
    display: block;
    max-width: 590px;
    margin-top: 7px;
    color: #89727f;
    font-size: 10px;
    line-height: 1.7;
  }

  .admin-ai-production-panel
  > header
  > strong {
    min-height: 31px;
    padding: 0 11px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: #675173;
    background: #eee5f4;
    font-size: 9px;
    white-space: nowrap;
  }

  .admin-ai-production-panel
  > header
  > strong[data-status="RUNNING"] {
    color: #4c5f91;
    background: #e9edff;
  }

  .admin-ai-production-panel
  > header
  > strong[data-status="NEEDS_INPUT"],
  .admin-ai-production-panel
  > header
  > strong[data-status="REJECTED"],
  .admin-ai-production-panel
  > header
  > strong[data-status="FAILED"] {
    color: #914b43;
    background: #ffe9e5;
  }

  .admin-ai-production-panel
  > header
  > strong[data-status="READY_FOR_APPROVAL"] {
    color: #8a621b;
    background: #fff0cb;
  }

  .admin-ai-production-panel
  > header
  > strong[data-status="APPROVED"] {
    color: #3a704b;
    background: #e5f4e9;
  }

  .admin-ai-production-summary {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      repeat(
        6,
        minmax(0, 1fr)
      );
    gap: 8px;
  }

  .admin-ai-production-summary
  article {
    padding: 13px;
    border: 1px solid #e8dde4;
    border-radius: 13px;
    background: #ffffff;
  }

  .admin-ai-production-summary
  span,
  .admin-ai-production-summary
  strong {
    display: block;
  }

  .admin-ai-production-summary
  span {
    color: #9b8791;
    font-size: 8px;
  }

  .admin-ai-production-summary
  strong {
    margin-top: 5px;
    font-size: 11px;
  }

  .admin-ai-production-summary
  article[data-tone="warning"] {
    border-color: #e8b6ac;
    background: #fff2ef;
  }

  .admin-ai-production-summary
  article[data-tone="success"] {
    border-color: #bfdac7;
    background: #eef8f1;
  }

  .admin-ai-production-progress {
    margin-top: 15px;
    padding: 16px;
    border: 1px solid #e5d9e2;
    border-radius: 16px;
    background: #ffffff;
  }

  .admin-ai-production-progress
  > div:first-child {
    display: flex;
    justify-content:
      space-between;
    gap: 12px;
    color: #7e6875;
    font-size: 9px;
  }

  .admin-ai-production-progress-track {
    height: 8px;
    margin-top: 9px;
    overflow: hidden;
    border-radius: 999px;
    background: #eee8ec;
  }

  .admin-ai-production-progress-track
  span {
    height: 100%;
    display: block;
    border-radius: inherit;
    background:
      linear-gradient(
        90deg,
        #745293,
        #aa7ec0
      );
  }

  .admin-ai-production-progress
  ol {
    margin: 15px 0 0;
    padding: 0;
    display: grid;
    grid-template-columns:
      repeat(
        8,
        minmax(0, 1fr)
      );
    gap: 6px;
    list-style: none;
  }

  .admin-ai-production-progress
  li {
    text-align: center;
  }

  .admin-ai-production-progress
  li span {
    width: 25px;
    height: 25px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #998993;
    background: #eee9ec;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-ai-production-progress
  li strong {
    display: block;
    margin-top: 6px;
    color: #9a8892;
    font-size: 7px;
  }

  .admin-ai-production-progress
  li[data-state="completed"]
  span {
    color: #ffffff;
    background: #765594;
  }

  .admin-ai-production-progress
  li[data-state="current"]
  span {
    color: #704b88;
    border: 2px solid #8a63a2;
    background: #f3eafa;
  }

  .admin-ai-production-progress
  li[data-state="current"]
  strong {
    color: #654476;
  }

  .admin-ai-production-issue-summary {
    margin-top: 12px;
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
    gap: 8px;
  }

  .admin-ai-production-issue-summary
  article {
    padding: 13px;
    border-radius: 13px;
  }

  .admin-ai-production-issue-summary
  span,
  .admin-ai-production-issue-summary
  strong {
    display: block;
  }

  .admin-ai-production-issue-summary
  span {
    font-size: 8px;
  }

  .admin-ai-production-issue-summary
  strong {
    margin-top: 4px;
    font-size: 19px;
  }

  .admin-ai-production-issue-summary
  article[data-tone="blocker"] {
    color: #91463f;
    background: #ffe9e5;
  }

  .admin-ai-production-issue-summary
  article[data-tone="warning"] {
    color: #89601c;
    background: #fff1cf;
  }

  .admin-ai-production-issue-summary
  article[data-tone="info"] {
    color: #526986;
    background: #eaf1fa;
  }

  .admin-ai-production-human-review,
  .admin-ai-production-admin-note {
    margin-top: 12px;
    padding: 14px;
    border: 1px solid #e5b4aa;
    border-radius: 13px;
    background: #fff3f0;
  }

  .admin-ai-production-human-review
  strong,
  .admin-ai-production-admin-note
  strong {
    font-size: 9px;
  }

  .admin-ai-production-human-review
  p,
  .admin-ai-production-admin-note
  p {
    margin: 6px 0 0;
    font-size: 9px;
    line-height: 1.7;
  }

  .admin-ai-production-issues {
    margin-top: 15px;
  }

  .admin-ai-production-section-heading {
    display: flex;
    align-items: center;
    justify-content:
      space-between;
    gap: 12px;
  }

  .admin-ai-production-section-heading
  span,
  .admin-ai-production-section-heading
  strong {
    display: block;
  }

  .admin-ai-production-section-heading
  span {
    color: #85629a;
    font-size: 8px;
    font-weight: 900;
  }

  .admin-ai-production-section-heading
  strong {
    margin-top: 3px;
    font-size: 13px;
  }

  .admin-ai-production-section-heading
  em {
    font-size: 9px;
    font-style: normal;
  }

  .admin-ai-production-issue-list {
    margin-top: 9px;
    display: grid;
    gap: 8px;
  }

  .admin-ai-production-issue-list
  article {
    padding: 13px;
    border: 1px solid #e8ddd8;
    border-left: 4px solid #9aa9bf;
    border-radius: 11px;
    background: #ffffff;
  }

  .admin-ai-production-issue-list
  article[data-severity="WARNING"] {
    border-left-color: #d2a348;
  }

  .admin-ai-production-issue-list
  article[data-severity="BLOCKER"] {
    border-left-color: #c96f63;
  }

  .admin-ai-production-issue-list
  article > div {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .admin-ai-production-issue-list
  article > div strong,
  .admin-ai-production-issue-list
  article > div span {
    font-size: 8px;
  }

  .admin-ai-production-issue-list
  article > div span {
    color: #9a8790;
  }

  .admin-ai-production-issue-list
  p {
    margin: 8px 0 0;
    font-size: 9px;
    line-height: 1.65;
  }

  .admin-ai-production-issue-list
  small,
  .admin-ai-production-issue-list
  em {
    display: block;
    margin-top: 5px;
    color: #8c7882;
    font-size: 8px;
    font-style: normal;
    line-height: 1.55;
  }

  .admin-ai-production-no-issues,
  .admin-ai-production-empty {
    margin-top: 15px;
    padding: 24px;
    border: 1px dashed #d8c6d4;
    border-radius: 14px;
    color: #897580;
    background: #fffaff;
    font-size: 9px;
    text-align: center;
  }

  .admin-ai-production-empty
  strong {
    display: block;
    font-size: 12px;
  }

  .admin-ai-production-empty
  p {
    margin: 7px auto 0;
    max-width: 520px;
    line-height: 1.7;
  }

  .admin-ai-production-dates {
    margin-top: 13px;
    display: grid;
    grid-template-columns:
      repeat(
        4,
        minmax(0, 1fr)
      );
    gap: 8px;
  }

  .admin-ai-production-dates
  div {
    padding: 12px;
    border: 1px solid #e8dde4;
    border-radius: 12px;
    background: #ffffff;
  }

  .admin-ai-production-dates
  span,
  .admin-ai-production-dates
  strong {
    display: block;
  }

  .admin-ai-production-dates
  span {
    color: #9b8791;
    font-size: 8px;
  }

  .admin-ai-production-dates
  strong {
    margin-top: 4px;
    font-size: 8px;
  }

  .admin-ai-production-pdf-link {
    min-height: 42px;
    margin-top: 12px;
    padding: 0 15px;
    display: inline-flex;
    align-items: center;
    border-radius: 11px;
    color: #ffffff;
    background: #755294;
    font-size: 9px;
    font-weight: 900;
    text-decoration: none;
  }

  .admin-ai-production-action {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eadfe6;
  }

  .admin-ai-production-action
  > p {
    margin: 9px 0 0;
    color: #95828c;
    font-size: 8px;
    line-height: 1.65;
  }

  @media (max-width: 950px) {
    .admin-ai-production-summary {
      grid-template-columns:
        repeat(
          3,
          minmax(0, 1fr)
        );
    }

    .admin-ai-production-progress
    ol {
      grid-template-columns:
        repeat(
          4,
          minmax(0, 1fr)
        );
      row-gap: 14px;
    }
  }

  @media (max-width: 650px) {
    .admin-ai-production-panel {
      padding: 17px;
    }

    .admin-ai-production-panel
    > header {
      flex-direction: column;
    }

    .admin-ai-production-summary,
    .admin-ai-production-issue-summary,
    .admin-ai-production-dates {
      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );
    }

    .admin-ai-production-progress
    ol {
      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );
    }
  }
`;