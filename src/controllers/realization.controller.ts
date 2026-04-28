import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse } from "../utils/response";

type PaginationQuery = {
  page?: string;
  limit?: string;
  name?: string;
  tag?: string;
};

/**
 * LIST REALIZATION METRICS
 * GET /api/realizations/metrics
 */
export const getRealizationMetrics = async (
  req: Request<{}, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const nameFilter = req.query.name?.trim();
    const tagFilter = req.query.tag?.trim();

    let ikus: any[] = [];

    // IKU doesn't have tags, so if tagFilter is provided, we skip fetching IKUs
    if (!tagFilter) {
      const ikuWhere: any = { isDirectInput: true };
      if (nameFilter) {
        ikuWhere.name = { contains: nameFilter };
      }
      ikus = await prisma.iKU.findMany({
        where: ikuWhere,
        orderBy: { createdAt: "desc" },
      });
    }

    const compWhere: any = {};
    if (nameFilter) {
      compWhere.name = { contains: nameFilter };
    }
    if (tagFilter) {
      compWhere.tags = {
        some: {
          tag: {
            deletedAt: null,
            name: { contains: tagFilter },
          },
        },
      };
    }

    const components = await prisma.component.findMany({
      where: compWhere,
      include: {
        tags: {
          where: { tag: { deletedAt: null } },
          include: { tag: true },
          orderBy: { tag: { name: "asc" } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Merge and format the responses
    const merged = [
      ...ikus.map((i) => ({
        id: i.id,
        type: "IKU",
        code: i.code,
        name: i.name,
        description: i.description,
        unit: i.unit,
        isDirectInput: i.isDirectInput,
        tags: [], // IKU has no tags
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
      ...components.map((c) => ({
        id: c.id,
        type: "COMPONENT",
        code: c.code,
        name: c.name,
        description: c.description,
        dataType: c.dataType,
        sourceType: c.sourceType,
        periodType: c.periodType,
        tags: c.tags.map((ct) => ct.tag),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    ];

    // Sort by createdAt descending across both types
    merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate in memory
    const total = merged.length;
    const paginated = merged.slice(skip, skip + limit);

    res.json(
      successResponse({
        data: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    next(error);
  }
};
