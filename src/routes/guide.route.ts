import { Router } from "express";
import {
  listGuides,
  getGuideById,
  createGuide,
  updateGuide,
  deleteGuide,
} from "../controllers/guide.controller";
import { validateBody } from "../middleware/validate";
import { upload } from "../middleware/upload";
import { GuideCreateDto, GuideUpdateDto } from "../dtos/guide.dto";

const router = Router();

// Endpoint uses upload.single("file") to accept an optional guide material file
// alongside the "title", "description" and "videoUrl" (YouTube/Google Drive) fields
router.get("/", listGuides);
router.get("/:id", getGuideById);
router.post("/", upload.single("file"), validateBody(GuideCreateDto), createGuide);
router.put("/:id", upload.single("file"), validateBody(GuideUpdateDto), updateGuide);
router.delete("/:id", deleteGuide);

export default router;
