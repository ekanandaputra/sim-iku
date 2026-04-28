import { Router } from "express";
import { getRealizationMetrics, getRealizationView } from "../controllers/realization.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// router.use(authenticate);

router.get("/metrics", getRealizationMetrics);
router.get("/:type/:id/view", getRealizationView);
export default router;
