import { Router } from "express";
import { listProdi, getProdiById, createProdi, updateProdi, deleteProdi } from "../controllers/prodi.controller";
import { validateBody } from "../middleware/validate";
import { ProdiCreateDto, ProdiUpdateDto } from "../dtos/prodi.dto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Prodi
 *   description: Master data Program Studi
 */

router.get("/", listProdi);
router.get("/:id", getProdiById);
router.post("/", validateBody(ProdiCreateDto), createProdi);
router.put("/:id", validateBody(ProdiUpdateDto), updateProdi);
router.delete("/:id", deleteProdi);

export default router;
