import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * GET /api/settings/period-locks?year=2026
 * Returns lock status for all 12 months in the given year.
 */
export const getPeriodLocks = async (
  req: Request<{}, {}, {}, { year?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    const locks = await prisma.realizationPeriodLock.findMany({
      where: { year },
    });

    const lockMap = new Map(locks.map((l) => [l.month, l]));

    const data = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const lock = lockMap.get(month);
      return {
        month,
        monthName: MONTH_NAMES[i],
        year,
        locked: !!lock,
        allowAdminBypass: lock?.allowAdminBypass ?? false,
        reason: lock?.reason ?? null,
        lockedBy: lock?.lockedBy ?? null,
        lockedAt: lock?.createdAt ?? null,
      };
    });

    res.json(successResponse(data));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/settings/period-locks
 * Toggle lock for a single month+year.
 * Body: { month, year, locked, allowAdminBypass?, reason? }
 */
export const togglePeriodLock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { month, year, locked, allowAdminBypass, reason } = req.body;
    const userId = (req as any).user?.id ?? null;

    if (locked) {
      // Create or update the lock
      const lock = await prisma.realizationPeriodLock.upsert({
        where: { month_year: { month, year } },
        create: {
          month,
          year,
          reason: reason ?? null,
          allowAdminBypass: allowAdminBypass ?? false,
          lockedBy: userId,
        },
        update: {
          reason: reason ?? null,
          allowAdminBypass: allowAdminBypass ?? false,
          lockedBy: userId,
        },
      });

      const monthName = MONTH_NAMES[month - 1];
      return res.json(
        successResponse(
          {
            month,
            monthName,
            year,
            locked: true,
            allowAdminBypass: lock.allowAdminBypass,
            reason: lock.reason,
            lockedBy: lock.lockedBy,
          },
          `Periode ${monthName} ${year} berhasil dikunci`
        )
      );
    } else {
      // Delete the lock (unlock)
      await prisma.realizationPeriodLock.deleteMany({
        where: { month, year },
      });

      const monthName = MONTH_NAMES[month - 1];
      return res.json(
        successResponse(
          { month, monthName, year, locked: false },
          `Periode ${monthName} ${year} berhasil dibuka`
        )
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/settings/period-locks/bulk
 * Bulk toggle locks for multiple months in a year.
 * Body: { year, locks: [{ month, locked, allowAdminBypass?, reason? }] }
 */
export const bulkTogglePeriodLock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, locks } = req.body;
    const userId = (req as any).user?.id ?? null;

    const results = [];

    for (const item of locks) {
      if (item.locked) {
        const lock = await prisma.realizationPeriodLock.upsert({
          where: { month_year: { month: item.month, year } },
          create: {
            month: item.month,
            year,
            reason: item.reason ?? null,
            allowAdminBypass: item.allowAdminBypass ?? false,
            lockedBy: userId,
          },
          update: {
            reason: item.reason ?? null,
            allowAdminBypass: item.allowAdminBypass ?? false,
            lockedBy: userId,
          },
        });
        results.push({
          month: item.month,
          monthName: MONTH_NAMES[item.month - 1],
          year,
          locked: true,
          allowAdminBypass: lock.allowAdminBypass,
          reason: lock.reason,
        });
      } else {
        await prisma.realizationPeriodLock.deleteMany({
          where: { month: item.month, year },
        });
        results.push({
          month: item.month,
          monthName: MONTH_NAMES[item.month - 1],
          year,
          locked: false,
        });
      }
    }

    res.json(successResponse(results, `Berhasil mengubah ${results.length} periode`));
  } catch (error) {
    next(error);
  }
};
