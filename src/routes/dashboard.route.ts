import { Router } from "express";
import { getIkuDashboard, getComponentDashboard } from "../controllers/dashboard.controller";

const router = Router();

router.get("/iku", getIkuDashboard);
router.get("/component", getComponentDashboard);

export default router;
