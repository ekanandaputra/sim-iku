"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("../generated/prisma/client");
// Use a global variable to preserve the PrismaClient instance across hot reloads in development.
// In production, this is not needed.
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient({ log: ["query", "info", "warn", "error"] });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
