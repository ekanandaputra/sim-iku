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

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * GET /api/verifications/dashboard?year=2026
 * Dashboard status verifikasi seluruh IKU (direct input) dan Component
 * per tahun. Menampilkan status verifikasi per record realisasi.
 */
export const getVerificationDashboard = async (
  req: Request<{}, {}, {}, { year?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const yearStr = req.query.year;
    if (!yearStr) {
      return res.status(400).json(errorResponse("Parameter year wajib diisi"));
    }
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return res.status(400).json(errorResponse("Format year tidak valid"));
    }

    // 1. Fetch all IKUs (direct input) and their results for the year
    const ikus = await prisma.iKU.findMany({
      where: { isDirectInput: true },
      orderBy: { code: "asc" },
    });

    const ikuResults = await prisma.ikuResult.findMany({
      where: { year },
    });

    // 2. Fetch all root Components and their realizations for the year
    const components = await prisma.component.findMany({
      where: { parentId: null },
      orderBy: { code: "asc" },
    });

    const allComponentIds = components.map((c) => c.id);
    const componentRealizations = await prisma.componentRealization.findMany({
      where: { idComponent: { in: allComponentIds }, year },
    });

    // 3. Collect all entity IDs and fetch verifications in one query
    const componentRealizationIds = componentRealizations.map((r) => r.idRealization);
    const ikuResultIds = ikuResults.map((r) => r.idResult);

    const allVerifications = await prisma.realizationVerification.findMany({
      where: {
        OR: [
          ...(componentRealizationIds.length > 0
            ? [{ entityType: "COMPONENT_REALIZATION" as VerificationEntityType, entityId: { in: componentRealizationIds } }]
            : []),
          ...(ikuResultIds.length > 0
            ? [{ entityType: "IKU_RESULT" as VerificationEntityType, entityId: { in: ikuResultIds } }]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Map verifications by entityId
    const verificationsByEntityId = new Map<string, typeof allVerifications>();
    for (const v of allVerifications) {
      if (!verificationsByEntityId.has(v.entityId)) {
        verificationsByEntityId.set(v.entityId, []);
      }
      verificationsByEntityId.get(v.entityId)!.push(v);
    }

    // 4. Build IKU rows
    const ikuRows = ikus.flatMap((iku) => {
      const results = ikuResults.filter((r) => r.idIku === iku.id);

      if (results.length === 0) {
        return [{
          entityType: "IKU_RESULT",
          entityId: null as string | null,
          metricType: "IKU",
          metricId: iku.id,
          metricCode: iku.code,
          metricName: iku.name,
          month: null as number | null,
          monthName: null as string | null,
          year,
          hasRealization: false,
          verificationStatus: "BELUM_ADA_REALISASI",
          verificationCount: 0,
          verifiedBy: [] as any[],
        }];
      }

      return results.map((r) => {
        const verifs = verificationsByEntityId.get(r.idResult) || [];
        return {
          entityType: "IKU_RESULT",
          entityId: r.idResult as string | null,
          metricType: "IKU",
          metricId: iku.id,
          metricCode: iku.code,
          metricName: iku.name,
          month: r.month as number | null,
          monthName: (r.month >= 1 && r.month <= 12 ? MONTH_NAMES[r.month - 1] : null) as string | null,
          year: r.year,
          hasRealization: true,
          verificationStatus: verifs.length > 0 ? "TERVERIFIKASI" : "BELUM_DIVERIFIKASI",
          verificationCount: verifs.length,
          verifiedBy: verifs.map((v) => ({
            userId: v.userId,
            userName: v.userName,
            note: v.note,
            verifiedAt: v.createdAt,
          })),
        };
      });
    });

    // 5. Build Component rows
    const componentRows = components.flatMap((component) => {
      const realizations = componentRealizations.filter((r) => r.idComponent === component.id);

      if (realizations.length === 0) {
        return [{
          entityType: "COMPONENT_REALIZATION",
          entityId: null as string | null,
          metricType: "COMPONENT",
          metricId: component.id,
          metricCode: component.code,
          metricName: component.name,
          month: null as number | null,
          monthName: null as string | null,
          year,
          hasRealization: false,
          verificationStatus: "BELUM_ADA_REALISASI",
          verificationCount: 0,
          verifiedBy: [] as any[],
        }];
      }

      return realizations.map((r) => {
        const verifs = verificationsByEntityId.get(r.idRealization) || [];
        return {
          entityType: "COMPONENT_REALIZATION",
          entityId: r.idRealization as string | null,
          metricType: "COMPONENT",
          metricId: component.id,
          metricCode: component.code,
          metricName: component.name,
          month: r.month as number | null,
          monthName: (r.month != null && r.month >= 1 && r.month <= 12
            ? MONTH_NAMES[r.month - 1]
            : null) as string | null,
          year: r.year,
          hasRealization: true,
          verificationStatus: verifs.length > 0 ? "TERVERIFIKASI" : "BELUM_DIVERIFIKASI",
          verificationCount: verifs.length,
          verifiedBy: verifs.map((v) => ({
            userId: v.userId,
            userName: v.userName,
            note: v.note,
            verifiedAt: v.createdAt,
          })),
        };
      });
    });

    // 6. Merge and sort by code
    const allRows = [...ikuRows, ...componentRows].sort((a: any, b: any) =>
      a.metricCode.localeCompare(b.metricCode)
    );

    // 7. Summary stats
    const totalRecords = allRows.length;
    const totalWithRealization = allRows.filter((r: any) => r.hasRealization).length;
    const totalVerified = allRows.filter((r: any) => r.verificationStatus === "TERVERIFIKASI").length;
    const totalUnverified = allRows.filter((r: any) => r.verificationStatus === "BELUM_DIVERIFIKASI").length;
    const totalNoRealization = allRows.filter((r: any) => r.verificationStatus === "BELUM_ADA_REALISASI").length;

    return res.json(
      successResponse({
        year,
        summary: {
          totalRecords,
          totalWithRealization,
          totalVerified,
          totalUnverified,
          totalNoRealization,
        },
        data: allRows,
      })
    );
  } catch (error) {
    next(error);
  }
};
