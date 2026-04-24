import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import fs from "fs";
import path from "path";

export const uploadDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json(errorResponse("No files uploaded"));
    }

    const createdDocuments = [];
    for (const file of files) {
      const doc = await prisma.document.create({
        data: {
          originalName: file.originalname,
          filename: file.filename,
          url: `/uploads/${file.filename}`, // Matches our static exposure path
          mimeType: file.mimetype,
          size: file.size,
        },
      });
      createdDocuments.push(doc);
    }

    res.status(201).json(successResponse(createdDocuments, "Documents uploaded successfully"));
  } catch (error) {
    next(error);
  }
};

export const listDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { components: { include: { component: true } } }
      }),
      prisma.document.count(),
    ]);

    res.json(successResponse({
      data: documents,
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

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return res.status(404).json(errorResponse("Document not found"));
    }

    const filePath = path.join(process.cwd(), "uploads", document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Clear tagging relations manually
    await prisma.componentDocument.deleteMany({
      where: { documentId: id }
    });

    await prisma.document.delete({ where: { id } });

    res.json(successResponse(null, "Document deleted successfully"));
  } catch (error) {
    next(error);
  }
};
