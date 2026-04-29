import { Router } from "express";
import { getRealizationMetrics, getRealizationView, bulkSaveRealization } from "../controllers/realization.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { BulkSaveRealizationDto } from "../dtos/realization.dto";

const router = Router();

// router.use(authenticate);

router.get("/metrics", getRealizationMetrics);
router.get("/:type/:id/view", getRealizationView);
router.post("/:type/:id/bulk", validateBody(BulkSaveRealizationDto), bulkSaveRealization);

export default router;
