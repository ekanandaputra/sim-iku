import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { AuditEntityType, AuditAction } from "../generated/prisma/enums";

type AuditLogQuery = {
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
};

/**
 * LIST AUDIT LOGS
 * GET /api/audit-logs
 *
 * Query params:
 *   entityType  — IKU | COMPONENT | COMPONENT_REALIZATION | IKU_RESULT
 *   entityId    — filter by specific record id
 *   action      — CREATE | UPDATE | DELETE
 *   userId      — filter by actor
 *   startDate   — ISO date string (inclusive)
 *   endDate     — ISO date string (inclusive)
 *   page, limit — pagination
 */
export const listAuditLogs = async (
  req: Request<{}, {}, {}, AuditLogQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.entityType) {
      where.entityType = req.query.entityType as AuditEntityType;
    }
    if (req.query.entityId) {
      where.entityId = req.query.entityId;
    }
    if (req.query.action) {
      where.action = req.query.action as AuditAction;
    }
    if (req.query.userId) {
      where.userId = req.query.userId;
    }
    if (req.query.startDate || req.query.endDate) {
      where.createdAt = {};
      if (req.query.startDate) {
        where.createdAt.gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        // Set to end of day
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json(successResponse({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET AUDIT LOG BY ID
 * GET /api/audit-logs/:id
 */
export const getAuditLogById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({ where: { id } });

    if (!log) {
      return res.status(404).json(errorResponse("Audit log not found"));
    }

    res.json(successResponse(log));
  } catch (error) {
    next(error);
  }
};
