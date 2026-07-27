import type {
  AIBookManuscriptResult,
} from "@/lib/ai-book-production-manuscript";
import type {
  AIBookFinalPhotoSelection,
} from "@/lib/ai-book-production-photo-selection";
import type {
  AIBookSourceSnapshot,
} from "@/lib/ai-book-production-source";

export type AIBookLayoutPageType =
  | "COVER"
  | "TITLE"
  | "COPYRIGHT"
  | "CONTENTS"
  | "INTRODUCTION"
  | "CHAPTER_OPENER"
  | "TEXT"
  | "PHOTO"
  | "PHOTO_GALLERY"
  | "EPILOGUE"
  | "COLOPHON"
  | "BLANK";

export type AIBookLayoutPlan = {
  version: 1;
  generatedAt: string;

  format: {
    name: "A5";
    trimWidthMm: number;
    trimHeightMm: number;
    bleedMm: number;
    safeMarginMm: number;
    layoutStyle: "WARM_EDITORIAL";
  };

  book: {
    title: string;
    subtitle: string;
    coverText: string;
    targetPageCount: number | null;
  };

  pages: Array<{
    sequence: number;
    printedPageNumber: number | null;
    pageType: AIBookLayoutPageType;
    chapterNumber: number | null;
    title: string;
    subtitle: string;
    textBlocks: Array<{
      heading: string;
      body: string;
      sourceRefs: string[];
    }>;
    photos: Array<{
      sourceRef: string;
      fileUrl: string;
      caption: string;
      placement: string;
      fit: "COVER" | "CONTAIN";
    }>;
    sourceRefs: string[];
    productionNote: string;
  }>;

  summary: {
    totalPageCount: number;
    numberedPageCount: number;
    frontMatterPageCount: number;
    bodyPageCount: number;
    blankPageCount: number;
    textPageCount: number;
    photoPageCount: number;
    usedPhotoCount: number;
    unusedIncludedPhotoCount: number;
    targetPageCount: number | null;
    pageDifference: number | null;
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

const TEXT_CHARACTERS_PER_PAGE = 850;
const INTRO_CHARACTERS_PER_PAGE = 700;
const EPILOGUE_CHARACTERS_PER_PAGE = 700;
const CONTENTS_ITEMS_PER_PAGE = 10;
const GALLERY_PHOTOS_PER_PAGE = 2;

export function generateAIBookLayout({
  snapshot,
  manuscript,
  photoSelection,
}: {
  snapshot: AIBookSourceSnapshot;
  manuscript: AIBookManuscriptResult;
  photoSelection: AIBookFinalPhotoSelection;
}): AIBookLayoutPlan {
  const generatedAt =
    new Date().toISOString();

  const pages:
    AIBookLayoutPlan["pages"] =
      [];

  const issues:
    AIBookLayoutPlan["issues"] =
      [];

  const photoSourceMap =
    new Map(
      snapshot.items
        .filter(
          (item) =>
            item.hasPhoto &&
            Boolean(
              item.fileUrl,
            ),
        )
        .map(
          (item) => [
            item.sourceRef,
            item,
          ]),
    );

  const includedPhotos =
    photoSelection.photoPlan.filter(
      (photo) =>
        photo.decision ===
        "INCLUDE",
    );

  const usedPhotoRefs =
    new Set<string>();

  let nextPrintedPageNumber =
    1;

  const appendFrontPage = (
    page: Omit<
      AIBookLayoutPlan["pages"][number],
      | "sequence"
      | "printedPageNumber"
    >,
  ) => {
    pages.push({
      ...page,
      sequence:
        pages.length + 1,
      printedPageNumber:
        null,
    });
  };

  const appendNumberedPage = (
    page: Omit<
      AIBookLayoutPlan["pages"][number],
      | "sequence"
      | "printedPageNumber"
    >,
  ) => {
    pages.push({
      ...page,
      sequence:
        pages.length + 1,
      printedPageNumber:
        nextPrintedPageNumber,
    });

    nextPrintedPageNumber +=
      1;
  };

  appendFrontPage({
    pageType:
      "COVER",
    chapterNumber:
      null,
    title:
      manuscript.book.title ||
      snapshot.book.title,
    subtitle:
      manuscript.book.subtitle ||
      snapshot.book.subtitle ||
      "",
    textBlocks: [],
    photos:
      createCoverPhotos({
        includedPhotos,
        photoSourceMap,
        usedPhotoRefs,
      }),
    sourceRefs: [],
    productionNote:
      "앞표지입니다. 표지 이미지와 제목의 안전영역을 인쇄 전에 확인합니다.",
  });

  appendFrontPage({
    pageType:
      "TITLE",
    chapterNumber:
      null,
    title:
      manuscript.book.title ||
      snapshot.book.title,
    subtitle:
      manuscript.book.subtitle ||
      snapshot.book.subtitle ||
      "",
    textBlocks: [
      {
        heading:
          "",
        body:
          manuscript.book.coverText,
        sourceRefs: [],
      },
    ],
    photos: [],
    sourceRefs: [],
    productionNote:
      "내지 표제지입니다.",
  });

  appendFrontPage({
    pageType:
      "COPYRIGHT",
    chapterNumber:
      null,
    title:
      "책 정보",
    subtitle:
      "",
    textBlocks: [
      {
        heading:
          "",
        body:
          "이 책은 사용자가 제공한 사진과 이야기를 바탕으로 제작되었습니다.\n\nAI는 원본을 변경하지 않고 편집과 구성을 돕는 조력자로 사용되었습니다.",
        sourceRefs: [],
      },
    ],
    photos: [],
    sourceRefs: [],
    productionNote:
      "발행일, 저자명, 출판 정보는 최종 PDF 생성 전에 실제 정보로 교체합니다.",
  });

  const contentsGroups =
    chunkArray(
      manuscript.tableOfContents,
      CONTENTS_ITEMS_PER_PAGE,
    );

  for (
    const contentsGroup of
    contentsGroups
  ) {
    appendFrontPage({
      pageType:
        "CONTENTS",
      chapterNumber:
        null,
      title:
        "차례",
      subtitle:
        "",
      textBlocks:
        contentsGroup.map(
          (item) => ({
            heading:
              `${item.chapterNumber}. ${item.title}`,
            body:
              "",
            sourceRefs: [],
          }),
        ),
      photos: [],
      sourceRefs: [],
      productionNote:
        "최종 페이지 번호는 PDF 생성 단계에서 다시 계산합니다.",
    });
  }

  const introductionChunks =
    splitText(
      manuscript.book.introduction,
      INTRO_CHARACTERS_PER_PAGE,
    );

  if (
    introductionChunks.length ===
    0
  ) {
    issues.push({
      category:
        "LAYOUT_CONTENT",
      code:
        "INTRODUCTION_MISSING",
      severity:
        "INFO",
      sourceRef:
        "",
      message:
        "머리말 내용이 비어 있습니다.",
      suggestedAction:
        "머리말 없이 제작하거나 AI 원고를 다시 확인합니다.",
      requiresHumanReview:
        false,
    });
  } else {
    introductionChunks.forEach(
      (
        body,
        index,
      ) => {
        appendNumberedPage({
          pageType:
            "INTRODUCTION",
          chapterNumber:
            null,
          title:
            index === 0
              ? manuscript.book
                  .introductionTitle ||
                "머리말"
              : "",
          subtitle:
            "",
          textBlocks: [
            {
              heading:
                "",
              body,
              sourceRefs: [],
            },
          ],
          photos: [],
          sourceRefs: [],
          productionNote:
            "머리말 페이지입니다.",
        });
      },
    );
  }

  for (
    const chapter of
    manuscript.chapters
  ) {
    if (
      nextPrintedPageNumber %
        2 ===
      0
    ) {
      appendNumberedPage({
        pageType:
          "BLANK",
        chapterNumber:
          null,
        title:
          "",
        subtitle:
          "",
        textBlocks: [],
        photos: [],
        sourceRefs: [],
        productionNote:
          "다음 장을 오른쪽 홀수 페이지에서 시작하기 위한 의도된 빈 페이지입니다.",
      });
    }

    const chapterPhotos =
      includedPhotos.filter(
        (photo) =>
          photo.chapterNumbers.includes(
            chapter.chapterNumber,
          ),
      );

    const openerPhoto =
      chapterPhotos[0] ||
      null;

    appendNumberedPage({
      pageType:
        "CHAPTER_OPENER",
      chapterNumber:
        chapter.chapterNumber,
      title:
        chapter.title,
      subtitle:
        chapter.lead,
      textBlocks: [],
      photos:
        openerPhoto
          ? createLayoutPhotos({
              photos: [
                openerPhoto,
              ],
              photoSourceMap,
              usedPhotoRefs,
              fit:
                "COVER",
            })
          : [],
      sourceRefs:
        uniqueStrings(
          chapter.sourceRefs,
        ),
      productionNote:
        `${chapter.chapterNumber}장 시작 페이지입니다.`,
    });

    const remainingChapterPhotos =
      openerPhoto
        ? chapterPhotos.slice(
            1,
          )
        : chapterPhotos;

    let photoIndex =
      0;

    for (
      const section of
      chapter.sections
    ) {
      const textChunks =
        splitText(
          section.body,
          TEXT_CHARACTERS_PER_PAGE,
        );

      if (
        textChunks.length ===
        0
      ) {
        continue;
      }

      textChunks.forEach(
        (
          body,
          chunkIndex,
        ) => {
          appendNumberedPage({
            pageType:
              "TEXT",
            chapterNumber:
              chapter.chapterNumber,
            title:
              "",
            subtitle:
              "",
            textBlocks: [
              {
                heading:
                  chunkIndex === 0
                    ? section.heading
                    : "",
                body,
                sourceRefs:
                  uniqueStrings(
                    section.sourceRefs,
                  ),
              },
            ],
            photos: [],
            sourceRefs:
              uniqueStrings(
                section.sourceRefs,
              ),
            productionNote:
              "본문 원고 페이지입니다.",
          });

          if (
            photoIndex <
            remainingChapterPhotos.length
          ) {
            const photo =
              remainingChapterPhotos[
                photoIndex
              ];

            appendNumberedPage({
              pageType:
                "PHOTO",
              chapterNumber:
                chapter.chapterNumber,
              title:
                "",
              subtitle:
                "",
              textBlocks: [],
              photos:
                createLayoutPhotos({
                  photos: [
                    photo,
                  ],
                  photoSourceMap,
                  usedPhotoRefs,
                  fit:
                    "CONTAIN",
                }),
              sourceRefs: [
                photo.sourceRef,
              ],
              productionNote:
                "장별 사진 페이지입니다. 사진 해상도와 재단 위치를 최종 검수합니다.",
            });

            photoIndex +=
              1;
          }
        },
      );
    }

    if (
      normalizeText(
        chapter.closing,
      )
    ) {
      appendNumberedPage({
        pageType:
          "TEXT",
        chapterNumber:
          chapter.chapterNumber,
        title:
          "",
        subtitle:
          "",
        textBlocks: [
          {
            heading:
              "장 마무리",
            body:
              chapter.closing,
            sourceRefs:
              uniqueStrings(
                chapter.sourceRefs,
              ),
          },
        ],
        photos: [],
        sourceRefs:
          uniqueStrings(
            chapter.sourceRefs,
          ),
        productionNote:
          "장 마무리 원고 페이지입니다.",
      });
    }

    while (
      photoIndex <
      remainingChapterPhotos.length
    ) {
      const photo =
        remainingChapterPhotos[
          photoIndex
        ];

      appendNumberedPage({
        pageType:
          "PHOTO",
        chapterNumber:
          chapter.chapterNumber,
        title:
          "",
        subtitle:
          "",
        textBlocks: [],
        photos:
          createLayoutPhotos({
            photos: [
              photo,
            ],
            photoSourceMap,
            usedPhotoRefs,
            fit:
              "CONTAIN",
          }),
        sourceRefs: [
          photo.sourceRef,
        ],
        productionNote:
          "본문에서 사용되지 않은 장별 추가 사진 페이지입니다.",
      });

      photoIndex +=
        1;
    }
  }

  const unassignedIncludedPhotos =
    includedPhotos.filter(
      (photo) =>
        !usedPhotoRefs.has(
          photo.sourceRef,
        ),
    );

  const galleryGroups =
    chunkArray(
      unassignedIncludedPhotos,
      GALLERY_PHOTOS_PER_PAGE,
    );

  for (
    const galleryGroup of
    galleryGroups
  ) {
    appendNumberedPage({
      pageType:
        "PHOTO_GALLERY",
      chapterNumber:
        null,
      title:
        "기억의 장면들",
      subtitle:
        "",
      textBlocks: [],
      photos:
        createLayoutPhotos({
          photos:
            galleryGroup,
          photoSourceMap,
          usedPhotoRefs,
          fit:
            "CONTAIN",
        }),
      sourceRefs:
        galleryGroup.map(
          (photo) =>
            photo.sourceRef,
        ),
      productionNote:
        "특정 장에 배정되지 않은 사용 사진을 모은 사진 페이지입니다.",
    });
  }

  const epilogueChunks =
    splitText(
      manuscript.book.epilogue,
      EPILOGUE_CHARACTERS_PER_PAGE,
    );

  epilogueChunks.forEach(
    (
      body,
      index,
    ) => {
      appendNumberedPage({
        pageType:
          "EPILOGUE",
        chapterNumber:
          null,
        title:
          index === 0
            ? manuscript.book
                .epilogueTitle ||
              "맺음말"
            : "",
        subtitle:
          "",
        textBlocks: [
          {
            heading:
              "",
            body,
            sourceRefs: [],
          },
        ],
        photos: [],
        sourceRefs: [],
        productionNote:
          "맺음말 페이지입니다.",
      });
    },
  );

  appendNumberedPage({
    pageType:
      "COLOPHON",
    chapterNumber:
      null,
    title:
      "달동네 스토리",
    subtitle:
      "",
    textBlocks: [
      {
        heading:
          "",
        body:
          "한 사람의 시간과 마음이 한 권의 이야기로 남았습니다.",
        sourceRefs: [],
      },
    ],
    photos: [],
    sourceRefs: [],
    productionNote:
      "판권과 제작 정보는 최종 PDF 생성 전에 실제 주문 정보로 완성합니다.",
  });

  const pagesWithMissingPhotos =
    pages.filter(
      (page) =>
        page.pageType ===
          "PHOTO" &&
        page.photos.length ===
          0,
    );

  if (
    pagesWithMissingPhotos.length >
    0
  ) {
    issues.push({
      category:
        "LAYOUT_PHOTO",
      code:
        "PHOTO_FILE_NOT_RESOLVED",
      severity:
        "BLOCKER",
      sourceRef:
        "",
      message:
        `사진 파일을 연결하지 못한 페이지가 ${pagesWithMissingPhotos.length}개 있습니다.`,
      suggestedAction:
        "최종 PDF 생성 전에 해당 사진 파일 주소를 확인해야 합니다.",
      requiresHumanReview:
        true,
    });
  }

  const bodyTextPageCount =
    pages.filter(
      (page) =>
        page.pageType ===
          "TEXT" ||
        page.pageType ===
          "INTRODUCTION" ||
        page.pageType ===
          "EPILOGUE",
    ).length;

  if (
    bodyTextPageCount ===
    0
  ) {
    issues.push({
      category:
        "LAYOUT_CONTENT",
      code:
        "NO_BODY_TEXT_PAGE",
      severity:
        "BLOCKER",
      sourceRef:
        "",
      message:
        "본문 원고가 배치된 페이지가 없습니다.",
      suggestedAction:
        "AI 원고 생성 결과와 장별 본문을 다시 확인해야 합니다.",
      requiresHumanReview:
        true,
    });
  }

  const targetPageCount =
    isPositiveInteger(
      snapshot.book.pageCount,
    )
      ? snapshot.book.pageCount
      : null;

  const totalPageCount =
    pages.length;

  const pageDifference =
    targetPageCount ===
    null
      ? null
      : totalPageCount -
        targetPageCount;

  if (
    targetPageCount !==
      null &&
    pageDifference !==
      null &&
    Math.abs(
      pageDifference,
    ) >= 6
  ) {
    issues.push({
      category:
        "LAYOUT_PAGE_COUNT",
      code:
        pageDifference < 0
          ? "PAGE_COUNT_BELOW_TARGET"
          : "PAGE_COUNT_ABOVE_TARGET",
      severity:
        "WARNING",
      sourceRef:
        "",
      message:
        pageDifference < 0
          ? `자동 구성 결과가 목표보다 ${Math.abs(
              pageDifference,
            )}페이지 부족합니다.`
          : `자동 구성 결과가 목표보다 ${pageDifference}페이지 많습니다.`,
      suggestedAction:
        pageDifference < 0
          ? "원고 분량과 사용 가능한 사진을 추가 확인합니다."
          : "중복 사진, 빈 페이지, 장별 분량을 다시 조정합니다.",
      requiresHumanReview:
        true,
    });
  }

  const numberedPageCount =
    pages.filter(
      (page) =>
        page.printedPageNumber !==
        null,
    ).length;

  const frontMatterPageCount =
    pages.filter(
      (page) =>
        page.printedPageNumber ===
        null,
    ).length;

  const blankPageCount =
    pages.filter(
      (page) =>
        page.pageType ===
        "BLANK",
    ).length;

  const textPageCount =
    pages.filter(
      (page) =>
        page.pageType ===
          "TEXT" ||
        page.pageType ===
          "INTRODUCTION" ||
        page.pageType ===
          "EPILOGUE",
    ).length;

  const photoPageCount =
    pages.filter(
      (page) =>
        page.pageType ===
          "PHOTO" ||
        page.pageType ===
          "PHOTO_GALLERY",
    ).length;

  return {
    version: 1,
    generatedAt,

    format: {
      name:
        "A5",
      trimWidthMm:
        148,
      trimHeightMm:
        210,
      bleedMm:
        3,
      safeMarginMm:
        12,
      layoutStyle:
        "WARM_EDITORIAL",
    },

    book: {
      title:
        manuscript.book.title ||
        snapshot.book.title,
      subtitle:
        manuscript.book.subtitle ||
        snapshot.book.subtitle ||
        "",
      coverText:
        manuscript.book.coverText,
      targetPageCount,
    },

    pages,

    summary: {
      totalPageCount,
      numberedPageCount,
      frontMatterPageCount,
      bodyPageCount:
        numberedPageCount -
        blankPageCount,
      blankPageCount,
      textPageCount,
      photoPageCount,
      usedPhotoCount:
        usedPhotoRefs.size,
      unusedIncludedPhotoCount:
        includedPhotos.filter(
          (photo) =>
            !usedPhotoRefs.has(
              photo.sourceRef,
            ),
        ).length,
      targetPageCount,
      pageDifference,
    },

    issues,
  };
}

function createCoverPhotos({
  includedPhotos,
  photoSourceMap,
  usedPhotoRefs,
}: {
  includedPhotos:
    AIBookFinalPhotoSelection["photoPlan"];
  photoSourceMap: Map<
    string,
    AIBookSourceSnapshot["items"][number]
  >;
  usedPhotoRefs: Set<string>;
}) {
  const coverPhoto =
    includedPhotos.find(
      (photo) =>
        photo.chapterNumbers.length ===
        0,
    ) ||
    includedPhotos[0];

  if (!coverPhoto) {
    return [];
  }

  return createLayoutPhotos({
    photos: [
      coverPhoto,
    ],
    photoSourceMap,
    usedPhotoRefs,
    fit:
      "COVER",
  });
}

function createLayoutPhotos({
  photos,
  photoSourceMap,
  usedPhotoRefs,
  fit,
}: {
  photos:
    AIBookFinalPhotoSelection["photoPlan"];
  photoSourceMap: Map<
    string,
    AIBookSourceSnapshot["items"][number]
  >;
  usedPhotoRefs: Set<string>;
  fit:
    | "COVER"
    | "CONTAIN";
}) {
  return photos.flatMap(
    (photo) => {
      const source =
        photoSourceMap.get(
          photo.sourceRef,
        );

      if (
        !source?.fileUrl
      ) {
        return [];
      }

      usedPhotoRefs.add(
        photo.sourceRef,
      );

      return [
        {
          sourceRef:
            photo.sourceRef,
          fileUrl:
            source.fileUrl,
          caption:
            photo.caption,
          placement:
            photo.placement,
          fit,
        },
      ];
    },
  );
}

function splitText(
  value: string,
  maxCharacters: number,
) {
  const normalized =
    normalizeParagraphs(
      value,
    );

  if (!normalized) {
    return [];
  }

  const paragraphs =
    normalized.split(
      "\n\n",
    );

  const chunks:
    string[] =
      [];

  let current =
    "";

  for (
    const paragraph of
    paragraphs
  ) {
    if (
      paragraph.length >
      maxCharacters
    ) {
      if (current) {
        chunks.push(
          current,
        );

        current =
          "";
      }

      chunks.push(
        ...splitLongParagraph(
          paragraph,
          maxCharacters,
        ),
      );

      continue;
    }

    const next =
      current
        ? `${current}\n\n${paragraph}`
        : paragraph;

    if (
      next.length >
      maxCharacters
    ) {
      if (current) {
        chunks.push(
          current,
        );
      }

      current =
        paragraph;
    } else {
      current =
        next;
    }
  }

  if (current) {
    chunks.push(
      current,
    );
  }

  return chunks;
}

function splitLongParagraph(
  paragraph: string,
  maxCharacters: number,
) {
  const sentences =
    paragraph
      .split(
        /(?<=[.!?。！？])\s+/,
      )
      .filter(Boolean);

  if (
    sentences.length <=
    1
  ) {
    const chunks:
      string[] =
        [];

    for (
      let index = 0;
      index <
      paragraph.length;
      index +=
        maxCharacters
    ) {
      chunks.push(
        paragraph.slice(
          index,
          index +
            maxCharacters,
        ),
      );
    }

    return chunks;
  }

  const chunks:
    string[] =
      [];

  let current =
    "";

  for (
    const sentence of
    sentences
  ) {
    const next =
      current
        ? `${current} ${sentence}`
        : sentence;

    if (
      next.length >
      maxCharacters
    ) {
      if (current) {
        chunks.push(
          current,
        );
      }

      current =
        sentence;
    } else {
      current =
        next;
    }
  }

  if (current) {
    chunks.push(
      current,
    );
  }

  return chunks;
}

function chunkArray<T>(
  values: T[],
  size: number,
) {
  const chunks:
    T[][] =
      [];

  for (
    let index = 0;
    index <
    values.length;
    index += size
  ) {
    chunks.push(
      values.slice(
        index,
        index + size,
      ),
    );
  }

  return chunks;
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

function uniqueStrings(
  values: string[],
) {
  return Array.from(
    new Set(
      values.filter(
        Boolean,
      ),
    ),
  );
}

function isPositiveInteger(
  value:
    | number
    | null,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isSafeInteger(
      value,
    ) &&
    value > 0
  );
}