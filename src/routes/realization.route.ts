import { Router } from "express";
import { getRealizationMetrics, getRealizationView, bulkSaveRealization, getRealizationDetail } from "../controllers/realization.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { BulkSaveRealizationDto } from "../dtos/realization.dto";

const router = Router();

// router.use(authenticate);

router.get("/metrics", getRealizationMetrics);
router.get("/:type/:id/view", getRealizationView);
router.get("/:type/:id/detail", getRealizationDetail);
router.post("/:type/:id/bulk", validateBody(BulkSaveRealizationDto), bulkSaveRealization);

export default router;
