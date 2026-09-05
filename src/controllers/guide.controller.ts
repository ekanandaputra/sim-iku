import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { VideoSourceType } from "../generated/prisma/enums";
import fs from "fs";
import path from "path";

type GuideParams = { id: string };
type GuideQuery = { title?: string; page?: string; limit?: string };

function detectVideoSource(videoUrl?: string | null): VideoSourceType | null {
  if (!videoUrl) return null;
  if (/youtube\.com|youtu\.be/i.test(videoUrl)) return VideoSourceType.YOUTUBE;
  if (/drive\.google\.com|docs\.google\.com/i.test(videoUrl)) return VideoSourceType.GOOGLE_DRIVE;
  return null;
}

/**
 * LIST GUIDES
 * GET /api/guides?title=&page=&limit=
 */
export const listGuides = async (
  req: Request<{}, {}, {}, GuideQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.title) {
      where.title = { contains: req.query.title };
    }

    const [guides, total] = await Promise.all([
      prisma.guide.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.guide.count({ where }),
    ]);

    res.json(successResponse({
      data: guides,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * GET GUIDE BY ID
 * GET /api/guides/:id
 */
export const getGuideById = async (
  req: Request<GuideParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const guide = await prisma.guide.findUnique({ where: { id: req.params.id } });
    if (!guide) {
      return res.status(404).json(errorResponse("Guide not found"));
    }
    res.json(successResponse(guide));
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE GUIDE
 * POST /api/guides (multipart/form-data: title, description?, videoUrl?, file?)
 */
export const createGuide = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, videoUrl } = req.body;
    const file = req.file;

    if (!title) {
      return res.status(400).json(errorResponse("title is required"));
    }

    if (!file && !videoUrl) {
      return res.status(400).json(errorResponse("Provide at least a file or a videoUrl"));
    }

    const guide = await prisma.guide.create({
      data: {
        title,
        description: description || null,
        filename: file?.filename ?? null,
        originalName: file?.originalname ?? null,
        fileUrl: file ? `/uploads/${file.filename}` : null,
        mimeType: file?.mimetype ?? null,
        size: file?.size ?? null,
        videoUrl: videoUrl || null,
        videoSource: detectVideoSource(videoUrl),
      },
    });

    res.status(201).json(successResponse(guide, "Guide created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE GUIDE
 * PUT /api/guides/:id (multipart/form-data: title?, description?, videoUrl?, file?)
 * Uploading a new file replaces the previous one (old file is removed from disk).
 */
export const updateGuide = async (
  req: Request<GuideParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, description, videoUrl } = req.body;
    const file = req.file;

    const existing = await prisma.guide.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Guide not found"));
    }

    if (file && existing.filename) {
      const oldPath = path.join(process.cwd(), "uploads", existing.filename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const guide = await prisma.guide.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(videoUrl !== undefined && {
          videoUrl: videoUrl || null,
          videoSource: detectVideoSource(videoUrl),
        }),
        ...(file && {
          filename: file.filename,
          originalName: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
        }),
      },
    });

    res.json(successResponse(guide, "Guide updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE GUIDE
 * DELETE /api/guides/:id
 */
export const deleteGuide = async (
  req: Request<GuideParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const existing = await prisma.guide.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json(errorResponse("Guide not found"));
    }

    if (existing.filename) {
      const filePath = path.join(process.cwd(), "uploads", existing.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.guide.delete({ where: { id } });

    res.json(successResponse(null, "Guide deleted successfully"));
  } catch (error) {
    next(error);
  }
};
