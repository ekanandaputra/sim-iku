import { Request, Response, NextFunction } from "express";
import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { parseFormulaExpression } from "../utils/formulaParser";

// ─── Constants ────────────────────────────────────────────────────────────────

const SHEET_NAME = "MasterData";

const VALID_IKU_UNITS = ["percentage", "text", "number", "file"] as const;
const VALID_DATA_TYPES = ["number", "percentage", "integer"] as const;
const VALID_SOURCE_TYPES = ["database", "api", "manual"] as const;
const VALID_PERIOD_TYPES = ["monthly", "quarter", "semester", "yearly"] as const;

type IkuUnit = typeof VALID_IKU_UNITS[number];
type DataType = typeof VALID_DATA_TYPES[number];
type SourceType = typeof VALID_SOURCE_TYPES[number];
type PeriodType = typeof VALID_PERIOD_TYPES[number];

// ─── Row shape after parsing ───────────────────────────────────────────────────

interface RawRow {
  rowNum: number;
  iku_code: string;
  iku_name: string;
  iku_description?: string;
  iku_is_direct_input: boolean;
  iku_unit: IkuUnit;
  ikp_code?: string;
  ikp_name?: string;
  ikp_description?: string;
  ikp_data_type?: DataType;
  ikp_source_type?: SourceType;
  ikp_period_type: PeriodType;
  formula_name?: string;
  formula_expression?: string;
  formula_is_final: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBool(val: any): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    return val.trim().toUpperCase() === "TRUE" || val.trim() === "1";
  }
  if (typeof val === "number") return val !== 0;
  return false;
}

function toString(val: any): string {
  if (val == null) return "";
  return String(val).trim();
}

// ─── DOWNLOAD TEMPLATE ────────────────────────────────────────────────────────

/**
 * GET /api/import/master/template
 * Returns an empty Excel template with all required columns and sample rows.
 */
export const downloadTemplate = (req: Request, res: Response) => {
  const headers = [
    "iku_code",
    "iku_name",
    "iku_description",
    "iku_is_direct_input",
    "iku_unit",
    "ikp_code",
    "ikp_name",
    "ikp_description",
    "ikp_data_type",
    "ikp_source_type",
    "ikp_period_type",
    "formula_name",
    "formula_expression",
    "formula_is_final",
  ];

  const sample1 = [
    "IKU001",
    "Kualitas Air",
    "Indikator kualitas air sungai",
    "FALSE",
    "percentage",
    "COMP001",
    "Kadar BOD",
    "Biological Oxygen Demand",
    "number",
    "manual",
    "monthly",
    "Rumus Kualitas Air",
    "((COMP001 + COMP002) / COMP003) * 100",
    "TRUE",
  ];

  const sample2 = [
    "IKU001",
    "Kualitas Air",
    "",
    "FALSE",
    "percentage",
    "COMP002",
    "Kadar COD",
    "",
    "number",
    "manual",
    "monthly",
    "",
    "",
    "",
  ];

  const sample3 = [
    "IKU001",
    "Kualitas Air",
    "",
    "FALSE",
    "percentage",
    "COMP003",
    "Total Sampel",
    "",
    "number",
    "manual",
    "monthly",
    "",
    "",
    "",
  ];

  const sample4 = [
    "IKU002",
    "Indeks Kualitas Udara",
    "",
    "TRUE",
    "number",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sample1, sample2, sample3, sample4]);

  // Column widths
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));

  // Bold header row style (basic)
  for (let c = 0; c < headers.length; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cellAddr]) {
      ws[cellAddr].s = { font: { bold: true } };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Disposition", 'attachment; filename="master_data_template.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
};

// ─── IMPORT MASTER DATA ───────────────────────────────────────────────────────

/**
 * POST /api/import/master
 * Accepts a .xlsx file upload (field name: "file") and upserts IKU, IKP, mapping, and formulas.
 *
 * Rules:
 * - Rows are grouped by iku_code.
 * - The FIRST row for each iku_code provides the IKU master data (name, unit, etc.).
 *   Subsequent rows with the same iku_code only contribute IKP mapping data.
 * - If ikp_code is provided, ikp_name is required.
 * - Both IKU and IKP are upserted by their code (unique key).
 * - IKU ↔ IKP mapping is upserted (skip if already exists).
 * - Formula: if formula_name & formula_expression are provided on the FIRST row of an
 *   iku_code group, the expression is parsed into sequential steps and a formula is created.
 *   Identifiers in the expression must match ikp_code values (component codes).
 */
export const importMasterData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json(errorResponse("No file uploaded. Use field name 'file'."));
    }

    // ── 1. Parse workbook ─────────────────────────────────────────────────────
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(file.buffer, { type: "buffer" });
    } catch {
      return res.status(400).json(errorResponse("File is not a valid Excel (.xlsx) file."));
    }

    const ws = wb.Sheets[SHEET_NAME];
    if (!ws) {
      return res.status(400).json(
        errorResponse(`Sheet '${SHEET_NAME}' not found. Please use the template.`)
      );
    }

    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    if (raw.length < 2) {
      return res.status(400).json(errorResponse("Sheet is empty or has no data rows."));
    }

    // ── 2. Validate & map header ──────────────────────────────────────────────
    const headerRow = (raw[0] as any[]).map((h: any) => toString(h).toLowerCase());
    const requiredCols = ["iku_code", "iku_name"];
    const missing = requiredCols.filter((c) => !headerRow.includes(c));
    if (missing.length > 0) {
      return res.status(400).json(
        errorResponse(`Missing required columns: ${missing.join(", ")}. Please use the template.`)
      );
    }

    const col = (name: string) => headerRow.indexOf(name);

    // ── 3. Parse data rows ────────────────────────────────────────────────────
    const rows: RawRow[] = [];
    const parseErrors: { row: number; error: string }[] = [];

    for (let i = 1; i < raw.length; i++) {
      const r = raw[i] as any[];
      const rowNum = i + 1; // 1-based Excel row

      const iku_code = toString(r[col("iku_code")]);
      if (!iku_code) continue; // skip completely empty rows

      const iku_name = toString(r[col("iku_name")]);
      if (!iku_name) {
        parseErrors.push({ row: rowNum, error: "iku_name is required when iku_code is present" });
        continue;
      }

      const iku_unit_raw = toString(r[col("iku_unit")]).toLowerCase() || "percentage";
      if (!VALID_IKU_UNITS.includes(iku_unit_raw as IkuUnit)) {
        parseErrors.push({ row: rowNum, error: `iku_unit '${iku_unit_raw}' is invalid. Use: ${VALID_IKU_UNITS.join(", ")}` });
        continue;
      }

      const ikp_code = col("ikp_code") >= 0 ? toString(r[col("ikp_code")]) : "";
      const ikp_name = col("ikp_name") >= 0 ? toString(r[col("ikp_name")]) : "";

      if (ikp_code && !ikp_name) {
        parseErrors.push({ row: rowNum, error: "ikp_name is required when ikp_code is present" });
        continue;
      }

      let ikp_data_type: DataType | undefined;
      if (col("ikp_data_type") >= 0) {
        const raw_dt = toString(r[col("ikp_data_type")]).toLowerCase();
        if (raw_dt && !VALID_DATA_TYPES.includes(raw_dt as DataType)) {
          parseErrors.push({ row: rowNum, error: `ikp_data_type '${raw_dt}' is invalid. Use: ${VALID_DATA_TYPES.join(", ")}` });
          continue;
        }
        ikp_data_type = raw_dt ? (raw_dt as DataType) : undefined;
      }

      let ikp_source_type: SourceType | undefined;
      if (col("ikp_source_type") >= 0) {
        const raw_st = toString(r[col("ikp_source_type")]).toLowerCase();
        if (raw_st && !VALID_SOURCE_TYPES.includes(raw_st as SourceType)) {
          parseErrors.push({ row: rowNum, error: `ikp_source_type '${raw_st}' is invalid. Use: ${VALID_SOURCE_TYPES.join(", ")}` });
          continue;
        }
        ikp_source_type = raw_st ? (raw_st as SourceType) : undefined;
      }

      const ikp_period_raw = col("ikp_period_type") >= 0
        ? toString(r[col("ikp_period_type")]).toLowerCase() || "yearly"
        : "yearly";
      if (!VALID_PERIOD_TYPES.includes(ikp_period_raw as PeriodType)) {
        parseErrors.push({ row: rowNum, error: `ikp_period_type '${ikp_period_raw}' is invalid. Use: ${VALID_PERIOD_TYPES.join(", ")}` });
        continue;
      }

      rows.push({
        rowNum,
        iku_code,
        iku_name,
        iku_description: col("iku_description") >= 0 ? toString(r[col("iku_description")]) || undefined : undefined,
        iku_is_direct_input: col("iku_is_direct_input") >= 0 ? toBool(r[col("iku_is_direct_input")]) : false,
        iku_unit: iku_unit_raw as IkuUnit,
        ikp_code: ikp_code || undefined,
        ikp_name: ikp_name || undefined,
        ikp_description: col("ikp_description") >= 0 ? toString(r[col("ikp_description")]) || undefined : undefined,
        ikp_data_type,
        ikp_source_type,
        ikp_period_type: ikp_period_raw as PeriodType,
        formula_name: col("formula_name") >= 0 ? toString(r[col("formula_name")]) || undefined : undefined,
        formula_expression: col("formula_expression") >= 0 ? toString(r[col("formula_expression")]) || undefined : undefined,
        formula_is_final: col("formula_is_final") >= 0 ? toBool(r[col("formula_is_final")]) : false,
      });
    }

    // ── 4. Group by iku_code — first row wins for IKU master data ─────────────
    const ikuMap = new Map<string, RawRow>(); // iku_code → first row
    for (const row of rows) {
      if (!ikuMap.has(row.iku_code)) {
        ikuMap.set(row.iku_code, row);
      }
    }

    // ── 5. Upsert IKUs ────────────────────────────────────────────────────────
    let ikuCreated = 0;
    let ikuUpdated = 0;
    const ikuIdByCode = new Map<string, string>(); // code → db id

    for (const [code, row] of ikuMap) {
      const existing = await prisma.iKU.findUnique({ where: { code } });

      if (existing) {
        await prisma.iKU.update({
          where: { code },
          data: {
            name: row.iku_name,
            description: row.iku_description ?? null,
            isDirectInput: row.iku_is_direct_input,
            unit: row.iku_unit,
          },
        });
        ikuIdByCode.set(code, existing.id);
        ikuUpdated++;
      } else {
        const created = await prisma.iKU.create({
          data: {
            code,
            name: row.iku_name,
            description: row.iku_description ?? null,
            isDirectInput: row.iku_is_direct_input,
            unit: row.iku_unit,
          },
        });
        ikuIdByCode.set(code, created.id);
        ikuCreated++;
      }
    }

    // ── 6. Upsert IKPs (Components) ────────────────────────────────────────────
    let ikpCreated = 0;
    let ikpUpdated = 0;
    const ikpIdByCode = new Map<string, string>(); // code → db id

    // Deduplicate IKPs: first row wins for each ikp_code
    const ikpMap = new Map<string, RawRow>();
    for (const row of rows) {
      if (row.ikp_code && !ikpMap.has(row.ikp_code)) {
        ikpMap.set(row.ikp_code, row);
      }
    }

    for (const [code, row] of ikpMap) {
      const existing = await prisma.component.findUnique({ where: { code } });

      if (existing) {
        await prisma.component.update({
          where: { code },
          data: {
            name: row.ikp_name!,
            description: row.ikp_description ?? null,
            dataType: row.ikp_data_type ?? null,
            sourceType: row.ikp_source_type ?? null,
            periodType: row.ikp_period_type,
          },
        });
        ikpIdByCode.set(code, existing.id);
        ikpUpdated++;
      } else {
        const created = await prisma.component.create({
          data: {
            code,
            name: row.ikp_name!,
            description: row.ikp_description ?? null,
            dataType: row.ikp_data_type ?? null,
            sourceType: row.ikp_source_type ?? null,
            periodType: row.ikp_period_type,
          },
        });
        ikpIdByCode.set(code, created.id);
        ikpCreated++;
      }
    }

    // ── 7. Upsert mappings ─────────────────────────────────────────────────────
    let mappingCreated = 0;
    let mappingSkipped = 0;

    for (const row of rows) {
      if (!row.ikp_code) continue;

      const ikuId = ikuIdByCode.get(row.iku_code);
      const componentId = ikpIdByCode.get(row.ikp_code);

      if (!ikuId || !componentId) continue;

      const existing = await prisma.iKUComponent.findUnique({
        where: { ikuId_componentId: { ikuId, componentId } },
      });

      if (!existing) {
        await prisma.iKUComponent.create({ data: { ikuId, componentId } });
        mappingCreated++;
      } else {
        mappingSkipped++;
      }
    }

    // ── 8. Parse & create formulas ─────────────────────────────────────────────
    let formulaCreated = 0;
    const formulaErrors: { ikuCode: string; row: number; error: string }[] = [];

    for (const [ikuCode, firstRow] of ikuMap) {
      if (!firstRow.formula_name || !firstRow.formula_expression) continue;

      const ikuId = ikuIdByCode.get(ikuCode);
      if (!ikuId) continue;

      try {
        const parsed = parseFormulaExpression(firstRow.formula_expression, "RESULT");

        // Validate that all component codes in the expression exist
        const missingCodes: string[] = [];
        for (const compCode of parsed.componentCodes) {
          // Check both newly created and existing components
          const comp = await prisma.component.findUnique({ where: { code: compCode } });
          if (!comp) {
            missingCodes.push(compCode);
          }
        }

        if (missingCodes.length > 0) {
          formulaErrors.push({
            ikuCode,
            row: firstRow.rowNum,
            error: `Component codes in formula not found: ${missingCodes.join(", ")}. Make sure these codes exist as ikp_code in the sheet.`,
          });
          continue;
        }

        // Get next version for this IKU
        const lastVersion = await prisma.iKUFormula.findFirst({
          where: { ikuId },
          orderBy: { version: "desc" },
          select: { version: true },
        });
        const nextVersion = (lastVersion?.version ?? 0) + 1;

        // Build transaction: if isFinal, unset other finals first
        const transactionOps: any[] = [];

        if (firstRow.formula_is_final) {
          transactionOps.push(
            prisma.iKUFormula.updateMany({
              where: { ikuId, isFinal: true },
              data: { isFinal: false },
            })
          );
        }

        transactionOps.push(
          prisma.iKUFormula.create({
            data: {
              ikuId,
              name: firstRow.formula_name,
              description: `Imported from expression: ${firstRow.formula_expression}`,
              finalResultKey: parsed.finalResultKey,
              isActive: true,
              isFinal: firstRow.formula_is_final,
              version: nextVersion,
              details: {
                create: parsed.steps.map((step) => ({
                  sequence: step.sequence,
                  leftType: step.leftType,
                  leftValue: step.leftValue,
                  operator: step.operator,
                  rightType: step.rightType,
                  rightValue: step.rightValue,
                  resultKey: step.resultKey,
                })),
              },
            },
          })
        );

        await prisma.$transaction(transactionOps);
        formulaCreated++;
      } catch (err: any) {
        formulaErrors.push({
          ikuCode,
          row: firstRow.rowNum,
          error: `Formula parse error: ${err.message}`,
        });
      }
    }

    // ── 9. Return summary ──────────────────────────────────────────────────────
    return res.status(200).json(
      successResponse(
        {
          summary: {
            iku: { created: ikuCreated, updated: ikuUpdated },
            ikp: { created: ikpCreated, updated: ikpUpdated },
            mapping: { created: mappingCreated, skipped: mappingSkipped },
            formula: { created: formulaCreated, errors: formulaErrors.length },
          },
          parseErrors,
          formulaErrors,
          totalRows: rows.length,
          skippedRows: parseErrors.length,
        },
        "Import master data completed"
      )
    );
  } catch (error) {
    next(error);
  }
};
