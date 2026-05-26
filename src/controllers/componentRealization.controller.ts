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

export async function calculateIkuResultsForComponentRealization(idComponent: string, month: number, year: number) {
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
    let hasData = false;

    for (const code of formulaCodes) {
      const targetComponent = codeToComponent.get(code);
      if (!targetComponent) {
        componentValues[code] = 0;
        continue;
      }

      const componentReals = realizationsByComponentId.get(targetComponent.id) || [];
      const selectedValues = targetComponent.periodType === "yearly"
        ? componentReals
        : componentReals.filter((realization) => realization.month === month);

      if (!selectedValues.length) {
        componentValues[code] = 0;
      } else {
        hasData = true;
        componentValues[code] = selectedValues.reduce((sum, realization) => sum + Number(realization.value), 0);
      }
    }

    if (!hasData) {
      console.log(`Missing all data for formula ${formula.id}, skipping evaluation.`);
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

/**
 * CALCULATE PARENT COMPONENT SUM (CASCADE)
 *
 * Ketika realisasi child komponen disimpan, fungsi ini:
 * 1. Mencari parent dari komponen tersebut
 * 2. Menjumlahkan semua realisasi children dari parent (missing = 0)
 * 3. Meng-upsert realisasi parent dengan nilai total
 * 4. Memicu kalkulasi IKU untuk parent
 * 5. Rekursif naik ke parent berikutnya (jika ada)
 */
export async function calculateParentComponentSum(
  componentId: string,
  month: number | null,
  year: number
): Promise<void> {
  // Cari parentId dari komponen ini
  const component = await prisma.component.findUnique({
    where: { id: componentId },
    select: { parentId: true },
  });

  if (!component?.parentId) return; // Tidak punya parent, stop

  const parentId = component.parentId;

  // Ambil semua children dari parent
  const siblings = await prisma.component.findMany({
    where: { parentId },
    select: { id: true },
  });
  const siblingIds = siblings.map((s) => s.id);

  // Ambil realisasi semua siblings untuk (month, year) yang sama
  const whereRealization: any = {
    idComponent: { in: siblingIds },
    year,
  };
  if (month !== null) {
    whereRealization.month = month;
  } else {
    whereRealization.month = null;
  }

  const realizations = await prisma.componentRealization.findMany({
    where: whereRealization,
  });

  // SUM semua nilai (siblings yang tidak punya realisasi dianggap 0)
  const totalValue = realizations.reduce((sum, r) => sum + Number(r.value), 0);

  // Upsert realisasi parent dengan total
  await prisma.componentRealization.upsert({
    where: {
      idComponent_month_year: {
        idComponent: parentId,
        month: month ?? 0,
        year,
      },
    },
    create: { idComponent: parentId, month: month ?? 0, year, value: totalValue },
    update: { value: totalValue },
  });

  console.log(`[Parent SUM] Parent ${parentId}: total = ${totalValue} (month=${month}, year=${year})`);

  // Trigger IKU recalculation untuk parent
  const effectiveMonth = month ?? 0;
  if (effectiveMonth !== 0) {
    await calculateIkuResultsForComponentRealization(parentId, effectiveMonth, year);
  }

  // Cascade ke atas: cek apakah parent juga punya parent
  await calculateParentComponentSum(parentId, month, year);
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
      include: { 
        component: { include: { tags: { where: { tag: { deletedAt: null } }, include: { tag: true } } } },
        documents: { include: { document: true } }
      },
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
      include: { 
        component: true,
        documents: { include: { document: true } }
      },
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
    const { idComponent, month, year, value, documentIds, prodiId } = req.body;

    const component = await prisma.component.findUnique({
      where: { id: idComponent },
      include: { children: { select: { id: true } } },
    });
    if (!component) return res.status(404).json(errorResponse("Component not found"));

    // Guard: komponen yang punya children dihitung otomatis dari SUM children
    if (component.children.length > 0) {
      return res.status(400).json(
        errorResponse(
          "Komponen ini memiliki sub-komponen. Nilai dihitung otomatis dari SUM sub-komponen. Input realisasi pada masing-masing sub-komponen."
        )
      );
    }

    if (component.hasBreakdown && !prodiId) {
      return res.status(400).json(errorResponse("prodiId is mandatory for components with breakdowns"));
    }

    let record: any;

    if (prodiId) {
      // Find or create the main realization record
      record = await prisma.componentRealization.findUnique({
        where: { idComponent_month_year: { idComponent, month, year } }
      });

      if (!record) {
        record = await prisma.componentRealization.create({
          data: { idComponent, month, year, value: 0 }
        });
      }

      // Upsert breakdown
      await prisma.componentRealizationBreakdown.upsert({
        where: { realizationId_prodiId: { realizationId: record.idRealization, prodiId } },
        create: { realizationId: record.idRealization, prodiId, value },
        update: { value }
      });

      // Recalculate total value for the main realization record
      const breakdowns = await prisma.componentRealizationBreakdown.findMany({
        where: { realizationId: record.idRealization }
      });
      const totalValue = breakdowns.reduce((sum, b) => sum + Number(b.value), 0);

      record = await prisma.componentRealization.update({
        where: { idRealization: record.idRealization },
        data: { value: totalValue },
        include: { component: true }
      });
    } else {
      record = await prisma.componentRealization.upsert({
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
    }

    if (documentIds && Array.isArray(documentIds)) {
      await prisma.componentRealizationDocument.deleteMany({
        where: { realizationId: record.idRealization }
      });
      for (const docId of documentIds) {
        await prisma.componentRealizationDocument.create({
          data: {
            realizationId: record.idRealization,
            documentId: docId
          }
        });
      }
    }

    if (month != null) {
      await calculateIkuResultsForComponentRealization(idComponent, month, year);
    }

    // Cascade naik ke parent (jika ada)
    await calculateParentComponentSum(idComponent, month ?? null, year);

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
    const { value, documentIds, prodiId } = req.body;

    const existing = await prisma.componentRealization.findUnique({
      where: { idRealization: id },
      include: {
        component: {
          include: { children: { select: { id: true } } },
        },
      },
    });
    if (!existing) {
      return res.status(404).json(errorResponse("Component realization not found"));
    }

    // Guard: komponen yang punya children dihitung otomatis
    if (existing.component.children.length > 0) {
      return res.status(400).json(
        errorResponse(
          "Komponen ini memiliki sub-komponen. Nilai dihitung otomatis dari SUM sub-komponen."
        )
      );
    }

    if (existing.component.hasBreakdown && !prodiId) {
      return res.status(400).json(errorResponse("prodiId is mandatory for components with breakdowns"));
    }

    let updated: any;

    if (prodiId) {
      // Upsert breakdown
      await prisma.componentRealizationBreakdown.upsert({
        where: { realizationId_prodiId: { realizationId: id, prodiId } },
        create: { realizationId: id, prodiId, value },
        update: { value }
      });

      // Recalculate total value for the main realization record
      const breakdowns = await prisma.componentRealizationBreakdown.findMany({
        where: { realizationId: id }
      });
      const totalValue = breakdowns.reduce((sum, b) => sum + Number(b.value), 0);

      updated = await prisma.componentRealization.update({
        where: { idRealization: id },
        data: { value: totalValue },
      });
    } else {
      updated = await prisma.componentRealization.update({
        where: { idRealization: id },
        data: { value },
      });
    }

    if (documentIds && Array.isArray(documentIds)) {
      await prisma.componentRealizationDocument.deleteMany({
        where: { realizationId: updated.idRealization }
      });
      for (const docId of documentIds) {
        await prisma.componentRealizationDocument.create({
          data: {
            realizationId: updated.idRealization,
            documentId: docId
          }
        });
      }
    }

    if (updated.month != null) {
      await calculateIkuResultsForComponentRealization(updated.idComponent, updated.month, updated.year);
    }

    // Cascade naik ke parent (jika ada)
    await calculateParentComponentSum(updated.idComponent, updated.month ?? null, updated.year);

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
