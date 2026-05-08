import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type ComponentParams = { componentId: string };

/**
 * LIST USERS ASSIGNED TO A COMPONENT
 * GET /api/component-users/:componentId
 */
export const listComponentUsers = async (
  req: Request<ComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { componentId } = req.params;

    const component = await prisma.component.findUnique({
      where: { id: componentId },
    });
    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    const assignments = await prisma.componentUser.findMany({
      where: { componentId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        prodiId: true,
        createdAt: true,
        prodi: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    res.json(successResponse({ component, assignments }));
  } catch (error) {
    next(error);
  }
};

/**
 * ASSIGN USERS TO A COMPONENT (bulk)
 * POST /api/component-users/:componentId/assign
 * body: { userIds: string[] }
 */
export const assignUsers = async (
  req: Request<ComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { componentId } = req.params;
    const { userIds, prodiId } = req.body as { userIds: string[]; prodiId?: string };

    const component = await prisma.component.findUnique({
      where: { id: componentId },
    });
    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    // Upsert each userId (skip if already assigned)
    const created = await prisma.$transaction(
      userIds.map((userId) =>
        prisma.componentUser.upsert({
          where: {
            componentId_userId_prodiId: {
              componentId,
              userId,
              prodiId: prodiId as any,
            },
          },
          create: { componentId, userId, prodiId: prodiId || null },
          update: {},
          select: { id: true, userId: true, prodiId: true, createdAt: true },
        })
      )
    );

    res.status(201).json(
      successResponse(created, `${created.length} user(s) assigned to component`)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * UNASSIGN USERS FROM A COMPONENT (bulk)
 * DELETE /api/component-users/:componentId/unassign
 * body: { userIds: string[] }
 */
export const unassignUsers = async (
  req: Request<ComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { componentId } = req.params;
    const { userIds, prodiId } = req.body as { userIds: string[]; prodiId?: string };

    const component = await prisma.component.findUnique({
      where: { id: componentId },
    });
    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    const result = await prisma.componentUser.deleteMany({
      where: {
        componentId,
        userId: { in: userIds },
        prodiId: prodiId || null,
      },
    });

    res.json(
      successResponse(
        { deletedCount: result.count },
        `${result.count} user(s) unassigned from component`
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL COMPONENTS ASSIGNED TO A SPECIFIC USER
 * GET /api/component-users/by-user/:userId
 */
export const listComponentsByUser = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const assignments = await prisma.componentUser.findMany({
      where: { userId },
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
          },
        },
      },
    });

    const components = assignments.map((a) => ({
      assignmentId: a.id,
      assignedAt: a.createdAt,
      ...a.component,
    }));

    res.json(successResponse(components));
  } catch (error) {
    next(error);
  }
};

/**
 * REPLACE ALL USER ASSIGNMENTS FOR A COMPONENT
 * PUT /api/component-users/:componentId
 * body: { userIds: string[] }
 */
export const syncUsers = async (
  req: Request<ComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { componentId } = req.params;
    const { userIds, prodiId } = req.body as { userIds: string[]; prodiId?: string };

    const component = await prisma.component.findUnique({
      where: { id: componentId },
    });
    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    await prisma.$transaction(async (tx) => {
      // Delete all existing for this component and prodi
      await tx.componentUser.deleteMany({
        where: { componentId, prodiId: prodiId || null },
      });

      // Re-create with new list
      if (userIds.length > 0) {
        await tx.componentUser.createMany({
          data: userIds.map((userId) => ({
            componentId,
            userId,
            prodiId: prodiId || null,
          })),
        });
      }
    });

    const updated = await prisma.componentUser.findMany({
      where: { componentId, prodiId: prodiId || null },
      select: { id: true, userId: true, prodiId: true, createdAt: true },
    });

    res.json(successResponse(updated, "Component users updated successfully"));
  } catch (error) {
    next(error);
  }
};
