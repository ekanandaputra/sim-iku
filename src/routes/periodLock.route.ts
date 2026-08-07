import { Router } from "express";
import {
  getPeriodLocks,
  togglePeriodLock,
  bulkTogglePeriodLock,
} from "../controllers/periodLock.controller";
import { validateBody } from "../middleware/validate";
import { TogglePeriodLockDto, BulkPeriodLockDto } from "../dtos/periodLock.dto";

const router = Router();

router.get("/period-locks", getPeriodLocks);
router.post("/period-locks", validateBody(TogglePeriodLockDto), togglePeriodLock);
router.post("/period-locks/bulk", validateBody(BulkPeriodLockDto), bulkTogglePeriodLock);

export default router;
