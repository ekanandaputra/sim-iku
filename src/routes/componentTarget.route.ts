import { Router } from "express";
import {
  getAllComponentTargets,
  getComponentTargetById,
  createComponentTarget,
  updateComponentTarget,
  deleteComponentTarget,
} from "../controllers/componentTarget.controller";

const router = Router();

router.get("/", getAllComponentTargets);
router.post("/", createComponentTarget);
router.get("/:id", getComponentTargetById);
router.put("/:id", updateComponentTarget);
router.delete("/:id", deleteComponentTarget);

export default router;
