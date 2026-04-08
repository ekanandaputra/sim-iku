import { Router } from "express";
import { getIkuDashboard } from "../controllers/dashboard.controller";

const router = Router();

router.get("/iku", getIkuDashboard);

export default router;
