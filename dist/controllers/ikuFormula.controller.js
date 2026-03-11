"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIkuFormulaStep = exports.updateIkuFormulaStep = exports.updateIkuFormulaSteps = exports.createIkuFormulaSteps = exports.createIkuFormulaStep = exports.testIkuFormula = exports.getFormulaComponents = exports.listIkuFormulaSteps = exports.deleteIkuFormula = exports.updateIkuFormula = exports.createIkuFormula = exports.getIkuFormulaById = exports.listIkuFormulas = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const formula_1 = require("../utils/formula");
/**
 * LIST IKU FORMULAS
 * GET /api/iku-formulas
 */
const listIkuFormulas = async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const includeInactive = req.query.includeInactive === "true";
        const where = { ikuId: req.query.ikuId };
        if (!includeInactive) {
            where.isActive = true;
        }
        if (!req.query.ikuId) {
            delete where.ikuId;
        }
        const formulas = await prisma_1.prisma.iKUFormula.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
        res.json((0, response_1.successResponse)(formulas));
    }
    catch (error) {
        next(error);
    }
};
exports.listIkuFormulas = listIkuFormulas;
/**
 * GET IKU FORMULA BY ID
 * GET /api/iku-formulas/:id
 */
const getIkuFormulaById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const formula = await prisma_1.prisma.iKUFormula.findUnique({
            where: { id },
        });
        if (!formula || !formula.isActive) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        res.json((0, response_1.successResponse)(formula));
    }
    catch (error) {
        next(error);
    }
};
exports.getIkuFormulaById = getIkuFormulaById;
/**
 * CREATE IKU FORMULA
 * POST /api/iku-formulas
 */
const createIkuFormula = async (req, res, next) => {
    try {
        const { ikuId, name, description, finalResultKey, isActive } = req.body;
        const iku = await prisma_1.prisma.iKU.findUnique({ where: { id: ikuId } });
        if (!iku) {
            return res.status(404).json((0, response_1.errorResponse)("IKU not found"));
        }
        const formula = await prisma_1.prisma.iKUFormula.create({
            data: {
                ikuId,
                name,
                description,
                finalResultKey,
                isActive,
            },
        });
        res.status(201).json((0, response_1.successResponse)(formula, "Formula created successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.createIkuFormula = createIkuFormula;
/**
 * UPDATE IKU FORMULA
 * PUT /api/iku-formulas/:id
 */
const updateIkuFormula = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { name, description, finalResultKey, isActive } = req.body;
        const existing = await prisma_1.prisma.iKUFormula.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        const updated = await prisma_1.prisma.iKUFormula.update({
            where: { id },
            data: {
                name,
                description,
                finalResultKey,
                isActive,
            },
        });
        res.json((0, response_1.successResponse)(updated, "Formula updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.updateIkuFormula = updateIkuFormula;
/**
 * DELETE IKU FORMULA
 * DELETE /api/iku-formulas/:id
 */
const deleteIkuFormula = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.iKUFormula.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        await prisma_1.prisma.iKUFormula.delete({ where: { id } });
        res.json((0, response_1.successResponse)(null, "Formula deleted successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteIkuFormula = deleteIkuFormula;
/**
 * LIST FORMULA STEPS
 * GET /api/iku-formulas/:formulaId/steps
 */
const listIkuFormulaSteps = async (req, res, next) => {
    try {
        const formulaId = req.params.formulaId;
        const formula = await prisma_1.prisma.iKUFormula.findUnique({ where: { id: formulaId } });
        if (!formula) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        const steps = await prisma_1.prisma.iKUFormulaDetail.findMany({
            where: { formulaId },
            orderBy: { sequence: "asc" },
        });
        res.json((0, response_1.successResponse)(steps));
    }
    catch (error) {
        next(error);
    }
};
exports.listIkuFormulaSteps = listIkuFormulaSteps;
/**
 * GET COMPONENT CODES USED BY FORMULA
 * GET /api/iku-formulas/:id/components
 */
const getFormulaComponents = async (req, res, next) => {
    try {
        const formulaId = req.params.id;
        const formula = await prisma_1.prisma.iKUFormula.findUnique({ where: { id: formulaId } });
        if (!formula) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        const steps = await prisma_1.prisma.iKUFormulaDetail.findMany({
            where: { formulaId },
            orderBy: { sequence: "asc" },
        });
        const codes = new Set();
        for (const step of steps) {
            if (step.leftType === "component") {
                codes.add(step.leftValue);
            }
            if (step.rightType === "component") {
                codes.add(step.rightValue);
            }
        }
        const components = Array.from(codes).map((code) => ({ code }));
        res.json((0, response_1.successResponse)({ formulaId, components }));
    }
    catch (error) {
        next(error);
    }
};
exports.getFormulaComponents = getFormulaComponents;
/**
 * TEST FORMULA CALCULATION
 * POST /api/iku-formulas/:id/test
 */
const testIkuFormula = async (req, res, next) => {
    try {
        const formulaId = req.params.id;
        const { componentValues } = req.body;
        if (!componentValues || typeof componentValues !== "object" || Array.isArray(componentValues)) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("componentValues must be an object with numeric values"));
        }
        for (const [key, value] of Object.entries(componentValues)) {
            if (typeof value !== "number" || Number.isNaN(value)) {
                return res
                    .status(400)
                    .json((0, response_1.errorResponse)(`componentValues['${key}'] must be a valid number`));
            }
        }
        const formula = await prisma_1.prisma.iKUFormula.findUnique({ where: { id: formulaId } });
        if (!formula) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        const evaluation = await (0, formula_1.evaluateFormula)(formulaId, componentValues);
        res.json((0, response_1.successResponse)(evaluation));
    }
    catch (error) {
        next(error);
    }
};
exports.testIkuFormula = testIkuFormula;
/**
 * CREATE FORMULA STEP
 * POST /api/iku-formulas/:formulaId/steps
 */
const createIkuFormulaStep = async (req, res, next) => {
    try {
        const formulaId = req.params.formulaId;
        const { sequence, leftType, leftValue, operator, rightType, rightValue, resultKey } = req.body;
        const formula = await prisma_1.prisma.iKUFormula.findUnique({ where: { id: formulaId } });
        if (!formula) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        const existingSequence = await prisma_1.prisma.iKUFormulaDetail.findFirst({
            where: { formulaId, sequence },
        });
        if (existingSequence) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("A step with this sequence already exists for the formula"));
        }
        const step = await prisma_1.prisma.iKUFormulaDetail.create({
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
        res.status(201).json((0, response_1.successResponse)(step, "Formula step created successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.createIkuFormulaStep = createIkuFormulaStep;
/**
 * CREATE FORMULA STEPS (BATCH)
 * POST /api/iku-formulas/:formulaId/steps/batch
 */
const createIkuFormulaSteps = async (req, res, next) => {
    try {
        const formulaId = req.params.formulaId;
        const { steps } = req.body;
        const formula = await prisma_1.prisma.iKUFormula.findUnique({ where: { id: formulaId } });
        if (!formula) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        const sequences = steps.map((step) => step.sequence);
        const uniqueSequences = new Set(sequences);
        if (uniqueSequences.size !== sequences.length) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("Duplicate sequence values are not allowed in the batch"));
        }
        const existingSequence = await prisma_1.prisma.iKUFormulaDetail.findFirst({
            where: { formulaId, sequence: { in: sequences } },
        });
        if (existingSequence) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("A step with one of the provided sequences already exists for the formula"));
        }
        const created = await prisma_1.prisma.$transaction(steps.map((step) => prisma_1.prisma.iKUFormulaDetail.create({
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
        })));
        res.status(201).json((0, response_1.successResponse)(created, "Formula steps created successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.createIkuFormulaSteps = createIkuFormulaSteps;
/**
 * UPDATE FORMULA STEPS (BATCH)
 * PUT /api/iku-formulas/:formulaId/steps/batch
 */
const updateIkuFormulaSteps = async (req, res, next) => {
    try {
        const formulaId = req.params.formulaId;
        const { steps } = req.body;
        const formula = await prisma_1.prisma.iKUFormula.findUnique({ where: { id: formulaId } });
        if (!formula) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        const ids = steps.map((step) => step.id);
        const sequences = steps.map((step) => step.sequence);
        if (new Set(ids).size !== ids.length) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("Duplicate step ids are not allowed in the batch"));
        }
        if (new Set(sequences).size !== sequences.length) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("Duplicate sequence values are not allowed in the batch"));
        }
        const existingSteps = await prisma_1.prisma.iKUFormulaDetail.findMany({
            where: { formulaId, id: { in: ids } },
        });
        if (existingSteps.length !== ids.length) {
            return res.status(404).json((0, response_1.errorResponse)("One or more formula steps were not found"));
        }
        const conflictingSequence = await prisma_1.prisma.iKUFormulaDetail.findFirst({
            where: {
                formulaId,
                sequence: { in: sequences },
                id: { notIn: ids },
            },
        });
        if (conflictingSequence) {
            return res
                .status(400)
                .json((0, response_1.errorResponse)("A step with one of the provided sequences already exists for the formula"));
        }
        const updated = await prisma_1.prisma.$transaction(steps.map((step) => prisma_1.prisma.iKUFormulaDetail.update({
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
        })));
        res.json((0, response_1.successResponse)(updated, "Formula steps updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.updateIkuFormulaSteps = updateIkuFormulaSteps;
/**
 * UPDATE FORMULA STEP
 * PUT /api/iku-formulas/:formulaId/steps/:id
 */
const updateIkuFormulaStep = async (req, res, next) => {
    try {
        const formulaId = req.params.formulaId;
        const id = req.params.id;
        const { sequence, leftType, leftValue, operator, rightType, rightValue, resultKey } = req.body;
        const formula = await prisma_1.prisma.iKUFormula.findUnique({ where: { id: formulaId } });
        if (!formula) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        const step = await prisma_1.prisma.iKUFormulaDetail.findUnique({ where: { id } });
        if (!step || step.formulaId !== formulaId) {
            return res.status(404).json((0, response_1.errorResponse)("Formula step not found"));
        }
        if (sequence !== step.sequence) {
            const existingSequence = await prisma_1.prisma.iKUFormulaDetail.findFirst({
                where: { formulaId, sequence },
            });
            if (existingSequence) {
                return res
                    .status(400)
                    .json((0, response_1.errorResponse)("A step with this sequence already exists for the formula"));
            }
        }
        const updated = await prisma_1.prisma.iKUFormulaDetail.update({
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
        res.json((0, response_1.successResponse)(updated, "Formula step updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.updateIkuFormulaStep = updateIkuFormulaStep;
/**
 * DELETE FORMULA STEP
 * DELETE /api/iku-formulas/:formulaId/steps/:id
 */
const deleteIkuFormulaStep = async (req, res, next) => {
    try {
        const formulaId = req.params.formulaId;
        const id = req.params.id;
        const formula = await prisma_1.prisma.iKUFormula.findUnique({ where: { id: formulaId } });
        if (!formula) {
            return res.status(404).json((0, response_1.errorResponse)("Formula not found"));
        }
        const step = await prisma_1.prisma.iKUFormulaDetail.findUnique({ where: { id } });
        if (!step || step.formulaId !== formulaId) {
            return res.status(404).json((0, response_1.errorResponse)("Formula step not found"));
        }
        await prisma_1.prisma.iKUFormulaDetail.delete({ where: { id } });
        res.json((0, response_1.successResponse)(null, "Formula step deleted successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteIkuFormulaStep = deleteIkuFormulaStep;
