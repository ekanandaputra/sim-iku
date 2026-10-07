import { Router } from "express";
import { getIkuDashboard, getIkuBreakdown, getComponentDashboard, getDashboardSummary } from "../controllers/dashboard.controller";

const router = Router();

router.get("/summary", getDashboardSummary);
router.get("/iku", getIkuDashboard);
router.get("/iku/:ikuId", getIkuBreakdown);
router.get("/component", getComponentDashboard);

export default router;
