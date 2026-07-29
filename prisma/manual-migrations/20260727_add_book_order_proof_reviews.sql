CREATE TABLE IF NOT EXISTS "book_order_proof_reviews" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "proof_file_url" TEXT NOT NULL,
    "proof_sent_at" TIMESTAMP(3) NOT NULL,
    "response_type" TEXT NOT NULL,
    "message" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_order_proof_reviews_pkey"
        PRIMARY KEY ("id")
);

DO $$
BEGIN
    ALTER TABLE "book_order_proof_reviews"
        ADD CONSTRAINT "book_order_proof_reviews_order_id_fkey"
        FOREIGN KEY ("order_id")
        REFERENCES "book_orders"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "book_order_proof_reviews"
        ADD CONSTRAINT "book_order_proof_reviews_author_id_fkey"
        FOREIGN KEY ("author_id")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS
    "book_order_proof_reviews_order_id_proof_sent_at_key"
ON "book_order_proof_reviews" (
    "order_id",
    "proof_sent_at"
);

CREATE INDEX IF NOT EXISTS
    "book_order_proof_reviews_order_id_created_at_idx"
ON "book_order_proof_reviews" (
    "order_id",
    "created_at"
);

CREATE INDEX IF NOT EXISTS
    "book_order_proof_reviews_author_id_created_at_idx"
ON "book_order_proof_reviews" (
    "author_id",
    "created_at"
);

CREATE INDEX IF NOT EXISTS
    "book_order_proof_reviews_response_type_resolved_at_idx"
ON "book_order_proof_reviews" (
    "response_type",
    "resolved_at"
);
