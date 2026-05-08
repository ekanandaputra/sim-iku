import { Router } from "express";
import { getRealizationMetrics, getRealizationView, bulkSaveRealization, getRealizationDetail } from "../controllers/realization.controller";
import { authenticate, optionalAuthenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { BulkSaveRealizationDto } from "../dtos/realization.dto";

const router = Router();

// optionalAuthenticate: parses JWT if present (for user filter), but does not
// reject unauthenticated requests (used when ENABLE_USER_FILTER=false).
router.get("/metrics", optionalAuthenticate, getRealizationMetrics);
router.get("/:type/:id/view", getRealizationView);
router.get("/:type/:id/detail", getRealizationDetail);
router.post("/:type/:id/bulk", validateBody(BulkSaveRealizationDto), bulkSaveRealization);

export default router;
