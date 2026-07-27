import { prisma } from "@/lib/prisma";

type BuildSourceSnapshotInput = {
  bookId: string;
  authorId: string;
};

export type AIBookSourceSnapshot = {
  version: 1;
  generatedAt: string;
  book: {
    id: string;
    title: string;
    subtitle: string | null;
    summary: string | null;
    type: string;
    pageCount: number | null;
  };
  counts: {
    total: number;
    photos: number;
    textItems: number;
    itemsWithStory: number;
    emptyItems: number;
  };
  items: Array<{
    sourceRef: string;
    order: number;
    type: string;
    title: string | null;
    description: string | null;
    fileUrl: string | null;
    occurredAt: string | null;
    createdAt: string;
    updatedAt: string;
    hasPhoto: boolean;
    hasStory: boolean;
  }>;
  sourceAlerts: Array<{
    code: string;
    severity: "INFO" | "WARNING";
    sourceRef: string;
    message: string;
  }>;
};

export async function buildAIBookSourceSnapshot({
  bookId,
  authorId,
}: BuildSourceSnapshotInput): Promise<AIBookSourceSnapshot> {
  const book =
    await prisma.book.findFirst({
      where: {
        id: bookId,
        authorId,
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        summary: true,
        type: true,
        pageCount: true,
        bookMemories: {
          orderBy: [
            {
              order: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
          select: {
            order: true,
            memory: {
              select: {
                id: true,
                type: true,
                title: true,
                description: true,
                fileUrl: true,
                occurredAt: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

  if (!book) {
    throw new Error(
      "AI 제작에 사용할 책을 찾을 수 없습니다.",
    );
  }

  const items =
    book.bookMemories.map(
      (bookMemory) => {
        const memory =
          bookMemory.memory;

        const title =
          normalizeOptionalText(
            memory.title,
          );

        const description =
          normalizeOptionalText(
            memory.description,
          );

        const fileUrl =
          normalizeOptionalText(
            memory.fileUrl,
          );

        const hasPhoto =
          String(memory.type) ===
            "PHOTO" &&
          Boolean(fileUrl);

        const hasStory =
          Boolean(
            title ||
              description,
          );

        return {
          sourceRef: memory.id,
          order: bookMemory.order,
          type: String(
            memory.type,
          ),
          title,
          description,
          fileUrl,
          occurredAt:
            memory.occurredAt?.toISOString() ||
            null,
          createdAt:
            memory.createdAt.toISOString(),
          updatedAt:
            memory.updatedAt.toISOString(),
          hasPhoto,
          hasStory,
        };
      },
    );

  const sourceAlerts:
    AIBookSourceSnapshot["sourceAlerts"] =
      [];

  for (const item of items) {
    if (
      item.type === "PHOTO" &&
      !item.fileUrl
    ) {
      sourceAlerts.push({
        code: "PHOTO_FILE_MISSING",
        severity: "WARNING",
        sourceRef:
          item.sourceRef,
        message:
          "사진 자료에 파일 주소가 없습니다.",
      });
    }

    if (
      !item.hasPhoto &&
      !item.hasStory
    ) {
      sourceAlerts.push({
        code: "EMPTY_SOURCE_ITEM",
        severity: "WARNING",
        sourceRef:
          item.sourceRef,
        message:
          "사진이나 이야기 내용이 없는 자료입니다.",
      });
    }

    if (
      item.type === "PHOTO" &&
      item.fileUrl &&
      !item.hasStory
    ) {
      sourceAlerts.push({
        code: "PHOTO_STORY_MISSING",
        severity: "INFO",
        sourceRef:
          item.sourceRef,
        message:
          "사진은 있지만 설명이나 이야기가 없습니다.",
      });
    }

    if (
      item.hasStory &&
      !item.occurredAt
    ) {
      sourceAlerts.push({
        code: "DATE_MISSING",
        severity: "INFO",
        sourceRef:
          item.sourceRef,
        message:
          "이야기의 발생 날짜가 등록되지 않았습니다.",
      });
    }
  }

  const photos =
    items.filter(
      (item) =>
        item.hasPhoto,
    ).length;

  const textItems =
    items.filter(
      (item) =>
        item.type === "TEXT",
    ).length;

  const itemsWithStory =
    items.filter(
      (item) =>
        item.hasStory,
    ).length;

  const emptyItems =
    items.filter(
      (item) =>
        !item.hasPhoto &&
        !item.hasStory,
    ).length;

  return {
    version: 1,
    generatedAt:
      new Date().toISOString(),
    book: {
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      summary: book.summary,
      type: String(
        book.type,
      ),
      pageCount:
        book.pageCount,
    },
    counts: {
      total: items.length,
      photos,
      textItems,
      itemsWithStory,
      emptyItems,
    },
    items,
    sourceAlerts,
  };
}

function normalizeOptionalText(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized ||
    null;
}