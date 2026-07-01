import { Router } from "express";
import {
  listIkuResults,
  getIkuResultById,
  createIkuResult,
  updateIkuResult,
  deleteIkuResult,
} from "../controllers/ikuResult.controller";
import {
  recalculateSingleIku,
  recalculateAllIkus,
} from "../controllers/ikuRecalculate.controller";
import { validateBody } from "../middleware/validate";
import { IkuResultCreateDto, IkuResultUpdateDto } from "../dtos/ikuResult.dto";

const router = Router();

// Recalculate routes (must be before /:id to avoid param collision)
router.post("/recalculate-all", recalculateAllIkus);
router.post("/recalculate/:ikuId", recalculateSingleIku);

router.get("/", listIkuResults);
router.get("/:id", getIkuResultById);
router.post("/", validateBody(IkuResultCreateDto), createIkuResult);
router.put("/:id", validateBody(IkuResultUpdateDto), updateIkuResult);
router.delete("/:id", deleteIkuResult);

export default router;
