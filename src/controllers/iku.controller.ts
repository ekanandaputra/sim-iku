import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type IkuParams = {
  id: string;
};

type PaginationQuery = {
  page?: string;
  limit?: string;
  includeInactive?: string;
};

/**
 * LIST IKU
 * GET /api/ikus
 */
export const listIkus = async (
  req: Request<{}, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const ikus = await prisma.iKU.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.json(successResponse(ikus));
  } catch (error) {
    next(error);
  }
};

/**
 * GET IKU BY ID
 * GET /api/ikus/:id
 */
export const getIkuById = async (
  req: Request<IkuParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const iku = await prisma.iKU.findUnique({
      where: { id },
    });

    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    res.json(successResponse(iku));
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE IKU
 * POST /api/ikus
 */
export const createIku = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, name, description } = req.body;

    const existing = await prisma.iKU.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json(errorResponse("IKU code already exists"));
    }

    const iku = await prisma.iKU.create({
      data: {
        code,
        name,
        description,
      },
    });

    res.status(201).json(successResponse(iku, "IKU created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE IKU
 * PUT /api/ikus/:id
 */
export const updateIku = async (
  req: Request<IkuParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const { code, name, description } = req.body;

    const existing = await prisma.iKU.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    if (code !== existing.code) {
      const other = await prisma.iKU.findUnique({
        where: { code },
      });

      if (other) {
        return res.status(400).json(errorResponse("IKU code already exists"));
      }
    }

    const updated = await prisma.iKU.update({
      where: { id },
      data: {
        code,
        name,
        description,
      },
    });

    res.json(successResponse(updated, "IKU updated successfully"));
  } catch (error) {
    next(error);
  }
};
type IkuComponentParams = {
  id: string;
  componentId: string;
};

/**
 * LIST IKU COMPONENTS
 * GET /api/ikus/:id/components
 */
export const listIkuComponents = async (
  req: Request<IkuParams, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const iku = await prisma.iKU.findUnique({
      where: { id },
      include: {
        components: {
          include: { component: true },
          skip,
          take: limit,
          orderBy: { id: "asc" },
        },
      },
    });

    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    const components = iku.components.map((c) => ({
      id: c.component.id,
      code: c.component.code,
      name: c.component.name,
      description: c.component.description,
      dataType: c.component.dataType,
      sourceType: c.component.sourceType,
    }));

    res.json(successResponse(components));
  } catch (error) {
    next(error);
  }
};

/**
 * LIST IKU FORMULAS
 * GET /api/ikus/:id/formulas
 */
export const listIkuFormulasByIku = async (
  req: Request<IkuParams, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const iku = await prisma.iKU.findUnique({ where: { id } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const includeInactive = req.query.includeInactive === "true";

    const formulas = await prisma.iKUFormula.findMany({
      where: {
        ikuId: id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.json(successResponse(formulas));
  } catch (error) {
    next(error);
  }
};

/**
 * MAP COMPONENT TO IKU
 * POST /api/ikus/:id/components
 */
export const mapComponentToIku = async (
  req: Request<IkuParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const ikuId = req.params.id;
    const { componentId } = req.body;

    const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    const component = await prisma.component.findUnique({ where: { id: componentId } });
    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    const existing = await prisma.iKUComponent.findUnique({
      where: { ikuId_componentId: { ikuId, componentId } },
    });

    if (existing) {
      return res.status(400).json(errorResponse("Component is already mapped to this IKU"));
    }

    const mapping = await prisma.iKUComponent.create({
      data: { ikuId, componentId },
    });

    res.status(201).json(successResponse(mapping, "Component mapped to IKU successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UNMAP COMPONENT FROM IKU
 * DELETE /api/ikus/:id/components/:componentId
 */
export const unmapComponentFromIku = async (
  req: Request<IkuComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const ikuId = req.params.id;
    const componentId = req.params.componentId;

    const existing = await prisma.iKUComponent.findUnique({
      where: { ikuId_componentId: { ikuId, componentId } },
    });

    if (!existing) {
      return res.status(404).json(errorResponse("Mapping not found"));
    }

    await prisma.iKUComponent.delete({
      where: { ikuId_componentId: { ikuId, componentId } },
    });

    res.json(successResponse(null, "Component unmapped from IKU successfully"));
  } catch (error) {
    next(error);
  }
};
/**
 * DELETE IKU
 * DELETE /api/ikus/:id
 */
export const deleteIku = async (
  req: Request<IkuParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const existing = await prisma.iKU.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    await prisma.iKU.delete({
      where: { id },
    });

    res.json(successResponse(null, "IKU deleted successfully"));
  } catch (error) {
    next(error);
  }
};