import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type BidangParams = { id: string };

/**
 * LIST COMPONENTS (IKP) LINKED TO A BIDANG
 * GET /api/bidang/:id/components
 */
export const listBidangComponents = async (
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

    const links = await prisma.bidangComponent.findMany({
      where: { bidangId: id },
      orderBy: { createdAt: "asc" },
      include: {
        component: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            dataType: true,
            sourceType: true,
            periodType: true,
            hasBreakdown: true,
          },
        },
      },
    });

    res.json(successResponse({ bidang, components: links }));
  } catch (error) {
    next(error);
  }
};

/**
 * ASSIGN COMPONENTS (IKP) TO A BIDANG (additive)
 * POST /api/bidang/:id/components/assign
 * body: { componentIds: string[] }
 */
export const assignBidangComponents = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { componentIds } = req.body as { componentIds: string[] };

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    // Validate all Component IDs exist
    const foundComponents = await prisma.component.findMany({
      where: { id: { in: componentIds } },
      select: { id: true },
    });
    if (foundComponents.length !== componentIds.length) {
      return res.status(404).json(errorResponse("One or more Component IDs not found"));
    }

    const created = await prisma.$transaction(
      componentIds.map((componentId) =>
        prisma.bidangComponent.upsert({
          where: { bidangId_componentId: { bidangId: id, componentId } },
          create: { bidangId: id, componentId },
          update: {},
          select: { id: true, componentId: true, createdAt: true },
        })
      )
    );

    res.status(201).json(
      successResponse(created, `${created.length} Component(s) linked to Bidang`)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * UNASSIGN COMPONENTS (IKP) FROM A BIDANG
 * DELETE /api/bidang/:id/components/unassign
 * body: { componentIds: string[] }
 */
export const unassignBidangComponents = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { componentIds } = req.body as { componentIds: string[] };

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    const result = await prisma.bidangComponent.deleteMany({
      where: { bidangId: id, componentId: { in: componentIds } },
    });

    res.json(
      successResponse(
        { deletedCount: result.count },
        `${result.count} Component(s) unlinked from Bidang`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * SYNC (REPLACE) ALL COMPONENTS LINKED TO A BIDANG
 * PUT /api/bidang/:id/components
 * body: { componentIds: string[] }
 */
export const syncBidangComponents = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { componentIds } = req.body as { componentIds: string[] };

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    if (componentIds.length > 0) {
      const foundComponents = await prisma.component.findMany({
        where: { id: { in: componentIds } },
        select: { id: true },
      });
      if (foundComponents.length !== componentIds.length) {
        return res.status(404).json(errorResponse("One or more Component IDs not found"));
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.bidangComponent.deleteMany({ where: { bidangId: id } });
      if (componentIds.length > 0) {
        await tx.bidangComponent.createMany({
          data: componentIds.map((componentId) => ({ bidangId: id, componentId })),
        });
      }
    });

    const updated = await prisma.bidangComponent.findMany({
      where: { bidangId: id },
      include: {
        component: {
          select: { id: true, code: true, name: true, dataType: true, periodType: true },
        },
      },
    });

    res.json(successResponse(updated, "Bidang components updated successfully"));
  } catch (error) {
    next(error);
  }
};
