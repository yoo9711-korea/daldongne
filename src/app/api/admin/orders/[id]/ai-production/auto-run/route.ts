import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type WorkflowStep =
  | "START"
  | "ANALYZE"
  | "MANUSCRIPT"
  | "PDF";

type WorkflowResponse = {
  ok?: boolean;
  message?: string;
  alreadyGenerated?: boolean;
  run?: {
    id?: string;
    attempt?: number;
    status?: string;
    currentStep?: string;
    requiresHumanReview?: boolean;
  };
  result?: {
    reviewRequired?: boolean;
    qualityBlocked?: boolean;
  };
};

type AutoRunStepResult = {
  step: WorkflowStep;
  label: string;
  ok: boolean;
  message?: string;
  status: number;
  run?: WorkflowResponse["run"];
  result?: WorkflowResponse["result"];
};

const DEFAULT_STEPS: WorkflowStep[] = [
  "START",
  "ANALYZE",
  "MANUSCRIPT",
  "PDF",
];

const STEP_LABELS: Record<
  WorkflowStep,
  string
> = {
  START: "제작 회차 생성",
  ANALYZE: "자료 분석·목차 구성",
  MANUSCRIPT:
    "원고·사진·페이지·품질 검수",
  PDF: "최종 PDF 생성",
};

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const { id } =
    await context.params;

  const orderRecordId =
    id.trim();

  if (!orderRecordId) {
    return createJsonResponse(
      {
        ok: false,
        message:
          "주문 정보를 찾을 수 없습니다.",
      },
      400,
    );
  }

  const body =
    await request
      .json()
      .catch(() => null);

  const steps =
    parseWorkflowSteps(body);

  if (steps.length === 0) {
    return createJsonResponse(
      {
        ok: false,
        message:
          "실행할 AI 제작 단계가 없습니다.",
      },
      400,
    );
  }

  const origin =
    new URL(request.url).origin;

  const completedSteps:
    AutoRunStepResult[] = [];

  for (const step of steps) {
    const stepResult =
      await callWorkflowStep({
        request,
        origin,
        orderRecordId,
        step,
      });

    completedSteps.push(
      stepResult,
    );

    if (!stepResult.ok) {
      return createJsonResponse(
        {
          ok: false,
          message:
            stepResult.message ||
            `${STEP_LABELS[step]} 작업을 완료하지 못했습니다.`,
          stoppedAt: step,
          completedSteps,
        },
        stepResult.status >= 400
          ? stepResult.status
          : 500,
      );
    }

    const stopMessage =
      validateStepResult(
        step,
        {
          ok: true,
          message:
            stepResult.message,
          run: stepResult.run,
          result:
            stepResult.result,
        },
      );

    if (stopMessage) {
      return createJsonResponse(
        {
          ok: true,
          stopped: true,
          message:
            stopMessage,
          stoppedAt: step,
          completedSteps,
        },
        200,
      );
    }
  }

  return createJsonResponse(
    {
      ok: true,
      message:
        "AI 전체 자동 제작과 최종 PDF 생성을 완료했습니다. 관리자 최종 승인 단계로 이동했습니다.",
      completedSteps,
    },
    200,
  );
}

async function callWorkflowStep({
  request,
  origin,
  orderRecordId,
  step,
}: {
  request: NextRequest;
  origin: string;
  orderRecordId: string;
  step: WorkflowStep;
}): Promise<AutoRunStepResult> {
  const endpoint =
    getWorkflowEndpoint(
      orderRecordId,
      step,
    );

  const headers =
    new Headers();

  headers.set(
    "Accept",
    "application/json",
  );

  const cookie =
    request.headers.get(
      "cookie",
    );

  if (cookie) {
    headers.set(
      "Cookie",
      cookie,
    );
  }

  const response =
    await fetch(
      new URL(
        endpoint,
        origin,
      ),
      {
        method: "POST",
        headers,
        cache: "no-store",
      },
    );

  const data =
    (await response
      .json()
      .catch(
        () => null,
      )) as
      | WorkflowResponse
      | null;

  return {
    step,
    label: STEP_LABELS[step],
    ok:
      response.ok &&
      data?.ok === true,
    message:
      data?.message ||
      undefined,
    status:
      response.status,
    run:
      data?.run,
    result:
      data?.result,
  };
}

function getWorkflowEndpoint(
  orderRecordId: string,
  step: WorkflowStep,
) {
  const encodedOrderId =
    encodeURIComponent(
      orderRecordId,
    );

  const basePath =
    `/api/admin/orders/${encodedOrderId}/ai-production`;

  if (step === "START") {
    return `${basePath}/start`;
  }

  if (step === "ANALYZE") {
    return `${basePath}/analyze`;
  }

  if (
    step ===
    "MANUSCRIPT"
  ) {
    return `${basePath}/manuscript`;
  }

  return `${basePath}/pdf`;
}

function parseWorkflowSteps(
  body: unknown,
): WorkflowStep[] {
  if (
    !isRecord(body) ||
    !Array.isArray(body.steps)
  ) {
    return DEFAULT_STEPS;
  }

  const steps =
    body.steps.filter(
      isWorkflowStep,
    );

  return steps.length > 0
    ? steps
    : DEFAULT_STEPS;
}

function isWorkflowStep(
  value: unknown,
): value is WorkflowStep {
  return (
    value === "START" ||
    value === "ANALYZE" ||
    value === "MANUSCRIPT" ||
    value === "PDF"
  );
}

function validateStepResult(
  step: WorkflowStep,
  data: WorkflowResponse,
): string | null {
  const status =
    cleanText(
      data.run?.status,
    );

  const currentStep =
    cleanText(
      data.run?.currentStep,
    );

  if (step === "START") {
    if (
      status ===
      "NEEDS_INPUT"
    ) {
      return (
        data.message ||
        "AI 제작에 사용할 자료가 부족하여 자동 제작을 멈췄습니다."
      );
    }

    if (
      status &&
      (
        status !==
          "QUEUED" ||
        currentStep !==
          "MATERIAL_ANALYSIS"
      )
    ) {
      return `제작 회차가 예상하지 않은 상태로 생성되어 자동 실행을 멈췄습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  if (
    step === "ANALYZE"
  ) {
    if (
      status ===
      "NEEDS_INPUT"
    ) {
      return (
        data.message ||
        "자료 분석 결과 사람의 입력이 필요하여 자동 제작을 멈췄습니다."
      );
    }

    if (
      status &&
      (
        status !==
          "RUNNING" ||
        currentStep !==
          "MANUSCRIPT_EDITING"
      )
    ) {
      return `자료 분석 후 다음 단계로 이동하지 못해 자동 실행을 멈췄습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  if (
    step ===
    "MANUSCRIPT"
  ) {
    if (
      status ===
        "NEEDS_INPUT" ||
      data.result
        ?.qualityBlocked ===
        true
    ) {
      return (
        data.message ||
        "품질 검수 차단 항목이 발견되어 최종 PDF 생성을 진행하지 않았습니다."
      );
    }

    if (
      status &&
      (
        status !==
          "RUNNING" ||
        currentStep !==
          "FINAL_PDF"
      )
    ) {
      return `원고 제작 후 최종 PDF 단계로 이동하지 못해 자동 실행을 멈췄습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  if (step === "PDF") {
    if (
      status &&
      status !==
        "READY_FOR_APPROVAL" &&
      status !==
        "APPROVED"
    ) {
      return `최종 PDF 생성 후 관리자 승인 단계로 이동하지 못했습니다. 현재 상태: ${status} / ${currentStep}`;
    }
  }

  return null;
}

function cleanText(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
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

function createJsonResponse(
  body: unknown,
  status: number,
) {
  return NextResponse.json(
    body,
    {
      status,
    },
  );
}