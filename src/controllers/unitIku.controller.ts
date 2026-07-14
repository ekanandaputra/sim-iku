import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { fetchAuthUnit } from "../utils/authService";

type UnitParams = { id: string };

/**
 * LIST IKUs LINKED TO A UNIT
 * GET /api/units/:id/ikus
 */
export const listUnitIkus = async (
  req: Request<UnitParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const unit = await fetchAuthUnit(id);
    if (!unit) {
      return res.status(404).json(errorResponse("Unit not found"));
    }

    const links = await prisma.unitIKU.findMany({
      where: { unitId: id },
      orderBy: { createdAt: "asc" },
      include: {
        iku: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            unit: true,
            isDirectInput: true,
          },
        },
      },
    });

    res.json(successResponse({ unit, ikus: links }));
  } catch (error) {
    next(error);
  }
};

/**
 * ASSIGN IKUs TO A UNIT (additive)
 * POST /api/units/:id/ikus/assign
 * body: { ikuIds: string[] }
 */
export const assignUnitIkus = async (
  req: Request<UnitParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { ikuIds } = req.body as { ikuIds: string[] };

    const unit = await fetchAuthUnit(id);
    if (!unit) {
      return res.status(404).json(errorResponse("Unit not found"));
    }

    // Validate all IKU IDs exist
    const foundIkus = await prisma.iKU.findMany({
      where: { id: { in: ikuIds } },
      select: { id: true },
    });
    if (foundIkus.length !== ikuIds.length) {
      return res.status(404).json(errorResponse("One or more IKU IDs not found"));
    }

    const created = await prisma.$transaction(
      ikuIds.map((ikuId) =>
        prisma.unitIKU.upsert({
          where: { unitId_ikuId: { unitId: id, ikuId } },
          create: { unitId: id, ikuId },
          update: {},
          select: { id: true, ikuId: true, createdAt: true },
        })
      )
    );

    res.status(201).json(
      successResponse(created, `${created.length} IKU(s) linked to Unit`)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * UNASSIGN IKUs FROM A UNIT
 * DELETE /api/units/:id/ikus/unassign
 * body: { ikuIds: string[] }
 */
export const unassignUnitIkus = async (
  req: Request<UnitParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { ikuIds } = req.body as { ikuIds: string[] };

    const unit = await fetchAuthUnit(id);
    if (!unit) {
      return res.status(404).json(errorResponse("Unit not found"));
    }

    const result = await prisma.unitIKU.deleteMany({
      where: { unitId: id, ikuId: { in: ikuIds } },
    });

    res.json(
      successResponse(
        { deletedCount: result.count },
        `${result.count} IKU(s) unlinked from Unit`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * SYNC (REPLACE) ALL IKUs LINKED TO A UNIT
 * PUT /api/units/:id/ikus
 * body: { ikuIds: string[] }
 */
export const syncUnitIkus = async (
  req: Request<UnitParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { ikuIds } = req.body as { ikuIds: string[] };

    const unit = await fetchAuthUnit(id);
    if (!unit) {
      return res.status(404).json(errorResponse("Unit not found"));
    }

    if (ikuIds.length > 0) {
      const foundIkus = await prisma.iKU.findMany({
        where: { id: { in: ikuIds } },
        select: { id: true },
      });
      if (foundIkus.length !== ikuIds.length) {
        return res.status(404).json(errorResponse("One or more IKU IDs not found"));
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.unitIKU.deleteMany({ where: { unitId: id } });
      if (ikuIds.length > 0) {
        await tx.unitIKU.createMany({
          data: ikuIds.map((ikuId) => ({ unitId: id, ikuId })),
        });
      }
    });

    const updated = await prisma.unitIKU.findMany({
      where: { unitId: id },
      include: {
        iku: { select: { id: true, code: true, name: true, unit: true } },
      },
    });

    res.json(successResponse(updated, "Unit IKUs updated successfully"));
  } catch (error) {
    next(error);
  }
};
