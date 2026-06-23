import { Router } from "express";
import { listAuditLogs, getAuditLogById } from "../controllers/auditLog.controller";

const router = Router();

/**
 * GET /api/audit-logs
 * Query: entityType, entityId, action, userId, startDate, endDate, page, limit
 */
router.get("/", listAuditLogs);

/**
 * GET /api/audit-logs/:id
 */
router.get("/:id", getAuditLogById);

export default router;
