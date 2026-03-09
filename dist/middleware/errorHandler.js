"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const library_1 = require("@prisma/client/runtime/library");
const response_1 = require("../utils/response");
function errorHandler(err, req, res, next) {
    // Handle Prisma unique constraint error for code uniqueness
    if (err instanceof library_1.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            const meta = err.meta;
            const conflictField = meta?.target?.[0] ?? "field";
            if (conflictField === "code") {
                return res.status(400).json((0, response_1.errorResponse)("IKU code already exists"));
            }
            return res.status(400).json((0, response_1.errorResponse)(`${conflictField} already exists`));
        }
    }
    // Handle generic validation-like errors (if thrown manually)
    if (err instanceof Error) {
        return res.status(400).json((0, response_1.errorResponse)(err.message));
    }
    // Fallback
    res.status(500).json((0, response_1.errorResponse)("Internal server error"));
}
