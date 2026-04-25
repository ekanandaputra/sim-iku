import { Request, Response, NextFunction } from "express";
import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { evaluateFormula, getFormulaRequiredComponentCodes } from "../utils/formula";
import { IkuFormulaDetailCreateDto, IkuFormulaDetailUpdateItemDto } from "../dtos/ikuFormulaDetail.dto";

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

    const [formulas, total] = await Promise.all([
      prisma.iKUFormula.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.iKUFormula.count({ where }),
    ]);

    res.json(successResponse({
      data: formulas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }));
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
      include: {
        details: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!formula || !formula.isActive) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    // Expose the formula steps as `steps` in the response for easier consumption
    const { details: steps, ...formulaData } = formula;

    res.json(successResponse({ ...formulaData, steps }));
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
    const { ikuId, name, description, finalResultKey, isFinal, steps } = req.body;

    const iku = await prisma.iKU.findUnique({ where: { id: ikuId } });
    if (!iku) {
      return res.status(404).json(errorResponse("IKU not found"));
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json(errorResponse("At least one formula step is required"));
    }

    const parsedSteps = plainToInstance(IkuFormulaDetailCreateDto, steps);
    const validationResults = await Promise.all(
      parsedSteps.map((step) => validate(step, { whitelist: true, forbidNonWhitelisted: true }))
    );

    const errors = validationResults.filter((result) => result.length > 0);
    if (errors.length > 0) {
      const formatted: Record<string, any> = {};
      for (const [idx, validationErrors] of errors.entries()) {
        formatted[idx] = formatErrors(validationErrors);
      }
      return res.status(400).json(errorResponse("Validation failed", formatted));
    }

    const sequences = parsedSteps.map((step) => step.sequence);
    if (new Set(sequences).size !== sequences.length) {
      return res
        .status(400)
        .json(errorResponse("Duplicate sequence values are not allowed in the steps"));
    }

    const lastVersion = await prisma.iKUFormula.findFirst({
      where: { ikuId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    // Build transaction operations based on isFinal flag
    const transactionOps: any[] = [];

    if (isFinal === true) {
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
          name,
          description,
          finalResultKey,
          isActive: true,
          isFinal: isFinal ?? false,
          version: nextVersion,
          details: {
            create: parsedSteps.map((step) => ({
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

    const created = await prisma.$transaction(transactionOps);

    // the create call is the last item in the transaction array
    const formula = created[created.length - 1];

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
    const { name, description, finalResultKey, isFinal, steps } = req.body;

    const existing = await prisma.iKUFormula.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const ikuId = existing.ikuId;

    let createSteps: any[] = [];

    if (Array.isArray(steps) && steps.length > 0) {
      const parsedSteps = plainToInstance(IkuFormulaDetailCreateDto, steps);
      const validationResults = await Promise.all(
        parsedSteps.map((step) => validate(step, { whitelist: true, forbidNonWhitelisted: true }))
      );

      const errors = validationResults.filter((result) => result.length > 0);
      if (errors.length > 0) {
        const formatted: Record<string, any> = {};
        for (const [idx, validationErrors] of errors.entries()) {
          formatted[idx] = formatErrors(validationErrors);
        }
        return res.status(400).json(errorResponse("Validation failed", formatted));
      }

      const sequences = parsedSteps.map((step) => step.sequence);
      if (new Set(sequences).size !== sequences.length) {
        return res
          .status(400)
          .json(errorResponse("Duplicate sequence values are not allowed in the steps"));
      }

      createSteps = parsedSteps.map((step) => ({
        sequence: step.sequence,
        leftType: step.leftType,
        leftValue: step.leftValue,
        operator: step.operator,
        rightType: step.rightType,
        rightValue: step.rightValue,
        resultKey: step.resultKey,
      }));
    } else {
      const existingSteps = await prisma.iKUFormulaDetail.findMany({
        where: { formulaId: id },
        orderBy: { sequence: "asc" },
      });

      createSteps = existingSteps.map((step) => ({
        sequence: step.sequence,
        leftType: step.leftType,
        leftValue: step.leftValue,
        operator: step.operator,
        rightType: step.rightType,
        rightValue: step.rightValue,
        resultKey: step.resultKey,
      }));
    }

    if (createSteps.length === 0) {
      return res.status(400).json(errorResponse("At least one formula step is required"));
    }

    const lastVersion = await prisma.iKUFormula.findFirst({
      where: { ikuId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    // Build transaction operations based on isFinal flag
    const transactionOps: any[] = [];

    if (isFinal === true) {
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
          name,
          description,
          finalResultKey,
          isActive: true,
          isFinal: isFinal ?? false,
          version: nextVersion,
          details: { create: createSteps },
        },
      })
    );

    const created = await prisma.$transaction(transactionOps);

    // the create call is the last item in the transaction array
    const formula = created[created.length - 1];

    res.json(successResponse(formula, "Formula updated successfully"));
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

    // Use the utility function to recursively get all required component codes
    // This handles both direct components and components nested inside formula_refs
    const componentCodesSet = await getFormulaRequiredComponentCodes(formulaId);
    
    // Query components
    const components = await prisma.component.findMany({
      where: {
        code: {
          in: Array.from(componentCodesSet),
        },
      },
    });

    res.json(successResponse({ formulaId, components }));
  } catch (error) {
    next(error);
  }
};

/**
 * TEST FORMULA CALCULATION
 * POST /api/iku-formulas/:id/test
 */
function formatErrors(errors: ValidationError[]): Record<string, string> {
  const formatted: Record<string, string> = {};

  for (const error of errors) {
    if (error.children && error.children.length > 0) {
      Object.assign(formatted, formatErrors(error.children));
      continue;
    }

    if (error.constraints) {
      const [first] = Object.values(error.constraints);
      formatted[error.property] = first;
    }
  }

  return formatted;
}

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
 * CREATE FORMULA STEPS (BATCH)
 * POST /api/iku-formulas/:formulaId/steps/batch
 */
export const createIkuFormulaSteps = async (
  req: Request<FormulaDetailParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const formulaId = req.params.formulaId;

    if (!Array.isArray(req.body)) {
      return res.status(400).json(errorResponse("Request body must be an array of steps"));
    }

    const steps = plainToInstance(IkuFormulaDetailCreateDto, req.body);
    const validationResults = await Promise.all(
      steps.map((step) => validate(step, { whitelist: true, forbidNonWhitelisted: true }))
    );

    const errors = validationResults
      .map((result, idx) => ({ idx, errors: result }))
      .filter((x) => x.errors.length > 0);

    if (errors.length > 0) {
      const formatted: Record<string, any> = {};
      for (const { idx, errors: validationErrors } of errors) {
        formatted[idx] = formatErrors(validationErrors);
      }
      return res.status(400).json(errorResponse("Validation failed", formatted));
    }

    const formula = await prisma.iKUFormula.findUnique({ where: { id: formulaId } });
    if (!formula) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const sequences = steps.map((step) => step.sequence);
    const uniqueSequences = new Set(sequences);
    if (uniqueSequences.size !== sequences.length) {
      return res
        .status(400)
        .json(errorResponse("Duplicate sequence values are not allowed in the batch"));
    }

    const existingSequence = await prisma.iKUFormulaDetail.findFirst({
      where: { formulaId, sequence: { in: sequences } },
    });

    if (existingSequence) {
      return res
        .status(400)
        .json(errorResponse("A step with one of the provided sequences already exists for the formula"));
    }

    const created = await prisma.$transaction(
      steps.map((step) =>
        prisma.iKUFormulaDetail.create({
          data: {
            formulaId,
            sequence: step.sequence,
            leftType: step.leftType,
            leftValue: step.leftValue,
            operator: step.operator,
            rightType: step.rightType,
            rightValue: step.rightValue,
            resultKey: step.resultKey,
          },
        })
      )
    );

    res.status(201).json(successResponse(created, "Formula steps created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE FORMULA STEPS (BATCH)
 * PUT /api/iku-formulas/:formulaId/steps/batch
 */
export const updateIkuFormulaSteps = async (
  req: Request<FormulaDetailParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const formulaId = req.params.formulaId;

    if (!Array.isArray(req.body)) {
      return res.status(400).json(errorResponse("Request body must be an array of steps"));
    }

    const steps = plainToInstance(IkuFormulaDetailUpdateItemDto, req.body);
    const validationResults = await Promise.all(
      steps.map((step) => validate(step, { whitelist: true, forbidNonWhitelisted: true }))
    );

    const errors = validationResults
      .map((result, idx) => ({ idx, errors: result }))
      .filter((x) => x.errors.length > 0);

    if (errors.length > 0) {
      const formatted: Record<string, any> = {};
      for (const { idx, errors: validationErrors } of errors) {
        formatted[idx] = formatErrors(validationErrors);
      }
      return res.status(400).json(errorResponse("Validation failed", formatted));
    }

    const formula = await prisma.iKUFormula.findUnique({ where: { id: formulaId } });
    if (!formula) {
      return res.status(404).json(errorResponse("Formula not found"));
    }

    const ids = steps.map((step) => step.id);
    const sequences = steps.map((step) => step.sequence);

    if (new Set(ids).size !== ids.length) {
      return res
        .status(400)
        .json(errorResponse("Duplicate step ids are not allowed in the batch"));
    }

    if (new Set(sequences).size !== sequences.length) {
      return res
        .status(400)
        .json(errorResponse("Duplicate sequence values are not allowed in the batch"));
    }

    const existingSteps = await prisma.iKUFormulaDetail.findMany({
      where: { formulaId, id: { in: ids } },
    });

    if (existingSteps.length !== ids.length) {
      return res.status(404).json(errorResponse("One or more formula steps were not found"));
    }

    const conflictingSequence = await prisma.iKUFormulaDetail.findFirst({
      where: {
        formulaId,
        sequence: { in: sequences },
        id: { notIn: ids },
      },
    });

    if (conflictingSequence) {
      return res
        .status(400)
        .json(errorResponse("A step with one of the provided sequences already exists for the formula"));
    }

    const updated = await prisma.$transaction(
      steps.map((step) =>
        prisma.iKUFormulaDetail.update({
          where: { id: step.id },
          data: {
            sequence: step.sequence,
            leftType: step.leftType,
            leftValue: step.leftValue,
            operator: step.operator,
            rightType: step.rightType,
            rightValue: step.rightValue,
            resultKey: step.resultKey,
          },
        })
      )
    );

    res.json(successResponse(updated, "Formula steps updated successfully"));
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
