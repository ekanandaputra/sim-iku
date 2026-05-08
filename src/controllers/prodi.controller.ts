import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type ProdiParams = { id: string };
type ProdiQuery = { name?: string; code?: string };

/**
 * LIST PRODI
 * GET /api/prodi
 */
export const listProdi = async (
  req: Request<{}, {}, {}, ProdiQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const where: any = {};
    if (req.query.name) where.name = { contains: req.query.name };
    if (req.query.code) where.code = { contains: req.query.code };

    const prodi = await prisma.prodi.findMany({
      where,
      orderBy: { name: "asc" },
    });

    res.json(successResponse(prodi));
  } catch (error) {
    next(error);
  }
};

/**
 * GET PRODI BY ID
 * GET /api/prodi/:id
 */
export const getProdiById = async (
  req: Request<ProdiParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prodi = await prisma.prodi.findUnique({ where: { id: req.params.id } });
    if (!prodi) return res.status(404).json(errorResponse("Prodi not found"));

    res.json(successResponse(prodi));
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE PRODI
 * POST /api/prodi
 */
export const createProdi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, name } = req.body;

    const existing = await prisma.prodi.findUnique({ where: { code } });
    if (existing) return res.status(400).json(errorResponse("Prodi code already exists"));

    const prodi = await prisma.prodi.create({ data: { code, name } });

    res.status(201).json(successResponse(prodi, "Prodi created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE PRODI
 * PUT /api/prodi/:id
 */
export const updateProdi = async (
  req: Request<ProdiParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { code, name } = req.body;

    const existing = await prisma.prodi.findUnique({ where: { id } });
    if (!existing) return res.status(404).json(errorResponse("Prodi not found"));

    if (code && code !== existing.code) {
      const duplicate = await prisma.prodi.findUnique({ where: { code } });
      if (duplicate) return res.status(400).json(errorResponse("Prodi code already exists"));
    }

    const updated = await prisma.prodi.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
      },
    });

    res.json(successResponse(updated, "Prodi updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE PRODI
 * DELETE /api/prodi/:id
 */
export const deleteProdi = async (
  req: Request<ProdiParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.prodi.findUnique({ where: { id } });
    if (!existing) return res.status(404).json(errorResponse("Prodi not found"));

    await prisma.prodi.delete({ where: { id } });

    res.json(successResponse(null, "Prodi deleted successfully"));
  } catch (error) {
    next(error);
  }
};
