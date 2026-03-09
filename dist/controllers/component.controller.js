"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComponent = exports.updateComponent = exports.createComponent = exports.getComponentById = exports.listComponents = void 0;
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
/**
 * LIST COMPONENTS
 * GET /api/components
 */
const listComponents = async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const components = await prisma_1.prisma.component.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        });
        res.json((0, response_1.successResponse)(components));
    }
    catch (error) {
        next(error);
    }
};
exports.listComponents = listComponents;
/**
 * GET COMPONENT BY ID
 * GET /api/components/:id
 */
const getComponentById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const component = await prisma_1.prisma.component.findUnique({
            where: { id },
        });
        if (!component) {
            return res.status(404).json((0, response_1.errorResponse)("Component not found"));
        }
        res.json((0, response_1.successResponse)(component));
    }
    catch (error) {
        next(error);
    }
};
exports.getComponentById = getComponentById;
/**
 * CREATE COMPONENT
 * POST /api/components
 */
const createComponent = async (req, res, next) => {
    try {
        const { code, name, description, dataType, sourceType } = req.body;
        const existing = await prisma_1.prisma.component.findUnique({
            where: { code },
        });
        if (existing) {
            return res.status(400).json((0, response_1.errorResponse)("Component code already exists"));
        }
        const component = await prisma_1.prisma.component.create({
            data: {
                code,
                name,
                description,
                dataType,
                sourceType,
            },
        });
        res.status(201).json((0, response_1.successResponse)(component, "Component created successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.createComponent = createComponent;
/**
 * UPDATE COMPONENT
 * PUT /api/components/:id
 */
const updateComponent = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { code, name, description, dataType, sourceType } = req.body;
        const existing = await prisma_1.prisma.component.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("Component not found"));
        }
        if (code !== existing.code) {
            const other = await prisma_1.prisma.component.findUnique({
                where: { code },
            });
            if (other) {
                return res.status(400).json((0, response_1.errorResponse)("Component code already exists"));
            }
        }
        const updated = await prisma_1.prisma.component.update({
            where: { id },
            data: {
                code,
                name,
                description,
                dataType,
                sourceType,
            },
        });
        res.json((0, response_1.successResponse)(updated, "Component updated successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.updateComponent = updateComponent;
/**
 * DELETE COMPONENT
 * DELETE /api/components/:id
 */
const deleteComponent = async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.component.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json((0, response_1.errorResponse)("Component not found"));
        }
        await prisma_1.prisma.component.delete({
            where: { id },
        });
        res.json((0, response_1.successResponse)(null, "Component deleted successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.deleteComponent = deleteComponent;
