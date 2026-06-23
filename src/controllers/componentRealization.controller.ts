import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { evaluateFormula, ComponentValues, getFormulaRequiredComponentCodes } from "../utils/formula";
import { IkuResultType } from "../generated/prisma/enums";
import { writeAuditLog } from "../utils/auditLog";
import { AuditAction, AuditEntityType } from "../generated/prisma/enums";

type RealizationParams = { id: string };

type RealizationQuery = {
  idComponent?: string;
  month?: string;
  year?: string;
  tagId?: string;
  page?: string;
  limit?: string;
};

const QUARTER_MONTHS: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
};

function getQuarterForMonth(month: number): number {
  if (month <= 3) return 1;
  if (month <= 6) return 2;
  if (month <= 9) return 3;
  return 4;
}

/**
 * Helper: evaluasi formula dengan aggregate komponen dari bulan-bulan tertentu.
 * Mengembalikan null jika tidak ada data sama sekali.
 * Mendukung aggregationType:
 *   - SUM  → jumlahkan semua realisasi dalam rentang bulan
 *   - LAST → ambil realisasi dengan bulan tertinggi (data terbaru)
 */
async function evaluateFormulaForMonths(
  formula: { id: string; version: number; ikuId: string },
  componentIds: string[],
  codeToInfo: Map<string, { id: string; code: string; periodType: string; aggregationType: string }>,
  formulaCodes: string[],
  year: number,
  monthsFilter: number[] | null // null = 1-12
): Promise<number | null> {
  const componentValues: ComponentValues = {};
  let hasAnyData = false;

  for (const code of formulaCodes) {
    const info = codeToInfo.get(code);
    if (!info) {
      componentValues[code] = 0;
      continue;
    }

    let compMonthsFilter: number[] | undefined = undefined;
    if (info.periodType === "yearly") {
      // Komponen tahunan: selalu ambil semua datanya tanpa filter bulan
      compMonthsFilter = undefined;
    } else {
      // Komponen bulanan/kuartalan: filter sesuai bulan yang diminta, 
      // default 1-12 (menghindari data nyangkut di month=0)
      compMonthsFilter = monthsFilter ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }

    const realizations = await prisma.componentRealization.findMany({
      where: {
        idComponent: info.id,
        year,
        ...(compMonthsFilter ? { month: { in: compMonthsFilter } } : {}),
      },
      orderBy: { month: "desc" },
    });

    if (realizations.length > 0) hasAnyData = true;

    // Agregasi berdasarkan aggregationType
    if (info.aggregationType === "LAST") {
      // Ambil nilai dari record dengan month tertinggi
      componentValues[code] = realizations.length > 0 ? Number(realizations[0].value) : 0;
    } else {
      // Default SUM
      componentValues[code] = realizations.reduce((acc, r) => acc + Number(r.value), 0);
    }
  }

  if (!hasAnyData) return null;

  try {
    const evaluation = await evaluateFormula(formula.id, componentValues);
    return evaluation.result;
  } catch (err) {
    console.error(`[Formula] Evaluation failed for formula ${formula.id}:`, err);
    return null;
  }
}

/**
 * Hitung dan simpan IKU result (monthly, quarterly, yearly) saat ada perubahan
 * realisasi komponen.
 *
 * Konvensi penyimpanan di tabel iku_results:
 *   - monthly   → resultType=monthly,   month=<bulan 1-12>, quarter=null
 *   - quarterly → resultType=quarterly, month=<nomor kuartal 1-4>, quarter=<nomor kuartal>
 *   - yearly    → resultType=yearly,    month=0, quarter=null
 *
 * Menyimpan month=quarter untuk quarterly memungkinkan unique constraint
 * (idIku, month, year, resultType) membedakan Q1/Q2/Q3/Q4 secara natural.
 */
export async function calculateIkuResultsForComponentRealization(
  idComponent: string,
  month: number,
  year: number
) {
  console.log("Calculating IKU results for component realization", { idComponent, month, year });

  const component = await prisma.component.findUnique({ where: { id: idComponent } });
  if (!component) return;

  // Cari semua formula aktif yang menggunakan komponen ini (langsung maupun tidak)
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

  for (const ikuId of affectedIkuIds) {
    const formula = await prisma.iKUFormula.findFirst({
      where: { ikuId, isFinal: true, isActive: true },
      include: { details: { orderBy: { sequence: "asc" } } },
    });

    if (!formula) {
      throw new Error(`Tidak ada formula aktif dengan isFinal=true untuk IKU ${ikuId}`);
    }

    const requiredCodesSet = await getFormulaRequiredComponentCodes(formula.id);
    const formulaCodes = Array.from(requiredCodesSet);
    if (formulaCodes.length === 0) continue;

    const components = await prisma.component.findMany({ where: { code: { in: formulaCodes } } });
    const codeToInfo = new Map<string, { id: string; code: string; periodType: string; aggregationType: string }>();
    components.forEach(c => codeToInfo.set(c.code, { id: c.id, code: c.code, periodType: c.periodType, aggregationType: c.aggregationType }));
    const componentIds = components.map(c => c.id);

    // ── 1. MONTHLY ──────────────────────────────────────────────────────────
    {
      const monthRealizations = await prisma.componentRealization.findMany({
        where: { idComponent: { in: componentIds }, year, month },
        orderBy: { month: "desc" },
      });

      const componentValues: ComponentValues = {};
      let hasData = false;

      for (const code of formulaCodes) {
        const info = codeToInfo.get(code);
        if (!info) { componentValues[code] = 0; continue; }

        const selected = info.periodType === "yearly"
          ? await prisma.componentRealization.findMany({ where: { idComponent: info.id, year } })
          : monthRealizations.filter(r => r.idComponent === info.id);

        if (selected.length) hasData = true;

        // Agregasi berdasarkan aggregationType
        if (info.aggregationType === "LAST") {
          // Untuk monthly: ada 1 record per bulan, ambil nilai-nya langsung
          // (jika periodType=yearly dan LAST, ambil record pertama setelah sort)
          const sortedSelected = [...selected].sort((a, b) => (b.month ?? 0) - (a.month ?? 0));
          componentValues[code] = sortedSelected.length > 0 ? Number(sortedSelected[0].value) : 0;
        } else {
          componentValues[code] = selected.reduce((s, r) => s + Number(r.value), 0);
        }
      }

      if (hasData) {
        console.log("Evaluating formula [monthly]", { formulaId: formula.id, month, componentValues });
        try {
          const evaluation = await evaluateFormula(formula.id, componentValues);
          await prisma.ikuResult.upsert({
            where: {
              idIku_month_year_resultType: {
                idIku: formula.ikuId, month, year, resultType: IkuResultType.monthly,
              },
            },
            create: {
              idIku: formula.ikuId, month, year,
              resultType: IkuResultType.monthly,
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
          console.error("IKU monthly result calculation failed", { formulaId: formula.id, error });
        }
      }
    }

    // ── 2. QUARTERLY ────────────────────────────────────────────────────────
    // Gunakan month=<nomor_kuartal> sebagai key agar Q1/Q2/Q3/Q4 punya row terpisah
    {
      const quarter = getQuarterForMonth(month);
      const quarterMonthList = QUARTER_MONTHS[quarter];

      const result = await evaluateFormulaForMonths(
        formula, componentIds, codeToInfo, formulaCodes, year, quarterMonthList
      );

      if (result !== null) {
        console.log("Evaluating formula [quarterly]", { formulaId: formula.id, quarter, result });
        await prisma.ikuResult.upsert({
          where: {
            idIku_month_year_resultType: {
              // month = quarter number (1-4) sebagai natural key untuk Q1/Q2/Q3/Q4
              idIku: formula.ikuId, month: quarter, year, resultType: IkuResultType.quarterly,
            },
          },
          create: {
            idIku: formula.ikuId, month: quarter, year,
            resultType: IkuResultType.quarterly,
            quarter,
            calculatedValue: result,
            formulaVersion: formula.version.toString(),
            calculatedAt: new Date(),
          },
          update: {
            calculatedValue: result,
            formulaVersion: formula.version.toString(),
            calculatedAt: new Date(),
          },
        });
      }
    }

    // ── 3. YEARLY ───────────────────────────────────────────────────────────
    {
      const result = await evaluateFormulaForMonths(
        formula, componentIds, codeToInfo, formulaCodes, year, null
      );

      if (result !== null) {
        console.log("Evaluating formula [yearly]", { formulaId: formula.id, result });
        await prisma.ikuResult.upsert({
          where: {
            idIku_month_year_resultType: {
              idIku: formula.ikuId, month: 0, year, resultType: IkuResultType.yearly,
            },
          },
          create: {
            idIku: formula.ikuId, month: 0, year,
            resultType: IkuResultType.yearly,
            calculatedValue: result,
            formulaVersion: formula.version.toString(),
            calculatedAt: new Date(),
          },
          update: {
            calculatedValue: result,
            formulaVersion: formula.version.toString(),
            calculatedAt: new Date(),
          },
        });
      }
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
  const component = await prisma.component.findUnique({
    where: { id: componentId },
    select: { parentId: true },
  });

  if (!component?.parentId) return;

  const parentId = component.parentId;

  const siblings = await prisma.component.findMany({
    where: { parentId },
    select: { id: true },
  });
  const siblingIds = siblings.map(s => s.id);

  const whereRealization: any = { idComponent: { in: siblingIds }, year };
  if (month !== null) {
    whereRealization.month = month;
  } else {
    whereRealization.month = null;
  }

  const realizations = await prisma.componentRealization.findMany({ where: whereRealization });
  const totalValue = realizations.reduce((sum, r) => sum + Number(r.value), 0);

  await prisma.componentRealization.upsert({
    where: {
      idComponent_month_year: { idComponent: parentId, month: month ?? 0, year },
    },
    create: { idComponent: parentId, month: month ?? 0, year, value: totalValue },
    update: { value: totalValue },
  });

  console.log(`[Parent SUM] Parent ${parentId}: total = ${totalValue} (month=${month}, year=${year})`);

  const effectiveMonth = month ?? 0;
  if (effectiveMonth !== 0) {
    await calculateIkuResultsForComponentRealization(parentId, effectiveMonth, year);
  }

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

    if (req.query.tagId) {
      const componentTags = await prisma.componentTag.findMany({
        where: { tagId: req.query.tagId, tag: { deletedAt: null } },
        select: { componentId: true },
      });

      const componentIds = componentTags.map(ct => ct.componentId);
      if (componentIds.length === 0) return res.json(successResponse([]));

      if (where.idComponent) {
        if (!componentIds.includes(where.idComponent)) return res.json(successResponse([]));
      } else {
        where.idComponent = { in: componentIds };
      }
    }

    const records = await prisma.componentRealization.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        component: { include: { tags: { where: { tag: { deletedAt: null } }, include: { tag: true } } } },
        documents: { include: { document: true } },
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
        documents: { include: { document: true } },
      },
    });

    if (!record) return res.status(404).json(errorResponse("Component realization not found"));
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

    // --- LANGKAH PREVENTIF: Validasi `month` berdasarkan periodType ---
    let validatedMonth = month;
    if (component.periodType === "yearly") {
      // Untuk komponen tahunan, paksakan month = 0 agar tidak terfragmentasi
      validatedMonth = 0;
    } else {
      // Untuk monthly, quarterly, semester -> wajib kirim month (1-12)
      if (validatedMonth === undefined || validatedMonth === null || validatedMonth < 1 || validatedMonth > 12) {
        return res.status(400).json(
          errorResponse(`Bulan (month) 1-12 wajib diisi untuk komponen dengan tipe periode ${component.periodType}`)
        );
      }
    }
    // ------------------------------------------------------------------

    let record: any;

    if (prodiId) {
      record = await prisma.componentRealization.findUnique({
        where: { idComponent_month_year: { idComponent, month: validatedMonth, year } },
      });

      if (!record) {
        record = await prisma.componentRealization.create({
          data: { idComponent, month: validatedMonth, year, value: 0 },
        });
      }

      await prisma.componentRealizationBreakdown.upsert({
        where: { realizationId_prodiId: { realizationId: record.idRealization, prodiId } },
        create: { realizationId: record.idRealization, prodiId, value },
        update: { value },
      });

      const breakdowns = await prisma.componentRealizationBreakdown.findMany({
        where: { realizationId: record.idRealization },
      });
      const totalValue = breakdowns.reduce((sum, b) => sum + Number(b.value), 0);

      record = await prisma.componentRealization.update({
        where: { idRealization: record.idRealization },
        data: { value: totalValue },
        include: { component: true },
      });
    } else {
      record = await prisma.componentRealization.upsert({
        where: { idComponent_month_year: { idComponent, month: validatedMonth, year } },
        create: { idComponent, month: validatedMonth, year, value },
        update: { value },
        include: { component: true },
      });
    }

    if (documentIds && Array.isArray(documentIds)) {
      await prisma.componentRealizationDocument.deleteMany({ where: { realizationId: record.idRealization } });
      for (const docId of documentIds) {
        await prisma.componentRealizationDocument.create({
          data: { realizationId: record.idRealization, documentId: docId },
        });
      }
    }

    if (validatedMonth !== 0) {
      await calculateIkuResultsForComponentRealization(idComponent, validatedMonth, year);
    } else {
      // Jika yearly (month=0), trigger ulang menggunakan salah satu dummy bulan (misal 12) 
      // agar fungsi eval berjalan secara full
      await calculateIkuResultsForComponentRealization(idComponent, 12, year);
    }

    await calculateParentComponentSum(idComponent, validatedMonth === 0 ? null : validatedMonth, year);

    await writeAuditLog({
      entityType: AuditEntityType.COMPONENT_REALIZATION,
      entityId: record.idRealization,
      entityCode: component.code,
      entityName: component.name,
      action: AuditAction.CREATE,
      userId: (req as any).user?.id ?? null,
      newValues: { idComponent, month: validatedMonth, year, value: record.value },
      req,
    });

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
      include: { component: { include: { children: { select: { id: true } } } } },
    });
    if (!existing) return res.status(404).json(errorResponse("Component realization not found"));

    if (existing.component.children.length > 0) {
      return res.status(400).json(
        errorResponse("Komponen ini memiliki sub-komponen. Nilai dihitung otomatis dari SUM sub-komponen.")
      );
    }

    if (existing.component.hasBreakdown && !prodiId) {
      return res.status(400).json(errorResponse("prodiId is mandatory for components with breakdowns"));
    }

    let updated: any;

    if (prodiId) {
      await prisma.componentRealizationBreakdown.upsert({
        where: { realizationId_prodiId: { realizationId: id, prodiId } },
        create: { realizationId: id, prodiId, value },
        update: { value },
      });

      const breakdowns = await prisma.componentRealizationBreakdown.findMany({ where: { realizationId: id } });
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
      await prisma.componentRealizationDocument.deleteMany({ where: { realizationId: updated.idRealization } });
      for (const docId of documentIds) {
        await prisma.componentRealizationDocument.create({
          data: { realizationId: updated.idRealization, documentId: docId },
        });
      }
    }

    if (updated.month != null) {
      await calculateIkuResultsForComponentRealization(updated.idComponent, updated.month, updated.year);
    }

    await calculateParentComponentSum(updated.idComponent, updated.month ?? null, updated.year);

    await writeAuditLog({
      entityType: AuditEntityType.COMPONENT_REALIZATION,
      entityId: updated.idRealization,
      entityCode: existing.component.code,
      entityName: existing.component.name,
      action: AuditAction.UPDATE,
      userId: (req as any).user?.id ?? null,
      oldValues: { month: existing.month, year: existing.year, value: existing.value },
      newValues: { month: updated.month, year: updated.year, value: updated.value },
      req,
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
    const id = req.params.id;
    const existing = await prisma.componentRealization.findUnique({
      where: { idRealization: id },
      include: { component: { select: { code: true, name: true } } },
    });
    if (!existing) return res.status(404).json(errorResponse("Component realization not found"));
    await prisma.componentRealization.delete({ where: { idRealization: id } });

    await writeAuditLog({
      entityType: AuditEntityType.COMPONENT_REALIZATION,
      entityId: id,
      entityCode: existing.component.code,
      entityName: existing.component.name,
      action: AuditAction.DELETE,
      userId: (req as any).user?.id ?? null,
      oldValues: { idComponent: existing.idComponent, month: existing.month, year: existing.year, value: existing.value },
      req,
    });

    res.json(successResponse(null, "Component realization deleted successfully"));
  } catch (error) {
    next(error);
  }
};
