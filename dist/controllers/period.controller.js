"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePeriod = exports.updatePeriod = exports.createPeriod = exports.getPeriodById = exports.listPeriods = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const listPeriods = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.year) {
            where.year = Number(req.query.year);
        }
        if (req.query.type) {
            where.periodType = req.query.type;
        }
        if (req.query.level) {
            where.level = Number(req.query.level);
        }
        if (req.query.parentId) {
            where.parentId = req.query.parentId;
        }
        const records = await prisma_1.prisma.period.findMany({
            where,
            orderBy: [{ year: "desc" }, { level: "asc" }, { periodValue: "asc" }],
            include: { children: true },
        });
        res.json((0, response_1.successResponse)(records));
    }
    catch (error) {
        next(error);
    }
};
exports.listPeriods = listPeriods;
const getPeriodById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const period = await prisma_1.prisma.period.findUnique({
            where: { idPeriod: id },
            include: { parent: true, children: true },
        });
        if (!period) {
            return res.status(404).json((0, response_1.errorResponse)("Period not found"));
        }
        res.json((0, response_1.successResponse)(period));
    }
    catch (error) {
        next(error);
    }
};
exports.getPeriodById = getPeriodById;
const createPeriod = async (req, res, next) => {
    try {
        const { year, periodType, periodValue, periodName, level, parentId } = req.body;
        const existing = await prisma_1.prisma.period.findFirst({
            where: {
                year,
                periodType,
                periodValue,
            },
        });
        if (existing) {
            return res.status(400).json((0, response_1.errorResponse)("Period already exists for this year/type/value"));
        }
        const period = await prisma_1.prisma.period.create({
            data: {
                year,
                periodType,
                periodValue,
                periodName,
                level,
                parentId: parentId ?? null,
            },
        });
        res.status(201).json((0, response_1.successResponse)(period, "Period created successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.createPeriod = createPeriod;
const updatePeriod = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { year, periodType, periodValue, periodName, level, parentId } = req.body;
        const period = await prisma_1.prisma.period.findUnique({ where: { idPeriod: id } });
        if (!period) {
            return res.status(404).json((0, response_1.errorResponse)("Period not found"));
        }
        const updated = await prisma_1.prisma.period.update({
            where: { idPeriod: id },
            data: {
                year: year ?? period.year,
                periodType: periodType ?? period.periodType,
                periodValue: periodValue ?? period.periodValue,
                periodName: periodName ?? period.periodName,
                level: level ?? period.level,
                parentId: parentId ?? period.parentId,
            },
        });
        res.json((0, response_1.successResponse)(updated, "Period updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.updatePeriod = updatePeriod;
const deletePeriod = async (req, res, next) => {
    try {
        const id = req.params.id;
        const period = await prisma_1.prisma.period.findUnique({ where: { idPeriod: id } });
        if (!period) {
            return res.status(404).json((0, response_1.errorResponse)("Period not found"));
        }
        await prisma_1.prisma.period.delete({ where: { idPeriod: id } });
        res.json((0, response_1.successResponse)(null, "Period deleted successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.deletePeriod = deletePeriod;
