import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type RealizationParams = { id: string };

type RealizationQuery = {
  idComponent?: string;
  idPeriod?: string;
};

export const listComponentRealizations = async (
  req: Request<{}, {}, {}, RealizationQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const where: any = {};
    if (req.query.idComponent) where.idComponent = req.query.idComponent;
    if (req.query.idPeriod) where.idPeriod = req.query.idPeriod;

    const records = await prisma.componentRealization.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: { period: true, component: true },
    });
    res.json(successResponse(records));
  } catch (error) {
    next(error);
  }
};

export const getComponentRealizationById = async (
  req: Request<RealizationParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const record = await prisma.componentRealization.findUnique({
      where: { idRealization: id },
      include: { period: true, component: true },
    });

    if (!record) {
      return res.status(404).json(errorResponse("Component realization not found"));
    }
    res.json(successResponse(record));
  } catch (error) {
    next(error);
  }
};

export const createComponentRealization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { idComponent, idPeriod, value } = req.body;

    const record = await prisma.componentRealization.upsert({
      where: {
        idComponent_idPeriod: {
          idComponent,
          idPeriod,
        },
      },
      create: {
        idComponent,
        idPeriod,
        value,
      },
      update: {
        value,
      },
      include: { period: true, component: true },
    });

    const message = record ? "Component realization created or updated successfully" : "Component realization processed";
    res.status(201).json(successResponse(record, message));
  } catch (error) {
    next(error);
  }
};

export const updateComponentRealization = async (
  req: Request<RealizationParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { value } = req.body;

    const existing = await prisma.componentRealization.findUnique({ where: { idRealization: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Component realization not found"));
    }

    const updated = await prisma.componentRealization.update({
      where: { idRealization: id },
      data: { value },
    });

    res.json(successResponse(updated, "Component realization updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteComponentRealization = async (
  req: Request<RealizationParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.componentRealization.findUnique({ where: { idRealization: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Component realization not found"));
    }
    await prisma.componentRealization.delete({ where: { idRealization: id } });
    res.json(successResponse(null, "Component realization deleted successfully"));
  } catch (error) {
    next(error);
  }
};
