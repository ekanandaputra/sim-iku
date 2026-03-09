import { PrismaClient } from "../generated/prisma/client";

// Use a global variable to preserve the PrismaClient instance across hot reloads in development.
// In production, this is not needed.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["query", "info", "warn", "error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
