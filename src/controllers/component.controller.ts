import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type ComponentParams = {
  id: string;
};

type PaginationQuery = {
  page?: string;
  limit?: string;
  name?: string;
  tag?: string;
  search?: string;
  parentId?: string;
};

/**
 * Helper: include clause untuk component dengan hierarki parent + children
 */
const componentInclude = {
  parent: { select: { id: true, code: true, name: true } },
  children: {
    select: { id: true, code: true, name: true, periodType: true, hasBreakdown: true },
    orderBy: { code: "asc" as const },
  },
  tags: {
    where: { tag: { deletedAt: null } },
    include: { tag: true },
    orderBy: { tag: { name: "asc" as const } },
  },
  ikus: { include: { iku: { select: { id: true, code: true, name: true } } } },
};

/**
 * Helper: cegah circular reference (nenek moyang tidak boleh menjadi anak)
 * Traverse naik dari calon parent ke atas, pastikan tidak ada `id` yang sama
 */
async function hasCircularReference(
  candidateParentId: string,
  componentId: string
): Promise<boolean> {
  let current: string | null = candidateParentId;
  const visited = new Set<string>();

  while (current) {
    if (visited.has(current)) break; // loop tak terduga
    if (current === componentId) return true; // circular!
    visited.add(current);

    const comp: { parentId: string | null } | null = await prisma.component.findUnique({
      where: { id: current },
      select: { parentId: true },
    });
    current = comp?.parentId ?? null;
  }

  return false;
}

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

    const nameFilter = req.query.name?.trim();
    const tagFilter = req.query.tag?.trim();
    const searchFilter = req.query.search?.trim();
    const parentIdFilter = req.query.parentId?.trim();

    // Build where clause
    const where: any = {};

    if (searchFilter) {
      where.OR = [
        { name: { contains: searchFilter } },
        { code: { contains: searchFilter } },
      ];
    } else if (nameFilter) {
      where.name = { contains: nameFilter };
    }

    if (tagFilter) {
      where.tags = {
        some: {
          tag: {
            deletedAt: null,
            name: { contains: tagFilter },
          },
        },
      };
    }

    // Filter by parentId: bisa filter root (parentId=null) atau by specific parent
    if (parentIdFilter === "null") {
      where.parentId = null; // hanya root components
    } else if (parentIdFilter) {
      where.parentId = parentIdFilter;
    }

    const [components, total] = await Promise.all([
      prisma.component.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: "asc" },
        include: componentInclude,
      }),
      prisma.component.count({ where }),
    ]);

    res.json(successResponse({
      data: components.map((c) => ({
        ...c,
        tags: c.tags.map((ct) => ct.tag),
        ikus: c.ikus.map((ci) => ci.iku),
        isCalculated: c.children.length > 0,
      })),
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
      include: componentInclude,
    });

    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    res.json(successResponse({
      ...component,
      tags: component.tags.map((ct) => ct.tag),
      ikus: component.ikus.map((ci) => ci.iku),
      isCalculated: component.children.length > 0,
    }));
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
    const { code, name, description, dataType, sourceType, periodType, tagIds, parentId } = req.body;

    // Cek kode unik
    const existing = await prisma.component.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json(errorResponse("Component code already exists"));
    }

    // Validasi parentId jika ada
    if (parentId) {
      const parent = await prisma.component.findUnique({ where: { id: parentId } });
      if (!parent) {
        return res.status(404).json(errorResponse("Parent component not found"));
      }
    }

    // Validasi tagIds jika ada (exclude soft-deleted)
    if (tagIds && tagIds.length > 0) {
      const foundTags = await prisma.tag.findMany({
        where: { id: { in: tagIds }, deletedAt: null },
        select: { id: true },
      });
      if (foundTags.length !== tagIds.length) {
        return res.status(400).json(errorResponse("One or more tagIds are invalid or have been deleted"));
      }
    }

    const componentData: any = {
      code,
      name,
      description,
      periodType,
      parentId: parentId ?? null,
    };

    if (dataType !== undefined) componentData.dataType = dataType;
    if (sourceType !== undefined) componentData.sourceType = sourceType;

    const component = await prisma.component.create({ data: componentData });

    // Assign tags jika ada
    if (tagIds && tagIds.length > 0) {
      await prisma.componentTag.createMany({
        data: tagIds.map((tagId: string) => ({ componentId: component.id, tagId })),
      });
    }

    // Return component lengkap
    const result = await prisma.component.findUnique({
      where: { id: component.id },
      include: componentInclude,
    });

    res.status(201).json(successResponse({
      ...result,
      tags: result!.tags.map((ct) => ct.tag),
      ikus: result!.ikus.map((ci) => ci.iku),
      isCalculated: result!.children.length > 0,
    }, "Component created successfully"));
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
    const { code, name, description, dataType, sourceType, periodType, parentId } = req.body;

    const existing = await prisma.component.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    // Cek kode unik (jika berubah)
    if (code !== existing.code) {
      const other = await prisma.component.findUnique({ where: { code } });
      if (other) {
        return res.status(400).json(errorResponse("Component code already exists"));
      }
    }

    // Validasi parentId jika diubah
    if (parentId !== undefined) {
      if (parentId !== null) {
        // Self-reference check
        if (parentId === id) {
          return res.status(400).json(errorResponse("Component cannot be its own parent"));
        }

        // Parent harus ada
        const parent = await prisma.component.findUnique({ where: { id: parentId } });
        if (!parent) {
          return res.status(404).json(errorResponse("Parent component not found"));
        }

        // Circular reference check
        const isCircular = await hasCircularReference(parentId, id);
        if (isCircular) {
          return res.status(400).json(
            errorResponse("Circular reference detected: a descendant cannot become a parent")
          );
        }
      }
    }

    const updateData: any = { code, name, description, periodType };

    if (dataType !== undefined) updateData.dataType = dataType;
    if (sourceType !== undefined) updateData.sourceType = sourceType;

    // parentId: undefined berarti tidak diubah, null berarti dijadikan root, string berarti diubah
    if (parentId !== undefined) updateData.parentId = parentId;

    const updated = await prisma.component.update({
      where: { id },
      data: updateData,
      include: componentInclude,
    });

    res.json(successResponse({
      ...updated,
      tags: updated.tags.map((ct) => ct.tag),
      ikus: updated.ikus.map((ci) => ci.iku),
      isCalculated: updated.children.length > 0,
    }, "Component updated successfully"));
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
      include: { children: { select: { id: true } } },
    });

    if (!existing) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    // Cegah hapus komponen yang masih punya children
    if (existing.children.length > 0) {
      return res.status(400).json(
        errorResponse("Cannot delete component that has child components. Remove children first.")
      );
    }

    await prisma.component.delete({ where: { id } });

    res.json(successResponse(null, "Component deleted successfully"));
  } catch (error) {
    next(error);
  }
};

type ComponentTagParams = {
  id: string;
  tagId: string;
};

/**
 * LIST TAGS OF A COMPONENT
 * GET /api/components/:id/tags
 */
export const listComponentTags = async (
  req: Request<ComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const component = await prisma.component.findUnique({ where: { id } });
    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    const tags = await prisma.componentTag.findMany({
      where: { componentId: id, tag: { deletedAt: null } },
      include: { tag: true },
      orderBy: { tag: { name: "asc" } },
    });

    res.json(successResponse(tags.map((ct) => ct.tag)));
  } catch (error) {
    next(error);
  }
};

/**
 * ASSIGN TAG TO COMPONENT
 * POST /api/components/:id/tags
 */
export const assignTagToComponent = async (
  req: Request<ComponentParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { tagId } = req.body;

    const component = await prisma.component.findUnique({ where: { id } });
    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    const tag = await prisma.tag.findFirst({ where: { id: tagId, deletedAt: null } });
    if (!tag) {
      return res.status(404).json(errorResponse("Tag not found or has been deleted"));
    }

    const existing = await prisma.componentTag.findUnique({
      where: { componentId_tagId: { componentId: id, tagId } },
    });
    if (existing) {
      return res.status(400).json(errorResponse("Tag is already assigned to this component"));
    }

    const componentTag = await prisma.componentTag.create({
      data: { componentId: id, tagId },
      include: { tag: true },
    });

    res.status(201).json(successResponse(componentTag, "Tag assigned to component successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UNASSIGN TAG FROM COMPONENT
 * DELETE /api/components/:id/tags/:tagId
 */
export const unassignTagFromComponent = async (
  req: Request<ComponentTagParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, tagId } = req.params;

    const existing = await prisma.componentTag.findUnique({
      where: { componentId_tagId: { componentId: id, tagId } },
    });
    if (!existing) {
      return res.status(404).json(errorResponse("Tag assignment not found"));
    }

    await prisma.componentTag.delete({
      where: { componentId_tagId: { componentId: id, tagId } },
    });

    res.json(successResponse(null, "Tag unassigned from component successfully"));
  } catch (error) {
    next(error);
  }
};
