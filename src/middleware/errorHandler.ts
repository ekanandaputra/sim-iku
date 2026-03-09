import { NextFunction, Request, Response } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { errorResponse } from "../utils/response";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  // Handle Prisma unique constraint error for code uniqueness
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const meta = err.meta as { target?: string[] } | undefined;
      const conflictField = meta?.target?.[0] ?? "field";

      if (conflictField === "code") {
        return res.status(400).json(errorResponse("IKU code already exists"));
      }

      return res.status(400).json(errorResponse(`${conflictField} already exists`));
    }
  }

  // Handle generic validation-like errors (if thrown manually)
  if (err instanceof Error) {
    return res.status(400).json(errorResponse(err.message));
  }

  // Fallback
  res.status(500).json(errorResponse("Internal server error"));
}
