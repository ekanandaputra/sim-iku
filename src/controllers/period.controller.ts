import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type PeriodParams = { id: string };

type PeriodQuery = {
  year?: string;
  type?: string;
  level?: string;
  parentId?: string;
};

export const listPeriods = async (
  req: Request<{}, {}, {}, PeriodQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const where: any = {};
    if (req.query.year) {
      where.year = Number(req.query.year);
    }
    if (req.query.type) {
      where.period_type = req.query.type;
    }
    if (req.query.level) {
      where.level = Number(req.query.level);
    }
    if (req.query.parentId) {
      where.parent_id = Number(req.query.parentId);
    }

    const records = await prisma.period.findMany({
      where,
      orderBy: [{ year: "desc" }, { level: "asc" }, { period_value: "asc" }],
      include: { children: true },
    });
    res.json(successResponse(records));
  } catch (error) {
    next(error);
  }
};

export const getPeriodById = async (
  req: Request<PeriodParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const period = await prisma.period.findUnique({
      where: { id_period: id },
      include: { parent: true, children: true },
    });
    if (!period) {
      return res.status(404).json(errorResponse("Period not found"));
    }
    res.json(successResponse(period));
  } catch (error) {
    next(error);
  }
};

export const createPeriod = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { year, periodType, periodValue, periodName, level, parentId } = req.body;

    const existing = await prisma.period.findUnique({
      where: {
        year_period_type_period_value: {
          year,
          period_type: periodType,
          period_value: periodValue,
        },
      },
    });

    if (existing) {
      return res.status(400).json(errorResponse("Period already exists for this year/type/value"));
    }

    const period = await prisma.period.create({
      data: {
        year,
        period_type: periodType,
        period_value: periodValue,
        period_name: periodName,
        level,
        parent_id: parentId ?? null,
      },
    });

    res.status(201).json(successResponse(period, "Period created successfully"));
  } catch (error) {
    next(error);
  }
};

export const updatePeriod = async (
  req: Request<PeriodParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { year, periodType, periodValue, periodName, level, parentId } = req.body;

    const period = await prisma.period.findUnique({ where: { id_period: id } });
    if (!period) {
      return res.status(404).json(errorResponse("Period not found"));
    }

    const updated = await prisma.period.update({
      where: { id_period: id },
      data: {
        year: year ?? period.year,
        period_type: periodType ?? period.period_type,
        period_value: periodValue ?? period.period_value,
        period_name: periodName ?? period.period_name,
        level: level ?? period.level,
        parent_id: parentId ?? period.parent_id,
      },
    });

    res.json(successResponse(updated, "Period updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deletePeriod = async (
  req: Request<PeriodParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const period = await prisma.period.findUnique({ where: { id_period: id } });

    if (!period) {
      return res.status(404).json(errorResponse("Period not found"));
    }

    await prisma.period.delete({ where: { id_period: id } });
    res.json(successResponse(null, "Period deleted successfully"));
  } catch (error) {
    next(error);
  }
};
