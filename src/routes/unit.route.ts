import { Router } from "express";
import { getUnits, assignUnitUsers, getUnitUsers, createUnit } from "../controllers/unit.controller";
import {
  listUnitIkus,
  assignUnitIkus,
  unassignUnitIkus,
  syncUnitIkus,
} from "../controllers/unitIku.controller";

const router = Router();

router.get("/", getUnits);
router.post("/", createUnit);
router.post("/:id/assign", assignUnitUsers);
router.get("/:id/users", getUnitUsers);

router.get("/:id/ikus", listUnitIkus);
router.post("/:id/ikus/assign", assignUnitIkus);
router.delete("/:id/ikus/unassign", unassignUnitIkus);
router.put("/:id/ikus", syncUnitIkus);

export default router;
