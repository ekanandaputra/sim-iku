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
        include: {
          tags: { where: { tag: { deletedAt: null } }, include: { tag: true }, orderBy: { tag: { name: "asc" } } },
          ikus: { include: { iku: { select: { id: true, code: true, name: true } } } },
        },
      }),
      prisma.component.count(),
    ]);

    res.json(successResponse({
      data: components.map((c) => ({
        ...c,
        tags: c.tags.map((ct) => ct.tag),
        ikus: c.ikus.map((ci) => ci.iku),
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
      include: {
        tags: { where: { tag: { deletedAt: null } }, include: { tag: true }, orderBy: { tag: { name: "asc" } } },
        ikus: { include: { iku: { select: { id: true, code: true, name: true } } } },
      },
    });

    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    res.json(successResponse({
      ...component,
      tags: component.tags.map((ct) => ct.tag),
      ikus: component.ikus.map((ci) => ci.iku),
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
    const { code, name, description, dataType, sourceType, periodType, tagIds } = req.body;

    const existing = await prisma.component.findUnique({
      where: { code },
    });

    if (existing) {
      return res.status(400).json(errorResponse("Component code already exists"));
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

    // Assign tags jika ada
    if (tagIds && tagIds.length > 0) {
      await prisma.componentTag.createMany({
        data: tagIds.map((tagId: string) => ({ componentId: component.id, tagId })),
      });
    }

    // Return component lengkap dengan tags
    const result = await prisma.component.findUnique({
      where: { id: component.id },
      include: {
        tags: { where: { tag: { deletedAt: null } }, include: { tag: true }, orderBy: { tag: { name: "asc" } } },
        ikus: { include: { iku: { select: { id: true, code: true, name: true } } } },
      },
    });

    res.status(201).json(successResponse({
      ...result,
      tags: result!.tags.map((ct) => ct.tag),
      ikus: result!.ikus.map((ci) => ci.iku),
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

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Konvensi penyimpanan bulan per period type:
//   yearly   → month = null  (key 0 di Map)
//   quarter  → month = 3, 6, 9, 12  (akhir kuartal)
//   semester → month = 6, 12        (akhir semester)
//   monthly  → month = 1 – 12

type RealizationViewQuery = { year?: string };

/**
 * GET COMPONENT REALIZATION VIEW
 * GET /api/components/:id/realization?year=2024
 *
 * Baris realisasi disesuaikan dengan periodType komponen:
 *   - yearly   → 1 baris (year, value)
 *   - quarter  → 4 baris (Q1–Q4 dengan month konvensi akhir kuartal)
 *   - semester → 2 baris (S1–S2 dengan month konvensi akhir semester)
 *   - monthly  → 12 baris (per bulan)
 *
 * id null pada baris = belum ada data → frontend kirim POST
 * id ada            = sudah ada data  → frontend kirim PUT
 */
export const getComponentRealizationView = async (
  req: Request<ComponentParams, {}, {}, RealizationViewQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    const component = await prisma.component.findUnique({
      where: { id },
      include: {
        tags: { where: { tag: { deletedAt: null } }, include: { tag: true }, orderBy: { tag: { name: "asc" } } },
        ikus: { include: { iku: { select: { id: true, code: true, name: true } } } },
      },
    });

    if (!component) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    // Ambil target tahun ini
    const target = await prisma.componentTarget.findUnique({
      where: { componentId_year: { componentId: id, year } },
    });

    // Ambil semua realisasi untuk tahun ini
    const realizationsRaw = await prisma.componentRealization.findMany({
      where: { idComponent: id, year },
    });

    // Index by month (null → 0)
    const byMonth = new Map(realizationsRaw.map((r) => [r.month ?? 0, r]));

    const row = (monthKey: number | 0, extra: object) => {
      const r = byMonth.get(monthKey);
      return {
        id: r?.idRealization ?? null,
        year,
        value: r ? Number(r.value) : null,
        _action: r ? "PUT" : "POST",
        ...extra,
      };
    };

    let realizations: object[];

    switch (component.periodType) {
      case "yearly":
        realizations = [row(0, {})];
        break;

      case "quarter":
        realizations = [
          row(3,  { quarter: "Q1", month: 3 }),
          row(6,  { quarter: "Q2", month: 6 }),
          row(9,  { quarter: "Q3", month: 9 }),
          row(12, { quarter: "Q4", month: 12 }),
        ];
        break;

      case "semester":
        realizations = [
          row(6,  { semester: "S1", month: 6 }),
          row(12, { semester: "S2", month: 12 }),
        ];
        break;

      case "monthly":
      default:
        realizations = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return row(month, { month, monthName: MONTH_NAMES[i] });
        });
        break;
    }

    res.json(successResponse({
      component: {
        id: component.id,
        code: component.code,
        name: component.name,
        description: component.description,
        dataType: component.dataType,
        sourceType: component.sourceType,
        periodType: component.periodType,
        tags: component.tags.map((ct) => ct.tag),
        ikus: component.ikus.map((ci) => ci.iku),
      },
      year,
      target: {
        id: target?.id ?? null,
        targetQ1: target ? Number(target.targetQ1) : null,
        targetQ2: target ? Number(target.targetQ2) : null,
        targetQ3: target ? Number(target.targetQ3) : null,
        targetQ4: target ? Number(target.targetQ4) : null,
        targetYear: target ? Number(target.targetYear) : null,
        _action: target ? "PUT" : "POST",
      },
      realizations,
    }));
  } catch (error) {
    next(error);
  }
};

