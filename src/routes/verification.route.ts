import { Router } from "express";
import {
  createVerification,
  getVerifications,
  deleteVerification,
} from "../controllers/verification.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { CreateVerificationDto } from "../dtos/verification.dto";

const router = Router();

// All verification endpoints require authentication
router.post("/", authenticate as any, validateBody(CreateVerificationDto), createVerification);
router.get("/:entityType/:entityId", authenticate as any, getVerifications);
router.delete("/:id", authenticate as any, deleteVerification);

export default router;
