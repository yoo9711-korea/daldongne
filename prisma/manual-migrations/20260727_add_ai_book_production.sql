DO $$
BEGIN
    CREATE TYPE "AIBookProductionMode" AS ENUM (
        'AUTOMATIC',
        'CUSTOMER_REVIEW'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "AIBookProductionStatus" AS ENUM (
        'QUEUED',
        'RUNNING',
        'NEEDS_INPUT',
        'READY_FOR_APPROVAL',
        'APPROVED',
        'REJECTED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "AIBookProductionStep" AS ENUM (
        'MATERIAL_ANALYSIS',
        'OUTLINE_GENERATION',
        'MANUSCRIPT_EDITING',
        'PHOTO_SELECTION',
        'LAYOUT_GENERATION',
        'QUALITY_CHECK',
        'FINAL_PDF',
        'ADMIN_APPROVAL'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "AIBookProductionIssueSeverity" AS ENUM (
        'INFO',
        'WARNING',
        'BLOCKER'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "AIBookProductionIssueStatus" AS ENUM (
        'OPEN',
        'RESOLVED',
        'IGNORED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ai_book_production_runs" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "order_id" TEXT,
    "author_id" TEXT NOT NULL,

    "mode" "AIBookProductionMode"
        NOT NULL
        DEFAULT 'AUTOMATIC',

    "status" "AIBookProductionStatus"
        NOT NULL
        DEFAULT 'QUEUED',

    "current_step" "AIBookProductionStep"
        NOT NULL
        DEFAULT 'MATERIAL_ANALYSIS',

    "attempt" INTEGER NOT NULL DEFAULT 1,

    "source_snapshot" JSONB NOT NULL,
    "outline_data" JSONB,
    "manuscript_data" JSONB,
    "photo_selection_data" JSONB,
    "layout_data" JSONB,
    "quality_report" JSONB,

    "final_pdf_url" TEXT,

    "requires_human_review"
        BOOLEAN
        NOT NULL
        DEFAULT false,

    "human_review_reason" TEXT,
    "admin_decision_note" TEXT,
    "approved_by_id" TEXT,

    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),

    "created_at"
        TIMESTAMP(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    "updated_at"
        TIMESTAMP(3)
        NOT NULL,

    CONSTRAINT "ai_book_production_runs_pkey"
        PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_book_production_issues" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    "severity"
        "AIBookProductionIssueSeverity"
        NOT NULL,

    "status"
        "AIBookProductionIssueStatus"
        NOT NULL
        DEFAULT 'OPEN',

    "message" TEXT NOT NULL,
    "source_ref" TEXT,
    "suggested_action" TEXT,
    "confidence" DOUBLE PRECISION,
    "details" JSONB,
    "resolved_at" TIMESTAMP(3),

    "created_at"
        TIMESTAMP(3)
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_book_production_issues_pkey"
        PRIMARY KEY ("id")
);

DO $$
BEGIN
    ALTER TABLE "ai_book_production_runs"
        ADD CONSTRAINT "ai_book_production_runs_book_id_fkey"
        FOREIGN KEY ("book_id")
        REFERENCES "books"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "ai_book_production_runs"
        ADD CONSTRAINT "ai_book_production_runs_order_id_fkey"
        FOREIGN KEY ("order_id")
        REFERENCES "book_orders"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "ai_book_production_runs"
        ADD CONSTRAINT "ai_book_production_runs_author_id_fkey"
        FOREIGN KEY ("author_id")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "ai_book_production_issues"
        ADD CONSTRAINT "ai_book_production_issues_run_id_fkey"
        FOREIGN KEY ("run_id")
        REFERENCES "ai_book_production_runs"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS
    "ai_book_production_runs_book_id_attempt_key"
ON "ai_book_production_runs" (
    "book_id",
    "attempt"
);

CREATE INDEX IF NOT EXISTS
    "ai_book_production_runs_order_id_idx"
ON "ai_book_production_runs" (
    "order_id"
);

CREATE INDEX IF NOT EXISTS
    "ai_book_production_runs_author_id_created_at_idx"
ON "ai_book_production_runs" (
    "author_id",
    "created_at"
);

CREATE INDEX IF NOT EXISTS
    "ai_book_production_runs_status_current_step_created_at_idx"
ON "ai_book_production_runs" (
    "status",
    "current_step",
    "created_at"
);

CREATE INDEX IF NOT EXISTS
    "ai_book_production_issues_run_id_status_severity_idx"
ON "ai_book_production_issues" (
    "run_id",
    "status",
    "severity"
);

CREATE INDEX IF NOT EXISTS
    "ai_book_production_issues_status_severity_created_at_idx"
ON "ai_book_production_issues" (
    "status",
    "severity",
    "created_at"
);
