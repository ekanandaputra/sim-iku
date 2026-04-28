import { Router } from "express";
import { getRealizationMetrics } from "../controllers/realization.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// router.use(authenticate);

router.get("/metrics", getRealizationMetrics);

export default router;
