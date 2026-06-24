import { Router } from "express";
import { getPics } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/pics", authenticate as any, getPics);

export default router;
