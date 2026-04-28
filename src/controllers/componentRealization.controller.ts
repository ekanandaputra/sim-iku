import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { evaluateFormula, ComponentValues, getFormulaRequiredComponentCodes } from "../utils/formula";

type RealizationParams = { id: string };

type RealizationQuery = {
  idComponent?: string;
  month?: string;
  year?: string;
  tagId?: string;
  page?: string;
  limit?: string;
};

async function calculateIkuResultsForComponentRealization(idComponent: string, month: number, year: number) {
  console.log("Calculating IKU results for component realization", { idComponent, month, year });
  const component = await prisma.component.findUnique({ where: { id: idComponent } });
  if (!component) {
    return;
  }

  const affectedFormulas = await prisma.iKUFormula.findMany({
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
    select: { ikuId: true },
  });

  const affectedIkuIds = Array.from(new Set(affectedFormulas.map(f => f.ikuId)));

  if (affectedIkuIds.length === 0) {
    console.log("No active formulas found using this component directly");
    return;
  }

  const formulasToCalculate = [];
  for (const ikuId of affectedIkuIds) {
    let finalFormula = await prisma.iKUFormula.findFirst({
      where: {
        ikuId,
        isFinal: true,
        isActive: true,
      },
      include: {
        details: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!finalFormula) {
      throw new Error(`Tidak ada formula aktif dengan isFinal=true untuk IKU ${ikuId}`);
    }

    if (finalFormula) {
      formulasToCalculate.push(finalFormula);
    }
  }

  if (formulasToCalculate.length === 0) {
    return;
  }

  for (const formula of formulasToCalculate) {
    const requiredCodesSet = await getFormulaRequiredComponentCodes(formula.id);
    const formulaCodes = Array.from(requiredCodesSet);

    if (formulaCodes.length === 0) {
      continue;
    }

    const components = await prisma.component.findMany({
      where: { code: { in: formulaCodes } }
    });

    const codeToComponent = new Map<string, { id: string; code: string; periodType: string }>();
    components.forEach((c) => codeToComponent.set(c.code, { id: c.id, code: c.code, periodType: c.periodType }));

    const componentIds = components.map(c => c.id);
    const realizations = await prisma.componentRealization.findMany({
      where: {
        idComponent: { in: componentIds },
        year,
      },
    });

    const realizationsByComponentId = new Map<string, any[]>();
    for (const realization of realizations) {
      const items = realizationsByComponentId.get(realization.idComponent) || [];
      items.push(realization);
      realizationsByComponentId.set(realization.idComponent, items);
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
      console.log(`Missing data for formula ${formula.id}, skipping evaluation.`);
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

    // Filter by tag: cari componentId yang punya tag tersebut
    if (req.query.tagId) {
      const componentTags = await prisma.componentTag.findMany({
        where: { tagId: req.query.tagId, tag: { deletedAt: null } },
        select: { componentId: true },
      });

      const componentIds = componentTags.map((ct) => ct.componentId);

      if (componentIds.length === 0) {
        return res.json(successResponse([]));
      }

      // Gabungkan dengan filter idComponent jika ada
      if (where.idComponent) {
        if (!componentIds.includes(where.idComponent)) {
          return res.json(successResponse([]));
        }
      } else {
        where.idComponent = { in: componentIds };
      }
    }

    const records = await prisma.componentRealization.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { component: { include: { tags: { where: { tag: { deletedAt: null } }, include: { tag: true } } } } },
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
