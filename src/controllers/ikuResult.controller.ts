import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type IkuResultParams = { id: string };

type IkuResultQuery = {
  idIku?: string;
  idPeriod?: string;
};

export const listIkuResults = async (
  req: Request<{}, {}, {}, IkuResultQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const where: any = {};
    if (req.query.idIku) where.id_iku = req.query.idIku;
    if (req.query.idPeriod) where.id_period = Number(req.query.idPeriod);

    const results = await prisma.ikuResult.findMany({
      where,
      include: { iku: true, period: true },
      orderBy: [{ created_at: "desc" }],
    });
    res.json(successResponse(results));
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
    const id = Number(req.params.id);
    const result = await prisma.ikuResult.findUnique({
      where: { id_result: id },
      include: { iku: true, period: true },
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
    const { idIku, idPeriod, calculatedValue, formulaVersion, calculatedAt } = req.body;

    const iku = await prisma.iKU.findUnique({ where: { id: idIku } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    const period = await prisma.period.findUnique({ where: { id_period: idPeriod } });
    if (!period) {
      return res.status(404).json(errorResponse("Period not found"));
    }

    const record = await prisma.ikuResult.upsert({
      where: {
        id_iku_id_period: {
          id_iku: idIku,
          id_period: idPeriod,
        },
      },
      create: {
        id_iku: idIku,
        id_period: idPeriod,
        calculated_value: calculatedValue,
        formula_version: formulaVersion ?? null,
        calculated_at: calculatedAt ? new Date(calculatedAt) : new Date(),
      },
      update: {
        calculated_value: calculatedValue,
        formula_version: formulaVersion ?? undefined,
        calculated_at: calculatedAt ? new Date(calculatedAt) : undefined,
      },
      include: { iku: true, period: true },
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
    const id = Number(req.params.id);
    const { calculatedValue, formulaVersion, calculatedAt } = req.body;

    const existing = await prisma.ikuResult.findUnique({ where: { id_result: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("IKU result not found"));
    }

    const updated = await prisma.ikuResult.update({
      where: { id_result: id },
      data: {
        calculated_value: calculatedValue ?? existing.calculated_value,
        formula_version: formulaVersion ?? existing.formula_version,
        calculated_at: calculatedAt ? new Date(calculatedAt) : existing.calculated_at,
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
    const id = Number(req.params.id);
    const existing = await prisma.ikuResult.findUnique({ where: { id_result: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("IKU result not found"));
    }
    await prisma.ikuResult.delete({ where: { id_result: id } });
    res.json(successResponse(null, "IKU result deleted successfully"));
  } catch (error) {
    next(error);
  }
};
