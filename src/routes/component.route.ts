import { Router } from "express";
import {
  listComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent,
} from "../controllers/component.controller";
import { validateBody } from "../middleware/validate";
import { ComponentCreateDto, ComponentUpdateDto } from "../dtos/component.dto";

const router = Router();

router.get("/", listComponents);
router.get("/:id", getComponentById);
router.post("/", validateBody(ComponentCreateDto), createComponent);
router.put("/:id", validateBody(ComponentUpdateDto), updateComponent);
router.delete("/:id", deleteComponent);

export default router;
