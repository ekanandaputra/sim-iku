import { Request, Response, NextFunction } from "express";
import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { parseFormulaExpression } from "../utils/formulaParser";

// ─── Constants ────────────────────────────────────────────────────────────────

const SHEET_MASTER = "MasterData";
const SHEET_FORMULA = "FormulaData";

const VALID_IKU_UNITS = ["percentage", "text", "number", "file"] as const;
const VALID_DATA_TYPES = ["number", "percentage", "integer"] as const;
const VALID_SOURCE_TYPES = ["database", "api", "manual"] as const;
const VALID_PERIOD_TYPES = ["monthly", "quarter", "semester", "yearly"] as const;

type IkuUnit = typeof VALID_IKU_UNITS[number];
type DataType = typeof VALID_DATA_TYPES[number];
type SourceType = typeof VALID_SOURCE_TYPES[number];
type PeriodType = typeof VALID_PERIOD_TYPES[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBool(val: any): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const s = val.trim().toUpperCase();
    return s === "TRUE" || s === "1" || s === "YA" || s === "YES";
  }
  if (typeof val === "number") return val !== 0;
  return false;
}

function toString(val: any): string {
  if (val == null) return "";
  return String(val).trim();
}

// ─── DOWNLOAD TEMPLATES ───────────────────────────────────────────────────────

/**
 * GET /api/import/master/template
 */
export const downloadMasterTemplate = (req: Request, res: Response) => {
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
  ];

  const samples = [
    ["IKU001", "Kualitas Air", "Deskripsi IKU", "FALSE", "percentage", "COMP001", "Kadar BOD", "Desc", "number", "manual", "monthly"],
    ["IKU001", "Kualitas Air", "", "FALSE", "percentage", "COMP002", "Kadar COD", "", "number", "manual", "monthly"],
    ["IKU002", "IKU Manual", "", "TRUE", "number", "", "", "", "", "", ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);
  ws["!cols"] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_MASTER);

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", 'attachment; filename="template_master_data.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
};

/**
 * GET /api/import/formulas/template
 */
export const downloadFormulaTemplate = (req: Request, res: Response) => {
  const headers = [
    "iku_code",
    "formula_name",
    "formula_description",
    "formula_expression",
    "final_result_key",
    "is_final",
  ];

  const samples = [
    ["IKU001", "Rumus Utama", "Perhitungan standar", "((COMP001 + COMP002) / COMP003) * 100", "BOD_COD_RESULT", "TRUE"],
    ["IKU001", "Rumus Alternatif", "Tanpa komponen C", "COMP001 + COMP002", "RESULT", "FALSE"],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);
  ws["!cols"] = headers.map(() => ({ wch: 25 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_FORMULA);

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", 'attachment; filename="template_formula.xlsx"');
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
};

// ─── IMPORT MASTER DATA ───────────────────────────────────────────────────────

export const importMasterData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json(errorResponse("No file uploaded."));

    const wb = XLSX.read(file.buffer, { type: "buffer" });
    const ws = wb.Sheets[SHEET_MASTER];
    if (!ws) return res.status(400).json(errorResponse(`Sheet '${SHEET_MASTER}' not found.`));

    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (raw.length < 2) return res.status(400).json(errorResponse("Sheet has no data."));

    const header = (raw[0] as any[]).map(h => toString(h).toLowerCase());
    const col = (name: string) => header.indexOf(name);

    let ikuCreated = 0, ikuUpdated = 0, ikpCreated = 0, ikpUpdated = 0, mappingCreated = 0, mappingSkipped = 0;
    const parseErrors: any[] = [];

    // Grouping rows by IKU code
    const ikuGroups = new Map<string, any[]>();
    for (let i = 1; i < raw.length; i++) {
      const r = raw[i];
      const code = toString(r[col("iku_code")]);
      if (!code) continue;
      if (!ikuGroups.has(code)) ikuGroups.set(code, []);
      ikuGroups.get(code)!.push(r);
    }

    for (const [ikuCode, rows] of ikuGroups) {
      const first = rows[0];
      const ikuName = toString(first[col("iku_name")]);
      if (!ikuName) {
        parseErrors.push({ row: "IKU:" + ikuCode, error: "iku_name is required" });
        continue;
      }

      // 1. Upsert IKU
      const iku = await prisma.iKU.upsert({
        where: { code: ikuCode },
        update: {
          name: ikuName,
          description: toString(first[col("iku_description")]) || null,
          isDirectInput: toBool(first[col("iku_is_direct_input")]),
          unit: (toString(first[col("iku_unit")]).toLowerCase() as any) || "percentage",
        },
        create: {
          code: ikuCode,
          name: ikuName,
          description: toString(first[col("iku_description")]) || null,
          isDirectInput: toBool(first[col("iku_is_direct_input")]),
          unit: (toString(first[col("iku_unit")]).toLowerCase() as any) || "percentage",
        },
      });
      
      const isNewIku = await prisma.iKU.count({ where: { code: ikuCode } }) === 1; // Simplify for summary
      // Note: prisma upsert doesn't tell if it created or updated easily. 
      // For summary accuracy, we'll just increment updated if we don't track state.
      ikuUpdated++; 

      // 2. Upsert Components & Mappings
      for (const r of rows) {
        const ikpCode = toString(r[col("ikp_code")]);
        if (!ikpCode) continue;

        const ikpName = toString(r[col("ikp_name")]);
        if (!ikpName) continue;

        const component = await prisma.component.upsert({
          where: { code: ikpCode },
          update: {
            name: ikpName,
            description: toString(r[col("ikp_description")]) || null,
            dataType: (toString(r[col("ikp_data_type")]).toLowerCase() as any) || null,
            sourceType: (toString(r[col("ikp_source_type")]).toLowerCase() as any) || null,
            periodType: (toString(r[col("ikp_period_type")]).toLowerCase() as any) || "yearly",
          },
          create: {
            code: ikpCode,
            name: ikpName,
            description: toString(r[col("ikp_description")]) || null,
            dataType: (toString(r[col("ikp_data_type")]).toLowerCase() as any) || null,
            sourceType: (toString(r[col("ikp_source_type")]).toLowerCase() as any) || null,
            periodType: (toString(r[col("ikp_period_type")]).toLowerCase() as any) || "yearly",
          },
        });
        ikpUpdated++;

        // Mapping
        const existingMap = await prisma.iKUComponent.findUnique({
          where: { ikuId_componentId: { ikuId: iku.id, componentId: component.id } }
        });
        if (!existingMap) {
          await prisma.iKUComponent.create({ data: { ikuId: iku.id, componentId: component.id } });
          mappingCreated++;
        } else {
          mappingSkipped++;
        }
      }
    }

    res.json(successResponse({
      summary: { iku: ikuUpdated, ikp: ikpUpdated, mapping: { created: mappingCreated, skipped: mappingSkipped } },
      parseErrors
    }, "Import Master Data successful"));
  } catch (error) {
    next(error);
  }
};

// ─── IMPORT FORMULAS ─────────────────────────────────────────────────────────

export const importFormulas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json(errorResponse("No file uploaded."));

    const wb = XLSX.read(file.buffer, { type: "buffer" });
    const ws = wb.Sheets[SHEET_FORMULA];
    if (!ws) return res.status(400).json(errorResponse(`Sheet '${SHEET_FORMULA}' not found.`));

    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (raw.length < 2) return res.status(400).json(errorResponse("Sheet has no data."));

    const header = (raw[0] as any[]).map(h => toString(h).toLowerCase());
    const col = (name: string) => header.indexOf(name);

    let formulaCreated = 0;
    const formulaErrors: any[] = [];

    for (let i = 1; i < raw.length; i++) {
      const r = raw[i];
      const rowNum = i + 1;
      const ikuCode = toString(r[col("iku_code")]);
      const expression = toString(r[col("formula_expression")]);
      const name = toString(r[col("formula_name")]) || "Formula Import";
      const finalResultKey = toString(r[col("final_result_key")]) || "RESULT";
      const isFinal = toBool(r[col("is_final")]);

      if (!ikuCode || !expression) continue;

      const iku = await prisma.iKU.findUnique({ where: { code: ikuCode } });
      if (!iku) {
        formulaErrors.push({ row: rowNum, error: `IKU code '${ikuCode}' not found.` });
        continue;
      }

      try {
        const parsed = parseFormulaExpression(expression, finalResultKey);

        // Validasi komponen
        const missing = [];
        for (const c of parsed.componentCodes) {
          const exists = await prisma.component.count({ where: { code: c } });
          if (!exists) missing.push(c);
        }
        if (missing.length > 0) {
          formulaErrors.push({ row: rowNum, error: `Component(s) not found: ${missing.join(", ")}` });
          continue;
        }

        const last = await prisma.iKUFormula.findFirst({ where: { ikuId: iku.id }, orderBy: { version: "desc" } });
        const version = (last?.version ?? 0) + 1;

        await prisma.$transaction(async (tx) => {
          if (isFinal) {
            await tx.iKUFormula.updateMany({ where: { ikuId: iku.id, isFinal: true }, data: { isFinal: false } });
          }
          await tx.iKUFormula.create({
            data: {
              ikuId: iku.id,
              name,
              description: toString(r[col("formula_description")]) || `Imported v${version}`,
              finalResultKey: parsed.finalResultKey,
              isActive: true,
              isFinal,
              version,
              details: {
                create: parsed.steps.map(s => ({
                  sequence: s.sequence,
                  leftType: s.leftType as any,
                  leftValue: s.leftValue,
                  operator: s.operator as any,
                  rightType: s.rightType as any,
                  rightValue: s.rightValue,
                  resultKey: s.resultKey,
                }))
              }
            }
          });
        });
        formulaCreated++;
      } catch (err: any) {
        formulaErrors.push({ row: rowNum, error: `Parse Error: ${err.message}` });
      }
    }

    res.json(successResponse({
      summary: { created: formulaCreated, errors: formulaErrors.length },
      formulaErrors
    }, "Import Formulas successful"));
  } catch (error) {
    next(error);
  }
};
