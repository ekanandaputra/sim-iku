import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { LoginDto, RegisterDto } from "../dtos/auth.dto";

const router = Router();

router.post("/register", validateBody(RegisterDto), register);
router.post("/login", validateBody(LoginDto), login);

export default router;
