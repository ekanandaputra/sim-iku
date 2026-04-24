import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { evaluateFormula, ComponentValues } from "../utils/formula";

type RealizationParams = { id: string };

type RealizationQuery = {
  idComponent?: string;
  month?: string;
  year?: string;
  page?: string;
  limit?: string;
};

async function calculateIkuResultsForComponentRealization(idComponent: string, month: number, year: number) {
  console.log("Calculating IKU results for component realization", { idComponent, month, year });
  const component = await prisma.component.findUnique({ where: { id: idComponent } });
  if (!component) {
    return;
  }

  // First, check if there are any isFinal formulas that use this component
  const finalFormulas = await prisma.iKUFormula.findMany({
    where: {
      isFinal: true,
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

  // Determine which formulas to calculate
  let formulasToCalculate = finalFormulas;

  // If no final formulas found, fall back to all active formulas
  if (finalFormulas.length === 0) {
    console.log("No final formulas found, falling back to active formulas");
    formulasToCalculate = await prisma.iKUFormula.findMany({
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
  } else {
    console.log("Final formulas found, using only those for KPI calculation", { count: finalFormulas.length });
  }

  if (!formulasToCalculate.length) {
    return;
  }

  const requiredCodes = new Set<string>();
  for (const formula of formulasToCalculate) {
    for (const detail of formula.details) {
      if (detail.leftType === "component") {
        requiredCodes.add(detail.leftValue);
      }
      if (detail.rightType === "component") {
        requiredCodes.add(detail.rightValue);
      }
    }
  }

  const components = requiredCodes.size > 0
    ? await prisma.component.findMany({ where: { code: { in: Array.from(requiredCodes) } } })
    : [];

  const codeToComponent = new Map<string, { id: string; code: string; periodType: string }>();
  components.forEach((c) => codeToComponent.set(c.code, { id: c.id, code: c.code, periodType: c.periodType }));

  const realizationsByComponentId = new Map<string, any[]>();
  if (components.length > 0) {
    const realizations = await prisma.componentRealization.findMany({
      where: {
        idComponent: { in: components.map((c) => c.id) },
        year,
      },
    });

    for (const realization of realizations) {
      const items = realizationsByComponentId.get(realization.idComponent) || [];
      items.push(realization);
      realizationsByComponentId.set(realization.idComponent, items);
    }
  }

  for (const formula of formulasToCalculate) {
    const formulaCodes = new Set<string>();
    for (const detail of formula.details) {
      if (detail.leftType === "component") {
        formulaCodes.add(detail.leftValue);
      }
      if (detail.rightType === "component") {
        formulaCodes.add(detail.rightValue);
      }
    }

    const componentValues: ComponentValues = {};
    let missingData = false;

    for (const code of formulaCodes) {
      const targetComponent = codeToComponent.get(code);
      if (!targetComponent) {
        missingData = true;
        break;
      }

      const componentReals = realizationsByComponentId.get(targetComponent.id) || [];
      const selectedValues = targetComponent.periodType === "yearly"
        ? componentReals
        : componentReals.filter((realization) => realization.month === month);

      if (!selectedValues.length) {
        missingData = true;
        break;
      }

      componentValues[code] = selectedValues.reduce((sum, realization) => sum + Number(realization.value), 0);
    }

    if (missingData) {
      continue;
    }

    console.log("Evaluating formula", { formulaId: formula.id, isFinal: formula.isFinal, componentValues });
    try {
      const evaluation = await evaluateFormula(formula.id, componentValues);
      await prisma.ikuResult.upsert({
        where: {
          idIku_month_year: {
            idIku: formula.ikuId,
            month,
            year,
          },
        },
        create: {
          idIku: formula.ikuId,
          month,
          year,
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
    const { idComponent, month, year, value, documentIds } = req.body;

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

    if (documentIds && Array.isArray(documentIds)) {
      for (const docId of documentIds) {
        await prisma.componentDocument.upsert({
          where: {
            componentId_documentId: {
              componentId: idComponent,
              documentId: docId
            }
          },
          create: {
            componentId: idComponent,
            documentId: docId
          },
          update: {}
        });
      }
    }

    if (month != null) {
      await calculateIkuResultsForComponentRealization(idComponent, month, year);
    }

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
    const { value, documentIds } = req.body;

    const existing = await prisma.componentRealization.findUnique({ where: { idRealization: id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Component realization not found"));
    }

    const updated = await prisma.componentRealization.update({
      where: { idRealization: id },
      data: { value },
    });

    if (documentIds && Array.isArray(documentIds)) {
      for (const docId of documentIds) {
        await prisma.componentDocument.upsert({
          where: {
            componentId_documentId: {
              componentId: updated.idComponent,
              documentId: docId
            }
          },
          create: {
            componentId: updated.idComponent,
            documentId: docId
          },
          update: {}
        });
      }
    }

    if (updated.month != null) {
      await calculateIkuResultsForComponentRealization(updated.idComponent, updated.month, updated.year);
    }

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
