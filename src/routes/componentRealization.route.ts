import { Router } from "express";
import {
  listComponentRealizations,
  getComponentRealizationById,
  createComponentRealization,
  updateComponentRealization,
  deleteComponentRealization,
} from "../controllers/componentRealization.controller";
import { validateBody } from "../middleware/validate";
import { ComponentRealizationCreateDto, ComponentRealizationUpdateDto } from "../dtos/componentRealization.dto";

const router = Router();

router.get("/", listComponentRealizations);
router.get("/:id", getComponentRealizationById);
router.post("/", validateBody(ComponentRealizationCreateDto), createComponentRealization);
router.put("/:id", validateBody(ComponentRealizationUpdateDto), updateComponentRealization);
router.delete("/:id", deleteComponentRealization);

export default router;
