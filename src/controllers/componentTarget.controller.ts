import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type TargetParams = { id: string };
type TargetQuery = { componentId?: string; year?: string; page?: string; limit?: string };

export const getAllComponentTargets = async (req: Request<{}, {}, {}, TargetQuery>, res: Response, next: NextFunction) => {
  try {
    const { componentId, year } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (componentId) where.componentId = String(componentId);
    if (year) where.year = Number(year);

    const [componentTargets, total] = await Promise.all([
      prisma.componentTarget.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: "desc" }, { createdAt: "desc" }],
        include: { component: true },
      }),
      prisma.componentTarget.count({ where }),
    ]);

    res.json(successResponse({
      data: componentTargets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    next(error);
  }
};

export const getComponentTargetById = async (req: Request<TargetParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const componentTarget = await prisma.componentTarget.findUnique({
      where: { id },
      include: { component: true },
    });

    if (!componentTarget) {
      return res.status(404).json(errorResponse("Component Target not found"));
    }

    res.json(successResponse(componentTarget));
  } catch (error) {
    next(error);
  }
};

export const createComponentTarget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { componentId, year, targetQ1, targetQ2, targetQ3, targetQ4, targetYear } = req.body;

    const existingTarget = await prisma.componentTarget.findUnique({
      where: {
        componentId_year: { componentId, year },
      },
    });

    if (existingTarget) {
      return res.status(400).json(errorResponse("Target for this Component and year already exists"));
    }

    const componentTarget = await prisma.componentTarget.create({
      data: { componentId, year, targetQ1, targetQ2, targetQ3, targetQ4, targetYear },
    });

    res.status(201).json(successResponse(componentTarget, "Component Target created successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateComponentTarget = async (req: Request<TargetParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { year, targetQ1, targetQ2, targetQ3, targetQ4, targetYear } = req.body;

    const existingTarget = await prisma.componentTarget.findUnique({ where: { id } });
    if (!existingTarget) {
      return res.status(404).json(errorResponse("Component Target not found"));
    }

    const componentTarget = await prisma.componentTarget.update({
      where: { id },
      data: { year, targetQ1, targetQ2, targetQ3, targetQ4, targetYear },
    });

    res.json(successResponse(componentTarget, "Component Target updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteComponentTarget = async (req: Request<TargetParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existingTarget = await prisma.componentTarget.findUnique({ where: { id } });
    
    if (!existingTarget) {
      return res.status(404).json(errorResponse("Component Target not found"));
    }

    await prisma.componentTarget.delete({ where: { id } });
    res.json(successResponse(null, "Component Target deleted successfully"));
  } catch (error) {
    next(error);
  }
};
