import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { evaluateFormula } from "../utils/formula";

type PaginationQuery = {
  page?: string;
  limit?: string;
  ikuId?: string;
  includeInactive?: string;
};

type FormulaParams = {
  id: string;
};

type FormulaDetailParams = {
  formulaId: string;
  id: string;
};

/**
 * LIST IKU FORMULAS
 * GET /api/iku-formulas
 */
export const listIkuFormulas = async (
  req: Request<{}, {}, {}, PaginationQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const includeInactive = req.query.includeInactive === "true";
    const where: any = { ikuId: req.query.ikuId };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (!req.query.ikuId) {
      delete where.ikuId;
    }

    const formulas = await prisma.iKUFormula.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.json(successResponse(formulas));
  } catch (error) {
    next(error);
  }
};

/**
 * GET IKU FORMULA BY ID
 * GET /api/iku-formulas/:id
 */
export const getIkuFormulaById = async (
  req: Request<FormulaParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const formula = await prisma.iKUFormula.findUnique({
      where: { id },
    });

    if (!formula || !formula.isActive) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    res.json(successResponse(formula));
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE IKU FORMULA
 * POST /api/iku-formulas
 */
export const createIkuFormula = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ikuId, name, description, finalResultKey, isActive } = req.body;

    const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    const formula = await prisma.iKUFormula.create({
      data: {
        ikuId,
        name,
        description,
        finalResultKey,
        isActive,
      },
    });

    res.status(201).json(successResponse(formula, "Formula created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE IKU FORMULA
 * PUT /api/iku-formulas/:id
 */
export const updateIkuFormula = async (
  req: Request<FormulaParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const { name, description, finalResultKey, isActive } = req.body;

    const existing = await prisma.iKUFormula.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const updated = await prisma.iKUFormula.update({
      where: { id },
      data: {
        name,
        description,
        finalResultKey,
        isActive,
      },
    });

    res.json(successResponse(updated, "Formula updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE IKU FORMULA
 * DELETE /api/iku-formulas/:id
 */
export const deleteIkuFormula = async (
  req: Request<FormulaParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const existing = await prisma.iKUFormula.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    await prisma.iKUFormula.delete({ where: { id } });

    res.json(successResponse(null, "Formula deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * LIST FORMULA STEPS
 * GET /api/iku-formulas/:formulaId/steps
 */
export const listIkuFormulaSteps = async (
  req: Request<FormulaDetailParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const formulaId = req.params.formulaId;

    const formula = await prisma.iKUFormula.findUnique({ where: { id: formulaId } });
    if (!formula) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const steps = await prisma.iKUFormulaDetail.findMany({
      where: { formulaId },
      orderBy: { sequence: "asc" },
    });

    res.json(successResponse(steps));
  } catch (error) {
    next(error);
  }
};

/**
 * GET COMPONENT CODES USED BY FORMULA
 * GET /api/iku-formulas/:id/components
 */
export const getFormulaComponents = async (
  req: Request<FormulaParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const formulaId = req.params.id;

    const formula = await prisma.iKUFormula.findUnique({ where: { id: formulaId } });
    if (!formula) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const steps = await prisma.iKUFormulaDetail.findMany({
      where: { formulaId },
      orderBy: { sequence: "asc" },
    });

    const codes = new Set<string>();
    for (const step of steps) {
      if (step.leftType === "component") {
        codes.add(step.leftValue);
      }
      if (step.rightType === "component") {
        codes.add(step.rightValue);
      }
    }

    const components = Array.from(codes).map((code) => ({ code }));

    res.json(successResponse({ formulaId, components }));
  } catch (error) {
    next(error);
  }
};

/**
 * TEST FORMULA CALCULATION
 * POST /api/iku-formulas/:id/test
 */
export const testIkuFormula = async (
  req: Request<FormulaParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const formulaId = req.params.id;
    const { componentValues } = req.body;

    if (!componentValues || typeof componentValues !== "object" || Array.isArray(componentValues)) {
      return res
        .status(400)
        .json(errorResponse("componentValues must be an object with numeric values"));
    }

    for (const [key, value] of Object.entries(componentValues)) {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return res
          .status(400)
          .json(errorResponse(`componentValues['${key}'] must be a valid number`));
      }
    }

    const formula = await prisma.iKUFormula.findUnique({ where: { id: formulaId } });
    if (!formula) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const evaluation = await evaluateFormula(formulaId, componentValues);

    res.json(successResponse(evaluation));
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE FORMULA STEP
 * POST /api/iku-formulas/:formulaId/steps
 */
export const createIkuFormulaStep = async (
  req: Request<FormulaDetailParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const formulaId = req.params.formulaId;
    const { sequence, leftType, leftValue, operator, rightType, rightValue, resultKey } = req.body;

    const formula = await prisma.iKUFormula.findUnique({ where: { id: formulaId } });
    if (!formula) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const existingSequence = await prisma.iKUFormulaDetail.findFirst({
      where: { formulaId, sequence },
    });

    if (existingSequence) {
      return res
        .status(400)
        .json(errorResponse("A step with this sequence already exists for the formula"));
    }

    const step = await prisma.iKUFormulaDetail.create({
      data: {
        formulaId,
        sequence,
        leftType,
        leftValue,
        operator,
        rightType,
        rightValue,
        resultKey,
      },
    });

    res.status(201).json(successResponse(step, "Formula step created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE FORMULA STEP
 * PUT /api/iku-formulas/:formulaId/steps/:id
 */
export const updateIkuFormulaStep = async (
  req: Request<FormulaDetailParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const formulaId = req.params.formulaId;
    const id = req.params.id;
    const { sequence, leftType, leftValue, operator, rightType, rightValue, resultKey } = req.body;

    const formula = await prisma.iKUFormula.findUnique({ where: { id: formulaId } });
    if (!formula) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const step = await prisma.iKUFormulaDetail.findUnique({ where: { id } });
    if (!step || step.formulaId !== formulaId) {
      return res.status(404).json(errorResponse("Formula step not found"));
    }

    if (sequence !== step.sequence) {
      const existingSequence = await prisma.iKUFormulaDetail.findFirst({
        where: { formulaId, sequence },
      });

      if (existingSequence) {
        return res
          .status(400)
          .json(errorResponse("A step with this sequence already exists for the formula"));
      }
    }

    const updated = await prisma.iKUFormulaDetail.update({
      where: { id },
      data: {
        sequence,
        leftType,
        leftValue,
        operator,
        rightType,
        rightValue,
        resultKey,
      },
    });

    res.json(successResponse(updated, "Formula step updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE FORMULA STEP
 * DELETE /api/iku-formulas/:formulaId/steps/:id
 */
export const deleteIkuFormulaStep = async (
  req: Request<FormulaDetailParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const formulaId = req.params.formulaId;
    const id = req.params.id;

    const formula = await prisma.iKUFormula.findUnique({ where: { id: formulaId } });
    if (!formula) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const step = await prisma.iKUFormulaDetail.findUnique({ where: { id } });
    if (!step || step.formulaId !== formulaId) {
      return res.status(404).json(errorResponse("Formula step not found"));
    }

    await prisma.iKUFormulaDetail.delete({ where: { id } });

    res.json(successResponse(null, "Formula step deleted successfully"));
  } catch (error) {
    next(error);
  }
};
