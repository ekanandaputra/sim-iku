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
    if (req.query.idIku) where.idIku = req.query.idIku;
    if (req.query.idPeriod) where.idPeriod = req.query.idPeriod;

    const results = await prisma.ikuResult.findMany({
      where,
      include: { iku: true, period: true },
      orderBy: [{ createdAt: "desc" }],
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
      where: { idResult: id },
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

    const period = await prisma.period.findUnique({ where: { idPeriod: idPeriod } });
    if (!period) {
      return res.status(404).json(errorResponse("Period not found"));
    }

    const record = await prisma.ikuResult.upsert({
      where: {
        idIku_idPeriod: {
          idIku: idIku,
          idPeriod: idPeriod,
        },
      },
      create: {
        idIku: idIku,
        idPeriod: idPeriod,
        calculatedValue: calculatedValue,
        formulaVersion: formulaVersion ?? null,
        calculatedAt: calculatedAt ? new Date(calculatedAt) : new Date(),
      },
      update: {
        calculatedValue: calculatedValue,
        formulaVersion: formulaVersion ?? undefined,
        calculatedAt: calculatedAt ? new Date(calculatedAt) : undefined,
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
    const id = Number(req.params.id);
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
