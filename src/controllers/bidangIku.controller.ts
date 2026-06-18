import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type BidangParams = { id: string };

/**
 * LIST IKUs LINKED TO A BIDANG
 * GET /api/bidang/:id/ikus
 */
export const listBidangIkus = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    const links = await prisma.bidangIKU.findMany({
      where: { bidangId: id },
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

    res.json(successResponse({ bidang, ikus: links }));
  } catch (error) {
    next(error);
  }
};

/**
 * ASSIGN IKUs TO A BIDANG (additive)
 * POST /api/bidang/:id/ikus/assign
 * body: { ikuIds: string[] }
 */
export const assignBidangIkus = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { ikuIds } = req.body as { ikuIds: string[] };

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
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
        prisma.bidangIKU.upsert({
          where: { bidangId_ikuId: { bidangId: id, ikuId } },
          create: { bidangId: id, ikuId },
          update: {},
          select: { id: true, ikuId: true, createdAt: true },
        })
      )
    );

    res.status(201).json(
      successResponse(created, `${created.length} IKU(s) linked to Bidang`)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * UNASSIGN IKUs FROM A BIDANG
 * DELETE /api/bidang/:id/ikus/unassign
 * body: { ikuIds: string[] }
 */
export const unassignBidangIkus = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { ikuIds } = req.body as { ikuIds: string[] };

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    const result = await prisma.bidangIKU.deleteMany({
      where: { bidangId: id, ikuId: { in: ikuIds } },
    });

    res.json(
      successResponse(
        { deletedCount: result.count },
        `${result.count} IKU(s) unlinked from Bidang`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * SYNC (REPLACE) ALL IKUs LINKED TO A BIDANG
 * PUT /api/bidang/:id/ikus
 * body: { ikuIds: string[] }
 */
export const syncBidangIkus = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { ikuIds } = req.body as { ikuIds: string[] };

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
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
      await tx.bidangIKU.deleteMany({ where: { bidangId: id } });
      if (ikuIds.length > 0) {
        await tx.bidangIKU.createMany({
          data: ikuIds.map((ikuId) => ({ bidangId: id, ikuId })),
        });
      }
    });

    const updated = await prisma.bidangIKU.findMany({
      where: { bidangId: id },
      include: {
        iku: { select: { id: true, code: true, name: true, unit: true } },
      },
    });

    res.json(successResponse(updated, "Bidang IKUs updated successfully"));
  } catch (error) {
    next(error);
  }
};
