"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIkuResult = exports.updateIkuResult = exports.createIkuResult = exports.getIkuResultById = exports.listIkuResults = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const listIkuResults = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.idIku)
            where.idIku = req.query.idIku;
        if (req.query.idPeriod)
            where.idPeriod = req.query.idPeriod;
        const results = await prisma_1.prisma.ikuResult.findMany({
            where,
            include: { iku: true, period: true },
            orderBy: [{ createdAt: "desc" }],
        });
        res.json((0, response_1.successResponse)(results));
    }
    catch (error) {
        next(error);
    }
};
exports.listIkuResults = listIkuResults;
const getIkuResultById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await prisma_1.prisma.ikuResult.findUnique({
            where: { idResult: id },
            include: { iku: true, period: true },
        });
        if (!result) {
            return res.status(404).json((0, response_1.errorResponse)("IKU result not found"));
        }
        res.json((0, response_1.successResponse)(result));
    }
    catch (error) {
        next(error);
    }
};
exports.getIkuResultById = getIkuResultById;
const createIkuResult = async (req, res, next) => {
    try {
        const { idIku, idPeriod, calculatedValue, formulaVersion, calculatedAt } = req.body;
        const iku = await prisma_1.prisma.iKU.findUnique({ where: { id: idIku } });
        if (!iku) {
            return res.status(404).json((0, response_1.errorResponse)("IKU not found"));
        }
        const period = await prisma_1.prisma.period.findUnique({ where: { idPeriod: idPeriod } });
        if (!period) {
            return res.status(404).json((0, response_1.errorResponse)("Period not found"));
        }
        const record = await prisma_1.prisma.ikuResult.upsert({
            where: {
                idIku_idPeriod: {
                    idIku: idIku,
                    idPeriod: idPeriod,
                },
            },
            create: {
                idIku: idIku,
                idPeriod: idPeriod,
                calculatedValue: calculatedValue,
                formulaVersion: formulaVersion ?? null,
                calculatedAt: calculatedAt ? new Date(calculatedAt) : new Date(),
            },
            update: {
                calculatedValue: calculatedValue,
                formulaVersion: formulaVersion ?? undefined,
                calculatedAt: calculatedAt ? new Date(calculatedAt) : undefined,
            },
            include: { iku: true, period: true },
        });
        res.status(201).json((0, response_1.successResponse)(record, "IKU result created or updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.createIkuResult = createIkuResult;
const updateIkuResult = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { calculatedValue, formulaVersion, calculatedAt } = req.body;
        const existing = await prisma_1.prisma.ikuResult.findUnique({ where: { idResult: id } });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("IKU result not found"));
        }
        const updated = await prisma_1.prisma.ikuResult.update({
            where: { idResult: id },
            data: {
                calculatedValue: calculatedValue ?? existing.calculatedValue,
                formulaVersion: formulaVersion ?? existing.formulaVersion,
                calculatedAt: calculatedAt ? new Date(calculatedAt) : existing.calculatedAt,
            },
        });
        res.json((0, response_1.successResponse)(updated, "IKU result updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.updateIkuResult = updateIkuResult;
const deleteIkuResult = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.ikuResult.findUnique({ where: { idResult: id } });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("IKU result not found"));
        }
        await prisma_1.prisma.ikuResult.delete({ where: { idResult: id } });
        res.json((0, response_1.successResponse)(null, "IKU result deleted successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteIkuResult = deleteIkuResult;
