import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

type Client = Pick<typeof db, "auditEvent">;

export interface AuditInput {
  actorId: string | null;
  action: string; // e.g. "job.publish", "application.status", "auth.login_failed"
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append-only audit trail. Pass the transaction client when the audited
 * change happens inside a transaction so both commit (or roll back) together.
 * Metadata must not contain personal data beyond IDs.
 */
export async function audit(input: AuditInput, client: Client = db): Promise<void> {
  try {
    await client.auditEvent.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
      },
    });
  } catch (e) {
    // Outside a transaction an audit failure must not break the user action,
    // but it must be visible to operators.
    if (client !== db) throw e;
    logger.error("audit.write_failed", { action: input.action, error: e });
  }
}
