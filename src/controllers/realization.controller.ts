import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { calculateIkuResultsForComponentRealization } from "./componentRealization.controller";
import { BulkSaveRealizationDto } from "../dtos/realization.dto";

const YEARS_RANGE = 6;
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

type PaginationQuery = {
  page?: string;
  limit?: string;
  name?: string;
  tag?: string;
};

/**
 * LIST REALIZATION METRICS
 * GET /api/realizations/metrics
 *
 * When ENABLE_USER_FILTER=true, the Bearer token is required.
 * The userId is extracted from the JWT payload (req.user.id).
 * When ENABLE_USER_FILTER=false (or unset), all IKUs and Components are returned
 * and authentication is not required.
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
    const tagFilter  = req.query.tag?.trim();

    const userFilterEnabled = process.env.ENABLE_USER_FILTER === "true";
    const userId = userFilterEnabled ? (req as any).user?.id : undefined;

    // When user filter is active but token is missing / invalid, return empty result
    if (userFilterEnabled && !userId) {
      return res.json(
        successResponse({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      );
    }

    let ikus: any[] = [];

    // IKU doesn't have tags, so if tagFilter is provided, we skip fetching IKUs
    if (!tagFilter) {
      const ikuWhere: any = { isDirectInput: true };
      if (nameFilter) {
        ikuWhere.name = { contains: nameFilter };
      }
      if (userFilterEnabled && userId) {
        // Only IKUs where this user is assigned
        ikuWhere.users = { some: { userId } };
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
    if (userFilterEnabled && userId) {
      // Only Components where this user is assigned
      compWhere.users = { some: { userId } };
    }

    const components = await prisma.component.findMany({
      where: compWhere,
      include: {
        tags: {
          where: { tag: { deletedAt: null } },
          include: { tag: true },
          orderBy: { tag: { name: "asc" } },
        },
        ikus: {
          include: { iku: { select: { id: true, code: true, name: true } } },
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
        ikus: c.ikus.map((ci) => ci.iku),
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


/**
 * GET REALIZATION VIEW
 * GET /api/realizations/:type/:id/view?year=2024
 *
 * Returns 6 years of data (selected year + 5 previous).
 * :type can be 'component' or 'iku'.
 */
export const getRealizationView = async (
  req: Request<{ type: string; id: string }, {}, {}, { year?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, id } = req.params;
    const baseYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const years = Array.from({ length: YEARS_RANGE }, (_, i) => baseYear - i);

    if (type.toLowerCase() === "component") {
      const component = await prisma.component.findUnique({
        where: { id },
        include: {
          tags: { where: { tag: { deletedAt: null } }, include: { tag: true }, orderBy: { tag: { name: "asc" } } },
          ikus: { include: { iku: { select: { id: true, code: true, name: true } } } },
        },
      });

      if (!component) return res.status(404).json(errorResponse("Component not found"));

      const [allTargets, allRealizations] = await Promise.all([
        prisma.componentTarget.findMany({ where: { componentId: id, year: { in: years } } }),
        prisma.componentRealization.findMany({ where: { idComponent: id, year: { in: years } } }),
      ]);

      const targetByYear = new Map(allTargets.map((t) => [t.year, t]));
      const realizationsByYear = new Map<number, Map<number, typeof allRealizations[0]>>();
      for (const r of allRealizations) {
        if (!realizationsByYear.has(r.year)) realizationsByYear.set(r.year, new Map());
        realizationsByYear.get(r.year)!.set(r.month ?? 0, r);
      }

      const buildRow = (byMonth: Map<number, typeof allRealizations[0]>, year: number, monthKey: number, extra: object) => {
        const r = byMonth.get(monthKey);
        return {
          id: r?.idRealization ?? null,
          year,
          value: r ? Number(r.value) : null,
          _action: r ? "PUT" : "POST",
          ...extra,
        };
      };

      const buildRows = (byMonth: Map<number, typeof allRealizations[0]>, year: number): object[] => {
        const row = (monthKey: number, extra: object) => buildRow(byMonth, year, monthKey, extra);
        switch (component.periodType) {
          case "yearly": return [row(0, {})];
          case "quarter": return [row(3, { quarter: "Q1", month: 3 }), row(6, { quarter: "Q2", month: 6 }), row(9, { quarter: "Q3", month: 9 }), row(12, { quarter: "Q4", month: 12 })];
          case "semester": return [row(6, { semester: "S1", month: 6 }), row(12, { semester: "S2", month: 12 })];
          case "monthly":
          default:
            return Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              return row(month, { month, monthName: MONTH_NAMES[i] });
            });
        }
      };

      const data = years.map((year) => {
        const target = targetByYear.get(year) ?? null;
        const byMonth = realizationsByYear.get(year) ?? new Map();
        return {
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
          realizations: buildRows(byMonth, year),
        };
      });

      return res.json(successResponse({
        metric: {
          id: component.id,
          type: "COMPONENT",
          code: component.code,
          name: component.name,
          description: component.description,
          dataType: component.dataType,
          sourceType: component.sourceType,
          periodType: component.periodType,
          tags: component.tags.map((ct) => ct.tag),
          ikus: component.ikus.map((ci) => ci.iku),
        },
        years,
        data,
      }));
    } else if (type.toLowerCase() === "iku") {
      const iku = await prisma.iKU.findUnique({ where: { id } });
      if (!iku) return res.status(404).json(errorResponse("IKU not found"));

      const [allTargets, allRealizations] = await Promise.all([
        prisma.ikuTarget.findMany({ where: { ikuId: id, year: { in: years } } }),
        prisma.ikuResult.findMany({ where: { idIku: id, year: { in: years } } }),
      ]);

      const targetByYear = new Map(allTargets.map((t) => [t.year, t]));
      const realizationsByYear = new Map<number, Map<number, typeof allRealizations[0]>>();
      for (const r of allRealizations) {
        if (!realizationsByYear.has(r.year)) realizationsByYear.set(r.year, new Map());
        realizationsByYear.get(r.year)!.set(r.month ?? 0, r);
      }

      const buildRow = (byMonth: Map<number, typeof allRealizations[0]>, year: number, monthKey: number, extra: object) => {
        const r = byMonth.get(monthKey);
        return {
          id: r?.idResult ?? null,
          year,
          value: r ? Number(r.calculatedValue) : null,
          _action: r ? "PUT" : "POST",
          ...extra,
        };
      };

      // IKU is yearly (month 0)
      const buildRows = (byMonth: Map<number, typeof allRealizations[0]>, year: number): object[] => {
        return [buildRow(byMonth, year, 0, {})];
      };

      const data = years.map((year) => {
        const target = targetByYear.get(year) ?? null;
        const byMonth = realizationsByYear.get(year) ?? new Map();
        return {
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
          realizations: buildRows(byMonth, year),
        };
      });

      return res.json(successResponse({
        metric: {
          id: iku.id,
          type: "IKU",
          code: iku.code,
          name: iku.name,
          description: iku.description,
          unit: iku.unit,
          isDirectInput: iku.isDirectInput,
          tags: [],
        },
        years,
        data,
      }));
    } else {
      return res.status(400).json(errorResponse("Invalid type. Must be 'component' or 'iku'"));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * BULK SAVE REALIZATION
 * POST /api/realizations/:type/:id/bulk
 */
export const bulkSaveRealization = async (
  req: Request<{ type: string; id: string }, {}, BulkSaveRealizationDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, id } = req.params;
    const { year, realizations } = req.body;

    if (type.toLowerCase() === "component") {
      const component = await prisma.component.findUnique({ where: { id } });
      if (!component) return res.status(404).json(errorResponse("Component not found"));

      // Validate month according to periodType
      const validMonths: number[] = [];
      if (component.periodType === "yearly") validMonths.push(0);
      else if (component.periodType === "semester") validMonths.push(6, 12);
      else if (component.periodType === "quarter") validMonths.push(3, 6, 9, 12);
      else if (component.periodType === "monthly") validMonths.push(...Array.from({ length: 12 }, (_, i) => i + 1));

      for (const item of realizations) {
        if (!validMonths.includes(item.month)) {
          return res.status(400).json(errorResponse(`Invalid month ${item.month} for periodType ${component.periodType}`));
        }
        if (item.value == null) {
          return res.status(400).json(errorResponse("value is required for component realization"));
        }
      }

      const results = [];
      for (const item of realizations) {
        const record = await prisma.componentRealization.upsert({
          where: {
            idComponent_month_year: { idComponent: id, month: item.month, year },
          },
          create: { idComponent: id, month: item.month, year, value: item.value! },
          update: { value: item.value! },
        });

        if (item.documentIds && Array.isArray(item.documentIds)) {
          for (const docId of item.documentIds) {
            await prisma.componentDocument.upsert({
              where: { componentId_documentId: { componentId: id, documentId: docId } },
              create: { componentId: id, documentId: docId },
              update: {},
            });
          }
        }

        if (item.month != null) {
          await calculateIkuResultsForComponentRealization(id, item.month, year);
        }
        results.push(record);
      }

      return res.json(successResponse(results, "Bulk save component realizations successful"));

    } else if (type.toLowerCase() === "iku") {
      const iku = await prisma.iKU.findUnique({ where: { id } });
      if (!iku) return res.status(404).json(errorResponse("IKU not found"));

      // Validate value vs metadata based on unit type
      for (const item of realizations) {
        if (iku.unit === "percentage" || iku.unit === "number") {
          if (item.value == null) {
            return res.status(400).json(errorResponse(`value is required for IKU unit type '${iku.unit}'`));
          }
        }
        if (iku.unit === "text") {
          if (!item.metadata || typeof item.metadata.text !== "string") {
            return res.status(400).json(errorResponse("metadata.text (string) is required for IKU unit type 'text'"));
          }
        }
        if (iku.unit === "file") {
          if (!item.metadata || !Array.isArray(item.metadata.files) || item.metadata.files.length === 0) {
            return res.status(400).json(errorResponse("metadata.files (array) is required for IKU unit type 'file'"));
          }
        }
      }

      const results = [];
      for (const item of realizations) {
        const record = await prisma.ikuResult.upsert({
          where: { idIku_month_year: { idIku: id, month: item.month, year } },
          create: {
            idIku: id,
            month: item.month,
            year,
            calculatedValue: item.value ?? null,
            metadata: item.metadata ?? Prisma.JsonNull,
          },
          update: {
            calculatedValue: item.value ?? null,
            metadata: item.metadata ?? Prisma.JsonNull,
          },
        });
        results.push(record);
      }

      return res.json(successResponse(results, "Bulk save IKU results successful"));
    } else {
      return res.status(400).json(errorResponse("Invalid type. Must be 'component' or 'iku'"));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET REALIZATION DETAIL
 * GET /api/realizations/:type/:id/detail
 * :id here is idRealization (for component) or idResult (for IKU)
 */
export const getRealizationDetail = async (
  req: Request<{ type: string; id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, id } = req.params;

    if (type.toLowerCase() === "component") {
      const realization = await prisma.componentRealization.findUnique({
        where: { idRealization: id },
        include: {
          component: {
            include: {
              tags: { where: { tag: { deletedAt: null } }, include: { tag: true }, orderBy: { tag: { name: "asc" } } },
              ikus: { include: { iku: { select: { id: true, code: true, name: true } } } },
            }
          },
          documents: { include: { document: true } },
        },
      });

      if (!realization) return res.status(404).json(errorResponse("Component realization not found"));

      const { component, ...realizationData } = realization;

      return res.json(successResponse({
        metric: component,
        realization: realizationData,
      }));

    } else if (type.toLowerCase() === "iku") {
      const result = await prisma.ikuResult.findUnique({
        where: { idResult: id },
        include: { iku: true }
      });

      if (!result) return res.status(404).json(errorResponse("IKU result not found"));

      let documents: any[] = [];
      if (result.documentIds && Array.isArray(result.documentIds)) {
        documents = await prisma.document.findMany({
          where: { id: { in: result.documentIds as string[] } }
        });
      }

      const { iku, ...realizationData } = result;

      return res.json(successResponse({
        metric: iku,
        realization: { ...realizationData, documents },
      }));

    } else {
      return res.status(400).json(errorResponse("Invalid type. Must be 'component' or 'iku'"));
    }
  } catch (error) {
    next(error);
  }
};
