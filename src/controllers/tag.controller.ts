import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type TagParams = { id: string };
type TagQuery = { name?: string; includeDeleted?: string };

/**
 * LIST TAGS
 * GET /api/tags?name=&includeDeleted=true
 */
export const listTags = async (
  req: Request<{}, {}, {}, TagQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const includeDeleted = req.query.includeDeleted === "true";
    const where: any = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (req.query.name) {
      where.name = { contains: req.query.name };
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { components: true } },
      },
    });

    res.json(successResponse(tags));
  } catch (error) {
    next(error);
  }
};

/**
 * GET TAG BY ID
 * GET /api/tags/:id
 */
export const getTagById = async (
  req: Request<TagParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const tag = await prisma.tag.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        components: {
          include: { component: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    if (!tag) {
      return res.status(404).json(errorResponse("Tag not found"));
    }

    res.json(successResponse(tag));
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE TAG
 * POST /api/tags
 */
export const createTag = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, color } = req.body;

    // Cek nama aktif (belum dihapus) agar tidak duplikat
    const existing = await prisma.tag.findFirst({ where: { name, deletedAt: null } });
    if (existing) {
      return res.status(400).json(errorResponse("Tag name already exists"));
    }

    const tag = await prisma.tag.create({
      data: { name, color },
    });

    res.status(201).json(successResponse(tag, "Tag created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE TAG
 * PUT /api/tags/:id
 */
export const updateTag = async (
  req: Request<TagParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const existing = await prisma.tag.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json(errorResponse("Tag not found"));
    }

    if (name && name !== existing.name) {
      const duplicate = await prisma.tag.findFirst({ where: { name, deletedAt: null } });
      if (duplicate) {
        return res.status(400).json(errorResponse("Tag name already exists"));
      }
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      },
    });

    res.json(successResponse(updated, "Tag updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * SOFT DELETE TAG
 * DELETE /api/tags/:id
 */
export const deleteTag = async (
  req: Request<TagParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.tag.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return res.status(404).json(errorResponse("Tag not found"));
    }

    await prisma.tag.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json(successResponse(null, "Tag deleted successfully"));
  } catch (error) {
    next(error);
  }
};
