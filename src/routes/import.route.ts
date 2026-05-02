import { Router } from "express";
import multer from "multer";
import { 
  downloadMasterTemplate, 
  downloadFormulaTemplate, 
  importMasterData, 
  importFormulas,
  exportMasterData,
  exportFormulas
} from "../controllers/import.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// Master Data (IKU, IKP, Mapping)
router.get("/master/template", downloadMasterTemplate);
router.post("/master", upload.single("file"), importMasterData);
router.get("/master/export", exportMasterData);

// Formula Data
router.get("/formulas/template", downloadFormulaTemplate);
router.post("/formulas", upload.single("file"), importFormulas);
router.get("/formulas/export", exportFormulas);

export default router;
