import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type TargetParams = { id: string };
type TargetQuery = { ikuId?: string; year?: string };

export const getAllIkuTargets = async (req: Request<{}, {}, {}, TargetQuery>, res: Response, next: NextFunction) => {
  try {
    const { ikuId, year } = req.query;
    const where: any = {};
    if (ikuId) where.ikuId = String(ikuId);
    if (year) where.year = Number(year);

    const ikuTargets = await prisma.ikuTarget.findMany({
      where,
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      include: {
        iku: true,
      },
    });
    res.json(successResponse(ikuTargets));
  } catch (error) {
    next(error);
  }
};

export const getIkuTargetById = async (req: Request<TargetParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const ikuTarget = await prisma.ikuTarget.findUnique({
      where: { id },
      include: { iku: true },
    });

    if (!ikuTarget) {
      return res.status(404).json(errorResponse("IKU Target not found"));
    }

    res.json(successResponse(ikuTarget));
  } catch (error) {
    next(error);
  }
};

export const createIkuTarget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ikuId, year, targetQ1, targetQ2, targetQ3, targetQ4, targetYear } = req.body;

    const existingTarget = await prisma.ikuTarget.findUnique({
      where: {
        ikuId_year: { ikuId, year },
      },
    });

    if (existingTarget) {
      return res.status(400).json(errorResponse("Target for this IKU and year already exists"));
    }

    const ikuTarget = await prisma.ikuTarget.create({
      data: { ikuId, year, targetQ1, targetQ2, targetQ3, targetQ4, targetYear },
    });

    res.status(201).json(successResponse(ikuTarget, "IKU Target created successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateIkuTarget = async (req: Request<TargetParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { year, targetQ1, targetQ2, targetQ3, targetQ4, targetYear } = req.body;

    const existingTarget = await prisma.ikuTarget.findUnique({ where: { id } });
    if (!existingTarget) {
      return res.status(404).json(errorResponse("IKU Target not found"));
    }

    const ikuTarget = await prisma.ikuTarget.update({
      where: { id },
      data: { year, targetQ1, targetQ2, targetQ3, targetQ4, targetYear },
    });

    res.json(successResponse(ikuTarget, "IKU Target updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteIkuTarget = async (req: Request<TargetParams>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existingTarget = await prisma.ikuTarget.findUnique({ where: { id } });
    
    if (!existingTarget) {
      return res.status(404).json(errorResponse("IKU Target not found"));
    }

    await prisma.ikuTarget.delete({ where: { id } });
    res.json(successResponse(null, "IKU Target deleted successfully"));
  } catch (error) {
    next(error);
  }
};
