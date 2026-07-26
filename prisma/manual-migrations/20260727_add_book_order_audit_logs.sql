CREATE TABLE IF NOT EXISTS "book_order_audit_logs" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "actor_email" TEXT,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "before_data" JSONB NOT NULL,
    "after_data" JSONB NOT NULL,
    "changed_fields" JSONB NOT NULL,
    "is_customer_visible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_order_audit_logs_pkey"
        PRIMARY KEY ("id")
);

DO $$
BEGIN
    ALTER TABLE "book_order_audit_logs"
        ADD CONSTRAINT "book_order_audit_logs_order_id_fkey"
        FOREIGN KEY ("order_id")
        REFERENCES "book_orders"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "book_order_audit_logs"
        ADD CONSTRAINT "book_order_audit_logs_actor_id_fkey"
        FOREIGN KEY ("actor_id")
        REFERENCES "users"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS
    "book_order_audit_logs_order_id_created_at_idx"
ON "book_order_audit_logs"(
    "order_id",
    "created_at"
);

CREATE INDEX IF NOT EXISTS
    "book_order_audit_logs_actor_id_created_at_idx"
ON "book_order_audit_logs"(
    "actor_id",
    "created_at"
);

CREATE INDEX IF NOT EXISTS
    "book_order_audit_logs_category_created_at_idx"
ON "book_order_audit_logs"(
    "category",
    "created_at"
);

CREATE INDEX IF NOT EXISTS
    "book_order_audit_logs_source_created_at_idx"
ON "book_order_audit_logs"(
    "source",
    "created_at"
);

CREATE INDEX IF NOT EXISTS
    "book_order_audit_logs_is_customer_visible_created_at_idx"
ON "book_order_audit_logs"(
    "is_customer_visible",
    "created_at"
);

INSERT INTO "book_order_audit_logs" (
    "id",
    "order_id",
    "actor_id",
    "actor_name",
    "actor_email",
    "source",
    "category",
    "action",
    "summary",
    "before_data",
    "after_data",
    "changed_fields",
    "is_customer_visible",
    "created_at"
)
SELECT
    'audit_' || md5(
        random()::text ||
        clock_timestamp()::text ||
        orders."id"
    ),
    orders."id",
    NULL,
    NULL,
    NULL,
    'SYSTEM',
    'ORDER',
    'AUDIT_BASELINE',
    '감사 로그 기능 적용 시점의 기존 주문 상태를 기록했습니다.',
    '{}'::jsonb,
    jsonb_build_object(
        'orderId', orders."orderId",
        'status', orders."status",
        'productionStage', orders."productionStage",
        'productName', orders."productName",
        'quantity', orders."quantity",
        'totalAmount', orders."totalAmount",
        'paymentMethod', orders."paymentMethod",
        'shippingCarrier', orders."shippingCarrier",
        'trackingNumber', orders."trackingNumber",
        'updatedAt', orders."updatedAt"
    ),
    '["baseline"]'::jsonb,
    false,
    CURRENT_TIMESTAMP
FROM "book_orders" AS orders
WHERE NOT EXISTS (
    SELECT 1
    FROM "book_order_audit_logs" AS logs
    WHERE logs."order_id" = orders."id"
);