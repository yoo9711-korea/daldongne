import type { AIBookSourceSnapshot } from "@/lib/ai-book-production-source";
import OpenAI from "openai";

const MAX_SOURCE_ITEMS = 180;
const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 1600;

export type AIBookMaterialAnalysis = {
  bookDirection: {
    workingTitle: string;
    subtitle: string;
    centralTheme: string;
    tone: string;
    targetReader: string;
    narrativePointOfView: string;
    editorialSummary: string;
  };

  chronology: Array<{
    sourceRef: string;
    timeLabel: string;
    sequence: number;
    confidence: number;
    note: string;
  }>;

  chapters: Array<{
    chapterNumber: number;
    title: string;
    purpose: string;
    sourceRefs: string[];
    openingDirection: string;
    closingDirection: string;
    missingInformation: string[];
  }>;

  photoPlan: Array<{
    sourceRef: string;
    decision:
      | "INCLUDE"
      | "RESERVE"
      | "EXCLUDE";
    reason: string;
    captionDirection: string;
  }>;

  issues: Array<{
    category: string;
    code: string;
    severity:
      | "INFO"
      | "WARNING"
      | "BLOCKER";
    sourceRef: string;
    message: string;
    suggestedAction: string;
    requiresHumanReview: boolean;
  }>;

  summary: {
    sourceCoverage: string;
    usableSourceCount: number;
    includePhotoCount: number;
    reservePhotoCount: number;
    excludedPhotoCount: number;
    chapterCount: number;
    reviewRequired: boolean;
    reviewSummary: string;
  };
};

const MATERIAL_ANALYSIS_SCHEMA: Record<
  string,
  unknown
> = {
  type: "object",
  additionalProperties: false,
  properties: {
    bookDirection: {
      type: "object",
      additionalProperties: false,
      properties: {
        workingTitle: {
          type: "string",
        },
        subtitle: {
          type: "string",
        },
        centralTheme: {
          type: "string",
        },
        tone: {
          type: "string",
        },
        targetReader: {
          type: "string",
        },
        narrativePointOfView: {
          type: "string",
        },
        editorialSummary: {
          type: "string",
        },
      },
      required: [
        "workingTitle",
        "subtitle",
        "centralTheme",
        "tone",
        "targetReader",
        "narrativePointOfView",
        "editorialSummary",
      ],
    },

    chronology: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          sourceRef: {
            type: "string",
          },
          timeLabel: {
            type: "string",
          },
          sequence: {
            type: "integer",
          },
          confidence: {
            type: "number",
          },
          note: {
            type: "string",
          },
        },
        required: [
          "sourceRef",
          "timeLabel",
          "sequence",
          "confidence",
          "note",
        ],
      },
    },

    chapters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          chapterNumber: {
            type: "integer",
          },
          title: {
            type: "string",
          },
          purpose: {
            type: "string",
          },
          sourceRefs: {
            type: "array",
            items: {
              type: "string",
            },
          },
          openingDirection: {
            type: "string",
          },
          closingDirection: {
            type: "string",
          },
          missingInformation: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: [
          "chapterNumber",
          "title",
          "purpose",
          "sourceRefs",
          "openingDirection",
          "closingDirection",
          "missingInformation",
        ],
      },
    },

    photoPlan: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          sourceRef: {
            type: "string",
          },
          decision: {
            type: "string",
            enum: [
              "INCLUDE",
              "RESERVE",
              "EXCLUDE",
            ],
          },
          reason: {
            type: "string",
          },
          captionDirection: {
            type: "string",
          },
        },
        required: [
          "sourceRef",
          "decision",
          "reason",
          "captionDirection",
        ],
      },
    },

    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: {
            type: "string",
          },
          code: {
            type: "string",
          },
          severity: {
            type: "string",
            enum: [
              "INFO",
              "WARNING",
              "BLOCKER",
            ],
          },
          sourceRef: {
            type: "string",
          },
          message: {
            type: "string",
          },
          suggestedAction: {
            type: "string",
          },
          requiresHumanReview: {
            type: "boolean",
          },
        },
        required: [
          "category",
          "code",
          "severity",
          "sourceRef",
          "message",
          "suggestedAction",
          "requiresHumanReview",
        ],
      },
    },

    summary: {
      type: "object",
      additionalProperties: false,
      properties: {
        sourceCoverage: {
          type: "string",
        },
        usableSourceCount: {
          type: "integer",
        },
        includePhotoCount: {
          type: "integer",
        },
        reservePhotoCount: {
          type: "integer",
        },
        excludedPhotoCount: {
          type: "integer",
        },
        chapterCount: {
          type: "integer",
        },
        reviewRequired: {
          type: "boolean",
        },
        reviewSummary: {
          type: "string",
        },
      },
      required: [
        "sourceCoverage",
        "usableSourceCount",
        "includePhotoCount",
        "reservePhotoCount",
        "excludedPhotoCount",
        "chapterCount",
        "reviewRequired",
        "reviewSummary",
      ],
    },
  },
  required: [
    "bookDirection",
    "chronology",
    "chapters",
    "photoPlan",
    "issues",
    "summary",
  ],
};

export async function generateAIBookMaterialAnalysis(
  snapshot: AIBookSourceSnapshot,
): Promise<AIBookMaterialAnalysis> {
  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY가 설정되지 않았습니다.",
    );
  }

  const client =
    new OpenAI({
      apiKey,
    });

  const model =
    process.env.OPENAI_BOOK_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-5-mini";

  const includedItems =
    snapshot.items.slice(
      0,
      MAX_SOURCE_ITEMS,
    );

  const omittedItems =
    snapshot.items.slice(
      MAX_SOURCE_ITEMS,
    );

  const validSourceRefs =
    new Set(
      includedItems.map(
        (item) =>
          item.sourceRef,
      ),
    );

  const sourcePayload =
    includedItems.map(
      (item) => ({
        sourceRef:
          item.sourceRef,

        sourceOrder:
          item.order,

        type:
          item.type,

        title:
          limitText(
            item.title,
            MAX_TITLE_LENGTH,
          ),

        description:
          limitText(
            item.description,
            MAX_DESCRIPTION_LENGTH,
          ),

        occurredAt:
          item.occurredAt,

        hasPhoto:
          item.hasPhoto,

        hasStory:
          item.hasStory,

        hasFile:
          Boolean(
            item.fileUrl,
          ),
      }),
    );

   const revisionInstruction =
    snapshot.revisionContext
      ?.instruction
      ?.trim() || "";

  const response =
    await client.responses.create({
      model,

      max_output_tokens:
        12000,

      instructions: [
        "당신은 한국어 인생책과 가족 기록책을 편집하는 전문 출판 편집자다.",
        "AI는 책의 주인공이 아니라 사용자의 기록을 정리하는 조력자다.",

        "revisionRequest가 제공되면 이전 관리자 반려 사유와 수정 지시를 이번 목차와 사진 사용 계획에 우선 반영한다.",
        "관리자 수정 지시는 원본에 없는 사실을 새로 만드는 근거가 될 수 없다.",
        "관리자 수정 지시와 원본 자료가 충돌하거나 지시가 불명확하면 임의로 확정하지 말고 issues와 검토 항목에 기록한다.",
        "자료에 없는 사람 관계, 이름, 장소, 날짜, 사건, 대화, 감정은 절대로 창작하지 않는다.",
        "현재 사진에 보이는 장면과 사용자가 과거를 회상한 이야기를 서로 혼동하지 않는다.",
        "날짜나 사실이 불확실하면 확정적으로 쓰지 말고 검토 항목으로 분류한다.",

        "사진이나 글을 영구 삭제하라고 지시하지 않는다.",
        "EXCLUDE는 원본 삭제가 아니라 해당 책에서만 사용하지 않는다는 뜻이다.",
        "비슷한 사진은 대표 사진을 INCLUDE하고 나머지는 RESERVE로 보관하는 것을 우선한다.",

        "목차는 등록된 자료의 양과 흐름에 맞게 구성한다.",
        "자료가 충분하면 6개에서 12개의 장으로 구성한다.",
        "자료가 부족하면 장 수를 억지로 늘리지 않는다.",
        "각 장의 sourceRefs에는 제공된 실제 sourceRef만 사용한다.",

        "사람의 확인이 없어도 안전하게 처리 가능한 맞춤법, 반복 표현, 순서 정리는 자동 처리 대상으로 본다.",
        "사람 이름, 가족관계, 정확한 날짜, 민감한 사실처럼 AI가 확정할 수 없는 내용만 사람의 확인 대상으로 표시한다.",

        "모든 결과는 한국어로 작성한다.",
        "반드시 지정된 JSON 구조만 반환한다.",
      ].join("\n"),

      input: JSON.stringify(
        {
                    task:
            revisionInstruction
              ? "이전 관리자 반려 지시를 우선 반영하여 책 제작 자료를 다시 분석하고 연대기, 목차, 초기 사진 사용 계획, 검토 항목을 작성하세요."
              : "책 제작 자료를 분석하고 연대기, 목차, 초기 사진 사용 계획, 검토 항목을 작성하세요.",

          revisionRequest:
            revisionInstruction &&
            snapshot.revisionContext
              ? {
                  previousRunId:
                    snapshot.revisionContext
                      .previousRunId,

                  previousAttempt:
                    snapshot.revisionContext
                      .previousAttempt,

                  rejectedAt:
                    snapshot.revisionContext
                      .rejectedAt,

                  instruction:
                    revisionInstruction,
                }
              : null,

          book: {
            title:
              snapshot.book.title,

            subtitle:
              snapshot.book.subtitle,

            summary:
              snapshot.book.summary,

            type:
              snapshot.book.type,

            requestedPageCount:
              snapshot.book.pageCount,
          },

          sourceCounts:
            snapshot.counts,

          sourceAlerts:
            snapshot.sourceAlerts,

          inputLimit: {
            totalSourceCount:
              snapshot.items.length,

            analyzedSourceCount:
              includedItems.length,

            omittedSourceCount:
              omittedItems.length,
          },

          sources:
            sourcePayload,
        },
        null,
        2,
      ),

      text: {
        format: {
          type:
            "json_schema",

          name:
            "ai_book_material_analysis",

          description:
            "인생책 제작을 위한 자료 분석, 목차, 사진 계획, 검토 항목",

          strict:
            true,

          schema:
            MATERIAL_ANALYSIS_SCHEMA,
        },
      },
    });

  const outputText =
    response.output_text?.trim();

  if (!outputText) {
    throw new Error(
      "AI 자료 분석 결과가 비어 있습니다.",
    );
  }

  const result =
    parseMaterialAnalysis(
      outputText,
    );

  sanitizeSourceReferences(
    result,
    validSourceRefs,
  );

  normalizeChapterNumbers(
    result,
  );

  recalculateSummary(
    result,
    includedItems.length,
    snapshot.items.length,
  );

  if (
    omittedItems.length >
    0
  ) {
    result.issues.push({
      category:
        "SOURCE_MATERIAL",

      code:
        "SOURCE_ANALYSIS_LIMIT_APPLIED",

      severity:
        "WARNING",

      sourceRef:
        "",

      message:
        `전체 ${snapshot.items.length}개 자료 중 ${includedItems.length}개만 이번 분석에 포함됐습니다.`,

      suggestedAction:
        "누락된 자료를 별도 묶음으로 추가 분석한 뒤 최종 목차에 병합해야 합니다.",

      requiresHumanReview:
        true,
    });

    result.summary.reviewRequired =
      true;

    result.summary.reviewSummary =
      appendText(
        result.summary.reviewSummary,
        "일부 자료가 분석 수량 제한으로 제외되어 추가 분석이 필요합니다.",
      );
  }

  return result;
}

function parseMaterialAnalysis(
  text: string,
): AIBookMaterialAnalysis {
  let value: unknown;

  try {
    value =
      JSON.parse(text);
  } catch {
    throw new Error(
      "AI 자료 분석 결과를 JSON으로 해석하지 못했습니다.",
    );
  }

  if (!isRecord(value)) {
    throw new Error(
      "AI 자료 분석 결과의 형식이 올바르지 않습니다.",
    );
  }

  if (
    !isRecord(
      value.bookDirection,
    ) ||
    !Array.isArray(
      value.chronology,
    ) ||
    !Array.isArray(
      value.chapters,
    ) ||
    !Array.isArray(
      value.photoPlan,
    ) ||
    !Array.isArray(
      value.issues,
    ) ||
    !isRecord(
      value.summary,
    )
  ) {
    throw new Error(
      "AI 자료 분석 결과에 필요한 항목이 없습니다.",
    );
  }

  return value as
    AIBookMaterialAnalysis;
}

function sanitizeSourceReferences(
  result:
    AIBookMaterialAnalysis,
  validSourceRefs:
    Set<string>,
) {
  result.chronology =
    result.chronology.filter(
      (item) =>
        validSourceRefs.has(
          item.sourceRef,
        ),
    );

  result.photoPlan =
    result.photoPlan.filter(
      (item) =>
        validSourceRefs.has(
          item.sourceRef,
        ),
    );

  result.chapters =
    result.chapters.map(
      (chapter) => ({
        ...chapter,

        sourceRefs:
          Array.from(
            new Set(
              chapter.sourceRefs.filter(
                (sourceRef) =>
                  validSourceRefs.has(
                    sourceRef,
                  ),
              ),
            ),
          ),
      }),
    );

  result.issues =
    result.issues.filter(
      (issue) =>
        !issue.sourceRef ||
        validSourceRefs.has(
          issue.sourceRef,
        ),
    );
}

function normalizeChapterNumbers(
  result:
    AIBookMaterialAnalysis,
) {
  result.chapters =
    result.chapters.map(
      (
        chapter,
        index,
      ) => ({
        ...chapter,
        chapterNumber:
          index + 1,
      }),
    );

  result.chronology.sort(
    (first, second) =>
      first.sequence -
      second.sequence,
  );
}

function recalculateSummary(
  result:
    AIBookMaterialAnalysis,
  analyzedSourceCount:
    number,
  totalSourceCount:
    number,
) {
  result.summary.sourceCoverage =
    `${analyzedSourceCount}/${totalSourceCount}`;

  result.summary.usableSourceCount =
    new Set(
      result.chapters.flatMap(
        (chapter) =>
          chapter.sourceRefs,
      ),
    ).size;

  result.summary.includePhotoCount =
    result.photoPlan.filter(
      (item) =>
        item.decision ===
        "INCLUDE",
    ).length;

  result.summary.reservePhotoCount =
    result.photoPlan.filter(
      (item) =>
        item.decision ===
        "RESERVE",
    ).length;

  result.summary.excludedPhotoCount =
    result.photoPlan.filter(
      (item) =>
        item.decision ===
        "EXCLUDE",
    ).length;

  result.summary.chapterCount =
    result.chapters.length;

  if (
    result.issues.some(
      (issue) =>
        issue.requiresHumanReview ||
        issue.severity ===
          "BLOCKER",
    )
  ) {
    result.summary.reviewRequired =
      true;
  }
}

function limitText(
  value: string | null,
  maxLength: number,
) {
  if (!value) {
    return "";
  }

  const normalized =
    value.trim();

  if (
    normalized.length <=
    maxLength
  ) {
    return normalized;
  }

  return `${normalized.slice(
    0,
    maxLength,
  )}…`;
}

function appendText(
  current: string,
  next: string,
) {
  const normalizedCurrent =
    current.trim();

  return normalizedCurrent
    ? `${normalizedCurrent} ${next}`
    : next;
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