import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { evaluateFormula, ComponentValues } from "../utils/formula";

type RealizationParams = { id: string };

type RealizationQuery = {
  idComponent?: string;
  month?: string;
  year?: string;
};

async function calculateIkuResultsForComponentRealization(idComponent: string, month: number, year: number) {
  const quarter = Math.ceil(month / 3);
  console.log("Calculating IKU results for component realization", { idComponent, month, year, quarter });
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

  const period = await prisma.period.findFirst({
    where: { year, periodType: "quarter", periodValue: quarter }
  });

  if (!period) {
    console.log(`No target period quarter found for year ${year} and quarter ${quarter}`);
    return;
  }

  const idPeriod = period.idPeriod;

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
      
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;

      const realizations = await prisma.componentRealization.findMany({
        where: {
          month: { gte: startMonth, lte: endMonth },
          year,
          idComponent: { in: componentIds },
        },
      });

      // Map back code -> value
      for (const realization of realizations) {
        const found = components.find((c) => c.id === realization.idComponent);
        if (found) {
          componentValues[found.code] = (componentValues[found.code] || 0) + Number(realization.value);
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
    if (req.query.month) where.month = parseInt(req.query.month);
    if (req.query.year) where.year = parseInt(req.query.year);

    const records = await prisma.componentRealization.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { component: true },
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
      include: { component: true },
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
    const { idComponent, month, year, value } = req.body;

    const record = await prisma.componentRealization.upsert({
      where: {
        idComponent_month_year: {
          idComponent,
          month,
          year,
        },
      },
      create: {
        idComponent,
        month,
        year,
        value,
      },
      update: {
        value,
      },
      include: { component: true },
    });

    await calculateIkuResultsForComponentRealization(idComponent, month, year);

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

    await calculateIkuResultsForComponentRealization(updated.idComponent, updated.month, updated.year);

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
