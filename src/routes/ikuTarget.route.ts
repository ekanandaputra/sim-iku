import { Router } from "express";
import {
  getAllIkuTargets,
  getIkuTargetById,
  createIkuTarget,
  updateIkuTarget,
  deleteIkuTarget,
} from "../controllers/ikuTarget.controller";

const router = Router();

router.get("/", getAllIkuTargets);
router.post("/", createIkuTarget);
router.get("/:id", getIkuTargetById);
router.put("/:id", updateIkuTarget);
router.delete("/:id", deleteIkuTarget);

export default router;
