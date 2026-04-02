import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { evaluateFormula, ComponentValues } from "../utils/formula";

type RealizationParams = { id: string };

type RealizationQuery = {
  idComponent?: string;
  idPeriod?: string;
};

async function calculateIkuResultsForComponentRealization(idComponent: string, idPeriod: string) {
  console.log("Calculating IKU results for component realization", { idComponent, idPeriod });
  const component = await prisma.component.findUnique({ where: { id: idComponent } });
  if (!component) {
    return;
  }

  const activeFormulas = await prisma.iKUFormula.findMany({
    where: {
      isActive: true,
      details: {
        some: {
          OR: [
            { leftType: "component", leftValue: component.code },
            { rightType: "component", rightValue: component.code },
          ],
        },
      },
    },
    include: {
      details: {
        orderBy: { sequence: "asc" },
      },
    },
  });

  console.log("Active formulas found", { count: activeFormulas.length });
  if (!activeFormulas.length) {
    return;
  }

  for (const formula of activeFormulas) {
    const componentCodes = new Set<string>();
    for (const detail of formula.details) {
      if (detail.leftType === "component") {
        componentCodes.add(detail.leftValue);
      }
      if (detail.rightType === "component") {
        componentCodes.add(detail.rightValue);
      }
    }

    const requiredCodes = Array.from(componentCodes);
    const componentValues: ComponentValues = {};

    if (requiredCodes.length > 0) {
      const components = await prisma.component.findMany({
        where: {
          code: { in: requiredCodes },
        },
      });

      const codeToId = new Map<string, string>();
      components.forEach((c) => codeToId.set(c.code, c.id));

      const componentIds = components.map((c) => c.id);
      const realizations = await prisma.componentRealization.findMany({
        where: {
          idPeriod,
          idComponent: { in: componentIds },
        },
      });

      // Map back code -> value
      for (const realization of realizations) {
        const found = components.find((c) => c.id === realization.idComponent);
        if (found) {
          componentValues[found.code] = Number(realization.value);
        }
      }

      const missingCodes = requiredCodes.filter((code) => !(code in componentValues));
      if (missingCodes.length > 0) {
        continue;
      }
    }

    console.log("Evaluating formula", { formulaId: formula.id, componentValues });
    // Evaluate formula and upsert result
    try {
      const evaluation = await evaluateFormula(formula.id, componentValues);
      await prisma.ikuResult.upsert({
        where: {
          idIku_idPeriod: {
            idIku: formula.ikuId,
            idPeriod,
          },
        },
        create: {
          idIku: formula.ikuId,
          idPeriod,
          calculatedValue: evaluation.result,
          formulaVersion: formula.version.toString(),
          calculatedAt: new Date(),
        },
        update: {
          calculatedValue: evaluation.result,
          formulaVersion: formula.version.toString(),
          calculatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("IKU result calculation failed", { formulaId: formula.id, error });
    }
  }
}

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
    const id = req.params.id;
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

    await calculateIkuResultsForComponentRealization(idComponent, idPeriod);

    res.status(201).json(successResponse(record, "Component realization created or updated successfully"));
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
    const id = req.params.id;
    const { value } = req.body;

    const existing = await prisma.componentRealization.findUnique({ where: { idRealization: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Component realization not found"));
    }

    const updated = await prisma.componentRealization.update({
      where: { idRealization: id },
      data: { value },
    });

    await calculateIkuResultsForComponentRealization(updated.idComponent, updated.idPeriod);

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
    const id = req.params.id;
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
