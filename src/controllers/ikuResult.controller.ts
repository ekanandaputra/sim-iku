import { Request, Response, NextFunction } from "express";
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
    const { idIku, month, year, calculatedValue, formulaVersion, calculatedAt } = req.body;

    const iku = await prisma.iKU.findUnique({ where: { id: idIku } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    const record = await prisma.ikuResult.upsert({
      where: {
        idIku_month_year: {
          idIku,
          month,
          year,
        },
      },
      create: {
        idIku,
        month,
        year,
        calculatedValue,
        formulaVersion: formulaVersion ?? null,
        calculatedAt: calculatedAt ? new Date(calculatedAt) : new Date(),
      },
      update: {
        calculatedValue,
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
    const { calculatedValue, formulaVersion, calculatedAt } = req.body;

    const existing = await prisma.ikuResult.findUnique({ where: { idResult: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("IKU result not found"));
    }

    const updated = await prisma.ikuResult.update({
      where: { idResult: id },
      data: {
        calculatedValue: calculatedValue ?? existing.calculatedValue,
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
