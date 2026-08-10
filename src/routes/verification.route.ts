import { Router } from "express";
import {
  createVerification,
  getVerifications,
  deleteVerification,
  getVerificationDashboard,
} from "../controllers/verification.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { CreateVerificationDto } from "../dtos/verification.dto";

const router = Router();

// Dashboard must be registered BEFORE parameterized routes
router.get("/dashboard", authenticate as any, getVerificationDashboard);

// All verification endpoints require authentication
router.post("/", authenticate as any, validateBody(CreateVerificationDto), createVerification);
router.get("/:entityType/:entityId", authenticate as any, getVerifications);
router.delete("/:id", authenticate as any, deleteVerification);

export default router;
