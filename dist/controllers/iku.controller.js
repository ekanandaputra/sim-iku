"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIku = exports.unmapComponentFromIku = exports.mapComponentToIku = exports.listIkuFormulasByIku = exports.listIkuComponents = exports.updateIku = exports.createIku = exports.getIkuById = exports.listIkus = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
/**
 * LIST IKU
 * GET /api/ikus
 */
const listIkus = async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const ikus = await prisma_1.prisma.iKU.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
        res.json((0, response_1.successResponse)(ikus));
    }
    catch (error) {
        next(error);
    }
};
exports.listIkus = listIkus;
/**
 * GET IKU BY ID
 * GET /api/ikus/:id
 */
const getIkuById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const iku = await prisma_1.prisma.iKU.findUnique({
            where: { id },
        });
        if (!iku) {
            return res.status(404).json((0, response_1.errorResponse)("IKU not found"));
        }
        res.json((0, response_1.successResponse)(iku));
    }
    catch (error) {
        next(error);
    }
};
exports.getIkuById = getIkuById;
/**
 * CREATE IKU
 * POST /api/ikus
 */
const createIku = async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        const existing = await prisma_1.prisma.iKU.findUnique({
            where: { code },
        });
        if (existing) {
            return res.status(400).json((0, response_1.errorResponse)("IKU code already exists"));
        }
        const iku = await prisma_1.prisma.iKU.create({
            data: {
                code,
                name,
                description,
            },
        });
        res.status(201).json((0, response_1.successResponse)(iku, "IKU created successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.createIku = createIku;
/**
 * UPDATE IKU
 * PUT /api/ikus/:id
 */
const updateIku = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { code, name, description } = req.body;
        const existing = await prisma_1.prisma.iKU.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("IKU not found"));
        }
        if (code !== existing.code) {
            const other = await prisma_1.prisma.iKU.findUnique({
                where: { code },
            });
            if (other) {
                return res.status(400).json((0, response_1.errorResponse)("IKU code already exists"));
            }
        }
        const updated = await prisma_1.prisma.iKU.update({
            where: { id },
            data: {
                code,
                name,
                description,
            },
        });
        res.json((0, response_1.successResponse)(updated, "IKU updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.updateIku = updateIku;
/**
 * LIST IKU COMPONENTS
 * GET /api/ikus/:id/components
 */
const listIkuComponents = async (req, res, next) => {
    try {
        const id = req.params.id;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const iku = await prisma_1.prisma.iKU.findUnique({
            where: { id },
            include: {
                components: {
                    include: { component: true },
                    skip,
                    take: limit,
                    orderBy: { id: "asc" },
                },
            },
        });
        if (!iku) {
            return res.status(404).json((0, response_1.errorResponse)("IKU not found"));
        }
        const components = iku.components.map((c) => c.component);
        res.json((0, response_1.successResponse)(components));
    }
    catch (error) {
        next(error);
    }
};
exports.listIkuComponents = listIkuComponents;
/**
 * LIST IKU FORMULAS
 * GET /api/ikus/:id/formulas
 */
const listIkuFormulasByIku = async (req, res, next) => {
    try {
        const id = req.params.id;
        const iku = await prisma_1.prisma.iKU.findUnique({ where: { id } });
        if (!iku) {
            return res.status(404).json((0, response_1.errorResponse)("IKU not found"));
        }
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const includeInactive = req.query.includeInactive === "true";
        const formulas = await prisma_1.prisma.iKUFormula.findMany({
            where: {
                ikuId: id,
                ...(includeInactive ? {} : { isActive: true }),
            },
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
exports.listIkuFormulasByIku = listIkuFormulasByIku;
/**
 * MAP COMPONENT TO IKU
 * POST /api/ikus/:id/components
 */
const mapComponentToIku = async (req, res, next) => {
    try {
        const ikuId = req.params.id;
        const { componentId } = req.body;
        const iku = await prisma_1.prisma.iKU.findUnique({ where: { id: ikuId } });
        if (!iku) {
            return res.status(404).json((0, response_1.errorResponse)("IKU not found"));
        }
        const component = await prisma_1.prisma.component.findUnique({ where: { id: componentId } });
        if (!component) {
            return res.status(404).json((0, response_1.errorResponse)("Component not found"));
        }
        const existing = await prisma_1.prisma.iKUComponent.findUnique({
            where: { ikuId_componentId: { ikuId, componentId } },
        });
        if (existing) {
            return res.status(400).json((0, response_1.errorResponse)("Component is already mapped to this IKU"));
        }
        const mapping = await prisma_1.prisma.iKUComponent.create({
            data: { ikuId, componentId },
        });
        res.status(201).json((0, response_1.successResponse)(mapping, "Component mapped to IKU successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.mapComponentToIku = mapComponentToIku;
/**
 * UNMAP COMPONENT FROM IKU
 * DELETE /api/ikus/:id/components/:componentId
 */
const unmapComponentFromIku = async (req, res, next) => {
    try {
        const ikuId = req.params.id;
        const componentId = req.params.componentId;
        const existing = await prisma_1.prisma.iKUComponent.findUnique({
            where: { ikuId_componentId: { ikuId, componentId } },
        });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("Mapping not found"));
        }
        await prisma_1.prisma.iKUComponent.delete({
            where: { ikuId_componentId: { ikuId, componentId } },
        });
        res.json((0, response_1.successResponse)(null, "Component unmapped from IKU successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.unmapComponentFromIku = unmapComponentFromIku;
/**
 * DELETE IKU
 * DELETE /api/ikus/:id
 */
const deleteIku = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.iKU.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("IKU not found"));
        }
        await prisma_1.prisma.iKU.delete({
            where: { id },
        });
        res.json((0, response_1.successResponse)(null, "IKU deleted successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteIku = deleteIku;
