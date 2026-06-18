import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { fetchAuthUsers } from "../utils/authService";

type BidangParams = { id: string };

/**
 * LIST USERS IN A BIDANG
 * GET /api/bidang/:id/users
 */
export const listBidangUsers = async (
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

    const assignments = await prisma.bidangUser.findMany({
      where: { bidangId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, userId: true, createdAt: true },
    });

    const userIds = assignments.map((a) => a.userId);
    const userMap = await fetchAuthUsers(userIds);

    const result = assignments.map((a) => ({
      ...a,
      user: userMap.get(a.userId) ?? null,
    }));

    res.json(successResponse({ bidang, assignments: result }));
  } catch (error) {
    next(error);
  }
};

/**
 * ASSIGN USERS TO A BIDANG (additive)
 * POST /api/bidang/:id/users/assign
 * body: { userIds: string[] }
 */
export const assignBidangUsers = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body as { userIds: string[] };

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    const created = await prisma.$transaction(
      userIds.map((userId) =>
        prisma.bidangUser.upsert({
          where: { bidangId_userId: { bidangId: id, userId } },
          create: { bidangId: id, userId },
          update: {},
          select: { id: true, userId: true, createdAt: true },
        })
      )
    );

    res.status(201).json(
      successResponse(created, `${created.length} user(s) assigned to Bidang`)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * UNASSIGN USERS FROM A BIDANG
 * DELETE /api/bidang/:id/users/unassign
 * body: { userIds: string[] }
 */
export const unassignBidangUsers = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body as { userIds: string[] };

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    const result = await prisma.bidangUser.deleteMany({
      where: { bidangId: id, userId: { in: userIds } },
    });

    res.json(
      successResponse(
        { deletedCount: result.count },
        `${result.count} user(s) unassigned from Bidang`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * SYNC (REPLACE) ALL USERS IN A BIDANG
 * PUT /api/bidang/:id/users
 * body: { userIds: string[] }
 */
export const syncBidangUsers = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body as { userIds: string[] };

    const bidang = await prisma.bidang.findUnique({ where: { id } });
    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    await prisma.$transaction(async (tx) => {
      await tx.bidangUser.deleteMany({ where: { bidangId: id } });
      if (userIds.length > 0) {
        await tx.bidangUser.createMany({
          data: userIds.map((userId) => ({ bidangId: id, userId })),
        });
      }
    });

    const updated = await prisma.bidangUser.findMany({
      where: { bidangId: id },
      select: { id: true, userId: true, createdAt: true },
    });

    res.json(successResponse(updated, "Bidang users updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL BIDANGS FOR A SPECIFIC USER
 * GET /api/bidang/by-user/:userId
 */
export const listBidangsByUser = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const assignments = await prisma.bidangUser.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        bidang: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    const bidangs = assignments.map((a) => ({
      assignmentId: a.id,
      assignedAt: a.createdAt,
      ...a.bidang,
    }));

    res.json(successResponse(bidangs));
  } catch (error) {
    next(error);
  }
};
