import type {
  AIBookLayoutPlan,
} from "@/lib/ai-book-production-layout";
import type {
  AIBookManuscriptResult,
} from "@/lib/ai-book-production-manuscript";
import type {
  AIBookFinalPhotoSelection,
} from "@/lib/ai-book-production-photo-selection";
import type {
  AIBookSourceSnapshot,
} from "@/lib/ai-book-production-source";

export type AIBookQualityStatus =
  | "PASSED"
  | "PASSED_WITH_WARNINGS"
  | "BLOCKED";

export type AIBookQualityCheckStatus =
  | "PASS"
  | "WARNING"
  | "BLOCKER";

type QualityIssueSeverity =
  | "INFO"
  | "WARNING"
  | "BLOCKER";

type QualityIssueInput = {
  category: string;
  code: string;
  severity: QualityIssueSeverity;
  sourceRef: string;
  message: string;
  suggestedAction: string;
  requiresHumanReview: boolean;
};

export type AIBookQualityReport = {
  version: 1;
  generatedAt: string;
  status: AIBookQualityStatus;

  checks: Array<{
    code: string;
    label: string;
    status: AIBookQualityCheckStatus;
    message: string;
    metrics: Record<
      string,
      | string
      | number
      | boolean
      | null
    >;
  }>;

  issues: Array<{
    origin:
      | "MANUSCRIPT"
      | "PHOTO_SELECTION"
      | "LAYOUT"
      | "QUALITY_CHECK";
    category: string;
    code: string;
    severity: QualityIssueSeverity;
    sourceRef: string;
    message: string;
    suggestedAction: string;
    requiresHumanReview: boolean;
  }>;

  summary: {
    totalCheckCount: number;
    passCount: number;
    warningCount: number;
    blockerCount: number;
    openIssueCount: number;
    informationIssueCount: number;
    warningIssueCount: number;
    blockerIssueCount: number;
    sourceCoveragePercent: number;
    photoUsagePercent: number;
    layoutPageCount: number;
    reviewRequired: boolean;
    reviewSummary: string;
  };
};

export function generateAIBookQualityReport({
  snapshot,
  manuscript,
  photoSelection,
  layout,
}: {
  snapshot: AIBookSourceSnapshot;
  manuscript: AIBookManuscriptResult;
  photoSelection: AIBookFinalPhotoSelection;
  layout: AIBookLayoutPlan;
}): AIBookQualityReport {
  const generatedAt =
    new Date().toISOString();

  const checks:
    AIBookQualityReport["checks"] =
      [];

  const issues:
    AIBookQualityReport["issues"] =
      [];

  const issueKeys =
    new Set<string>();

  const addIssue = ({
    origin,
    issue,
  }: {
    origin:
      AIBookQualityReport["issues"][number]["origin"];
    issue: QualityIssueInput;
  }) => {
    const normalizedIssue = {
      origin,
      category:
        normalizeRequiredText(
          issue.category,
          "QUALITY_CHECK",
        ),
      code:
        normalizeRequiredText(
          issue.code,
          "QUALITY_REVIEW",
        ),
      severity:
        normalizeSeverity(
          issue.severity,
        ),
      sourceRef:
        normalizeText(
          issue.sourceRef,
        ),
      message:
        normalizeRequiredText(
          issue.message,
          "제작 결과를 확인해야 합니다.",
        ),
      suggestedAction:
        normalizeRequiredText(
          issue.suggestedAction,
          "최종 승인 전에 해당 내용을 확인합니다.",
        ),
      requiresHumanReview:
        Boolean(
          issue.requiresHumanReview,
        ),
    };

    const key = [
      normalizedIssue.origin,
      normalizedIssue.code,
      normalizedIssue.sourceRef,
      normalizedIssue.message,
    ].join("|");

    if (
      issueKeys.has(
        key,
      )
    ) {
      return;
    }

    issueKeys.add(
      key,
    );

    issues.push(
      normalizedIssue,
    );
  };

  for (
    const issue of
    manuscript.issues
  ) {
    addIssue({
      origin:
        "MANUSCRIPT",
      issue,
    });
  }

  for (
    const issue of
    photoSelection.issues
  ) {
    addIssue({
      origin:
        "PHOTO_SELECTION",
      issue,
    });
  }

  for (
    const issue of
    layout.issues
  ) {
    addIssue({
      origin:
        "LAYOUT",
      issue,
    });
  }

  const validSourceRefs =
    new Set(
      snapshot.items.map(
        (item) =>
          item.sourceRef,
      ),
    );

  const usableSourceRefs =
    new Set(
      snapshot.items
        .filter(
          (item) =>
            item.hasStory ||
            item.hasPhoto,
        )
        .map(
          (item) =>
            item.sourceRef,
        ),
    );

  const manuscriptSourceRefs =
    collectManuscriptSourceRefs(
      manuscript,
    );

  const layoutSourceRefs =
    collectLayoutSourceRefs(
      layout,
    );

  const usedSourceRefs =
    new Set([
      ...manuscriptSourceRefs,
      ...layoutSourceRefs,
    ]);

  const invalidSourceRefs =
    [...usedSourceRefs].filter(
      (sourceRef) =>
        !validSourceRefs.has(
          sourceRef,
        ),
    );

  if (
    invalidSourceRefs.length >
    0
  ) {
    checks.push({
      code:
        "SOURCE_REFERENCE_VALIDITY",
      label:
        "원본 자료 연결 검사",
      status:
        "BLOCKER",
      message:
        `존재하지 않는 원본 자료 ID가 ${invalidSourceRefs.length}개 사용됐습니다.`,
      metrics: {
        invalidSourceCount:
          invalidSourceRefs.length,
      },
    });

    for (
      const sourceRef of
      invalidSourceRefs
    ) {
      addIssue({
        origin:
          "QUALITY_CHECK",
        issue: {
          category:
            "SOURCE_TRACEABILITY",
          code:
            "INVALID_SOURCE_REFERENCE",
          severity:
            "BLOCKER",
          sourceRef,
          message:
            "원고 또는 페이지 구성에 존재하지 않는 원본 자료 ID가 포함됐습니다.",
          suggestedAction:
            "해당 원본 연결을 제거하거나 올바른 자료 ID로 다시 연결해야 합니다.",
          requiresHumanReview:
            true,
        },
      });
    }
  } else {
    checks.push({
      code:
        "SOURCE_REFERENCE_VALIDITY",
      label:
        "원본 자료 연결 검사",
      status:
        "PASS",
      message:
        "원고와 페이지 구성에 사용된 모든 원본 자료 ID가 유효합니다.",
      metrics: {
        usedSourceCount:
          usedSourceRefs.size,
      },
    });
  }

  const validUsedSourceCount =
    [...usedSourceRefs].filter(
      (sourceRef) =>
        usableSourceRefs.has(
          sourceRef,
        ),
    ).length;

  const sourceCoveragePercent =
    usableSourceRefs.size ===
    0
      ? 0
      : roundPercent(
          validUsedSourceCount,
          usableSourceRefs.size,
        );

  checks.push({
    code:
      "SOURCE_COVERAGE",
    label:
      "원본 자료 활용률",
    status:
      sourceCoveragePercent >=
      25
        ? "PASS"
        : usableSourceRefs.size ===
            0
          ? "BLOCKER"
          : "WARNING",
    message:
      usableSourceRefs.size ===
      0
        ? "사용 가능한 원본 자료가 없습니다."
        : `사용 가능한 원본 자료 ${usableSourceRefs.size}개 중 ${validUsedSourceCount}개가 원고 또는 페이지에 연결됐습니다.`,
    metrics: {
      usableSourceCount:
        usableSourceRefs.size,
      usedSourceCount:
        validUsedSourceCount,
      coveragePercent:
        sourceCoveragePercent,
    },
  });

  if (
    usableSourceRefs.size ===
    0
  ) {
    addIssue({
      origin:
        "QUALITY_CHECK",
      issue: {
        category:
          "SOURCE_MATERIAL",
        code:
          "NO_USABLE_SOURCE",
        severity:
          "BLOCKER",
        sourceRef:
          "",
        message:
          "책 제작에 사용할 수 있는 원본 자료가 없습니다.",
        suggestedAction:
          "사진이나 이야기 자료를 추가한 뒤 제작을 다시 시작해야 합니다.",
        requiresHumanReview:
          true,
      },
    });
  } else if (
    sourceCoveragePercent <
    25
  ) {
    addIssue({
      origin:
        "QUALITY_CHECK",
      issue: {
        category:
          "SOURCE_COVERAGE",
        code:
          "LOW_SOURCE_COVERAGE",
        severity:
          "WARNING",
        sourceRef:
          "",
        message:
          `원본 자료 활용률이 ${sourceCoveragePercent}%로 낮습니다.`,
        suggestedAction:
          "중요한 이야기나 사진이 원고에서 누락되지 않았는지 최종 승인 전에 확인합니다.",
        requiresHumanReview:
          true,
      },
    });
  }

  const emptyChapters =
    manuscript.chapters.filter(
      (chapter) =>
        chapter.sections.length ===
        0 ||
        chapter.sections.every(
          (section) =>
            !normalizeText(
              section.body,
            ),
        ),
    );

  if (
    manuscript.chapters.length ===
    0
  ) {
    checks.push({
      code:
        "MANUSCRIPT_STRUCTURE",
      label:
        "원고 장 구성 검사",
      status:
        "BLOCKER",
      message:
        "생성된 원고에 장이 없습니다.",
      metrics: {
        chapterCount:
          0,
      },
    });

    addIssue({
      origin:
        "QUALITY_CHECK",
      issue: {
        category:
          "MANUSCRIPT_STRUCTURE",
        code:
          "NO_MANUSCRIPT_CHAPTER",
        severity:
          "BLOCKER",
        sourceRef:
          "",
        message:
          "생성된 원고에 장별 내용이 없습니다.",
        suggestedAction:
          "목차 분석과 원고 생성을 다시 실행해야 합니다.",
        requiresHumanReview:
          true,
      },
    });
  } else if (
    emptyChapters.length >
    0
  ) {
    checks.push({
      code:
        "MANUSCRIPT_STRUCTURE",
      label:
        "원고 장 구성 검사",
      status:
        "BLOCKER",
      message:
        `본문이 비어 있는 장이 ${emptyChapters.length}개 있습니다.`,
      metrics: {
        chapterCount:
          manuscript.chapters.length,
        emptyChapterCount:
          emptyChapters.length,
      },
    });

    for (
      const chapter of
      emptyChapters
    ) {
      addIssue({
        origin:
          "QUALITY_CHECK",
        issue: {
          category:
            "MANUSCRIPT_STRUCTURE",
          code:
            "EMPTY_MANUSCRIPT_CHAPTER",
          severity:
            "BLOCKER",
          sourceRef:
            chapter.sourceRefs[0] ||
            "",
          message:
            `${chapter.chapterNumber}장 본문이 비어 있습니다.`,
          suggestedAction:
            "해당 장의 원본 자료를 확인하고 원고를 다시 생성해야 합니다.",
          requiresHumanReview:
            true,
        },
      });
    }
  } else {
    checks.push({
      code:
        "MANUSCRIPT_STRUCTURE",
      label:
        "원고 장 구성 검사",
      status:
        "PASS",
      message:
        `전체 ${manuscript.chapters.length}장의 본문 구성이 확인됐습니다.`,
      metrics: {
        chapterCount:
          manuscript.chapters.length,
        emptyChapterCount:
          0,
      },
    });
  }

  const chaptersWithoutSource =
    manuscript.chapters.filter(
      (chapter) =>
        chapter.sourceRefs.length ===
        0 &&
        chapter.sections.every(
          (section) =>
            section.sourceRefs
              .length === 0,
        ),
    );

  if (
    chaptersWithoutSource.length >
    0
  ) {
    checks.push({
      code:
        "CHAPTER_TRACEABILITY",
      label:
        "장별 원본 추적 검사",
      status:
        "WARNING",
      message:
        `연결된 원본 자료가 없는 장이 ${chaptersWithoutSource.length}개 있습니다.`,
      metrics: {
        chapterCount:
          manuscript.chapters.length,
        unlinkedChapterCount:
          chaptersWithoutSource.length,
      },
    });

    for (
      const chapter of
      chaptersWithoutSource
    ) {
      addIssue({
        origin:
          "QUALITY_CHECK",
        issue: {
          category:
            "SOURCE_TRACEABILITY",
          code:
            "CHAPTER_WITHOUT_SOURCE",
          severity:
            "WARNING",
          sourceRef:
            "",
          message:
            `${chapter.chapterNumber}장에 연결된 원본 자료가 없습니다.`,
          suggestedAction:
            "해당 장의 내용이 실제 사용자 자료에 근거했는지 최종 승인 전에 확인합니다.",
          requiresHumanReview:
            true,
        },
      });
    }
  } else {
    checks.push({
      code:
        "CHAPTER_TRACEABILITY",
      label:
        "장별 원본 추적 검사",
      status:
        "PASS",
      message:
        "모든 장이 하나 이상의 원본 자료와 연결돼 있습니다.",
      metrics: {
        chapterCount:
          manuscript.chapters.length,
        unlinkedChapterCount:
          0,
      },
    });
  }

  const manuscriptCharacterCount =
    manuscript.summary
      .estimatedKoreanCharacterCount;

  if (
    manuscriptCharacterCount <
    3000
  ) {
    checks.push({
      code:
        "MANUSCRIPT_LENGTH",
      label:
        "원고 분량 검사",
      status:
        "WARNING",
      message:
        `전체 원고 분량이 약 ${manuscriptCharacterCount.toLocaleString()}자로 책 제작 기준보다 짧을 수 있습니다.`,
      metrics: {
        characterCount:
          manuscriptCharacterCount,
      },
    });

    addIssue({
      origin:
        "QUALITY_CHECK",
      issue: {
        category:
          "MANUSCRIPT_LENGTH",
        code:
          "QUALITY_MANUSCRIPT_TOO_SHORT",
        severity:
          "WARNING",
        sourceRef:
          "",
        message:
          "전체 원고 분량이 3,000자보다 짧습니다.",
        suggestedAction:
          "누락된 이야기 자료가 있는지 확인하고 필요하면 원고를 보강합니다.",
        requiresHumanReview:
          true,
      },
    });
  } else {
    checks.push({
      code:
        "MANUSCRIPT_LENGTH",
      label:
        "원고 분량 검사",
      status:
        "PASS",
      message:
        `전체 원고 분량은 약 ${manuscriptCharacterCount.toLocaleString()}자입니다.`,
      metrics: {
        characterCount:
          manuscriptCharacterCount,
      },
    });
  }

  const includedPhotos =
    photoSelection.photoPlan.filter(
      (photo) =>
        photo.decision ===
        "INCLUDE",
    );

  const includedPhotoRefs =
    new Set(
      includedPhotos.map(
        (photo) =>
          photo.sourceRef,
      ),
    );

  const layoutPhotoRefs =
    new Set(
      layout.pages.flatMap(
        (page) =>
          page.photos.map(
            (photo) =>
              photo.sourceRef,
          ),
      ),
    );

  const usedIncludedPhotoCount =
    [...includedPhotoRefs].filter(
      (sourceRef) =>
        layoutPhotoRefs.has(
          sourceRef,
        ),
    ).length;

  const unusedIncludedPhotoRefs =
    [...includedPhotoRefs].filter(
      (sourceRef) =>
        !layoutPhotoRefs.has(
          sourceRef,
        ),
    );

  const photoUsagePercent =
    includedPhotoRefs.size ===
    0
      ? 0
      : roundPercent(
          usedIncludedPhotoCount,
          includedPhotoRefs.size,
        );

  if (
    includedPhotoRefs.size ===
    0
  ) {
    checks.push({
      code:
        "PHOTO_USAGE",
      label:
        "사진 사용 검사",
      status:
        snapshot.items.some(
          (item) =>
            item.hasPhoto,
        )
          ? "WARNING"
          : "PASS",
      message:
        snapshot.items.some(
          (item) =>
            item.hasPhoto,
        )
          ? "등록된 사진은 있지만 책에 사용할 사진이 선택되지 않았습니다."
          : "사진이 없는 글 중심 책 구성입니다.",
      metrics: {
        includedPhotoCount:
          0,
        usedPhotoCount:
          0,
        usagePercent:
          0,
      },
    });

    if (
      snapshot.items.some(
        (item) =>
          item.hasPhoto,
      )
    ) {
      addIssue({
        origin:
          "QUALITY_CHECK",
        issue: {
          category:
            "PHOTO_SELECTION",
          code:
            "NO_PHOTO_SELECTED_FOR_BOOK",
          severity:
            "WARNING",
          sourceRef:
            "",
          message:
            "등록된 사진 중 책에 사용할 사진이 선택되지 않았습니다.",
          suggestedAction:
            "글 중심 책으로 제작할지 사진을 다시 선별할지 최종 승인 단계에서 확인합니다.",
          requiresHumanReview:
            true,
        },
      });
    }
  } else if (
    unusedIncludedPhotoRefs.length >
    0
  ) {
    checks.push({
      code:
        "PHOTO_USAGE",
      label:
        "사진 사용 검사",
      status:
        "WARNING",
      message:
        `사용 대상으로 선택된 사진 ${includedPhotoRefs.size}장 중 ${usedIncludedPhotoCount}장이 페이지에 배치됐습니다.`,
      metrics: {
        includedPhotoCount:
          includedPhotoRefs.size,
        usedPhotoCount:
          usedIncludedPhotoCount,
        unusedPhotoCount:
          unusedIncludedPhotoRefs.length,
        usagePercent:
          photoUsagePercent,
      },
    });

    for (
      const sourceRef of
      unusedIncludedPhotoRefs
    ) {
      addIssue({
        origin:
          "QUALITY_CHECK",
        issue: {
          category:
            "PHOTO_LAYOUT",
          code:
            "INCLUDED_PHOTO_NOT_PLACED",
          severity:
            "WARNING",
          sourceRef,
          message:
            "사용 대상으로 선택된 사진이 페이지에 배치되지 않았습니다.",
          suggestedAction:
            "해당 사진을 배치하거나 예비 사진으로 변경할지 확인합니다.",
          requiresHumanReview:
            true,
        },
      });
    }
  } else {
    checks.push({
      code:
        "PHOTO_USAGE",
      label:
        "사진 사용 검사",
      status:
        "PASS",
      message:
        `사용 대상으로 선택된 사진 ${includedPhotoRefs.size}장이 모두 페이지에 배치됐습니다.`,
      metrics: {
        includedPhotoCount:
          includedPhotoRefs.size,
        usedPhotoCount:
          usedIncludedPhotoCount,
        unusedPhotoCount:
          0,
        usagePercent:
          photoUsagePercent,
      },
    });
  }

  const photosWithoutCaption =
    includedPhotos.filter(
      (photo) =>
        !normalizeText(
          photo.caption,
        ),
    );

  if (
    photosWithoutCaption.length >
    0
  ) {
    checks.push({
      code:
        "PHOTO_CAPTION",
      label:
        "사진 설명 검사",
      status:
        "WARNING",
      message:
        `설명 문구가 없는 사용 사진이 ${photosWithoutCaption.length}장 있습니다.`,
      metrics: {
        includedPhotoCount:
          includedPhotos.length,
        missingCaptionCount:
          photosWithoutCaption.length,
      },
    });

    for (
      const photo of
      photosWithoutCaption
    ) {
      addIssue({
        origin:
          "QUALITY_CHECK",
        issue: {
          category:
            "PHOTO_CAPTION",
          code:
            "QUALITY_PHOTO_CAPTION_MISSING",
          severity:
            "WARNING",
          sourceRef:
            photo.sourceRef,
          message:
            "사용 사진의 설명 문구가 비어 있습니다.",
          suggestedAction:
            "사진과 연결된 원본 이야기를 확인해 설명 문구를 보강합니다.",
          requiresHumanReview:
            false,
        },
      });
    }
  } else {
    checks.push({
      code:
        "PHOTO_CAPTION",
      label:
        "사진 설명 검사",
      status:
        "PASS",
      message:
        "페이지에 사용할 모든 사진에 설명 문구가 있습니다.",
      metrics: {
        includedPhotoCount:
          includedPhotos.length,
        missingCaptionCount:
          0,
      },
    });
  }

  const pagesWithMissingPhotoFile =
    layout.pages.filter(
      (page) =>
        (
          page.pageType ===
            "PHOTO" ||
          page.pageType ===
            "PHOTO_GALLERY"
        ) &&
        (
          page.photos.length ===
            0 ||
          page.photos.some(
            (photo) =>
              !normalizeText(
                photo.fileUrl,
              ),
          )
        ),
    );

  if (
    pagesWithMissingPhotoFile.length >
    0
  ) {
    checks.push({
      code:
        "PHOTO_FILE_VALIDITY",
      label:
        "사진 파일 연결 검사",
      status:
        "BLOCKER",
      message:
        `사진 파일을 정상적으로 연결하지 못한 페이지가 ${pagesWithMissingPhotoFile.length}개 있습니다.`,
      metrics: {
        invalidPhotoPageCount:
          pagesWithMissingPhotoFile.length,
      },
    });

    addIssue({
      origin:
        "QUALITY_CHECK",
      issue: {
        category:
          "PHOTO_FILE",
        code:
          "LAYOUT_PHOTO_FILE_MISSING",
        severity:
          "BLOCKER",
        sourceRef:
          "",
        message:
          "사진 페이지 중 실제 사진 파일이 연결되지 않은 페이지가 있습니다.",
        suggestedAction:
          "최종 PDF 생성 전에 사진 파일 주소와 저장 상태를 확인해야 합니다.",
        requiresHumanReview:
          true,
      },
    });
  } else {
    checks.push({
      code:
        "PHOTO_FILE_VALIDITY",
      label:
        "사진 파일 연결 검사",
      status:
        "PASS",
      message:
        "모든 사진 페이지에 실제 사진 파일이 연결돼 있습니다.",
      metrics: {
        invalidPhotoPageCount:
          0,
      },
    });
  }

  const sequenceErrors =
    layout.pages.filter(
      (
        page,
        index,
      ) =>
        page.sequence !==
        index + 1,
    );

  const numberedPages =
    layout.pages.filter(
      (page) =>
        page.printedPageNumber !==
        null,
    );

  const printedNumberErrors =
    numberedPages.filter(
      (
        page,
        index,
      ) =>
        page.printedPageNumber !==
        index + 1,
    );

  if (
    sequenceErrors.length >
      0 ||
    printedNumberErrors.length >
      0
  ) {
    checks.push({
      code:
        "PAGE_NUMBER_SEQUENCE",
      label:
        "페이지 순서 검사",
      status:
        "BLOCKER",
      message:
        "페이지 순서 또는 인쇄 페이지 번호가 연속적이지 않습니다.",
      metrics: {
        sequenceErrorCount:
          sequenceErrors.length,
        printedNumberErrorCount:
          printedNumberErrors.length,
      },
    });

    addIssue({
      origin:
        "QUALITY_CHECK",
      issue: {
        category:
          "PAGE_SEQUENCE",
        code:
          "INVALID_PAGE_SEQUENCE",
        severity:
          "BLOCKER",
        sourceRef:
          "",
        message:
          "페이지 순서나 인쇄 페이지 번호에 누락 또는 중복이 있습니다.",
        suggestedAction:
          "페이지 구성을 다시 생성한 뒤 최종 PDF를 만들어야 합니다.",
        requiresHumanReview:
          true,
      },
    });
  } else {
    checks.push({
      code:
        "PAGE_NUMBER_SEQUENCE",
      label:
        "페이지 순서 검사",
      status:
        "PASS",
      message:
        `전체 ${layout.pages.length}페이지의 순서가 정상입니다.`,
      metrics: {
        totalPageCount:
          layout.pages.length,
        numberedPageCount:
          numberedPages.length,
      },
    });
  }

  const evenChapterOpeners =
    layout.pages.filter(
      (page) =>
        page.pageType ===
          "CHAPTER_OPENER" &&
        page.printedPageNumber !==
          null &&
        page.printedPageNumber %
          2 ===
          0,
    );

  if (
    evenChapterOpeners.length >
    0
  ) {
    checks.push({
      code:
        "CHAPTER_OPENER_POSITION",
      label:
        "장 시작 위치 검사",
      status:
        "WARNING",
      message:
        `오른쪽 홀수 페이지에서 시작하지 않는 장이 ${evenChapterOpeners.length}개 있습니다.`,
      metrics: {
        evenChapterOpenerCount:
          evenChapterOpeners.length,
      },
    });

    addIssue({
      origin:
        "QUALITY_CHECK",
      issue: {
        category:
          "PAGE_LAYOUT",
        code:
          "CHAPTER_OPENER_ON_EVEN_PAGE",
        severity:
          "WARNING",
        sourceRef:
          "",
        message:
          "일부 장 시작 페이지가 왼쪽 짝수 페이지에 배치됐습니다.",
        suggestedAction:
          "필요한 곳에 의도된 빈 페이지를 삽입해 장 시작 위치를 조정합니다.",
        requiresHumanReview:
          false,
      },
    });
  } else {
    checks.push({
      code:
        "CHAPTER_OPENER_POSITION",
      label:
        "장 시작 위치 검사",
      status:
        "PASS",
      message:
        "모든 장 시작 페이지가 오른쪽 홀수 페이지에 배치됐습니다.",
      metrics: {
        evenChapterOpenerCount:
          0,
      },
    });
  }

  if (
    layout.pages.length ===
    0
  ) {
    checks.push({
      code:
        "LAYOUT_PAGE_COUNT",
      label:
        "전체 페이지 수 검사",
      status:
        "BLOCKER",
      message:
        "생성된 책 페이지가 없습니다.",
      metrics: {
        totalPageCount:
          0,
      },
    });

    addIssue({
      origin:
        "QUALITY_CHECK",
      issue: {
        category:
          "PAGE_COUNT",
        code:
          "NO_LAYOUT_PAGE",
        severity:
          "BLOCKER",
        sourceRef:
          "",
        message:
          "페이지 구성 결과가 비어 있습니다.",
        suggestedAction:
          "페이지 구성 단계를 다시 실행해야 합니다.",
        requiresHumanReview:
          true,
      },
    });
  } else if (
    layout.pages.length <
    12
  ) {
    checks.push({
      code:
        "LAYOUT_PAGE_COUNT",
      label:
        "전체 페이지 수 검사",
      status:
        "WARNING",
      message:
        `자동 구성 결과가 ${layout.pages.length}페이지로 책 제작 분량이 짧을 수 있습니다.`,
      metrics: {
        totalPageCount:
          layout.pages.length,
        targetPageCount:
          layout.summary
            .targetPageCount,
      },
    });

    addIssue({
      origin:
        "QUALITY_CHECK",
      issue: {
        category:
          "PAGE_COUNT",
        code:
          "BOOK_PAGE_COUNT_TOO_SHORT",
        severity:
          "WARNING",
        sourceRef:
          "",
        message:
          "자동 구성된 전체 페이지 수가 12페이지보다 적습니다.",
        suggestedAction:
          "원고와 사진을 추가하거나 소책자 형태로 제작할지 확인합니다.",
        requiresHumanReview:
          true,
      },
    });
  } else {
    checks.push({
      code:
        "LAYOUT_PAGE_COUNT",
      label:
        "전체 페이지 수 검사",
      status:
        "PASS",
      message:
        `자동 구성된 전체 페이지 수는 ${layout.pages.length}페이지입니다.`,
      metrics: {
        totalPageCount:
          layout.pages.length,
        targetPageCount:
          layout.summary
            .targetPageCount,
      },
    });
  }

  const inheritedBlockerCount =
    issues.filter(
      (issue) =>
        issue.origin !==
          "QUALITY_CHECK" &&
        issue.severity ===
          "BLOCKER",
    ).length;

  const inheritedWarningCount =
    issues.filter(
      (issue) =>
        issue.origin !==
          "QUALITY_CHECK" &&
        issue.severity ===
          "WARNING",
    ).length;

  checks.push({
    code:
      "PREVIOUS_STAGE_ISSUES",
    label:
      "이전 제작 단계 검수 항목",
    status:
      inheritedBlockerCount >
      0
        ? "BLOCKER"
        : inheritedWarningCount >
            0
          ? "WARNING"
          : "PASS",
    message:
      inheritedBlockerCount >
      0
        ? `이전 제작 단계에서 차단 항목 ${inheritedBlockerCount}건이 발견됐습니다.`
        : inheritedWarningCount >
            0
          ? `이전 제작 단계에서 경고 항목 ${inheritedWarningCount}건이 발견됐습니다.`
          : "이전 제작 단계에서 전달된 차단·경고 항목이 없습니다.",
    metrics: {
      inheritedBlockerCount,
      inheritedWarningCount,
    },
  });

  const passCount =
    checks.filter(
      (check) =>
        check.status ===
        "PASS",
    ).length;

  const warningCount =
    checks.filter(
      (check) =>
        check.status ===
        "WARNING",
    ).length;

  const blockerCount =
    checks.filter(
      (check) =>
        check.status ===
        "BLOCKER",
    ).length;

  const informationIssueCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "INFO",
    ).length;

  const warningIssueCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "WARNING",
    ).length;

  const blockerIssueCount =
    issues.filter(
      (issue) =>
        issue.severity ===
        "BLOCKER",
    ).length;

  const reviewRequired =
    blockerIssueCount >
      0 ||
    warningIssueCount >
      0 ||
    issues.some(
      (issue) =>
        issue.requiresHumanReview,
    );

  const status:
    AIBookQualityStatus =
      blockerIssueCount >
      0 ||
      blockerCount >
      0
        ? "BLOCKED"
        : warningIssueCount >
              0 ||
            warningCount >
              0
          ? "PASSED_WITH_WARNINGS"
          : "PASSED";

  const reviewSummary =
    createReviewSummary({
      status,
      blockerIssueCount,
      warningIssueCount,
      informationIssueCount,
    });

  return {
    version: 1,
    generatedAt,
    status,
    checks,
    issues,

    summary: {
      totalCheckCount:
        checks.length,
      passCount,
      warningCount,
      blockerCount,
      openIssueCount:
        issues.length,
      informationIssueCount,
      warningIssueCount,
      blockerIssueCount,
      sourceCoveragePercent,
      photoUsagePercent,
      layoutPageCount:
        layout.pages.length,
      reviewRequired,
      reviewSummary,
    },
  };
}

function collectManuscriptSourceRefs(
  manuscript:
    AIBookManuscriptResult,
) {
  const sourceRefs =
    new Set<string>();

  for (
    const chapter of
    manuscript.chapters
  ) {
    for (
      const sourceRef of
      chapter.sourceRefs
    ) {
      if (sourceRef) {
        sourceRefs.add(
          sourceRef,
        );
      }
    }

    for (
      const section of
      chapter.sections
    ) {
      for (
        const sourceRef of
        section.sourceRefs
      ) {
        if (sourceRef) {
          sourceRefs.add(
            sourceRef,
          );
        }
      }
    }
  }

  for (
    const caption of
    manuscript.photoCaptions
  ) {
    if (
      caption.sourceRef
    ) {
      sourceRefs.add(
        caption.sourceRef,
      );
    }
  }

  return sourceRefs;
}

function collectLayoutSourceRefs(
  layout:
    AIBookLayoutPlan,
) {
  const sourceRefs =
    new Set<string>();

  for (
    const page of
    layout.pages
  ) {
    for (
      const sourceRef of
      page.sourceRefs
    ) {
      if (sourceRef) {
        sourceRefs.add(
          sourceRef,
        );
      }
    }

    for (
      const textBlock of
      page.textBlocks
    ) {
      for (
        const sourceRef of
        textBlock.sourceRefs
      ) {
        if (sourceRef) {
          sourceRefs.add(
            sourceRef,
          );
        }
      }
    }

    for (
      const photo of
      page.photos
    ) {
      if (
        photo.sourceRef
      ) {
        sourceRefs.add(
          photo.sourceRef,
        );
      }
    }
  }

  return sourceRefs;
}

function createReviewSummary({
  status,
  blockerIssueCount,
  warningIssueCount,
  informationIssueCount,
}: {
  status:
    AIBookQualityStatus;
  blockerIssueCount:
    number;
  warningIssueCount:
    number;
  informationIssueCount:
    number;
}) {
  if (
    status ===
    "BLOCKED"
  ) {
    return `최종 PDF 생성 전에 차단 항목 ${blockerIssueCount}건을 해결해야 합니다. 경고 ${warningIssueCount}건과 안내 ${informationIssueCount}건도 함께 확인합니다.`;
  }

  if (
    status ===
    "PASSED_WITH_WARNINGS"
  ) {
    return `자동 품질 검수는 통과했지만 최종 승인 시 경고 항목 ${warningIssueCount}건을 확인해야 합니다.`;
  }

  return "원본 연결, 원고 구조, 사진 배치, 페이지 순서 검사를 모두 통과했습니다.";
}

function normalizeSeverity(
  value:
    | string
    | null
    | undefined,
): QualityIssueSeverity {
  if (
    value ===
    "BLOCKER"
  ) {
    return "BLOCKER";
  }

  if (
    value ===
    "WARNING"
  ) {
    return "WARNING";
  }

  return "INFO";
}

function normalizeRequiredText(
  value:
    | string
    | null
    | undefined,
  fallback: string,
) {
  const normalized =
    normalizeText(
      value,
    );

  return normalized ||
    fallback;
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

function roundPercent(
  numerator: number,
  denominator: number,
) {
  if (
    denominator <=
    0
  ) {
    return 0;
  }

  return Math.round(
    (
      numerator /
      denominator
    ) *
      1000,
  ) / 10;
}
