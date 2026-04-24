import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type ComponentParams = {
  id: string;
};

type PaginationQuery = {
  page?: string;
  limit?: string;
};

/**
 * LIST COMPONENTS
 * GET /api/components
 */
export const listComponents = async (
  req: Request<{}, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [components, total] = await Promise.all([
      prisma.component.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.component.count(),
    ]);

    res.json(successResponse({
      data: components,
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

/**
 * GET COMPONENT BY ID
 * GET /api/components/:id
 */
export const getComponentById = async (
  req: Request<ComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const component = await prisma.component.findUnique({
      where: { id },
    });

    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    res.json(successResponse(component));
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE COMPONENT
 * POST /api/components
 */
export const createComponent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, name, description, dataType, sourceType, periodType } = req.body;

    const existing = await prisma.component.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json(errorResponse("Component code already exists"));
    }

    const componentData: any = {
      code,
      name,
      description,
      periodType,
    };

    if (dataType !== undefined) {
      componentData.dataType = dataType;
    }

    if (sourceType !== undefined) {
      componentData.sourceType = sourceType;
    }

    const component = await prisma.component.create({
      data: componentData,
    });

    res.status(201).json(successResponse(component, "Component created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE COMPONENT
 * PUT /api/components/:id
 */
export const updateComponent = async (
  req: Request<ComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const { code, name, description, dataType, sourceType, periodType } = req.body;

    const existing = await prisma.component.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    if (code !== existing.code) {
      const other = await prisma.component.findUnique({
        where: { code },
      });

      if (other) {
        return res.status(400).json(errorResponse("Component code already exists"));
      }
    }

    const updateData: any = {
      code,
      name,
      description,
      periodType,
    };

    if (dataType !== undefined) {
      updateData.dataType = dataType;
    }

    if (sourceType !== undefined) {
      updateData.sourceType = sourceType;
    }

    const updated = await prisma.component.update({
      where: { id },
      data: updateData,
    });

    res.json(successResponse(updated, "Component updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE COMPONENT
 * DELETE /api/components/:id
 */
export const deleteComponent = async (
  req: Request<ComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const existing = await prisma.component.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    await prisma.component.delete({
      where: { id },
    });

    res.json(successResponse(null, "Component deleted successfully"));
  } catch (error) {
    next(error);
  }
};
