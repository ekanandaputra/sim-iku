import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { evaluateFormula, ComponentValues, getFormulaRequiredComponentCodes } from "../utils/formula";
import { IkuResultType } from "../generated/prisma/enums";

const QUARTER_MONTHS: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
};

/**
 * Recalculate a single IKU for a specific year across all periods (monthly, quarterly, yearly).
 * Returns detailed debug info for each result.
 */
async function recalculateIkuForYear(ikuId: string, year: number) {
  const formula = await prisma.iKUFormula.findFirst({
    where: { ikuId, isFinal: true, isActive: true },
    include: { details: { orderBy: { sequence: "asc" } } },
  });

  if (!formula) {
    return { ikuId, year, status: "skipped", reason: "No active final formula found" };
  }

  const requiredCodesSet = await getFormulaRequiredComponentCodes(formula.id);
  const formulaCodes = Array.from(requiredCodesSet);
  if (formulaCodes.length === 0) {
    return { ikuId, year, status: "skipped", reason: "Formula has no required component codes" };
  }

  const components = await prisma.component.findMany({ where: { code: { in: formulaCodes } } });
  const codeToInfo = new Map<string, { id: string; code: string; periodType: string; aggregationType: string }>();
  components.forEach(c => codeToInfo.set(c.code, { id: c.id, code: c.code, periodType: c.periodType, aggregationType: c.aggregationType }));

  const results: {
    resultType: string;
    month: number;
    quarter?: number;
    calculatedValue: number | null;
    status: string;
    error?: string;
  }[] = [];

  // ── MONTHLY (1-12) ────────────────────────────────────────────────────
  for (let month = 1; month <= 12; month++) {
    try {
      const evalResult = await evaluateForPeriod(formula, codeToInfo, formulaCodes, year, [month]);
      if (evalResult) {
        const debugInfo = {
          componentValues: evalResult.componentValues,
          componentAggregations: evalResult.componentAggregations,
          formulaSteps: evalResult.steps,
          allFormulas: evalResult.allFormulas,
          evaluatedAt: new Date().toISOString(),
        };
        await prisma.ikuResult.upsert({
          where: {
            idIku_month_year_resultType: {
              idIku: ikuId, month, year, resultType: IkuResultType.monthly,
            },
          },
          create: {
            idIku: ikuId, month, year,
            resultType: IkuResultType.monthly,
            calculatedValue: evalResult.result,
            debugInfo,
            formulaVersion: formula.version.toString(),
            calculatedAt: new Date(),
          },
          update: {
            calculatedValue: evalResult.result,
            debugInfo,
            formulaVersion: formula.version.toString(),
            calculatedAt: new Date(),
          },
        });
        results.push({ resultType: "monthly", month, calculatedValue: evalResult.result, status: "ok" });
      } else {
        results.push({ resultType: "monthly", month, calculatedValue: null, status: "no_data" });
      }
    } catch (error: any) {
      results.push({ resultType: "monthly", month, calculatedValue: null, status: "error", error: error.message });
    }
  }

  // ── QUARTERLY (Q1-Q4) ─────────────────────────────────────────────────
  for (let quarter = 1; quarter <= 4; quarter++) {
    const quarterMonths = QUARTER_MONTHS[quarter];
    try {
      const evalResult = await evaluateForPeriod(formula, codeToInfo, formulaCodes, year, quarterMonths);
      if (evalResult) {
        const debugInfo = {
          componentValues: evalResult.componentValues,
          componentAggregations: evalResult.componentAggregations,
          formulaSteps: evalResult.steps,
          allFormulas: evalResult.allFormulas,
          evaluatedAt: new Date().toISOString(),
        };
        await prisma.ikuResult.upsert({
          where: {
            idIku_month_year_resultType: {
              idIku: ikuId, month: quarter, year, resultType: IkuResultType.quarterly,
            },
          },
          create: {
            idIku: ikuId, month: quarter, year,
            resultType: IkuResultType.quarterly,
            quarter,
            calculatedValue: evalResult.result,
            debugInfo,
            formulaVersion: formula.version.toString(),
            calculatedAt: new Date(),
          },
          update: {
            calculatedValue: evalResult.result,
            debugInfo,
            formulaVersion: formula.version.toString(),
            calculatedAt: new Date(),
          },
        });
        results.push({ resultType: "quarterly", month: quarter, quarter, calculatedValue: evalResult.result, status: "ok" });
      } else {
        results.push({ resultType: "quarterly", month: quarter, quarter, calculatedValue: null, status: "no_data" });
      }
    } catch (error: any) {
      results.push({ resultType: "quarterly", month: quarter, quarter, calculatedValue: null, status: "error", error: error.message });
    }
  }

  // ── YEARLY ────────────────────────────────────────────────────────────
  try {
    const evalResult = await evaluateForPeriod(formula, codeToInfo, formulaCodes, year, null);
    if (evalResult) {
      const debugInfo = {
        componentValues: evalResult.componentValues,
        componentAggregations: evalResult.componentAggregations,
        formulaSteps: evalResult.steps,
        allFormulas: evalResult.allFormulas,
        evaluatedAt: new Date().toISOString(),
      };
      await prisma.ikuResult.upsert({
        where: {
          idIku_month_year_resultType: {
            idIku: ikuId, month: 0, year, resultType: IkuResultType.yearly,
          },
        },
        create: {
          idIku: ikuId, month: 0, year,
          resultType: IkuResultType.yearly,
          calculatedValue: evalResult.result,
          debugInfo,
          formulaVersion: formula.version.toString(),
          calculatedAt: new Date(),
        },
        update: {
          calculatedValue: evalResult.result,
          debugInfo,
          formulaVersion: formula.version.toString(),
          calculatedAt: new Date(),
        },
      });
      results.push({ resultType: "yearly", month: 0, calculatedValue: evalResult.result, status: "ok" });
    } else {
      results.push({ resultType: "yearly", month: 0, calculatedValue: null, status: "no_data" });
    }
  } catch (error: any) {
    results.push({ resultType: "yearly", month: 0, calculatedValue: null, status: "error", error: error.message });
  }

  return {
    ikuId,
    year,
    formulaId: formula.id,
    formulaVersion: formula.version,
    status: "completed",
    results,
  };
}

type FormulaDebugEntry = {
  formulaId: string;
  formulaName: string;
  version: number;
  isFinal: boolean;
  finalResultKey: string;
  result: number | null;
  error?: string;
  steps: { sequence: number; expression: string; result: number }[];
};

type EvalPeriodResult = {
  result: number;
  componentValues: ComponentValues;
  componentAggregations: Record<string, { aggregationType: string; periodType: string; monthsUsed: number[]; realizationCount: number }>;
  steps: { sequence: number; expression: string; result: number }[];
  allFormulas: FormulaDebugEntry[];
};

/**
 * Evaluate a formula for a given set of months (or all 1-12 if null).
 * Returns null if there is no realization data at all.
 */
async function evaluateForPeriod(
  formula: { id: string; version: number; ikuId: string },
  codeToInfo: Map<string, { id: string; code: string; periodType: string; aggregationType: string }>,
  formulaCodes: string[],
  year: number,
  monthsFilter: number[] | null
): Promise<EvalPeriodResult | null> {
  const componentValues: ComponentValues = {};
  const componentAggregations: Record<string, { aggregationType: string; periodType: string; monthsUsed: number[]; realizationCount: number }> = {};
  let hasAnyData = false;

  for (const code of formulaCodes) {
    const info = codeToInfo.get(code);
    if (!info) {
      componentValues[code] = 0;
      componentAggregations[code] = { aggregationType: "UNKNOWN", periodType: "UNKNOWN", monthsUsed: [], realizationCount: 0 };
      continue;
    }

    let compMonthsFilter: number[] | undefined = undefined;
    if (info.periodType === "yearly") {
      compMonthsFilter = undefined;
    } else {
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

    const monthsUsed = realizations.map(r => r.month).filter((m): m is number => m !== null);

    if (info.aggregationType === "LAST") {
      componentValues[code] = realizations.length > 0 ? Number(realizations[0].value) : 0;
    } else {
      componentValues[code] = realizations.reduce((acc, r) => acc + Number(r.value), 0);
    }

    componentAggregations[code] = {
      aggregationType: info.aggregationType,
      periodType: info.periodType,
      monthsUsed,
      realizationCount: realizations.length,
    };
  }

  if (!hasAnyData) return null;

  const evaluation = await evaluateFormula(formula.id, componentValues);

  // Evaluate ALL active formulas for this IKU (not just isFinal)
  const allActiveFormulas = await prisma.iKUFormula.findMany({
    where: { ikuId: formula.ikuId, isActive: true },
    include: { details: { orderBy: { sequence: "asc" } } },
    orderBy: [{ isFinal: "desc" }, { version: "desc" }],
  });

  const allFormulas: FormulaDebugEntry[] = [];
  for (const f of allActiveFormulas) {
    try {
      const eval2 = await evaluateFormula(f.id, componentValues);
      allFormulas.push({
        formulaId: f.id,
        formulaName: f.name,
        version: f.version,
        isFinal: f.isFinal,
        finalResultKey: f.finalResultKey,
        result: eval2.result,
        steps: eval2.steps,
      });
    } catch (err: any) {
      allFormulas.push({
        formulaId: f.id,
        formulaName: f.name,
        version: f.version,
        isFinal: f.isFinal,
        finalResultKey: f.finalResultKey,
        result: null,
        error: err.message,
        steps: [],
      });
    }
  }

  return {
    result: evaluation.result,
    componentValues,
    componentAggregations,
    steps: evaluation.steps,
    allFormulas,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/iku-results/recalculate/:ikuId
 * Recalculate results for a single IKU.
 * Query params: year (required)
 */
export const recalculateSingleIku = async (
  req: Request<{ ikuId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ikuId } = req.params;
    const year = Number(req.query.year);

    if (!year || isNaN(year)) {
      return res.status(400).json(errorResponse("Query parameter 'year' is required and must be a valid number"));
    }

    const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    console.log(`[Recalculate] Starting recalculation for IKU ${iku.code} (${ikuId}), year=${year}`);
    const result = await recalculateIkuForYear(ikuId, year);
    console.log(`[Recalculate] Completed for IKU ${iku.code}: status=${result.status}`);

    res.json(successResponse(result, `Recalculation completed for IKU ${iku.code}`));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/iku-results/recalculate-all
 * Recalculate results for ALL IKUs that have an active final formula.
 * Query params: year (required)
 */
export const recalculateAllIkus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const year = Number(req.query.year);

    if (!year || isNaN(year)) {
      return res.status(400).json(errorResponse("Query parameter 'year' is required and must be a valid number"));
    }

    // Find all IKUs that have at least one active final formula
    const ikuIds = await prisma.iKUFormula.findMany({
      where: { isFinal: true, isActive: true },
      select: { ikuId: true },
      distinct: ["ikuId"],
    });

    const allIkuIds = ikuIds.map(f => f.ikuId);

    if (allIkuIds.length === 0) {
      return res.json(successResponse({ totalIkus: 0, results: [] }, "No IKUs with active final formulas found"));
    }

    console.log(`[Recalculate All] Starting recalculation for ${allIkuIds.length} IKUs, year=${year}`);

    const allResults: any[] = [];
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const ikuId of allIkuIds) {
      try {
        const result = await recalculateIkuForYear(ikuId, year);
        allResults.push(result);
        if (result.status === "completed") successCount++;
        else skipCount++;
      } catch (error: any) {
        errorCount++;
        allResults.push({
          ikuId,
          year,
          status: "error",
          reason: error.message,
        });
        console.error(`[Recalculate All] Error for IKU ${ikuId}:`, error.message);
      }
    }

    console.log(`[Recalculate All] Completed: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`);

    res.json(successResponse({
      totalIkus: allIkuIds.length,
      summary: { success: successCount, skipped: skipCount, errors: errorCount },
      results: allResults,
    }, `Recalculation completed for ${allIkuIds.length} IKUs`));
  } catch (error) {
    next(error);
  }
};
