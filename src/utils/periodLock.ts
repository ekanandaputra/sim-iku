import { prisma } from "../lib/prisma";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * Check if a month+year is locked. If locked, throws an error.
 * @param month 1-12
 * @param year e.g. 2026
 * @param isAdmin whether the requesting user has admin permission
 */
export async function checkPeriodLock(month: number, year: number, isAdmin: boolean = false): Promise<void> {
  if (month === 0) return; // yearly period uses month=0, skip lock check

  const lock = await prisma.realizationPeriodLock.findUnique({
    where: { month_year: { month, year } },
  });

  if (lock) {
    // If admin and bypass is allowed, skip
    if (isAdmin && lock.allowAdminBypass) {
      return;
    }

    const monthName = MONTH_NAMES[month - 1] || `Bulan ${month}`;
    throw new PeriodLockError(
      `Periode ${monthName} ${year} telah dikunci. Input realisasi tidak diperbolehkan.`,
      month,
      year
    );
  }
}

/**
 * Check if a specific month+year is locked.
 */
export async function isMonthLocked(month: number, year: number): Promise<boolean> {
  if (month === 0) return false;

  const lock = await prisma.realizationPeriodLock.findUnique({
    where: { month_year: { month, year } },
  });

  return !!lock;
}

/**
 * Batch-fetch lock statuses for all months in a given year.
 * Returns a Map<month, lockRecord | null>.
 */
export async function getLockedMonths(year: number): Promise<Map<number, { locked: boolean; allowAdminBypass: boolean; reason?: string | null }>> {
  const locks = await prisma.realizationPeriodLock.findMany({
    where: { year },
  });

  const lockMap = new Map<number, { locked: boolean; allowAdminBypass: boolean; reason?: string | null }>();

  // Initialize all months as unlocked
  for (let m = 1; m <= 12; m++) {
    lockMap.set(m, { locked: false, allowAdminBypass: false, reason: null });
  }

  // Override with actual locks
  for (const lock of locks) {
    lockMap.set(lock.month, {
      locked: true,
      allowAdminBypass: lock.allowAdminBypass,
      reason: lock.reason,
    });
  }

  return lockMap;
}

/**
 * Custom error class for period lock violations.
 */
export class PeriodLockError extends Error {
  public statusCode = 403;
  public month: number;
  public year: number;

  constructor(message: string, month: number, year: number) {
    super(message);
    this.name = "PeriodLockError";
    this.month = month;
    this.year = year;
  }
}
