import { Router } from "express";
import { getIkuDashboard, getComponentDashboard, getDashboardSummary } from "../controllers/dashboard.controller";

const router = Router();

router.get("/summary", getDashboardSummary);
router.get("/iku", getIkuDashboard);
router.get("/component", getComponentDashboard);

export default router;
