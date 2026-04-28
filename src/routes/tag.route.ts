import { Router } from "express";
import {
  listTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} from "../controllers/tag.controller";
import { validateBody } from "../middleware/validate";
import { TagCreateDto, TagUpdateDto } from "../dtos/tag.dto";

const router = Router();

router.get("/", listTags);
router.get("/:id", getTagById);
router.post("/", validateBody(TagCreateDto), createTag);
router.put("/:id", validateBody(TagUpdateDto), updateTag);
router.delete("/:id", deleteTag);

export default router;
