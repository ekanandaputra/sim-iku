import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { VerificationEntityType } from "../generated/prisma/enums";
import { CreateVerificationDto } from "../dtos/verification.dto";

const REQUIRED_PERMISSION = "verifikator_sim_iku";

/**
 * Helper: check if user has verifikator or admin permission.
 */
function hasVerificationPermission(req: Request): boolean {
  const permissions: string[] = (req as any).user?.permissions || [];
  return (
    permissions.includes(REQUIRED_PERMISSION) ||
    permissions.includes("admin_sim_iku")
  );
}

/**
 * POST /api/verifications
 * Tambah verifikasi pada satu record realisasi.
 * Requires permission: verifikator_sim_iku
 *
 * FE hanya perlu mengirim entityId — BE otomatis mendeteksi apakah itu
 * ComponentRealization atau IkuResult.
 */
export const createVerification = async (
  req: Request<{}, {}, CreateVerificationDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!hasVerificationPermission(req)) {
      return res
        .status(403)
        .json(errorResponse("Anda tidak memiliki akses untuk melakukan verifikasi"));
    }

    const { entityId, note } = req.body;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.name || (req as any).user?.email || null;

    if (!userId) {
      return res.status(401).json(errorResponse("User ID tidak ditemukan"));
    }

    // Auto-detect entityType by checking both tables
    let entityType: VerificationEntityType | null = null;

    const componentRealization = await prisma.componentRealization.findUnique({
      where: { idRealization: entityId },
      select: { idRealization: true },
    });

    if (componentRealization) {
      entityType = "COMPONENT_REALIZATION" as VerificationEntityType;
    } else {
      const ikuResult = await prisma.ikuResult.findUnique({
        where: { idResult: entityId },
        select: { idResult: true },
      });

      if (ikuResult) {
        entityType = "IKU_RESULT" as VerificationEntityType;
      }
    }

    if (!entityType) {
      return res
        .status(404)
        .json(errorResponse("Record realisasi tidak ditemukan"));
    }

    // Check for duplicate verification by same user
    const existing = await prisma.realizationVerification.findUnique({
      where: {
        entityType_entityId_userId: {
          entityType,
          entityId,
          userId,
        },
      },
    });

    if (existing) {
      return res
        .status(409)
        .json(errorResponse("Anda sudah memverifikasi data ini sebelumnya"));
    }

    const verification = await prisma.realizationVerification.create({
      data: {
        entityType,
        entityId,
        userId,
        userName,
        note: note ?? null,
      },
    });

    return res
      .status(201)
      .json(successResponse(verification, "Verifikasi berhasil ditambahkan"));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/verifications/:entityType/:entityId
 * Ambil histori verifikasi untuk satu record realisasi.
 */
export const getVerifications = async (
  req: Request<{ entityType: string; entityId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { entityType, entityId } = req.params;

    // Validate entityType
    const validTypes = ["COMPONENT_REALIZATION", "IKU_RESULT"];
    if (!validTypes.includes(entityType.toUpperCase())) {
      return res
        .status(400)
        .json(
          errorResponse("entityType harus COMPONENT_REALIZATION atau IKU_RESULT")
        );
    }

    const verifications = await prisma.realizationVerification.findMany({
      where: {
        entityType: entityType.toUpperCase() as VerificationEntityType,
        entityId,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(
      successResponse({
        entityType: entityType.toUpperCase(),
        entityId,
        isVerified: verifications.length > 0,
        verificationCount: verifications.length,
        verifications,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/verifications/:id
 * Hapus/batalkan satu verifikasi.
 * Hanya user yang sama atau admin yang bisa menghapus.
 */
export const deleteVerification = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!hasVerificationPermission(req)) {
      return res
        .status(403)
        .json(errorResponse("Anda tidak memiliki akses untuk menghapus verifikasi"));
    }

    const { id } = req.params;
    const userId = (req as any).user?.id;
    const permissions: string[] = (req as any).user?.permissions || [];
    const isAdmin = permissions.includes("admin_sim_iku");

    const verification = await prisma.realizationVerification.findUnique({
      where: { id },
    });

    if (!verification) {
      return res.status(404).json(errorResponse("Verifikasi tidak ditemukan"));
    }

    // Only allow deletion by the verifier themselves or admin
    if (verification.userId !== userId && !isAdmin) {
      return res
        .status(403)
        .json(
          errorResponse(
            "Anda hanya bisa menghapus verifikasi milik Anda sendiri"
          )
        );
    }

    await prisma.realizationVerification.delete({ where: { id } });

    return res.json(successResponse(null, "Verifikasi berhasil dihapus"));
  } catch (error) {
    next(error);
  }
};
