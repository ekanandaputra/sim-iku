import { Router } from "express";
import {
  listIkus,
  getIkuById,
  createIku,
  updateIku,
  deleteIku,
  listIkuComponents,
  mapComponentToIku,
  unmapComponentFromIku,
} from "../controllers/iku.controller";
import { validateBody } from "../middleware/validate";
import { IkuCreateDto, IkuUpdateDto, IkuComponentMappingDto } from "../dtos/iku.dto";

const router = Router();

router.get("/", listIkus);
router.get("/:id", getIkuById);
router.get("/:id/components", listIkuComponents);
router.post("/:id/components", validateBody(IkuComponentMappingDto), mapComponentToIku);
router.delete("/:id/components/:componentId", unmapComponentFromIku);

router.post("/", validateBody(IkuCreateDto), createIku);
router.put("/:id", validateBody(IkuUpdateDto), updateIku);
router.delete("/:id", deleteIku);

export default router;
