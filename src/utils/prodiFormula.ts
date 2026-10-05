import { prisma } from "../lib/prisma";
import { ProdiAggregationType } from "../generated/prisma/enums";
import { evaluateFormula, ComponentValues, FormulaEvaluationStep, FormulaEvaluationOptions } from "./formula";

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
  /** Diisi jika hasil ini berasal dari sub-formula yang direferensikan */
  formulaId?: string;
  formulaName?: string;
};

export type ProdiEvaluationInfo = {
  aggregation: ProdiAggregationType;
  prodiLevel: string | null;
  prodiCount: number;
  excludedProdiIds: string[];
  prodiResults: ProdiFormulaEntry[];
};

export type FinalFormulaEvaluation = {
  result: number;
  steps: FormulaEvaluationStep[];
  prodiEvaluation?: ProdiEvaluationInfo;
};

/** Hasil sub-formula (formula_ref) yang dihitung per prodi. */
export type RefProdiEvaluation = {
  formulaId: string;
  formulaName: string;
  result: number;
  prodiEvaluation?: ProdiEvaluationInfo;
};

/**
 * Context untuk evaluasi formula yang mereferensikan sub-formula dengan
 * prodiAggregation (mis. "AEE D4 + AEE D3"). Sub-formula tersebut dihitung per
 * prodi sesuai filternya, bukan dari nilai total.
 *
 * Nilai per prodi baru diambil (lazy) saat ada sub-formula yang membutuhkannya,
 * sehingga formula tanpa prodiAggregation tidak menjalankan query tambahan.
 */
export function createProdiRefContext(loadProdiValues: () => Promise<ProdiValues>) {
  let prodiValuesPromise: Promise<ProdiValues> | null = null;
  const getProdiValues = () => (prodiValuesPromise ??= loadProdiValues());
  const refEvaluations = new Map<string, RefProdiEvaluation>();

  const options: FormulaEvaluationOptions = {
    resolveFormulaRef: async (ref, componentValues) => {
      if (!ref.prodiAggregation) return null;
      const evaluation = await evaluateFormulaPerProdi(
        ref.id, ref.prodiAggregation, componentValues, await getProdiValues()
      );
      refEvaluations.set(ref.id, {
        formulaId: ref.id,
        formulaName: ref.name,
        result: evaluation.result,
        prodiEvaluation: evaluation.prodiEvaluation,
      });
      return evaluation.result;
    },
  };

  return {
    options,
    getProdiValues,
    getRefEvaluations: (): RefProdiEvaluation[] => Array.from(refEvaluations.values()),
  };
}

/**
 * Gabungkan hasil per prodi untuk disimpan ke iku_result_prodi:
 * - formula final memakai prodiAggregation → hasil per prodi formula final
 * - selain itu → gabungan hasil per prodi dari sub-formula (mis. AEE D4 + AEE D3).
 *   Jika satu prodi muncul di beberapa sub-formula, yang pertama dipakai.
 * Mengembalikan undefined jika tidak ada perhitungan per prodi sama sekali.
 */
export function collectProdiEntries(
  finalEvaluation: ProdiEvaluationInfo | undefined,
  refEvaluations: RefProdiEvaluation[] | undefined
): ProdiFormulaEntry[] | undefined {
  if (finalEvaluation) return finalEvaluation.prodiResults;
  if (!refEvaluations || refEvaluations.length === 0) return undefined;

  const byProdi = new Map<string, ProdiFormulaEntry>();
  for (const ref of refEvaluations) {
    for (const p of ref.prodiEvaluation?.prodiResults ?? []) {
      if (!byProdi.has(p.prodiId)) {
        byProdi.set(p.prodiId, { ...p, formulaId: ref.formulaId, formulaName: ref.formulaName });
      }
    }
  }
  return Array.from(byProdi.values());
}

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
 * Prodi yang tidak sesuai iku_formula.prodi_level (jika diisi) atau terdaftar di
 * iku_formula_excluded_prodi tidak diproses sama sekali.
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

  const formulaFilter = await prisma.iKUFormula.findUnique({
    where: { id: formulaId },
    select: { prodiLevel: true, excludedProdis: { select: { prodiId: true } } },
  });
  const prodiLevel = formulaFilter?.prodiLevel?.trim() || null;
  const excludedIds = new Set((formulaFilter?.excludedProdis ?? []).map(e => e.prodiId));

  const candidateIds = Array.from(
    new Set(breakdownCodes.flatMap(code => Object.keys(prodiValues[code])))
  ).filter(id => !excludedIds.has(id));
  const prodis = await prisma.prodi.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, code: true, name: true, level: true },
  });
  const prodiById = new Map(prodis.map(p => [p.id, p]));
  const prodiIds = prodiLevel
    ? candidateIds.filter(id => prodiById.get(id)?.level.trim().toLowerCase() === prodiLevel.toLowerCase())
    : candidateIds;
  if (prodiIds.length === 0) {
    throw new Error(
      `Tidak ada prodi yang memenuhi filter${prodiLevel ? ` level '${prodiLevel}'` : ""}${excludedIds.size ? " dan exclude" : ""}`
    );
  }

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
    const reasons = prodiResults.map(p => `${p.prodiCode ?? p.prodiId}: ${p.skipped}`).join("; ");
    throw new Error(`Tidak ada prodi dengan data lengkap untuk dievaluasi (${reasons})`);
  }

  const sum = validResults.reduce((acc, r) => acc + r, 0);
  const result = aggregation === ProdiAggregationType.AVG ? sum / validResults.length : sum;

  return {
    result,
    steps: [],
    prodiEvaluation: {
      aggregation,
      prodiLevel,
      prodiCount: validResults.length,
      excludedProdiIds: Array.from(excludedIds),
      prodiResults,
    },
  };
}

/**
 * Simpan hasil per prodi untuk sebuah IkuResult (replace semua baris lama).
 * entries kosong (tidak ada perhitungan per prodi) → baris lama dihapus.
 */
export async function saveProdiResults(
  resultId: string,
  entries: ProdiFormulaEntry[] | undefined
): Promise<void> {
  if (!entries) {
    await prisma.ikuResultProdi.deleteMany({ where: { resultId } });
    return;
  }
  await prisma.$transaction([
    prisma.ikuResultProdi.deleteMany({ where: { resultId } }),
    prisma.ikuResultProdi.createMany({
      data: entries.map(p => ({
        resultId,
        prodiId: p.prodiId,
        calculatedValue: p.result,
        skippedReason: p.skipped ?? null,
        debugInfo: {
          componentValues: p.componentValues,
          formulaSteps: p.steps,
          ...(p.formulaId ? { formulaId: p.formulaId, formulaName: p.formulaName } : {}),
        },
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
