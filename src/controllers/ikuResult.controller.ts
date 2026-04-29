import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type IkuResultParams = { id: string };

type IkuResultQuery = {
  idIku?: string;
  month?: string;
  year?: string;
  page?: string;
  limit?: string;
};

/**
 * Validate that the payload has the correct value field based on IKU unit type.
 * - percentage / number → calculatedValue (Decimal)
 * - text                → metadata.text (string)
 * - file                → metadata.files (array)
 */
async function validateValueByUnit(
  ikuId: string,
  calculatedValue?: number | null,
  metadata?: Record<string, any> | null
): Promise<string | null> {
  const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
  if (!iku) return "IKU not found";

  const unit = iku.unit;

  if (unit === "percentage" || unit === "number") {
    if (calculatedValue == null) {
      return `calculatedValue is required for unit type '${unit}'`;
    }
  }

  if (unit === "text") {
    if (!metadata || typeof metadata.text !== "string") {
      return "metadata.text (string) is required for unit type 'text'";
    }
  }

  if (unit === "file") {
    if (!metadata || !Array.isArray(metadata.files) || metadata.files.length === 0) {
      return "metadata.files (array) is required for unit type 'file'";
    }
  }

  return null;
}

export const listIkuResults = async (
  req: Request<{}, {}, {}, IkuResultQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const where: any = {};
    if (req.query.idIku) where.idIku = req.query.idIku;
    if (req.query.month) where.month = Number(req.query.month);
    if (req.query.year) where.year = Number(req.query.year);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      prisma.ikuResult.findMany({
        where,
        skip,
        take: limit,
        include: { iku: true },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.ikuResult.count({ where }),
    ]);

    res.json(successResponse({
      data: results,
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

export const getIkuResultById = async (
  req: Request<IkuResultParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const result = await prisma.ikuResult.findUnique({
      where: { idResult: id },
      include: { iku: true },
    });
    if (!result) {
      return res.status(404).json(errorResponse("IKU result not found"));
    }
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const createIkuResult = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { idIku, month, year, calculatedValue, metadata, formulaVersion, calculatedAt } = req.body;

    const validationError = await validateValueByUnit(idIku, calculatedValue, metadata);
    if (validationError) {
      return res.status(400).json(errorResponse(validationError));
    }

    const record = await prisma.ikuResult.upsert({
      where: {
        idIku_month_year: { idIku, month, year },
      },
      create: {
        idIku,
        month,
        year,
        calculatedValue: calculatedValue ?? null,
        metadata: metadata ?? Prisma.JsonNull,
        formulaVersion: formulaVersion ?? null,
        calculatedAt: calculatedAt ? new Date(calculatedAt) : new Date(),
      },
      update: {
        calculatedValue: calculatedValue ?? null,
        metadata: metadata ?? Prisma.JsonNull,
        formulaVersion: formulaVersion ?? undefined,
        calculatedAt: calculatedAt ? new Date(calculatedAt) : undefined,
      },
      include: { iku: true },
    });

    res.status(201).json(successResponse(record, "IKU result created or updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateIkuResult = async (
  req: Request<IkuResultParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const { calculatedValue, metadata, formulaVersion, calculatedAt } = req.body;

    const existing = await prisma.ikuResult.findUnique({ where: { idResult: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("IKU result not found"));
    }

    const validationError = await validateValueByUnit(
      existing.idIku,
      calculatedValue ?? (existing.calculatedValue ? Number(existing.calculatedValue) : null),
      metadata ?? (existing.metadata as Record<string, any> | null)
    );
    if (validationError) {
      return res.status(400).json(errorResponse(validationError));
    }

    const updated = await prisma.ikuResult.update({
      where: { idResult: id },
      data: {
        calculatedValue: calculatedValue !== undefined ? calculatedValue : existing.calculatedValue,
        metadata: metadata !== undefined ? metadata : existing.metadata,
        formulaVersion: formulaVersion ?? existing.formulaVersion,
        calculatedAt: calculatedAt ? new Date(calculatedAt) : existing.calculatedAt,
      },
    });

    res.json(successResponse(updated, "IKU result updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteIkuResult = async (
  req: Request<IkuResultParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const existing = await prisma.ikuResult.findUnique({ where: { idResult: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("IKU result not found"));
    }
    await prisma.ikuResult.delete({ where: { idResult: id } });
    res.json(successResponse(null, "IKU result deleted successfully"));
  } catch (error) {
    next(error);
  }
};
