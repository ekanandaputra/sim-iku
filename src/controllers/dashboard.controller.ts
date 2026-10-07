import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { IkuResultType } from "../generated/prisma/enums";
import { toAbsoluteUrl } from "../utils/url";

const formatDecimal = (val: any): number | null => {
  if (val == null) return null;
  const num = Number(val);
  return isNaN(num) ? null : Number(num.toFixed(2));
};

const quarterMonths: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
};

export const getIkuDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const yearStr = req.query.year as string;
    if (!yearStr) {
      return res.status(400).json(errorResponse("Year is required in query params"));
    }
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return res.status(400).json(errorResponse("Invalid year format"));
    }

    const ikus = await prisma.iKU.findMany({
      orderBy: { code: "asc" }
    });

    const targets = await prisma.ikuTarget.findMany({ where: { year } });
    const targetMap = new Map(targets.map(t => [t.ikuId, t]));

    // Ambil semua iku_result untuk tahun ini (monthly + quarterly + yearly)
    const results = await prisma.ikuResult.findMany({
      where: { year },
      orderBy: [{ idIku: "asc" }, { month: "asc" }],
    });

    // Kelompokkan per IKU
    const docIds = new Set<string>();
    const resultsByIku = new Map<string, typeof results>();
    for (const r of results) {
      if (!resultsByIku.has(r.idIku)) resultsByIku.set(r.idIku, []);
      resultsByIku.get(r.idIku)!.push(r);
      if (r.documentIds && Array.isArray(r.documentIds)) {
        for (const id of r.documentIds) {
          if (typeof id === "string") docIds.add(id);
        }
      }
    }

    const documents = await prisma.document.findMany({
      where: { id: { in: Array.from(docIds) } },
      select: { id: true, url: true, originalName: true }
    });
    const docMap = new Map(documents.map(d => [d.id, d]));

    const dashboardData = ikus.map(iku => {
      const target = targetMap.get(iku.id);
      const ikuResults = resultsByIku.get(iku.id) || [];

      // Quarterly: month = nomor kuartal (1-4), resultType = quarterly
      const getQuarterRealization = (quarter: number): number | null => {
        const row = ikuResults.find(
          r => r.resultType === IkuResultType.quarterly && r.month === quarter
        );
        if (row?.calculatedValue != null) return formatDecimal(row.calculatedValue);

        if (iku.unit === "number") {
          const monthsInQuarter = quarterMonths[quarter];
          for (let i = monthsInQuarter.length - 1; i >= 0; i--) {
            const mRow = ikuResults.find(
              r => r.resultType === IkuResultType.monthly && r.month === monthsInQuarter[i]
            );
            if (mRow && mRow.calculatedValue != null) {
              return formatDecimal(mRow.calculatedValue);
            }
          }
        }
        return null;
      };

      // Yearly: resultType = yearly, month = 0
      const getYearlyRealization = (): number | null => {
        const row = ikuResults.find(r => r.resultType === IkuResultType.yearly);
        if (row?.calculatedValue != null) return formatDecimal(row.calculatedValue);

        if (iku.unit === "number") {
          for (let i = 12; i >= 1; i--) {
            const mRow = ikuResults.find(
              r => r.resultType === IkuResultType.monthly && r.month === i
            );
            if (mRow && mRow.calculatedValue != null) {
              return formatDecimal(mRow.calculatedValue);
            }
          }
        }
        return null;
      };

      // Helper for text/file table data
      const getFiles = (docIds: any) => {
        if (!Array.isArray(docIds) || docIds.length === 0) return [];
        return docIds
          .map(id => docMap.get(id))
          .filter(Boolean)
          .map((d: any) => ({ name: d.originalName, url: toAbsoluteUrl(d.url) }));
      };

      const getQuarterTextRealization = (quarter: number) => {
        const qRow = ikuResults.find(
          r => r.resultType === IkuResultType.quarterly && r.month === quarter
        );
        if (qRow) {
          if (iku.unit === "file") {
            const files = getFiles(qRow.documentIds);
            return { realization: files.length > 0 ? "File Terlampir" : "-", files };
          }
          if (iku.unit === "number" || iku.unit === "percentage") {
            const val = formatDecimal(qRow.calculatedValue);
            return { realization: val !== null ? val : "-" };
          }
          return { realization: qRow.textValue || "-" };
        }

        const monthsInQuarter = quarterMonths[quarter];
        for (let i = monthsInQuarter.length - 1; i >= 0; i--) {
          const mRow = ikuResults.find(
            r => r.resultType === IkuResultType.monthly && r.month === monthsInQuarter[i]
          );
          if (mRow) {
            if (iku.unit === "file") {
              const files = getFiles(mRow.documentIds);
              return { realization: files.length > 0 ? "File Terlampir" : "-", files };
            }
            if (iku.unit === "number" || iku.unit === "percentage") {
              const val = formatDecimal(mRow.calculatedValue);
              return { realization: val !== null ? val : "-" };
            }
            return { realization: mRow.textValue || "-" };
          }
        }
        return { realization: "-" };
      };

      const isChart = ["percentage", "number"].includes(iku.unit);

      return {
        ikuId: iku.id,
        ikuCode: iku.code,
        ikuName: iku.name,
        type: iku.type,
        unit: iku.unit,
        ikuTarget: iku.target,
        chartData: isChart ? [
          {
            period: "Q1",
            target: formatDecimal(target?.targetQ1),
            realization: getQuarterRealization(1),
          },
          {
            period: "Q2",
            target: formatDecimal(target?.targetQ2),
            realization: getQuarterRealization(2),
          },
          {
            period: "Q3",
            target: formatDecimal(target?.targetQ3),
            realization: getQuarterRealization(3),
          },
          {
            period: "Q4",
            target: formatDecimal(target?.targetQ4),
            realization: getQuarterRealization(4),
          },
          {
            period: "Year",
            target: formatDecimal(target?.targetYear),
            realization: getYearlyRealization(),
          },
        ] : [],
        tableData: !isChart ? [
          { period: "Q1", ...getQuarterTextRealization(1) },
          { period: "Q2", ...getQuarterTextRealization(2) },
          { period: "Q3", ...getQuarterTextRealization(3) },
          { period: "Q4", ...getQuarterTextRealization(4) },
        ] : []
      };
    });

    res.json(successResponse(dashboardData));
  } catch (error) {
    next(error);
  }
};


export const getComponentDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const yearStr = req.query.year as string;
    const componentId = (req.query.componentId as string) || (req.query.component_id as string);
    if (!yearStr) {
      return res.status(400).json(errorResponse("Year is required in query params"));
    }
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return res.status(400).json(errorResponse("Invalid year format"));
    }

    const componentFilter: any = {};
    if (componentId) {
      componentFilter.id = componentId;
    }

    const components = await prisma.component.findMany({
      where: componentFilter,
      orderBy: { code: "asc" },
    });

    if (componentId && components.length === 0) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    const targetWhere: any = { year };
    const realizationWhere: any = { year };
    if (componentId) {
      targetWhere.componentId = componentId;
      realizationWhere.idComponent = componentId;
    }

    const targets = await prisma.componentTarget.findMany({ where: targetWhere });
    const realizations = await prisma.componentRealization.findMany({ where: realizationWhere });

    const targetMap = new Map(targets.map((t) => [t.componentId, t]));
    const realizationMap = new Map<string, any[]>();

    for (const realization of realizations) {
      const items = realizationMap.get(realization.idComponent) || [];
      items.push(realization);
      realizationMap.set(realization.idComponent, items);
    }

    const dashboardData = components.map((component) => {
      const target = targetMap.get(component.id);
      const componentRealizations = realizationMap.get(component.id) || [];

      const getRealization = (periodType: string, periodValue: number) => {
        let filtered = componentRealizations;
        if (periodType === "quarter") {
          filtered = filtered.filter((r) => quarterMonths[periodValue]?.includes(r.month));
        }

        if (!filtered.length) return null;
        const sum = filtered.reduce((sum, item) => sum + Number(item.value), 0);
        return formatDecimal(sum);
      };

      return {
        componentId: component.id,
        componentCode: component.code,
        componentName: component.name,
        chartData: [
          {
            period: "Q1",
            target: formatDecimal(target?.targetQ1),
            realization: getRealization("quarter", 1),
          },
          {
            period: "Q2",
            target: formatDecimal(target?.targetQ2),
            realization: getRealization("quarter", 2),
          },
          {
            period: "Q3",
            target: formatDecimal(target?.targetQ3),
            realization: getRealization("quarter", 3),
          },
          {
            period: "Q4",
            target: formatDecimal(target?.targetQ4),
            realization: getRealization("quarter", 4),
          },
          {
            period: "Year",
            target: formatDecimal(target?.targetYear),
            realization: getRealization("year", 1),
          },
        ],
      };
    });

    const responseData = componentId ? dashboardData[0] : dashboardData;

    res.json(successResponse(responseData));
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const yearStr = req.query.year as string;
    if (!yearStr) {
      return res.status(400).json(errorResponse("Year is required in query params"));
    }
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return res.status(400).json(errorResponse("Invalid year format"));
    }

    const ikus = await prisma.iKU.findMany({
      orderBy: { code: "asc" }
    });

    const targets = await prisma.ikuTarget.findMany({ where: { year } });
    const targetMap = new Map(targets.map(t => [t.ikuId, t]));

    const results = await prisma.ikuResult.findMany({
      where: { year },
      orderBy: [{ idIku: "asc" }, { month: "asc" }],
    });

    const resultsByIku = new Map<string, typeof results>();
    for (const r of results) {
      if (!resultsByIku.has(r.idIku)) resultsByIku.set(r.idIku, []);
      resultsByIku.get(r.idIku)!.push(r);
    }

    const summary = [
      { period: "Q1", achieved: 0, notAchieved: 0, achievedIkus: [] as any[], notAchievedIkus: [] as any[] },
      { period: "Q2", achieved: 0, notAchieved: 0, achievedIkus: [] as any[], notAchievedIkus: [] as any[] },
      { period: "Q3", achieved: 0, notAchieved: 0, achievedIkus: [] as any[], notAchievedIkus: [] as any[] },
      { period: "Q4", achieved: 0, notAchieved: 0, achievedIkus: [] as any[], notAchievedIkus: [] as any[] },
    ];

    for (const iku of ikus) {
      if (!["percentage", "number", "file", "text"].includes(iku.unit)) continue;
      
      const target = targetMap.get(iku.id);
      const ikuResults = resultsByIku.get(iku.id) || [];

      // Calculate Q1-Q4
      for (let quarter = 1; quarter <= 4; quarter++) {
        const sumItem = summary.find(s => s.period === `Q${quarter}`)!;

        if (iku.unit === "file" || iku.unit === "text") {
          let hasValue = false;
          const qRow = ikuResults.find(r => r.resultType === IkuResultType.quarterly && r.month === quarter);
          
          if (qRow) {
            if (iku.unit === "file" && Array.isArray(qRow.documentIds) && qRow.documentIds.length > 0) {
              hasValue = true;
            } else if (iku.unit === "text" && qRow.textValue && qRow.textValue.trim() !== "") {
              hasValue = true;
            }
          } else {
            const monthsInQuarter = quarterMonths[quarter];
            for (let i = monthsInQuarter.length - 1; i >= 0; i--) {
              const mRow = ikuResults.find(r => r.resultType === IkuResultType.monthly && r.month === monthsInQuarter[i]);
              if (mRow) {
                if (iku.unit === "file" && Array.isArray(mRow.documentIds) && mRow.documentIds.length > 0) {
                  hasValue = true;
                  break;
                } else if (iku.unit === "text" && mRow.textValue && mRow.textValue.trim() !== "") {
                  hasValue = true;
                  break;
                }
              }
            }
          }

          if (hasValue) {
            sumItem.achieved++;
            sumItem.achievedIkus.push({ id: iku.id, code: iku.code, name: iku.name });
          } else {
            sumItem.notAchieved++;
            sumItem.notAchievedIkus.push({ id: iku.id, code: iku.code, name: iku.name });
          }
          continue;
        }

        let realization: number | null = null;
        const qRow = ikuResults.find(r => r.resultType === IkuResultType.quarterly && r.month === quarter);
        if (qRow?.calculatedValue != null) {
          realization = formatDecimal(qRow.calculatedValue);
        } else if (iku.unit === "number") {
          const monthsInQuarter = quarterMonths[quarter];
          for (let i = monthsInQuarter.length - 1; i >= 0; i--) {
            const mRow = ikuResults.find(r => r.resultType === IkuResultType.monthly && r.month === monthsInQuarter[i]);
            if (mRow && mRow.calculatedValue != null) {
              realization = formatDecimal(mRow.calculatedValue);
              break;
            }
          }
        }

        let targetVal: number | null = null;
        if (quarter === 1) targetVal = formatDecimal(target?.targetQ1);
        if (quarter === 2) targetVal = formatDecimal(target?.targetQ2);
        if (quarter === 3) targetVal = formatDecimal(target?.targetQ3);
        if (quarter === 4) targetVal = formatDecimal(target?.targetQ4);

        const isTargetEmptyOrZero = targetVal == null || targetVal === 0;
        const isRealizationEmptyOrZero = realization == null || realization === 0;

        if (isTargetEmptyOrZero && isRealizationEmptyOrZero) {
          sumItem.achieved++;
          sumItem.achievedIkus.push({ id: iku.id, code: iku.code, name: iku.name });
        } else if (targetVal != null) {
          if (realization != null && realization >= targetVal) {
            sumItem.achieved++;
            sumItem.achievedIkus.push({ id: iku.id, code: iku.code, name: iku.name });
          } else {
            sumItem.notAchieved++;
            sumItem.notAchievedIkus.push({ id: iku.id, code: iku.code, name: iku.name });
          }
        }
      }

    }

    res.json(successResponse(summary));
  } catch (error) {
    next(error);
  }
};

// ── IKU breakdown (detail perhitungan sampai level prodi) ───────────────

type StoredStep = { sequence: number; expression: string; result: number };

type StoredProdiEntry = {
  prodiId: string;
  prodiCode: string | null;
  prodiName: string | null;
  componentValues: Record<string, number>;
  result: number | null;
  steps: StoredStep[];
  skipped?: string;
};

type StoredProdiEvaluation = {
  aggregation: "AVG" | "SUM";
  prodiLevel: string | null;
  prodiCount: number;
  excludedProdiIds: string[];
  prodiResults: StoredProdiEntry[];
};

type StoredDebugInfo = {
  componentValues?: Record<string, number>;
  componentAggregations?: Record<string, { aggregationType: string; periodType: string; monthsUsed: number[]; realizationCount: number }>;
  formulaSteps?: StoredStep[];
  prodiEvaluation?: StoredProdiEvaluation;
  refProdiEvaluations?: { formulaId: string; formulaName: string; result: number; prodiEvaluation?: StoredProdiEvaluation }[];
  allFormulas?: { formulaId: string; formulaName: string; isFinal: boolean; finalResultKey: string; steps: StoredStep[] }[];
  evaluatedAt?: string;
};

type BreakdownWarning = { code: string; message: string; formulaId?: string; prodiId?: string };

/**
 * "Q1".."Q4" | "Year" (sama dengan label chartData di getIkuDashboard) atau
 * "M1".."M12" untuk bulanan. Dipetakan ke kunci unik iku_results
 * (month, resultType): quarterly → month = nomor kuartal, yearly → month = 0.
 */
function parseDashboardPeriod(raw: string):
  | { resultType: IkuResultType; month: number; quarter: number | null; label: string }
  | null {
  const value = raw.trim().toUpperCase();
  if (value === "YEAR" || value === "Y") {
    return { resultType: IkuResultType.yearly, month: 0, quarter: null, label: "Year" };
  }
  const quarter = /^Q([1-4])$/.exec(value);
  if (quarter) {
    const q = Number(quarter[1]);
    return { resultType: IkuResultType.quarterly, month: q, quarter: q, label: `Q${q}` };
  }
  const month = /^M(1[0-2]|[1-9])$/.exec(value);
  if (month) {
    const m = Number(month[1]);
    return { resultType: IkuResultType.monthly, month: m, quarter: Math.ceil(m / 3), label: `M${m}` };
  }
  return null;
}

/** Kode komponen yang hilang, dari pesan skip evaluateFormulaPerProdi. */
function parseMissingComponents(skippedReason: string | null | undefined): Set<string> {
  const match = /^Tidak ada data untuk komponen: (.+)$/.exec(skippedReason ?? "");
  return new Set(match ? match[1].split(",").map(s => s.trim()) : []);
}

export const getIkuBreakdown = async (req: Request<{ ikuId: string }>, res: Response, next: NextFunction) => {
  try {
    const { ikuId } = req.params;
    const year = parseInt(req.query.year as string);
    if (isNaN(year)) {
      return res.status(400).json(errorResponse("Year is required in query params"));
    }
    const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    // period tidak dikirim → pakai kuartal terakhir (nomor tertinggi) yang sudah punya nilai
    const rawPeriod = ((req.query.period as string | undefined) ?? "").trim();
    let periodAutoSelected = false;
    let period: ReturnType<typeof parseDashboardPeriod>;
    if (rawPeriod) {
      period = parseDashboardPeriod(rawPeriod);
      if (!period) {
        return res.status(400).json(errorResponse("Invalid period, use Q1-Q4, Year, or M1-M12"));
      }
    } else {
      // Quarterly disimpan dengan month = nomor kuartal
      const lastQuarter = await prisma.ikuResult.findFirst({
        where: {
          idIku: ikuId, year, resultType: IkuResultType.quarterly,
          OR: [{ calculatedValue: { not: null } }, { textValue: { not: null } }],
        },
        orderBy: { month: "desc" },
        select: { month: true },
      });
      if (!lastQuarter) {
        return res.status(404).json(errorResponse(`Belum ada hasil perhitungan kuartal untuk IKU ini di tahun ${year}`));
      }
      period = parseDashboardPeriod(`Q${lastQuarter.month}`)!;
      periodAutoSelected = true;
    }

    const result = await prisma.ikuResult.findUnique({
      where: {
        idIku_month_year_resultType: { idIku: ikuId, month: period.month, year, resultType: period.resultType },
      },
    });
    if (!result) {
      return res.status(404).json(errorResponse(`Belum ada hasil perhitungan IKU untuk ${period.label} ${year}`));
    }

    const debug = (result.debugInfo ?? {}) as StoredDebugInfo;
    const warnings: BreakdownWarning[] = [];

    // ── Target & status ─────────────────────────────────────────────────
    const ikuTarget = await prisma.ikuTarget.findUnique({ where: { ikuId_year: { ikuId, year } } });
    const targetKey = period.quarter
      ? (["targetQ1", "targetQ2", "targetQ3", "targetQ4"] as const)[period.quarter - 1]
      : "targetYear";
    const target = formatDecimal(ikuTarget?.[targetKey]);
    const calculatedValue = formatDecimal(result.calculatedValue);
    const achievementRatio =
      calculatedValue != null && target != null && target !== 0 ? Number((calculatedValue / target).toFixed(4)) : null;
    const status =
      calculatedValue == null ? "NO_DATA"
      : target == null ? "NO_TARGET"
      : calculatedValue >= target ? "ACHIEVED"
      : "NOT_ACHIEVED";

    const verificationCount = await prisma.realizationVerification.count({
      where: { entityType: "IKU_RESULT", entityId: result.idResult },
    });

    // Yearly disalin dari kuartal terakhir yang tidak nol (lihat recalculateIku).
    let copiedFromQuarter: number | null = null;
    if (period.resultType === IkuResultType.yearly) {
      const source = await prisma.ikuResult.findFirst({
        where: {
          idIku: ikuId, year, resultType: IkuResultType.quarterly,
          calculatedValue: { not: null }, NOT: { calculatedValue: 0 },
        },
        orderBy: { quarter: "desc" },
        select: { quarter: true, month: true },
      });
      copiedFromQuarter = source?.quarter ?? source?.month ?? null;
    }

    // ── Komponen ────────────────────────────────────────────────────────
    const componentCodes = Object.keys(debug.componentValues ?? {});
    const componentRows = componentCodes.length
      ? await prisma.component.findMany({
          where: { code: { in: componentCodes } },
          select: { code: true, name: true, hasBreakdown: true },
        })
      : [];
    const componentByCode = new Map(componentRows.map(c => [c.code, c]));

    const components = componentCodes.sort().map(code => {
      const aggregation = debug.componentAggregations?.[code];
      return {
        code,
        name: componentByCode.get(code)?.name ?? null,
        hasBreakdown: componentByCode.get(code)?.hasBreakdown ?? false,
        totalValue: formatDecimal(debug.componentValues?.[code]),
        aggregationType: aggregation?.aggregationType ?? null,
        periodType: aggregation?.periodType ?? null,
        monthsUsed: aggregation?.monthsUsed ?? [],
        realizationCount: aggregation?.realizationCount ?? 0,
      };
    });

    // ── Formula final ───────────────────────────────────────────────────
    const finalFormulaRow = await prisma.iKUFormula.findFirst({
      where: { ikuId, isFinal: true, isActive: true },
      select: { id: true, name: true, finalResultKey: true, prodiAggregation: true, prodiLevel: true },
    });

    const mode = debug.prodiEvaluation ? "PER_PRODI"
      : debug.refProdiEvaluations?.length ? "REF_PRODI"
      : result.debugInfo == null ? "DIRECT_INPUT"
      : "TOTAL";

    // ── Prodi per formula ───────────────────────────────────────────────
    const evaluations: { formulaId: string; formulaName: string; result: number; evaluation: StoredProdiEvaluation }[] =
      mode === "PER_PRODI"
        ? [{
            formulaId: finalFormulaRow?.id ?? "",
            formulaName: finalFormulaRow?.name ?? "",
            result: Number(result.calculatedValue ?? 0),
            evaluation: debug.prodiEvaluation!,
          }]
        : (debug.refProdiEvaluations ?? [])
            .filter(ref => ref.prodiEvaluation)
            .map(ref => ({ formulaId: ref.formulaId, formulaName: ref.formulaName, result: ref.result, evaluation: ref.prodiEvaluation! }));

    // Prodi yang di-exclude tidak punya entry di prodiResults; ambil datanya dari tabel prodi.
    const allProdiIds = new Set<string>();
    for (const { evaluation } of evaluations) {
      evaluation.prodiResults.forEach(p => allProdiIds.add(p.prodiId));
      evaluation.excludedProdiIds.forEach(id => allProdiIds.add(id));
    }
    const prodiRows = allProdiIds.size
      ? await prisma.prodi.findMany({
          where: { id: { in: Array.from(allProdiIds) } },
          select: { id: true, code: true, name: true, level: true },
        })
      : [];
    const prodiById = new Map(prodiRows.map(p => [p.id, p]));

    const formulas = evaluations.map(({ formulaId, formulaName, result: formulaResult, evaluation }) => {
      const counted = evaluation.prodiResults.filter(p => p.result != null);
      const countedValues = counted.map(p => formatDecimal(p.result)!);
      const sumExpression = countedValues.join(" + ") || "0";
      const expression = evaluation.aggregation === "AVG"
        ? `(${sumExpression}) / ${countedValues.length}`
        : sumExpression;

      const prodis = evaluation.prodiResults.map(p => {
        const prodi = prodiById.get(p.prodiId);
        const missing = parseMissingComponents(p.skipped);
        const isCounted = p.result != null;
        if (!isCounted) {
          warnings.push({
            code: "PRODI_SKIPPED",
            formulaId,
            prodiId: p.prodiId,
            message: `${prodi?.code ?? p.prodiCode ?? p.prodiId} tidak ikut dihitung di ${formulaName}: ${p.skipped ?? "tanpa alasan"}`,
          });
        }
        return {
          prodiId: p.prodiId,
          code: prodi?.code ?? p.prodiCode,
          name: prodi?.name ?? p.prodiName,
          level: prodi?.level ?? null,
          status: isCounted ? "COUNTED" : "SKIPPED",
          calculatedValue: formatDecimal(p.result),
          skippedReason: p.skipped ?? null,
          componentValues: Object.entries(p.componentValues)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([code, value]) => {
              // evaluateFormulaPerProdi menyalin nilai total lalu menimpa komponen
              // breakdown; komponen yang hilang tetap berisi total, jadi tandai MISSING.
              const source = missing.has(code) ? "MISSING"
                : componentByCode.get(code)?.hasBreakdown ? "BREAKDOWN"
                : "TOTAL";
              return { code, value: source === "MISSING" ? null : formatDecimal(value), source };
            }),
          steps: p.steps,
        };
      });

      const excluded = evaluation.excludedProdiIds.map(id => {
        const prodi = prodiById.get(id);
        return {
          prodiId: id,
          code: prodi?.code ?? null,
          name: prodi?.name ?? null,
          level: prodi?.level ?? null,
          status: "EXCLUDED",
          calculatedValue: null,
          skippedReason: "Dikecualikan pada formula",
          componentValues: [],
          steps: [],
        };
      });

      return {
        formulaId,
        formulaName,
        prodiAggregation: evaluation.aggregation,
        prodiLevel: evaluation.prodiLevel,
        result: formatDecimal(formulaResult),
        aggregationDetail: {
          expression,
          prodiCounted: counted.length,
          prodiSkipped: evaluation.prodiResults.length - counted.length,
          prodiExcluded: excluded.length,
        },
        prodis: [...prodis, ...excluded],
      };
    });

    // Result lama (sebelum add_iku_result_prodi) belum menyimpan detail per prodi.
    if (mode === "TOTAL" && finalFormulaRow?.prodiAggregation) {
      warnings.push({
        code: "RECALCULATE_REQUIRED",
        message: "Formula memakai agregasi per prodi tetapi hasil ini belum menyimpan detail prodi. Jalankan recalculate.",
      });
    }

    const storedFinal = debug.allFormulas?.find(f => f.isFinal);

    res.json(successResponse({
      iku: {
        id: iku.id,
        code: iku.code,
        name: iku.name,
        type: iku.type,
        unit: iku.unit,
        isDirectInput: iku.isDirectInput,
      },
      period: {
        resultId: result.idResult,
        label: period.label,
        year,
        resultType: result.resultType,
        month: result.month,
        quarter: period.quarter,
        autoSelected: periodAutoSelected,
        calculatedAt: result.calculatedAt,
        evaluatedAt: debug.evaluatedAt ?? null,
        formulaVersion: result.formulaVersion,
        copiedFromQuarter,
      },
      summary: {
        calculatedValue,
        textValue: result.textValue,
        target,
        targetSource: ikuTarget ? targetKey : null,
        achievementRatio,
        status,
        isVerified: verificationCount > 0,
        verificationCount,
      },
      finalFormula: {
        id: storedFinal?.formulaId ?? finalFormulaRow?.id ?? null,
        name: storedFinal?.formulaName ?? finalFormulaRow?.name ?? null,
        finalResultKey: storedFinal?.finalResultKey ?? finalFormulaRow?.finalResultKey ?? null,
        mode,
        steps: debug.formulaSteps ?? [],
      },
      components,
      formulas,
      warnings,
    }));
  } catch (error) {
    next(error);
  }
};
