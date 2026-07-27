import type { AIBookSourceSnapshot } from "@/lib/ai-book-production-source";
import OpenAI from "openai";

const MAX_SOURCE_ITEMS = 140;
const MAX_SOURCE_TEXT_LENGTH = 2200;
const MAX_TOTAL_SOURCE_CHARACTERS = 120000;

export type AIBookOutlineData = {
  version?: number;
  generatedAt?: string;

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

  summary?: {
    sourceCoverage?: string;
    usableSourceCount?: number;
    chapterCount?: number;
    reviewRequired?: boolean;
    reviewSummary?: string;
  };
};

export type AIBookPhotoSelectionData = {
  version?: number;
  generatedAt?: string;

  photoPlan: Array<{
    sourceRef: string;
    decision:
      | "INCLUDE"
      | "RESERVE"
      | "EXCLUDE";
    reason: string;
    captionDirection: string;
  }>;

  summary?: {
    includePhotoCount?: number;
    reservePhotoCount?: number;
    excludedPhotoCount?: number;
  };
};

export type AIBookManuscriptResult = {
  book: {
    title: string;
    subtitle: string;
    coverText: string;
    introductionTitle: string;
    introduction: string;
    epilogueTitle: string;
    epilogue: string;
    editorialTone: string;
    narrativePointOfView: string;
  };

  tableOfContents: Array<{
    chapterNumber: number;
    title: string;
  }>;

  chapters: Array<{
    chapterNumber: number;
    title: string;
    lead: string;

    sections: Array<{
      heading: string;
      body: string;
      sourceRefs: string[];
    }>;

    closing: string;
    sourceRefs: string[];
    photoRefs: string[];

    editorialNotes: string[];
    uncertainStatements: string[];
  }>;

  photoCaptions: Array<{
    sourceRef: string;
    caption: string;
    placement: string;
  }>;

  excludedSourceRefs: Array<{
    sourceRef: string;
    reason: string;
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
    chapterCount: number;
    sectionCount: number;
    usedSourceCount: number;
    usedPhotoCount: number;
    excludedSourceCount: number;
    estimatedKoreanCharacterCount: number;
    reviewRequired: boolean;
    reviewSummary: string;
  };
};

const MANUSCRIPT_SCHEMA: Record<
  string,
  unknown
> = {
  type: "object",
  additionalProperties: false,

  properties: {
    book: {
      type: "object",
      additionalProperties: false,

      properties: {
        title: {
          type: "string",
        },

        subtitle: {
          type: "string",
        },

        coverText: {
          type: "string",
        },

        introductionTitle: {
          type: "string",
        },

        introduction: {
          type: "string",
        },

        epilogueTitle: {
          type: "string",
        },

        epilogue: {
          type: "string",
        },

        editorialTone: {
          type: "string",
        },

        narrativePointOfView: {
          type: "string",
        },
      },

      required: [
        "title",
        "subtitle",
        "coverText",
        "introductionTitle",
        "introduction",
        "epilogueTitle",
        "epilogue",
        "editorialTone",
        "narrativePointOfView",
      ],
    },

    tableOfContents: {
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
        },

        required: [
          "chapterNumber",
          "title",
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

          lead: {
            type: "string",
          },

          sections: {
            type: "array",

            items: {
              type: "object",
              additionalProperties: false,

              properties: {
                heading: {
                  type: "string",
                },

                body: {
                  type: "string",
                },

                sourceRefs: {
                  type: "array",

                  items: {
                    type: "string",
                  },
                },
              },

              required: [
                "heading",
                "body",
                "sourceRefs",
              ],
            },
          },

          closing: {
            type: "string",
          },

          sourceRefs: {
            type: "array",

            items: {
              type: "string",
            },
          },

          photoRefs: {
            type: "array",

            items: {
              type: "string",
            },
          },

          editorialNotes: {
            type: "array",

            items: {
              type: "string",
            },
          },

          uncertainStatements: {
            type: "array",

            items: {
              type: "string",
            },
          },
        },

        required: [
          "chapterNumber",
          "title",
          "lead",
          "sections",
          "closing",
          "sourceRefs",
          "photoRefs",
          "editorialNotes",
          "uncertainStatements",
        ],
      },
    },

    photoCaptions: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          sourceRef: {
            type: "string",
          },

          caption: {
            type: "string",
          },

          placement: {
            type: "string",
          },
        },

        required: [
          "sourceRef",
          "caption",
          "placement",
        ],
      },
    },

    excludedSourceRefs: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          sourceRef: {
            type: "string",
          },

          reason: {
            type: "string",
          },
        },

        required: [
          "sourceRef",
          "reason",
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
        chapterCount: {
          type: "integer",
        },

        sectionCount: {
          type: "integer",
        },

        usedSourceCount: {
          type: "integer",
        },

        usedPhotoCount: {
          type: "integer",
        },

        excludedSourceCount: {
          type: "integer",
        },

        estimatedKoreanCharacterCount: {
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
        "chapterCount",
        "sectionCount",
        "usedSourceCount",
        "usedPhotoCount",
        "excludedSourceCount",
        "estimatedKoreanCharacterCount",
        "reviewRequired",
        "reviewSummary",
      ],
    },
  },

  required: [
    "book",
    "tableOfContents",
    "chapters",
    "photoCaptions",
    "excludedSourceRefs",
    "issues",
    "summary",
  ],
};

export async function generateAIBookManuscript({
  snapshot,
  outline,
  photoSelection,
}: {
  snapshot: AIBookSourceSnapshot;
  outline: AIBookOutlineData;
  photoSelection: AIBookPhotoSelectionData;
}): Promise<AIBookManuscriptResult> {
  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY가 설정되지 않았습니다.",
    );
  }

  if (
    !Array.isArray(
      outline.chapters,
    ) ||
    outline.chapters.length === 0
  ) {
    throw new Error(
      "AI 원고를 작성할 목차 정보가 없습니다.",
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

  const validSourceRefs =
    new Set(
      snapshot.items.map(
        (item) =>
          item.sourceRef,
      ),
    );

  const validPhotoRefs =
    new Set(
      snapshot.items
        .filter(
          (item) =>
            item.hasPhoto,
        )
        .map(
          (item) =>
            item.sourceRef,
        ),
    );

  const requestedSourceRefs =
    new Set(
      outline.chapters.flatMap(
        (chapter) =>
          chapter.sourceRefs,
      ),
    );

  for (
    const photo of
    photoSelection.photoPlan
  ) {
    if (
      photo.decision ===
      "INCLUDE"
    ) {
      requestedSourceRefs.add(
        photo.sourceRef,
      );
    }
  }

  const sourcePayload =
    buildSourcePayload({
      snapshot,
      requestedSourceRefs,
    });

  const response =
    await client.responses.create({
      model,

      max_output_tokens:
        24000,

      instructions: [
        "당신은 한국어 인생책, 가족 기록책, 추억책을 편집하는 전문 출판 편집자다.",

        "AI는 주인공이 아니라 사용자의 기억을 읽기 좋은 책으로 정리하는 조력자다.",

        "원본 자료에 없는 이름, 가족관계, 날짜, 장소, 사건, 대화, 직업, 감정, 행동은 절대로 창작하지 않는다.",

        "자료에 명확하게 적히지 않은 사실은 확정적인 문장으로 쓰지 않는다.",

        "불확실한 사실은 원고에서 자연스럽게 생략하거나 uncertainStatements와 issues에 기록한다.",

        "사용자가 직접 쓴 표현과 말투, 감정의 방향을 최대한 보존한다.",

        "맞춤법, 띄어쓰기, 어색한 문장, 불필요한 반복은 자연스럽게 편집한다.",

        "서로 다른 원본 자료를 합칠 때 사실관계가 뒤섞이지 않도록 각 sourceRef의 내용을 구분한다.",

        "현재 사진에 보이는 장면과 과거를 회상한 글을 같은 시점의 사건으로 단정하지 않는다.",

        "사용자가 작성하지 않은 직접 인용문이나 대화를 새로 만들지 않는다.",

        "각 장은 도입, 본문 구간, 마무리가 자연스럽게 이어지도록 작성한다.",

        "각 본문 구간의 sourceRefs에는 실제로 해당 문장을 작성할 때 사용한 원본 자료 ID만 기록한다.",

        "사진 설명은 원본 글에 근거해 작성하며, 사진에 보이지 않거나 자료에 없는 내용을 단정하지 않는다.",

        "EXCLUDE는 원본 삭제가 아니다. 이번 책 원고에서 사용하지 않는 자료라는 뜻이다.",

        "초기 목차의 장 수와 흐름을 유지하되, 빈 장을 만들기 위해 내용을 창작하지 않는다.",

        "자료가 부족한 장은 분량을 억지로 늘리지 말고 editorialNotes 또는 issues에 기록한다.",

        "책 전체의 문체는 따뜻하고 담백하며 과도하게 시적이거나 과장되지 않도록 한다.",

        "결과는 모두 한국어로 작성한다.",

        "반드시 지정된 JSON 구조만 반환한다.",
      ].join("\n"),

      input: JSON.stringify(
        {
          task:
            "원본 사진과 글, AI 자료 분석 목차를 바탕으로 책의 전체 원고 초안을 작성하세요.",

          bookRequest: {
            originalTitle:
              snapshot.book.title,

            originalSubtitle:
              snapshot.book.subtitle,

            originalSummary:
              snapshot.book.summary,

            bookType:
              snapshot.book.type,

            requestedPageCount:
              snapshot.book.pageCount,
          },

          editorialDirection:
            outline.bookDirection,

          chronology:
            outline.chronology,

          chapterPlan:
            outline.chapters,

          photoPlan:
            photoSelection.photoPlan,

          sourceCounts:
            snapshot.counts,

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
            "ai_book_manuscript",

          description:
            "달동네 스토리 책 제작을 위한 전체 원고 초안과 사진 배치 정보",

          strict:
            true,

          schema:
            MANUSCRIPT_SCHEMA,
        },
      },
    });

  const outputText =
    response.output_text?.trim();

  if (!outputText) {
    throw new Error(
      "AI 원고 편집 결과가 비어 있습니다.",
    );
  }

  const result =
    parseManuscriptResult(
      outputText,
    );

  sanitizeSourceReferences({
    result,
    validSourceRefs,
    validPhotoRefs,
  });

  normalizeManuscript(
    result,
  );

  recalculateSummary(
    result,
  );

  appendAutomaticIssues({
    result,
    outline,
  });

  return result;
}

function buildSourcePayload({
  snapshot,
  requestedSourceRefs,
}: {
  snapshot: AIBookSourceSnapshot;
  requestedSourceRefs: Set<string>;
}) {
  const prioritizedItems =
    snapshot.items
      .filter(
        (item) =>
          requestedSourceRefs.has(
            item.sourceRef,
          ),
      )
      .concat(
        snapshot.items.filter(
          (item) =>
            !requestedSourceRefs.has(
              item.sourceRef,
            ),
        ),
      );

  const payload: Array<{
    sourceRef: string;
    order: number;
    type: string;
    title: string;
    description: string;
    occurredAt: string | null;
    hasPhoto: boolean;
    hasStory: boolean;
  }> = [];

  let totalCharacters = 0;

  for (
    const item of
    prioritizedItems
  ) {
    if (
      payload.length >=
      MAX_SOURCE_ITEMS
    ) {
      break;
    }

    const title =
      limitText(
        item.title,
        180,
      );

    const description =
      limitText(
        item.description,
        MAX_SOURCE_TEXT_LENGTH,
      );

    const itemCharacters =
      title.length +
      description.length;

    if (
      payload.length > 0 &&
      totalCharacters +
        itemCharacters >
        MAX_TOTAL_SOURCE_CHARACTERS
    ) {
      break;
    }

    payload.push({
      sourceRef:
        item.sourceRef,

      order:
        item.order,

      type:
        item.type,

      title,

      description,

      occurredAt:
        item.occurredAt,

      hasPhoto:
        item.hasPhoto,

      hasStory:
        item.hasStory,
    });

    totalCharacters +=
      itemCharacters;
  }

  if (
    payload.length === 0
  ) {
    throw new Error(
      "AI 원고 작성에 사용할 수 있는 원본 자료가 없습니다.",
    );
  }

  return payload;
}

function parseManuscriptResult(
  text: string,
): AIBookManuscriptResult {
  let value: unknown;

  try {
    value =
      JSON.parse(text);
  } catch {
    throw new Error(
      "AI 원고 편집 결과를 JSON으로 해석하지 못했습니다.",
    );
  }

  if (
    !isRecord(value) ||
    !isRecord(
      value.book,
    ) ||
    !Array.isArray(
      value.tableOfContents,
    ) ||
    !Array.isArray(
      value.chapters,
    ) ||
    !Array.isArray(
      value.photoCaptions,
    ) ||
    !Array.isArray(
      value.excludedSourceRefs,
    ) ||
    !Array.isArray(
      value.issues,
    ) ||
    !isRecord(
      value.summary,
    )
  ) {
    throw new Error(
      "AI 원고 편집 결과의 형식이 올바르지 않습니다.",
    );
  }

  return value as
    AIBookManuscriptResult;
}

function sanitizeSourceReferences({
  result,
  validSourceRefs,
  validPhotoRefs,
}: {
  result: AIBookManuscriptResult;
  validSourceRefs: Set<string>;
  validPhotoRefs: Set<string>;
}) {
  result.chapters =
    result.chapters.map(
      (chapter) => ({
        ...chapter,

        sourceRefs:
          uniqueValidRefs(
            chapter.sourceRefs,
            validSourceRefs,
          ),

        photoRefs:
          uniqueValidRefs(
            chapter.photoRefs,
            validPhotoRefs,
          ),

        sections:
          chapter.sections.map(
            (section) => ({
              ...section,

              sourceRefs:
                uniqueValidRefs(
                  section.sourceRefs,
                  validSourceRefs,
                ),
            }),
          ),
      }),
    );

  result.photoCaptions =
    result.photoCaptions.filter(
      (caption) =>
        validPhotoRefs.has(
          caption.sourceRef,
        ),
    );

  result.excludedSourceRefs =
    result.excludedSourceRefs.filter(
      (item) =>
        validSourceRefs.has(
          item.sourceRef,
        ),
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

function normalizeManuscript(
  result: AIBookManuscriptResult,
) {
  result.book.title =
    normalizeText(
      result.book.title,
    );

  result.book.subtitle =
    normalizeText(
      result.book.subtitle,
    );

  result.book.coverText =
    normalizeText(
      result.book.coverText,
    );

  result.book.introduction =
    normalizeParagraphs(
      result.book.introduction,
    );

  result.book.epilogue =
    normalizeParagraphs(
      result.book.epilogue,
    );

  result.chapters =
    result.chapters.map(
      (
        chapter,
        index,
      ) => ({
        ...chapter,

        chapterNumber:
          index + 1,

        title:
          normalizeText(
            chapter.title,
          ),

        lead:
          normalizeParagraphs(
            chapter.lead,
          ),

        closing:
          normalizeParagraphs(
            chapter.closing,
          ),

        editorialNotes:
          chapter.editorialNotes
            .map(
              normalizeText,
            )
            .filter(Boolean),

        uncertainStatements:
          chapter.uncertainStatements
            .map(
              normalizeText,
            )
            .filter(Boolean),

        sections:
          chapter.sections
            .map(
              (section) => ({
                ...section,

                heading:
                  normalizeText(
                    section.heading,
                  ),

                body:
                  normalizeParagraphs(
                    section.body,
                  ),
              }),
            )
            .filter(
              (section) =>
                Boolean(
                  section.body,
                ),
            ),
      }),
    );

  result.tableOfContents =
    result.chapters.map(
      (chapter) => ({
        chapterNumber:
          chapter.chapterNumber,

        title:
          chapter.title,
      }),
    );

  result.photoCaptions =
    result.photoCaptions.map(
      (item) => ({
        ...item,

        caption:
          normalizeText(
            item.caption,
          ),

        placement:
          normalizeText(
            item.placement,
          ),
      }),
    );
}

function recalculateSummary(
  result: AIBookManuscriptResult,
) {
  const usedSourceRefs =
    new Set<string>();

  const usedPhotoRefs =
    new Set<string>();

  let sectionCount = 0;

  let characterCount =
    countCharacters(
      result.book.coverText,
    ) +
    countCharacters(
      result.book.introduction,
    ) +
    countCharacters(
      result.book.epilogue,
    );

  for (
    const chapter of
    result.chapters
  ) {
    sectionCount +=
      chapter.sections.length;

    characterCount +=
      countCharacters(
        chapter.title,
      ) +
      countCharacters(
        chapter.lead,
      ) +
      countCharacters(
        chapter.closing,
      );

    for (
      const sourceRef of
      chapter.sourceRefs
    ) {
      usedSourceRefs.add(
        sourceRef,
      );
    }

    for (
      const photoRef of
      chapter.photoRefs
    ) {
      usedPhotoRefs.add(
        photoRef,
      );
    }

    for (
      const section of
      chapter.sections
    ) {
      characterCount +=
        countCharacters(
          section.heading,
        ) +
        countCharacters(
          section.body,
        );

      for (
        const sourceRef of
        section.sourceRefs
      ) {
        usedSourceRefs.add(
          sourceRef,
        );
      }
    }
  }

  result.summary.chapterCount =
    result.chapters.length;

  result.summary.sectionCount =
    sectionCount;

  result.summary.usedSourceCount =
    usedSourceRefs.size;

  result.summary.usedPhotoCount =
    usedPhotoRefs.size;

  result.summary.excludedSourceCount =
    new Set(
      result.excludedSourceRefs.map(
        (item) =>
          item.sourceRef,
      ),
    ).size;

  result.summary.estimatedKoreanCharacterCount =
    characterCount;

  if (
    result.issues.some(
      (issue) =>
        issue.requiresHumanReview ||
        issue.severity ===
          "BLOCKER",
    ) ||
    result.chapters.some(
      (chapter) =>
        chapter.uncertainStatements
          .length > 0,
    )
  ) {
    result.summary.reviewRequired =
      true;
  }
}

function appendAutomaticIssues({
  result,
  outline,
}: {
  result: AIBookManuscriptResult;
  outline: AIBookOutlineData;
}) {
  for (
    const chapter of
    result.chapters
  ) {
    if (
      chapter.sections.length === 0
    ) {
      result.issues.push({
        category:
          "MANUSCRIPT",

        code:
          "EMPTY_CHAPTER",

        severity:
          "BLOCKER",

        sourceRef:
          "",

        message:
          `${chapter.chapterNumber}장의 본문이 비어 있습니다.`,

        suggestedAction:
          "해당 장의 원본 자료를 다시 확인하고 원고를 재생성해야 합니다.",

        requiresHumanReview:
          true,
      });
    }

    if (
      chapter.sourceRefs.length ===
      0
    ) {
      result.issues.push({
        category:
          "SOURCE_TRACEABILITY",

        code:
          "CHAPTER_SOURCE_MISSING",

        severity:
          "WARNING",

        sourceRef:
          "",

        message:
          `${chapter.chapterNumber}장에 연결된 원본 자료가 없습니다.`,

        suggestedAction:
          "원고 내용이 어떤 원본 자료에서 작성됐는지 다시 확인해야 합니다.",

        requiresHumanReview:
          true,
      });
    }

    if (
      chapter.uncertainStatements
        .length > 0
    ) {
      result.issues.push({
        category:
          "FACT_CHECK",

        code:
          "UNCERTAIN_STATEMENT",

        severity:
          "WARNING",

        sourceRef:
          chapter.sourceRefs[0] ||
          "",

        message:
          `${chapter.chapterNumber}장에 사실 확인이 필요한 표현이 있습니다.`,

        suggestedAction:
          "최종 승인 전에 불확실한 표현을 원본 자료와 비교해 주세요.",

        requiresHumanReview:
          true,
      });
    }
  }

  const plannedChapterCount =
    outline.chapters.length;

  if (
    result.chapters.length !==
    plannedChapterCount
  ) {
    result.issues.push({
      category:
        "MANUSCRIPT_STRUCTURE",

      code:
        "CHAPTER_COUNT_CHANGED",

      severity:
        "WARNING",

      sourceRef:
        "",

      message:
        `계획된 목차는 ${plannedChapterCount}장이지만 작성된 원고는 ${result.chapters.length}장입니다.`,

      suggestedAction:
        "누락되거나 합쳐진 장이 있는지 확인해 주세요.",

      requiresHumanReview:
        true,
    });
  }

  if (
    result.summary
      .estimatedKoreanCharacterCount <
    3000
  ) {
    result.issues.push({
      category:
        "MANUSCRIPT_LENGTH",

      code:
        "MANUSCRIPT_TOO_SHORT",

      severity:
        "WARNING",

      sourceRef:
        "",

      message:
        "작성된 전체 원고 분량이 책 제작 기준보다 짧을 수 있습니다.",

      suggestedAction:
        "사용 가능한 원본 이야기가 더 있는지 확인하거나 부족한 장을 보강해야 합니다.",

      requiresHumanReview:
        true,
    });
  }

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

    if (
      !result.summary.reviewSummary.trim()
    ) {
      result.summary.reviewSummary =
        "사실관계, 원본 연결 또는 원고 분량과 관련된 검토 항목이 있습니다.";
    }
  }
}

function uniqueValidRefs(
  values: string[],
  validRefs: Set<string>,
) {
  return Array.from(
    new Set(
      values.filter(
        (value) =>
          validRefs.has(
            value,
          ),
      ),
    ),
  );
}

function normalizeText(
  value: string,
) {
  return value
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function normalizeParagraphs(
  value: string,
) {
  return value
    .replace(
      /\r\n/g,
      "\n",
    )
    .replace(
      /\r/g,
      "\n",
    )
    .split(
      /\n{2,}/,
    )
    .map(
      (paragraph) =>
        paragraph
          .replace(
            /[ \t]+/g,
            " ",
          )
          .trim(),
    )
    .filter(Boolean)
    .join("\n\n");
}

function countCharacters(
  value: string,
) {
  return value
    .replace(
      /\s/g,
      "",
    )
    .length;
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