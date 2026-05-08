import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type IkuParams = { ikuId: string };

/**
 * LIST USERS ASSIGNED TO AN IKU
 * GET /api/iku-users/:ikuId
 */
export const listIkuUsers = async (
  req: Request<IkuParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ikuId } = req.params;

    const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    const assignments = await prisma.ikuUser.findMany({
      where: { ikuId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });

    res.json(successResponse({ iku, assignments }));
  } catch (error) {
    next(error);
  }
};

/**
 * ASSIGN USERS TO AN IKU (bulk, additive)
 * POST /api/iku-users/:ikuId/assign
 * body: { userIds: string[] }
 */
export const assignIkuUsers = async (
  req: Request<IkuParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ikuId } = req.params;
    const { userIds } = req.body as { userIds: string[] };

    const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    const created = await prisma.$transaction(
      userIds.map((userId) =>
        prisma.ikuUser.upsert({
          where: { ikuId_userId: { ikuId, userId } },
          create: { ikuId, userId },
          update: {},
          select: { id: true, userId: true, createdAt: true },
        })
      )
    );

    res.status(201).json(
      successResponse(created, `${created.length} user(s) assigned to IKU`)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * UNASSIGN USERS FROM AN IKU (bulk)
 * DELETE /api/iku-users/:ikuId/unassign
 * body: { userIds: string[] }
 */
export const unassignIkuUsers = async (
  req: Request<IkuParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ikuId } = req.params;
    const { userIds } = req.body as { userIds: string[] };

    const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    const result = await prisma.ikuUser.deleteMany({
      where: {
        ikuId,
        userId: { in: userIds },
      },
    });

    res.json(
      successResponse(
        { deletedCount: result.count },
        `${result.count} user(s) unassigned from IKU`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL IKUs ASSIGNED TO A SPECIFIC USER
 * GET /api/iku-users/by-user/:userId
 */
export const listIkusByUser = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const assignments = await prisma.ikuUser.findMany({
      where: { userId },
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

    const ikus = assignments.map((a) => ({
      assignmentId: a.id,
      assignedAt: a.createdAt,
      ...a.iku,
    }));

    res.json(successResponse(ikus));
  } catch (error) {
    next(error);
  }
};

/**
 * REPLACE ALL USER ASSIGNMENTS FOR AN IKU
 * PUT /api/iku-users/:ikuId
 * body: { userIds: string[] }
 */
export const syncIkuUsers = async (
  req: Request<IkuParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ikuId } = req.params;
    const { userIds } = req.body as { userIds: string[] };

    const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    await prisma.$transaction(async (tx) => {
      await tx.ikuUser.deleteMany({ where: { ikuId } });
      if (userIds.length > 0) {
        await tx.ikuUser.createMany({
          data: userIds.map((userId) => ({ ikuId, userId })),
        });
      }
    });

    const updated = await prisma.ikuUser.findMany({
      where: { ikuId },
      select: { id: true, userId: true, createdAt: true },
    });

    res.json(successResponse(updated, "IKU users updated successfully"));
  } catch (error) {
    next(error);
  }
};
