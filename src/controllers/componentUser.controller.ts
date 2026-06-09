import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { fetchAuthUsers } from "../utils/authService";

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

    // Fetch data user dari auth service secara paralel
    const userIds = assignments.map((a) => a.userId);
    const userMap = await fetchAuthUsers(userIds);

    const assignmentsWithUser = assignments.map((a) => ({
      ...a,
      user: userMap.get(a.userId) ?? null,
    }));

    res.json(successResponse({ component, assignments: assignmentsWithUser }));
  } catch (error) {
    next(error);
  }
};

/**
 * ASSIGN USERS TO A COMPONENT (sync)
 * POST /api/component-users/:componentId/assign
 * body: { userIds: string[], prodiId?: string }
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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing users in this prodi scope that are NOT in the payload
      await tx.componentUser.deleteMany({
        where: {
          componentId,
          prodiId: prodiId || null,
          userId: { notIn: userIds },
        },
      });

      // 2. Add users that don't exist yet
      const existingUsers = await tx.componentUser.findMany({
        where: { componentId, prodiId: prodiId || null },
        select: { userId: true },
      });
      const existingUserIds = new Set(existingUsers.map((u) => u.userId));
      const newUserIds = userIds.filter((id) => !existingUserIds.has(id));

      if (newUserIds.length > 0) {
        await tx.componentUser.createMany({
          data: newUserIds.map((userId) => ({
            componentId,
            userId,
            prodiId: prodiId || null,
          })),
        });
      }

      return await tx.componentUser.findMany({
        where: { componentId, prodiId: prodiId || null },
      });
    });

    res.status(200).json(
      successResponse(result, `Component users synced successfully`)
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
