import { Router } from "express";
import { uploadDocuments, listDocuments, deleteDocument } from "../controllers/document.controller";
import { upload } from "../middleware/upload";

const router = Router();

// Endpoint uses upload.array to handle multiple files from a field named 'files'
router.post("/upload", upload.array("files", 10), uploadDocuments);
router.get("/", listDocuments);
router.delete("/:id", deleteDocument);

export default router;
