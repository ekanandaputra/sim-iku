import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import { IkuResultType } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { writeAuditLog } from "../utils/auditLog";
import { AuditAction, AuditEntityType } from "../generated/prisma/enums";

type IkuResultParams = { id: string };

type IkuResultQuery = {
  idIku?: string;
  month?: string;
  year?: string;
  resultType?: string;
  quarter?: string;
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
  textValue?: string | null,
  documentIds?: string[] | null,
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
    if (!textValue && (!metadata || typeof metadata.text !== "string")) {
      return "textValue or metadata.text (string) is required for unit type 'text'";
    }
  }

  if (unit === "file") {
    if ((!documentIds || !Array.isArray(documentIds)) && (!metadata || !Array.isArray(metadata.files))) {
      return "documentIds (array) or metadata.files (array) is required for unit type 'file'";
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
    if (req.query.resultType) where.resultType = req.query.resultType as IkuResultType;
    if (req.query.quarter) where.quarter = Number(req.query.quarter);

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
    const { idIku, month, year, resultType, quarter, calculatedValue, textValue, documentIds, metadata, formulaVersion, calculatedAt, narrative } = req.body;

    const validationError = await validateValueByUnit(idIku, calculatedValue, textValue, documentIds, metadata);
    if (validationError) {
      return res.status(400).json(errorResponse(validationError));
    }

    const resolvedResultType: IkuResultType = resultType ?? IkuResultType.monthly;

    const record = await prisma.ikuResult.upsert({
      where: {
        idIku_month_year_resultType: { idIku, month, year, resultType: resolvedResultType },
      },
      create: {
        idIku,
        month,
        year,
        resultType: resolvedResultType,
        quarter: quarter ?? null,
        calculatedValue: calculatedValue ?? null,
        textValue: textValue ?? null,
        documentIds: documentIds ?? Prisma.JsonNull,
        metadata: metadata ?? Prisma.JsonNull,
        formulaVersion: formulaVersion ?? null,
        narrative: narrative ?? null,
        calculatedAt: calculatedAt ? new Date(calculatedAt) : new Date(),
      },
      update: {
        quarter: quarter ?? null,
        calculatedValue: calculatedValue ?? null,
        textValue: textValue ?? null,
        documentIds: documentIds ?? Prisma.JsonNull,
        metadata: metadata ?? Prisma.JsonNull,
        formulaVersion: formulaVersion ?? undefined,
        narrative: narrative ?? undefined,
        calculatedAt: calculatedAt ? new Date(calculatedAt) : undefined,
      },
      include: { iku: true },
    });

    await writeAuditLog({
      entityType: AuditEntityType.IKU_RESULT,
      entityId: record.idResult,
      entityCode: record.iku?.code,
      entityName: record.iku?.name,
      action: AuditAction.CREATE,
      userId: (req as any).user?.id ?? null,
      newValues: { idIku, month, year, resultType: resolvedResultType, calculatedValue, textValue, quarter, narrative },
      req,
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
    const { calculatedValue, textValue, documentIds, metadata, formulaVersion, calculatedAt, narrative } = req.body;

    const existing = await prisma.ikuResult.findUnique({ where: { idResult: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("IKU result not found"));
    }

    const validationError = await validateValueByUnit(
      existing.idIku,
      calculatedValue ?? (existing.calculatedValue ? Number(existing.calculatedValue) : null),
      textValue ?? existing.textValue,
      documentIds ?? (existing.documentIds as string[] | null),
      metadata ?? (existing.metadata as Record<string, any> | null)
    );
    if (validationError) {
      return res.status(400).json(errorResponse(validationError));
    }

    const updated = await prisma.ikuResult.update({
      where: { idResult: id },
      data: {
        calculatedValue: calculatedValue !== undefined ? calculatedValue : existing.calculatedValue,
        textValue: textValue !== undefined ? textValue : existing.textValue,
        documentIds: documentIds !== undefined ? documentIds : existing.documentIds,
        metadata: metadata !== undefined ? metadata : existing.metadata,
        formulaVersion: formulaVersion ?? existing.formulaVersion,
        narrative: narrative !== undefined ? narrative : existing.narrative,
        calculatedAt: calculatedAt ? new Date(calculatedAt) : existing.calculatedAt,
      },
    });

    await writeAuditLog({
      entityType: AuditEntityType.IKU_RESULT,
      entityId: updated.idResult,
      entityCode: existing.idIku,
      entityName: null,
      action: AuditAction.UPDATE,
      userId: (req as any).user?.id ?? null,
      oldValues: { calculatedValue: existing.calculatedValue, textValue: existing.textValue, documentIds: existing.documentIds, metadata: existing.metadata, formulaVersion: existing.formulaVersion, narrative: existing.narrative },
      newValues: { calculatedValue: updated.calculatedValue, textValue: updated.textValue, documentIds: updated.documentIds, metadata: updated.metadata, formulaVersion: updated.formulaVersion, narrative: updated.narrative },
      req,
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

    await writeAuditLog({
      entityType: AuditEntityType.IKU_RESULT,
      entityId: id,
      entityCode: existing.idIku,
      entityName: null,
      action: AuditAction.DELETE,
      userId: (req as any).user?.id ?? null,
      oldValues: { idIku: existing.idIku, month: existing.month, year: existing.year, resultType: existing.resultType, calculatedValue: existing.calculatedValue },
      req,
    });

    res.json(successResponse(null, "IKU result deleted successfully"));
  } catch (error) {
    next(error);
  }
};
