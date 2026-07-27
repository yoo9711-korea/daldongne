import type {
  AIBookManuscriptResult,
  AIBookPhotoSelectionData,
} from "@/lib/ai-book-production-manuscript";
import type { AIBookSourceSnapshot } from "@/lib/ai-book-production-source";

type PhotoDecision =
  | "INCLUDE"
  | "RESERVE"
  | "EXCLUDE";

export type AIBookFinalPhotoSelection = {
  version: 2;
  finalizedAt: string;

  photoPlan: Array<{
    sourceRef: string;
    sourceOrder: number;
    decision: PhotoDecision;
    reason: string;
    caption: string;
    placement: string;
    chapterNumbers: number[];
  }>;

  summary: {
    totalPhotoCount: number;
    includePhotoCount: number;
    reservePhotoCount: number;
    excludedPhotoCount: number;
    captionedPhotoCount: number;
    conflictCount: number;
  };

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
};

export function finalizeAIBookPhotoSelection({
  snapshot,
  initialSelection,
  manuscript,
}: {
  snapshot: AIBookSourceSnapshot;
  initialSelection: AIBookPhotoSelectionData;
  manuscript: AIBookManuscriptResult;
}): AIBookFinalPhotoSelection {
  const finalizedAt =
    new Date().toISOString();

  const photoSources =
    snapshot.items.filter(
      (item) =>
        item.hasPhoto &&
        Boolean(item.fileUrl),
    );

  const initialPlanMap =
    new Map(
      initialSelection.photoPlan.map(
        (item) => [
          item.sourceRef,
          item,
        ],
      ),
    );

  const captionMap =
    new Map(
      manuscript.photoCaptions.map(
        (item) => [
          item.sourceRef,
          item,
        ],
      ),
    );

  const chapterMap =
    new Map<
      string,
      number[]
    >();

  const usedPhotoRefs =
    new Set<string>();

  for (
    const chapter of
    manuscript.chapters
  ) {
    for (
      const photoRef of
      chapter.photoRefs
    ) {
      usedPhotoRefs.add(
        photoRef,
      );

      const current =
        chapterMap.get(
          photoRef,
        ) || [];

      if (
        !current.includes(
          chapter.chapterNumber,
        )
      ) {
        current.push(
          chapter.chapterNumber,
        );
      }

      chapterMap.set(
        photoRef,
        current,
      );
    }
  }

  const issues:
    AIBookFinalPhotoSelection["issues"] =
      [];

  let conflictCount = 0;

  const photoPlan =
    photoSources.map(
      (photo) => {
        const initial =
          initialPlanMap.get(
            photo.sourceRef,
          );

        const caption =
          captionMap.get(
            photo.sourceRef,
          );

        const chapterNumbers =
          chapterMap.get(
            photo.sourceRef,
          ) || [];

        const isUsedInManuscript =
          usedPhotoRefs.has(
            photo.sourceRef,
          );

        const initialDecision =
          normalizeDecision(
            initial?.decision,
          );

        let decision:
          PhotoDecision =
            initialDecision;

        let reason =
          initial?.reason.trim() ||
          "";

        if (
          isUsedInManuscript
        ) {
          decision =
            "INCLUDE";

          reason =
            "AI 원고의 장 구성에서 사용된 사진입니다.";

          if (
            initialDecision ===
            "EXCLUDE"
          ) {
            conflictCount += 1;

            issues.push({
              category:
                "PHOTO_SELECTION",

              code:
                "PHOTO_DECISION_CONFLICT",

              severity:
                "WARNING",

              sourceRef:
                photo.sourceRef,

              message:
                "초기 분석에서는 제외된 사진이 원고 작성 과정에서 사용 사진으로 선택됐습니다.",

              suggestedAction:
                "원고 사용 결과를 우선 적용했으며 최종 승인 화면에서 사진 배치를 확인합니다.",

              requiresHumanReview:
                false,
            });
          }
        } else if (
          !initial
        ) {
          decision =
            "RESERVE";

          reason =
            "초기 사진 분석에 포함되지 않아 예비 사진으로 보관합니다.";
        }

        const finalCaption =
          normalizeText(
            caption?.caption,
          ) ||
          normalizeText(
            initial?.captionDirection,
          ) ||
          normalizeText(
            photo.description,
          ) ||
          normalizeText(
            photo.title,
          );

        const placement =
          normalizeText(
            caption?.placement,
          ) ||
          createPlacement(
            chapterNumbers,
            decision,
          );

        if (
          decision ===
            "INCLUDE" &&
          !finalCaption
        ) {
          issues.push({
            category:
              "PHOTO_CAPTION",

            code:
              "PHOTO_CAPTION_MISSING",

            severity:
              "WARNING",

            sourceRef:
              photo.sourceRef,

            message:
              "책에 사용할 사진의 설명 문구가 비어 있습니다.",

            suggestedAction:
              "페이지 구성 단계에서 사진 주변 원고를 이용해 기본 설명을 생성합니다.",

            requiresHumanReview:
              false,
          });
        }

        return {
          sourceRef:
            photo.sourceRef,

          sourceOrder:
            photo.order,

          decision,

          reason:
            reason ||
            getDefaultReason(
              decision,
            ),

          caption:
            finalCaption,

          placement,

          chapterNumbers:
            [...chapterNumbers].sort(
              (
                first,
                second,
              ) =>
                first -
                second,
            ),
        };
      },
    );

  const includePhotoCount =
    photoPlan.filter(
      (item) =>
        item.decision ===
        "INCLUDE",
    ).length;

  const reservePhotoCount =
    photoPlan.filter(
      (item) =>
        item.decision ===
        "RESERVE",
    ).length;

  const excludedPhotoCount =
    photoPlan.filter(
      (item) =>
        item.decision ===
        "EXCLUDE",
    ).length;

  const captionedPhotoCount =
    photoPlan.filter(
      (item) =>
        Boolean(
          item.caption,
        ),
    ).length;

  if (
    photoSources.length ===
    0
  ) {
    issues.push({
      category:
        "PHOTO_SELECTION",

      code:
        "NO_USABLE_PHOTO",

      severity:
        "BLOCKER",

      sourceRef:
        "",

      message:
        "책 제작에 사용할 수 있는 사진 파일이 없습니다.",

      suggestedAction:
        "사진이 없는 글 중심 책으로 제작할지 최종 승인 단계에서 결정해야 합니다.",

      requiresHumanReview:
        true,
    });
  } else if (
    includePhotoCount ===
    0
  ) {
    issues.push({
      category:
        "PHOTO_SELECTION",

      code:
        "NO_INCLUDED_PHOTO",

      severity:
        "WARNING",

      sourceRef:
        "",

      message:
        "등록된 사진은 있지만 현재 원고에 사용할 사진이 선택되지 않았습니다.",

      suggestedAction:
        "페이지 구성 단계에서 원고와 연결 가능한 대표 사진을 자동으로 다시 배치합니다.",

      requiresHumanReview:
        false,
    });
  }

  return {
    version: 2,
    finalizedAt,

    photoPlan,

    summary: {
      totalPhotoCount:
        photoSources.length,

      includePhotoCount,

      reservePhotoCount,

      excludedPhotoCount,

      captionedPhotoCount,

      conflictCount,
    },

    issues,
  };
}

function normalizeDecision(
  value:
    | string
    | undefined,
): PhotoDecision {
  if (
    value ===
      "INCLUDE" ||
    value ===
      "RESERVE" ||
    value ===
      "EXCLUDE"
  ) {
    return value;
  }

  return "RESERVE";
}

function createPlacement(
  chapterNumbers: number[],
  decision: PhotoDecision,
) {
  if (
    chapterNumbers.length >
    0
  ) {
    return chapterNumbers
      .map(
        (chapterNumber) =>
          `${chapterNumber}장`,
      )
      .join(", ");
  }

  if (
    decision ===
    "INCLUDE"
  ) {
    return "본문 사진 영역";
  }

  if (
    decision ===
    "EXCLUDE"
  ) {
    return "이번 책에서 사용하지 않음";
  }

  return "예비 사진";
}

function getDefaultReason(
  decision: PhotoDecision,
) {
  if (
    decision ===
    "INCLUDE"
  ) {
    return "책의 이야기 흐름과 연결되는 사진입니다.";
  }

  if (
    decision ===
    "EXCLUDE"
  ) {
    return "이번 책의 이야기 흐름과 직접 연결되지 않아 사용하지 않습니다.";
  }

  return "필요할 때 사용할 수 있도록 예비 사진으로 보관합니다.";
}

function normalizeText(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "";
  }

  return value
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}