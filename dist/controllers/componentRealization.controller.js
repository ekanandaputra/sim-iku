"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComponentRealization = exports.updateComponentRealization = exports.createComponentRealization = exports.getComponentRealizationById = exports.listComponentRealizations = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const formula_1 = require("../utils/formula");
async function calculateIkuResultsForComponentRealization(idComponent, idPeriod) {
    console.log("Calculating IKU results for component realization", { idComponent, idPeriod });
    const component = await prisma_1.prisma.component.findUnique({ where: { id: idComponent } });
    if (!component) {
        return;
    }
    const activeFormulas = await prisma_1.prisma.iKUFormula.findMany({
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
        include: {
            details: {
                orderBy: { sequence: "asc" },
            },
        },
    });
    console.log("Active formulas found", { count: activeFormulas.length });
    if (!activeFormulas.length) {
        return;
    }
    for (const formula of activeFormulas) {
        const componentCodes = new Set();
        for (const detail of formula.details) {
            if (detail.leftType === "component") {
                componentCodes.add(detail.leftValue);
            }
            if (detail.rightType === "component") {
                componentCodes.add(detail.rightValue);
            }
        }
        const requiredCodes = Array.from(componentCodes);
        const componentValues = {};
        if (requiredCodes.length > 0) {
            const components = await prisma_1.prisma.component.findMany({
                where: {
                    code: { in: requiredCodes },
                },
            });
            const codeToId = new Map();
            components.forEach((c) => codeToId.set(c.code, c.id));
            const componentIds = components.map((c) => c.id);
            const realizations = await prisma_1.prisma.componentRealization.findMany({
                where: {
                    idPeriod,
                    idComponent: { in: componentIds },
                },
            });
            // Map back code -> value
            for (const realization of realizations) {
                const found = components.find((c) => c.id === realization.idComponent);
                if (found) {
                    componentValues[found.code] = Number(realization.value);
                }
            }
            const missingCodes = requiredCodes.filter((code) => !(code in componentValues));
            if (missingCodes.length > 0) {
                continue;
            }
        }
        console.log("Evaluating formula", { formulaId: formula.id, componentValues });
        // Evaluate formula and upsert result
        try {
            const evaluation = await (0, formula_1.evaluateFormula)(formula.id, componentValues);
            await prisma_1.prisma.ikuResult.upsert({
                where: {
                    idIku_idPeriod: {
                        idIku: formula.ikuId,
                        idPeriod,
                    },
                },
                create: {
                    idIku: formula.ikuId,
                    idPeriod,
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
        }
        catch (error) {
            console.error("IKU result calculation failed", { formulaId: formula.id, error });
        }
    }
}
const listComponentRealizations = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.idComponent)
            where.idComponent = req.query.idComponent;
        if (req.query.idPeriod)
            where.idPeriod = req.query.idPeriod;
        const records = await prisma_1.prisma.componentRealization.findMany({
            where,
            orderBy: [{ createdAt: "desc" }],
            include: { period: true, component: true },
        });
        res.json((0, response_1.successResponse)(records));
    }
    catch (error) {
        next(error);
    }
};
exports.listComponentRealizations = listComponentRealizations;
const getComponentRealizationById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const record = await prisma_1.prisma.componentRealization.findUnique({
            where: { idRealization: id },
            include: { period: true, component: true },
        });
        if (!record) {
            return res.status(404).json((0, response_1.errorResponse)("Component realization not found"));
        }
        res.json((0, response_1.successResponse)(record));
    }
    catch (error) {
        next(error);
    }
};
exports.getComponentRealizationById = getComponentRealizationById;
const createComponentRealization = async (req, res, next) => {
    try {
        const { idComponent, idPeriod, value } = req.body;
        const record = await prisma_1.prisma.componentRealization.upsert({
            where: {
                idComponent_idPeriod: {
                    idComponent,
                    idPeriod,
                },
            },
            create: {
                idComponent,
                idPeriod,
                value,
            },
            update: {
                value,
            },
            include: { period: true, component: true },
        });
        await calculateIkuResultsForComponentRealization(idComponent, idPeriod);
        res.status(201).json((0, response_1.successResponse)(record, "Component realization created or updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.createComponentRealization = createComponentRealization;
const updateComponentRealization = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { value } = req.body;
        const existing = await prisma_1.prisma.componentRealization.findUnique({ where: { idRealization: id } });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("Component realization not found"));
        }
        const updated = await prisma_1.prisma.componentRealization.update({
            where: { idRealization: id },
            data: { value },
        });
        await calculateIkuResultsForComponentRealization(updated.idComponent, updated.idPeriod);
        res.json((0, response_1.successResponse)(updated, "Component realization updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.updateComponentRealization = updateComponentRealization;
const deleteComponentRealization = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.componentRealization.findUnique({ where: { idRealization: id } });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("Component realization not found"));
        }
        await prisma_1.prisma.componentRealization.delete({ where: { idRealization: id } });
        res.json((0, response_1.successResponse)(null, "Component realization deleted successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteComponentRealization = deleteComponentRealization;
