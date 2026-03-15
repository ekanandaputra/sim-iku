import { Router } from "express";
import {
  listPeriods,
  getPeriodById,
  createPeriod,
  updatePeriod,
  deletePeriod,
} from "../controllers/period.controller";
import { validateBody } from "../middleware/validate";
import { PeriodCreateDto, PeriodUpdateDto } from "../dtos/period.dto";

const router = Router();

router.get("/", listPeriods);
router.get("/:id", getPeriodById);
router.post("/", validateBody(PeriodCreateDto), createPeriod);
router.put("/:id", validateBody(PeriodUpdateDto), updatePeriod);
router.delete("/:id", deletePeriod);

export default router;
