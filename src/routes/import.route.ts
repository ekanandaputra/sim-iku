import { Router } from "express";
import multer from "multer";
import { downloadTemplate, importMasterData } from "../controllers/import.controller";

const router = Router();

// Use memory storage so we don't write temp files to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx files are allowed"));
    }
  },
});

router.get("/master/template", downloadTemplate);
router.post("/master", upload.single("file"), importMasterData);

export default router;
