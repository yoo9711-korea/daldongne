UPDATE "ai_book_production_runs" AS "run"
SET "approved_by_id" = NULL
WHERE
    "run"."approved_by_id" IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM "users" AS "user"
        WHERE
            "user"."id" =
            "run"."approved_by_id"
    );

UPDATE "book_order_proof_reviews" AS "review"
SET "resolved_by_id" = NULL
WHERE
    "review"."resolved_by_id" IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM "users" AS "user"
        WHERE
            "user"."id" =
            "review"."resolved_by_id"
    );

DO $$
BEGIN
    ALTER TABLE "ai_book_production_runs"
        ADD CONSTRAINT "ai_book_production_runs_approved_by_id_fkey"
        FOREIGN KEY ("approved_by_id")
        REFERENCES "users"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "book_order_proof_reviews"
        ADD CONSTRAINT "book_order_proof_reviews_resolved_by_id_fkey"
        FOREIGN KEY ("resolved_by_id")
        REFERENCES "users"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

CREATE INDEX IF NOT EXISTS
    "ai_book_production_runs_approved_by_id_idx"
ON "ai_book_production_runs" (
    "approved_by_id"
);

CREATE INDEX IF NOT EXISTS
    "book_order_proof_reviews_resolved_by_id_idx"
ON "book_order_proof_reviews" (
    "resolved_by_id"
);