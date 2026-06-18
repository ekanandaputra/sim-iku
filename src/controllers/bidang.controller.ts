import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

type BidangParams = { id: string };

/**
 * LIST ALL BIDANG
 * GET /api/bidang
 */
export const listBidang = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bidangs = await prisma.bidang.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { users: true, ikus: true, components: true },
        },
      },
    });
    res.json(successResponse(bidangs));
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE BIDANG (with users, IKUs, components)
 * GET /api/bidang/:id
 */
export const getBidang = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const bidang = await prisma.bidang.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, userId: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        ikus: {
          include: {
            iku: {
              select: { id: true, code: true, name: true, unit: true, isDirectInput: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        components: {
          include: {
            component: {
              select: {
                id: true,
                code: true,
                name: true,
                dataType: true,
                sourceType: true,
                periodType: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!bidang) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    res.json(successResponse(bidang));
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE BIDANG
 * POST /api/bidang
 */
export const createBidang = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, name, description } = req.body as {
      code: string;
      name: string;
      description?: string;
    };

    const existing = await prisma.bidang.findUnique({ where: { code } });
    if (existing) {
      return res.status(409).json(errorResponse(`Bidang with code '${code}' already exists`));
    }

    const bidang = await prisma.bidang.create({
      data: { code, name, description },
    });

    res.status(201).json(successResponse(bidang, "Bidang created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE BIDANG
 * PUT /api/bidang/:id
 */
export const updateBidang = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { code, name, description } = req.body as {
      code?: string;
      name?: string;
      description?: string;
    };

    const existing = await prisma.bidang.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    // Check unique code if changed
    if (code && code !== existing.code) {
      const codeConflict = await prisma.bidang.findUnique({ where: { code } });
      if (codeConflict) {
        return res.status(409).json(errorResponse(`Bidang with code '${code}' already exists`));
      }
    }

    const updated = await prisma.bidang.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    res.json(successResponse(updated, "Bidang updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE BIDANG
 * DELETE /api/bidang/:id
 */
export const deleteBidang = async (
  req: Request<BidangParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.bidang.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Bidang not found"));
    }

    await prisma.bidang.delete({ where: { id } });

    res.json(successResponse(null, "Bidang deleted successfully"));
  } catch (error) {
    next(error);
  }
};
