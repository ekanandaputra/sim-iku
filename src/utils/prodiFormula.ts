import { prisma } from "../lib/prisma";
import { ProdiAggregationType } from "../generated/prisma/enums";
import { evaluateFormula, ComponentValues, FormulaEvaluationStep } from "./formula";

/** Nilai breakdown per komponen: kode komponen → prodiId → nilai. */
export type ProdiValues = Record<string, Record<string, number>>;

export type ProdiFormulaEntry = {
  prodiId: string;
  prodiCode: string | null;
  prodiName: string | null;
  componentValues: ComponentValues;
  result: number | null;
  steps: FormulaEvaluationStep[];
  skipped?: string;
};

export type ProdiEvaluationInfo = {
  aggregation: ProdiAggregationType;
  prodiCount: number;
  excludedProdiIds: string[];
  prodiResults: ProdiFormulaEntry[];
};

export type FinalFormulaEvaluation = {
  result: number;
  steps: FormulaEvaluationStep[];
  prodiEvaluation?: ProdiEvaluationInfo;
};

/**
 * Ambil nilai TERAKHIR (month tertinggi) per prodi dari sekumpulan realisasi.
 * Prodi yang input di bulan awal periode tetap terhitung walaupun prodi lain
 * baru input di bulan berikutnya.
 */
export function latestValuePerProdi(
  realizations: { month: number | null; breakdowns: { prodiId: string; value: unknown }[] }[]
): Record<string, number> {
  const latest = new Map<string, { month: number; value: number }>();
  for (const r of realizations) {
    for (const b of r.breakdowns) {
      const existing = latest.get(b.prodiId);
      if (!existing || (r.month ?? 0) > existing.month) {
        latest.set(b.prodiId, { month: r.month ?? 0, value: Number(b.value) });
      }
    }
  }
  return Object.fromEntries(Array.from(latest, ([prodiId, v]) => [prodiId, v.value]));
}

/**
 * Ambil nilai breakdown per prodi untuk semua komponen hasBreakdown di formula.
 * Komponen yearly mengambil seluruh data tahun itu; lainnya difilter monthsFilter.
 */
export async function fetchProdiValues(
  codeToInfo: Map<string, { id: string; periodType: string; hasBreakdown: boolean }>,
  formulaCodes: string[],
  year: number,
  monthsFilter: number[]
): Promise<ProdiValues> {
  const prodiValues: ProdiValues = {};
  for (const code of formulaCodes) {
    const info = codeToInfo.get(code);
    if (!info?.hasBreakdown) continue;

    const realizations = await prisma.componentRealization.findMany({
      where: {
        idComponent: info.id,
        year,
        ...(info.periodType === "yearly" ? {} : { month: { in: monthsFilter } }),
      },
      select: { month: true, breakdowns: { select: { prodiId: true, value: true } } },
    });
    prodiValues[code] = latestValuePerProdi(realizations);
  }
  return prodiValues;
}

/**
 * Evaluasi formula per prodi: komponen breakdown memakai nilai prodi tersebut,
 * komponen non-breakdown memakai nilai totalnya. Hasil tiap prodi lalu
 * dirata-rata (AVG) / dijumlah (SUM).
 *
 * Prodi yang terdaftar di iku_formula_excluded_prodi tidak diproses sama sekali.
 * Prodi lain dilewati (tidak ikut agregasi) jika tidak punya data untuk salah
 * satu komponen breakdown, atau evaluasinya gagal (mis. pembagian dengan nol).
 * Jika formula tidak memakai komponen breakdown sama sekali, formula
 * dievaluasi biasa dari nilai total.
 */
export async function evaluateFormulaPerProdi(
  formulaId: string,
  aggregation: ProdiAggregationType,
  componentValues: ComponentValues,
  prodiValues: ProdiValues
): Promise<FinalFormulaEvaluation> {
  const breakdownCodes = Object.keys(prodiValues);
  if (breakdownCodes.length === 0) {
    return evaluateFormula(formulaId, componentValues);
  }

  const excluded = await prisma.ikuFormulaExcludedProdi.findMany({
    where: { formulaId },
    select: { prodiId: true },
  });
  const excludedIds = new Set(excluded.map(e => e.prodiId));

  const prodiIds = Array.from(
    new Set(breakdownCodes.flatMap(code => Object.keys(prodiValues[code])))
  ).filter(id => !excludedIds.has(id));
  const prodis = await prisma.prodi.findMany({
    where: { id: { in: prodiIds } },
    select: { id: true, code: true, name: true },
  });
  const prodiById = new Map(prodis.map(p => [p.id, p]));

  const prodiResults: ProdiFormulaEntry[] = [];
  for (const prodiId of prodiIds) {
    const prodi = prodiById.get(prodiId);
    const values: ComponentValues = { ...componentValues };
    const missing: string[] = [];
    for (const code of breakdownCodes) {
      if (prodiId in prodiValues[code]) {
        values[code] = prodiValues[code][prodiId];
      } else {
        missing.push(code);
      }
    }

    const entry: ProdiFormulaEntry = {
      prodiId,
      prodiCode: prodi?.code ?? null,
      prodiName: prodi?.name ?? null,
      componentValues: values,
      result: null,
      steps: [],
    };

    if (missing.length > 0) {
      entry.skipped = `Tidak ada data untuk komponen: ${missing.join(", ")}`;
    } else {
      try {
        const evaluation = await evaluateFormula(formulaId, values);
        entry.result = evaluation.result;
        entry.steps = evaluation.steps;
      } catch (err: any) {
        entry.skipped = err.message;
      }
    }
    prodiResults.push(entry);
  }

  const validResults = prodiResults
    .map(p => p.result)
    .filter((r): r is number => r !== null);
  if (validResults.length === 0) {
    throw new Error("Tidak ada prodi dengan data lengkap untuk dievaluasi");
  }

  const sum = validResults.reduce((acc, r) => acc + r, 0);
  const result = aggregation === ProdiAggregationType.AVG ? sum / validResults.length : sum;

  return {
    result,
    steps: [],
    prodiEvaluation: {
      aggregation,
      prodiCount: validResults.length,
      excludedProdiIds: Array.from(excludedIds),
      prodiResults,
    },
  };
}

/**
 * Simpan hasil per prodi untuk sebuah IkuResult (replace semua baris lama).
 * prodiEvaluation kosong (formula tanpa komponen breakdown) → baris lama dihapus.
 */
export async function saveProdiResults(
  resultId: string,
  prodiEvaluation: ProdiEvaluationInfo | undefined
): Promise<void> {
  if (!prodiEvaluation) {
    await prisma.ikuResultProdi.deleteMany({ where: { resultId } });
    return;
  }
  await prisma.$transaction([
    prisma.ikuResultProdi.deleteMany({ where: { resultId } }),
    prisma.ikuResultProdi.createMany({
      data: prodiEvaluation.prodiResults.map(p => ({
        resultId,
        prodiId: p.prodiId,
        calculatedValue: p.result,
        skippedReason: p.skipped ?? null,
        debugInfo: { componentValues: p.componentValues, formulaSteps: p.steps },
      })),
    }),
  ]);
}

/**
 * Salin hasil per prodi dari satu IkuResult ke IkuResult lain (dipakai yearly,
 * yang nilainya disalin dari quarterly). sourceResultId null → kosongkan target.
 */
export async function copyProdiResults(
  sourceResultId: string | null,
  targetResultId: string
): Promise<void> {
  const source = sourceResultId
    ? await prisma.ikuResultProdi.findMany({ where: { resultId: sourceResultId } })
    : [];
  await prisma.$transaction([
    prisma.ikuResultProdi.deleteMany({ where: { resultId: targetResultId } }),
    prisma.ikuResultProdi.createMany({
      data: source.map(p => ({
        resultId: targetResultId,
        prodiId: p.prodiId,
        calculatedValue: p.calculatedValue,
        skippedReason: p.skippedReason,
        debugInfo: p.debugInfo ?? undefined,
      })),
    }),
  ]);
}
