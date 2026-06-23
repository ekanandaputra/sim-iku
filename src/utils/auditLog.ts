import { Request } from "express";
import { prisma } from "../lib/prisma";
import { AuditAction, AuditEntityType } from "../generated/prisma/enums";

export interface WriteAuditLogParams {
  entityType: AuditEntityType;
  entityId: string;
  entityCode?: string | null;
  entityName?: string | null;
  action: AuditAction;
  userId?: string | null;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  req?: Request;
}

/**
 * Writes an audit log record to the database.
 * Errors are caught internally and only logged to console to avoid
 * disrupting the main request flow.
 */
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  try {
    const ipAddress = params.req
      ? (
          (params.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          params.req.socket?.remoteAddress ||
          null
        )
      : null;

    const userAgent = params.req
      ? (params.req.headers["user-agent"] || null)
      : null;

    await prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        entityCode: params.entityCode ?? null,
        entityName: params.entityName ?? null,
        action: params.action,
        userId: params.userId ?? null,
        oldValues: params.oldValues ?? undefined,
        newValues: params.newValues ?? undefined,
        ipAddress: ipAddress ? ipAddress.substring(0, 45) : null,
        userAgent: userAgent,
      },
    });
  } catch (err) {
    // Never let audit log failure crash the main flow
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}
