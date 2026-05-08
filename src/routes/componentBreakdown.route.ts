import { Router } from "express";
import {
  getBreakdown,
  saveBreakdown,
  deleteBreakdownEntry,
} from "../controllers/componentBreakdown.controller";
import { validateBody } from "../middleware/validate";
import { SaveBreakdownDto } from "../dtos/componentBreakdown.dto";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: ComponentBreakdown
 *   description: Breakdown realisasi komponen per prodi (auto-sum ke total komponen)
 */

router.get("/", getBreakdown);
router.post("/", validateBody(SaveBreakdownDto), saveBreakdown);
router.delete("/:prodiId", deleteBreakdownEntry);

export default router;
