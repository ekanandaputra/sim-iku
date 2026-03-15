import { Router } from "express";
import {
  listIkuResults,
  getIkuResultById,
  createIkuResult,
  updateIkuResult,
  deleteIkuResult,
} from "../controllers/ikuResult.controller";
import { validateBody } from "../middleware/validate";
import { IkuResultCreateDto, IkuResultUpdateDto } from "../dtos/ikuResult.dto";

const router = Router();

router.get("/", listIkuResults);
router.get("/:id", getIkuResultById);
router.post("/", validateBody(IkuResultCreateDto), createIkuResult);
router.put("/:id", validateBody(IkuResultUpdateDto), updateIkuResult);
router.delete("/:id", deleteIkuResult);

export default router;
