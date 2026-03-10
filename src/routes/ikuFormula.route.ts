import { Router } from "express";
import {
  listIkuFormulas,
  getIkuFormulaById,
  createIkuFormula,
  updateIkuFormula,
  deleteIkuFormula,
  listIkuFormulaSteps,
  createIkuFormulaStep,
  updateIkuFormulaStep,
  deleteIkuFormulaStep,
} from "../controllers/ikuFormula.controller";
import { validateBody } from "../middleware/validate";
import {
  IkuFormulaCreateDto,
  IkuFormulaUpdateDto,
} from "../dtos/ikuFormula.dto";
import {
  IkuFormulaDetailCreateDto,
  IkuFormulaDetailUpdateDto,
} from "../dtos/ikuFormulaDetail.dto";

const router = Router();

router.get("/", listIkuFormulas);
router.get("/:id", getIkuFormulaById);
router.post("/", validateBody(IkuFormulaCreateDto), createIkuFormula);
router.put("/:id", validateBody(IkuFormulaUpdateDto), updateIkuFormula);
router.delete("/:id", deleteIkuFormula);

router.get("/:formulaId/steps", listIkuFormulaSteps);
router.post(
  "/:formulaId/steps",
  validateBody(IkuFormulaDetailCreateDto),
  createIkuFormulaStep
);
router.put(
  "/:formulaId/steps/:id",
  validateBody(IkuFormulaDetailUpdateDto),
  updateIkuFormulaStep
);
router.delete("/:formulaId/steps/:id", deleteIkuFormulaStep);

export default router;
