import { auth } from "@/auth";
import {
  recordBookOrderAudit,
} from "@/lib/order-audit";
import { prisma } from "@/lib/prisma";
import chromium from "@sparticuz/chromium";
import {
  AIBookProductionStatus,
  AIBookProductionStep,
} from "@prisma/client";
import {
  del,
  get,
  put,
} from "@vercel/blob";
import {
  existsSync,
} from "node:fs";
import {
  join,
} from "node:path";
import { revalidatePath } from "next/cache";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import puppeteer, {
  type Browser,
} from "puppeteer-core";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const maxDuration =
  300;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AdminIdentity = {
  id: string;
  name: string | null;
  email: string | null;
};

type ActiveRun = {
  id: string;
  attempt: number;
  status: AIBookProductionStatus;
  currentStep: AIBookProductionStep;
  finalPdfUrl: string | null;
  humanReviewReason: string | null;
};

class RouteError extends Error {
  status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name =
      "RouteError";
    this.status =
      status;
  }
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdmin();

    const { id } =
      await context.params;

    const orderRecordId =
      cleanText(id);

    if (!orderRecordId) {
      throw new RouteError(
        "주문 정보를 찾을 수 없습니다.",
        400,
      );
    }

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id:
            orderRecordId,
        },
        select: {
          id: true,
          orderId: true,
        },
      });

    if (!order) {
      throw new RouteError(
        "주문을 찾을 수 없습니다.",
        404,
      );
    }

    const run =
      await prisma.aIBookProductionRun.findFirst({
        where: {
          orderId:
            order.id,
          finalPdfUrl: {
            not: null,
          },
        },
        orderBy: {
          attempt:
            "desc",
        },
        select: {
          finalPdfUrl:
            true,
        },
      });

    const finalPdfUrl =
      cleanText(
        run?.finalPdfUrl,
      );

    if (!finalPdfUrl) {
      throw new RouteError(
        "생성된 최종 PDF가 없습니다.",
        404,
      );
    }

    const pathname =
      extractBlobPathname(
        finalPdfUrl,
      );

    if (!pathname) {
      throw new RouteError(
        "최종 PDF 저장 경로를 확인할 수 없습니다.",
        500,
      );
    }

    const token =
      cleanText(
        process.env
          .BLOB_READ_WRITE_TOKEN,
      );

    if (!token) {
      throw new RouteError(
        "Blob 저장소 환경변수가 설정되지 않았습니다.",
        500,
      );
    }

    const result =
      await get(pathname, {
        access:
          "private",
        token,
      });

    if (
      !result ||
      !result.stream
    ) {
      throw new RouteError(
        "최종 PDF 파일을 불러올 수 없습니다.",
        404,
      );
    }

    const safeOrderNumber =
      makeSafeFilename(
        order.orderId,
      );

    return new NextResponse(
      result.stream,
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/pdf",
          "Content-Disposition":
            `attachment; filename="${safeOrderNumber}-final.pdf"`,
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return handleRouteError(
      error,
      "[ADMIN_AI_PDF_DOWNLOAD_ERROR]",
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  let browser:
    Browser | null =
      null;

  let run:
    ActiveRun | null =
      null;

  let orderRecordId =
    "";

  let uploadedBlobUrl =
    "";

  let databaseSaved =
    false;

  try {
    const admin =
      await requireAdmin();

    const { id } =
      await context.params;

    orderRecordId =
      cleanText(id);

    if (!orderRecordId) {
      throw new RouteError(
        "주문 정보를 찾을 수 없습니다.",
        400,
      );
    }

    const token =
      cleanText(
        process.env
          .BLOB_READ_WRITE_TOKEN,
      );

    if (!token) {
      throw new RouteError(
        "BLOB_READ_WRITE_TOKEN 환경변수가 설정되지 않았습니다.",
        500,
      );
    }

    const order =
      await prisma.bookOrder.findUnique({
        where: {
          id:
            orderRecordId,
        },
        select: {
          id: true,
          orderId: true,
          status: true,
          productionStage:
            true,
          reviewStartedAt:
            true,
          bookId: true,
          book: {
            select: {
              title: true,
            },
          },
        },
      });

    if (!order) {
      throw new RouteError(
        "주문을 찾을 수 없습니다.",
        404,
      );
    }

    if (
  String(
    order.status,
  ) !== "PAID"
) {
      throw new RouteError(
        "결제가 완료된 제작 주문에서만 최종 PDF를 생성할 수 있습니다.",
        409,
      );
    }

    const latestRun =
      await prisma.aIBookProductionRun.findFirst({
        where: {
          orderId:
            order.id,
        },
        orderBy: {
          attempt:
            "desc",
        },
        select: {
          id: true,
          attempt: true,
          status: true,
          currentStep:
            true,
          finalPdfUrl:
            true,
          humanReviewReason:
            true,
          layoutData:
            true,
          qualityReport:
            true,
        },
      });

    if (!latestRun) {
      throw new RouteError(
        "AI 제작 실행 기록을 찾을 수 없습니다.",
        404,
      );
    }

    if (
  latestRun.finalPdfUrl &&
  (
    latestRun.status ===
      AIBookProductionStatus
        .READY_FOR_APPROVAL ||
    latestRun.status ===
      AIBookProductionStatus
        .APPROVED
  )
) {
      return NextResponse.json({
        ok: true,
        alreadyGenerated:
          true,
        message:
          "이미 최종 PDF가 생성돼 있습니다.",
        run: {
          id:
            latestRun.id,
          attempt:
            latestRun.attempt,
          status:
            latestRun.status,
          currentStep:
            latestRun.currentStep,
          downloadUrl:
            `/api/admin/orders/${order.id}/ai-production/pdf`,
        },
      });
    }

    if (
      latestRun.status !==
        AIBookProductionStatus
          .RUNNING ||
      latestRun.currentStep !==
        AIBookProductionStep
          .FINAL_PDF
    ) {
      throw new RouteError(
        "현재 AI 제작 단계에서는 최종 PDF를 생성할 수 없습니다.",
        409,
      );
    }

    if (
      !latestRun.layoutData
    ) {
      throw new RouteError(
        "PDF에 사용할 페이지 구성 결과가 없습니다.",
        409,
      );
    }

    if (
      !latestRun.qualityReport
    ) {
      throw new RouteError(
        "PDF 생성 전에 품질 검수 결과가 필요합니다.",
        409,
      );
    }

    /*
     * RUNNING 상태를 QUEUED로 잠시 변경해
     * 같은 PDF 생성 요청이 동시에 실행되는 것을 막습니다.
     */
    const claimed =
      await prisma.aIBookProductionRun.updateMany({
        where: {
          id:
            latestRun.id,
          status:
            AIBookProductionStatus
              .RUNNING,
          currentStep:
            AIBookProductionStep
              .FINAL_PDF,
        },
        data: {
          status:
            AIBookProductionStatus
              .QUEUED,
        },
      });

    if (
      claimed.count !== 1
    ) {
      throw new RouteError(
        "다른 PDF 생성 작업이 이미 진행 중입니다.",
        409,
      );
    }

    run = {
      id:
        latestRun.id,
      attempt:
        latestRun.attempt,
      status:
        AIBookProductionStatus
          .QUEUED,
      currentStep:
        latestRun.currentStep,
      finalPdfUrl:
        latestRun.finalPdfUrl,
      humanReviewReason:
        latestRun.humanReviewReason,
    };

    const executablePath =
      await resolveChromeExecutablePath();

    browser =
      await puppeteer.launch({
        args:
          chromium.args,
        defaultViewport: {
          width:
            1120,
          height:
            1600,
          deviceScaleFactor:
            1,
        },
        executablePath,
        headless:
          "shell",
      });

    const page =
      await browser.newPage();

    const cookieHeader =
      request.headers.get(
        "cookie",
      );

    if (cookieHeader) {
      await page.setExtraHTTPHeaders({
        cookie:
          cookieHeader,
      });
    }

    const renderUrl =
      new URL(
        `/internal/ai-book-pdf/${encodeURIComponent(
          order.id,
        )}`,
        request.nextUrl.origin,
      );

    const response =
      await page.goto(
        renderUrl.toString(),
        {
          waitUntil:
            "domcontentloaded",
          timeout:
            120000,
        },
      );

    if (
      !response ||
      !response.ok()
    ) {
      throw new Error(
        `PDF 전용 페이지를 불러오지 못했습니다. HTTP ${
          response?.status() ??
          "UNKNOWN"
        }`,
      );
    }

    await page.waitForSelector(
      '[data-pdf-ready="true"]',
      {
        timeout:
          120000,
      },
    );

    await page.evaluate(
      async () => {
        await document.fonts.ready;

        const images =
          Array.from(
            document.images,
          );

        await Promise.all(
          images.map(
            (image) =>
              new Promise<void>(
                (
                  resolve,
                ) => {
                  if (
                    image.complete
                  ) {
                    resolve();
                    return;
                  }

                  let finished =
                    false;

                  const finish =
                    () => {
                      if (
                        finished
                      ) {
                        return;
                      }

                      finished =
                        true;
                      resolve();
                    };

                  image.addEventListener(
                    "load",
                    finish,
                    {
                      once:
                        true,
                    },
                  );

                  image.addEventListener(
                    "error",
                    finish,
                    {
                      once:
                        true,
                    },
                  );

                  window.setTimeout(
                    finish,
                    30000,
                  );
                },
              ),
          ),
        );

        const failedImages =
          images.filter(
            (image) =>
              !image.complete ||
              image.naturalWidth ===
                0 ||
              image.naturalHeight ===
                0,
          );

        if (
          failedImages.length >
          0
        ) {
          throw new Error(
            `PDF 사진 ${failedImages.length}개를 불러오지 못했습니다.`,
          );
        }
      },
    );

    await page.emulateMediaType(
      "print",
    );

    const pdfBytes =
      await page.pdf({
        printBackground:
          true,
        preferCSSPageSize:
          true,
        width:
          "148mm",
        height:
          "210mm",
        margin: {
          top:
            "0mm",
          right:
            "0mm",
          bottom:
            "0mm",
          left:
            "0mm",
        },
        waitForFonts:
          true,
        timeout:
          120000,
      });

    if (
      pdfBytes.byteLength ===
      0
    ) {
      throw new Error(
        "생성된 PDF 파일이 비어 있습니다.",
      );
    }

    const pathname =
      createPdfPathname({
        orderNumber:
          order.orderId,
        attempt:
          run.attempt,
      });

    const uploaded =
      await put(
        pathname,
        Buffer.from(
          pdfBytes,
        ),
        {
          access:
            "private",
          contentType:
            "application/pdf",
          addRandomSuffix:
            false,
          token,
        },
      );

    uploadedBlobUrl =
      uploaded.url;

    if (!uploadedBlobUrl) {
      throw new Error(
        "최종 PDF를 Blob 저장소에 저장하지 못했습니다.",
      );
    }

    const now =
      new Date();

    const finalReviewReason =
      joinReviewReasons(
        run.humanReviewReason,
        "최종 PDF 생성이 완료됐습니다. 관리자의 최종 승인과 인쇄 전 확인이 필요합니다.",
      );

    const updatedRun =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          const savedRun =
            await transaction.aIBookProductionRun.update({
              where: {
                id:
                  run!.id,
              },
              data: {
                finalPdfUrl:
                  uploadedBlobUrl,
                status:
                  AIBookProductionStatus
                    .READY_FOR_APPROVAL,
                currentStep:
                  AIBookProductionStep
                    .ADMIN_APPROVAL,
                requiresHumanReview:
                  true,
                humanReviewReason:
                  finalReviewReason,
                completedAt:
                  now,
              },
              select: {
                id: true,
                attempt:
                  true,
                status:
                  true,
                currentStep:
                  true,
                finalPdfUrl:
                  true,
                requiresHumanReview:
                  true,
                humanReviewReason:
                  true,
                completedAt:
                  true,
                updatedAt:
                  true,
              },
            });

          await transaction.bookOrder.update({
            where: {
              id:
                order.id,
            },
            data: {
                productionStage:
                "PROOFING",
              productionStageUpdatedAt:
                now,
              reviewStartedAt:
                order.reviewStartedAt ??
                now,
              proofFileUrl:
                uploadedBlobUrl,
            },
          });

          return savedRun;
        },
      );

    databaseSaved =
      true;

    try {
      await recordBookOrderAudit({
        orderId:
          order.id,
        actorId:
          admin.id,
        actorName:
          admin.name,
        actorEmail:
          admin.email,
        source:
          "ADMIN",
        category:
          "PRODUCTION",
        action:
          "AI_FINAL_PDF_GENERATED",
        summary:
          `AI 자동 제작 ${run.attempt}차 최종 PDF를 생성했습니다.`,
        before: {
          aiProductionRunId:
            run.id,
          status:
            AIBookProductionStatus
              .RUNNING,
          currentStep:
            AIBookProductionStep
              .FINAL_PDF,
          finalPdfUrl:
            null,
          productionStage:
            order.productionStage,
        },
        after: {
          aiProductionRunId:
            updatedRun.id,
          status:
            updatedRun.status,
          currentStep:
            updatedRun.currentStep,
          finalPdfUrl:
            uploadedBlobUrl,
          productionStage:
            "PROOFING",
          requiresHumanReview:
            updatedRun.requiresHumanReview,
          completedAt:
            updatedRun.completedAt,
          pdfByteLength:
            pdfBytes.byteLength,
        },
        isCustomerVisible:
          false,
      });
    } catch (auditError) {
      console.error(
        "[ADMIN_AI_FINAL_PDF_AUDIT_ERROR]",
        auditError,
      );
    }

    revalidateAIProductionPaths(
      order.id,
      order.bookId,
    );

    return NextResponse.json({
      ok: true,
      message:
        "최종 PDF를 생성했습니다. 관리자 최종 승인 단계로 이동했습니다.",
      run: {
        id:
          updatedRun.id,
        attempt:
          updatedRun.attempt,
        status:
          updatedRun.status,
        currentStep:
          updatedRun.currentStep,
        requiresHumanReview:
          updatedRun.requiresHumanReview,
        completedAt:
          updatedRun.completedAt,
        downloadUrl:
          `/api/admin/orders/${order.id}/ai-production/pdf`,
      },
    });
  } catch (error) {
    const errorMessage =
      getErrorMessage(
        error,
      );

    if (
      uploadedBlobUrl &&
      !databaseSaved
    ) {
      try {
        await del(
          uploadedBlobUrl,
          {
            token:
              process.env
                .BLOB_READ_WRITE_TOKEN,
          },
        );
      } catch (cleanupError) {
        console.error(
          "[ADMIN_AI_FINAL_PDF_BLOB_CLEANUP_ERROR]",
          cleanupError,
        );
      }
    }

    if (
      run &&
      !databaseSaved
    ) {
      try {
        const failedReason =
          joinReviewReasons(
            run.humanReviewReason,
            `최종 PDF 생성 실패: ${errorMessage}`,
          );

        await prisma.aIBookProductionRun.updateMany({
          where: {
            id:
              run.id,
            currentStep:
              AIBookProductionStep
                .FINAL_PDF,
          },
          data: {
            status:
              AIBookProductionStatus
                .FAILED,
            requiresHumanReview:
              true,
            humanReviewReason:
              failedReason,
          },
        });

        try {
          const admin =
            await getOptionalAdmin();

          await recordBookOrderAudit({
            orderId:
              orderRecordId,
            actorId:
              admin?.id ??
              null,
            actorName:
              admin?.name ??
              null,
            actorEmail:
              admin?.email ??
              null,
            source:
              "ADMIN",
            category:
              "PRODUCTION",
            action:
              "AI_FINAL_PDF_FAILED",
            summary:
              `AI 자동 제작 ${run.attempt}차 최종 PDF 생성에 실패했습니다.`,
            before: {
              aiProductionRunId:
                run.id,
              status:
                AIBookProductionStatus
                  .QUEUED,
              currentStep:
                AIBookProductionStep
                  .FINAL_PDF,
            },
            after: {
              aiProductionRunId:
                run.id,
              status:
                AIBookProductionStatus
                  .FAILED,
              currentStep:
                AIBookProductionStep
                  .FINAL_PDF,
              error:
                errorMessage,
            },
            isCustomerVisible:
              false,
          });
        } catch (auditError) {
          console.error(
            "[ADMIN_AI_FINAL_PDF_FAILED_AUDIT_ERROR]",
            auditError,
          );
        }

        revalidateAIProductionPaths(
          orderRecordId,
          "",
        );
      } catch (updateError) {
        console.error(
          "[ADMIN_AI_FINAL_PDF_FAILURE_UPDATE_ERROR]",
          updateError,
        );
      }
    }

    return handleRouteError(
      error,
      "[ADMIN_AI_FINAL_PDF_ERROR]",
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error(
          "[ADMIN_AI_FINAL_PDF_BROWSER_CLOSE_ERROR]",
          closeError,
        );
      }
    }
  }
}

async function requireAdmin(): Promise<AdminIdentity> {
  const session =
    await auth();

  const userId =
    session?.user?.id;

  if (!userId) {
    throw new RouteError(
      "로그인이 필요합니다.",
      401,
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id:
          userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

  if (
    !user ||
    user.role !==
      "ADMIN"
  ) {
    throw new RouteError(
      "관리자만 최종 PDF를 관리할 수 있습니다.",
      403,
    );
  }

  return {
    id:
      user.id,
    name:
      user.name,
    email:
      user.email,
  };
}

async function getOptionalAdmin() {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}

async function resolveChromeExecutablePath() {
  const configuredPath =
    cleanText(
      process.env
        .CHROME_EXECUTABLE_PATH,
    );

  if (
    configuredPath &&
    existsSync(
      configuredPath,
    )
  ) {
    return configuredPath;
  }

  const localPath =
    findLocalChromePath();

  if (localPath) {
    return localPath;
  }

  return chromium.executablePath();
}

function findLocalChromePath() {
  const candidates:
    string[] =
      [];

  if (
    process.platform ===
    "win32"
  ) {
    const programFiles =
      cleanText(
        process.env
          .PROGRAMFILES,
      );

    const programFilesX86 =
      cleanText(
        process.env[
          "PROGRAMFILES(X86)"
        ],
      );

    const localAppData =
      cleanText(
        process.env
          .LOCALAPPDATA,
      );

    if (programFiles) {
      candidates.push(
        join(
          programFiles,
          "Google",
          "Chrome",
          "Application",
          "chrome.exe",
        ),
      );

      candidates.push(
        join(
          programFiles,
          "Microsoft",
          "Edge",
          "Application",
          "msedge.exe",
        ),
      );
    }

    if (programFilesX86) {
      candidates.push(
        join(
          programFilesX86,
          "Google",
          "Chrome",
          "Application",
          "chrome.exe",
        ),
      );

      candidates.push(
        join(
          programFilesX86,
          "Microsoft",
          "Edge",
          "Application",
          "msedge.exe",
        ),
      );
    }

    if (localAppData) {
      candidates.push(
        join(
          localAppData,
          "Google",
          "Chrome",
          "Application",
          "chrome.exe",
        ),
      );

      candidates.push(
        join(
          localAppData,
          "Microsoft",
          "Edge",
          "Application",
          "msedge.exe",
        ),
      );
    }
  }

  if (
    process.platform ===
    "darwin"
  ) {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    );

    candidates.push(
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    );
  }

  if (
    process.platform ===
    "linux"
  ) {
    candidates.push(
      "/usr/bin/google-chrome",
    );

    candidates.push(
      "/usr/bin/google-chrome-stable",
    );

    candidates.push(
      "/usr/bin/chromium",
    );

    candidates.push(
      "/usr/bin/chromium-browser",
    );
  }

  return (
    candidates.find(
      (candidate) =>
        existsSync(
          candidate,
        ),
    ) ||
    ""
  );
}

function createPdfPathname({
  orderNumber,
  attempt,
}: {
  orderNumber: string;
  attempt: number;
}) {
  const safeOrderNumber =
    makeSafeFilename(
      orderNumber,
    );

  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-",
      );

  return [
    "ai-book-pdfs",
    safeOrderNumber,
    `attempt-${attempt}`,
    `${safeOrderNumber}-attempt-${attempt}-${timestamp}.pdf`,
  ].join("/");
}

function extractBlobPathname(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return url.pathname.replace(
      /^\/+/,
      "",
    );
  } catch {
    return value.replace(
      /^\/+/,
      "",
    );
  }
}

function makeSafeFilename(
  value: string,
) {
  const cleaned =
    cleanText(value)
      .replace(
        /[^a-zA-Z0-9가-힣_-]/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^-|-$/g,
        "",
      );

  return (
    cleaned ||
    "daldongne-book"
  );
}

function joinReviewReasons(
  previous: string | null,
  next: string,
) {
  return Array.from(
    new Set(
      [
        cleanText(
          previous,
        ),
        cleanText(
          next,
        ),
      ].filter(Boolean),
    ),
  ).join("\n");
}

function cleanText(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function getErrorMessage(
  error: unknown,
) {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return "알 수 없는 오류가 발생했습니다.";
}

function handleRouteError(
  error: unknown,
  logLabel: string,
) {
  const message =
    getErrorMessage(
      error,
    );

  const status =
    error instanceof
    RouteError
      ? error.status
      : 500;

  console.error(
    logLabel,
    error,
  );

  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status,
    },
  );
}

function revalidateAIProductionPaths(
  orderRecordId: string,
  bookId: string,
) {
  revalidatePath(
    "/admin",
  );

  revalidatePath(
    "/admin/orders",
  );

  if (orderRecordId) {
    revalidatePath(
      `/admin/orders/${orderRecordId}`,
    );

    revalidatePath(
      `/internal/ai-book-pdf/${orderRecordId}`,
    );
  }

  revalidatePath(
    "/dashboard/orders",
  );

  if (bookId) {
    revalidatePath(
      `/dashboard/library/${bookId}`,
    );
  }
}