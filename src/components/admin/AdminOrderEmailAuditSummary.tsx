import AdminOrderEmailAuditClient, {
  type AdminOrderEmailAuditLogItem,
} from "@/components/admin/AdminOrderEmailAuditClient";
import { prisma } from "@/lib/prisma";

const INITIAL_PAGE_SIZE = 10;

const EMAIL_AUDIT_ACTIONS = [
  "CUSTOMER_SHIPPING_EMAIL_SENT",
  "CUSTOMER_SHIPPING_EMAIL_SKIPPED",
  "CUSTOMER_SHIPPING_EMAIL_FAILED",
  "CUSTOMER_COMPLETION_EMAIL_SENT",
  "CUSTOMER_COMPLETION_EMAIL_SKIPPED",
  "CUSTOMER_COMPLETION_EMAIL_FAILED",
];

export default async function AdminOrderEmailAuditSummary({
  orderRecordId,
}: {
  orderRecordId: string;
}) {
  const where = {
    orderId: orderRecordId,

    action: {
      in: EMAIL_AUDIT_ACTIONS,
    },
  };

  const [
    totalCount,
    records,
  ] = await Promise.all([
    prisma.bookOrderAuditLog.count({
      where,
    }),

    prisma.bookOrderAuditLog.findMany({
      where,

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      take:
        INITIAL_PAGE_SIZE + 1,

      select: {
        id: true,
        action: true,
        summary: true,
        afterData: true,
        createdAt: true,
      },
    }),
  ]);

  const initialHasMore =
    records.length >
    INITIAL_PAGE_SIZE;

  const initialRecords =
    initialHasMore
      ? records.slice(
          0,
          INITIAL_PAGE_SIZE,
        )
      : records;

  const initialLogs:
    AdminOrderEmailAuditLogItem[] =
    initialRecords.map(
      (log) => ({
        id:
          log.id,

        action:
          log.action,

        summary:
          log.summary,

        afterData:
          log.afterData,

        createdAt:
          log.createdAt.toISOString(),
      }),
    );

  const initialNextCursor =
    initialHasMore &&
    initialLogs.length > 0
      ? initialLogs[
          initialLogs.length - 1
        ].id
      : null;

  return (
    <section className="admin-order-email-audit">
      <div className="admin-order-email-audit-heading">
        <div>
          <p>
            CUSTOMER NOTIFICATION
          </p>

          <h2>
            고객 알림 발송 기록
          </h2>

          <span>
            배송 시작과 제작 완료 안내
            이메일의 처리 결과를
            확인합니다.
          </span>
        </div>

        <strong>
          총{" "}
          {totalCount.toLocaleString()}
          건
        </strong>
      </div>

      {totalCount > 0 ? (
        <AdminOrderEmailAuditClient
          orderRecordId={
            orderRecordId
          }
          initialLogs={
            initialLogs
          }
          initialTotalCount={
            totalCount
          }
          initialHasMore={
            initialHasMore
          }
          initialNextCursor={
            initialNextCursor
          }
        />
      ) : (
        <div className="admin-order-email-audit-empty">
          아직 기록된 고객 알림 발송
          내역이 없습니다.
        </div>
      )}

      <style>
        {`
          .admin-order-email-audit {
            margin-top: 24px;
            padding: 22px;
            border: 1px solid #eaded8;
            border-radius: 18px;
            background: #fffdfb;
          }

          .admin-order-email-audit-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
          }

          .admin-order-email-audit-heading p {
            margin: 0 0 7px;
            color: #c06c56;
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 0.14em;
          }

          .admin-order-email-audit-heading h2 {
            margin: 0;
            color: #4c382f;
            font-size: 18px;
            line-height: 1.35;
          }

          .admin-order-email-audit-heading span {
            display: block;
            margin-top: 8px;
            color: #927a70;
            font-size: 9px;
            line-height: 1.7;
          }

          .admin-order-email-audit-heading > strong {
            padding: 8px 11px;
            border-radius: 999px;
            color: #754c3e;
            background: #f5ece7;
            font-size: 8px;
            white-space: nowrap;
          }

          .admin-order-email-audit-empty {
            margin-top: 18px;
            padding: 18px;
            border: 1px solid #ead9b4;
            border-radius: 12px;
            color: #806329;
            background: #fff8e6;
            font-size: 9px;
            line-height: 1.7;
            text-align: center;
          }

          @media (max-width: 720px) {
            .admin-order-email-audit {
              padding: 16px;
            }

            .admin-order-email-audit-heading {
              flex-direction: column;
            }
          }
        `}
      </style>
    </section>
  );
}