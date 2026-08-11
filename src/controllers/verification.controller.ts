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

    // 1. Fetch ALL IKUs with their associated components
    const ikus = await prisma.iKU.findMany({
      orderBy: { code: "asc" },
      include: {
        components: {
          include: {
            component: true
          }
        }
      }
    });

    const ikuResults = await prisma.ikuResult.findMany({
      where: { year, month: { not: 0 } },
    });

    // 2. Fetch all root Components (some might not be in IKU, but usually are)
    const allComponents = await prisma.component.findMany({
      orderBy: { code: "asc" },
    });
    
    const componentRealizations = await prisma.componentRealization.findMany({
      where: { year, month: { not: 0 } },
    });

    // 3. Collect all entity IDs and fetch verifications
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

    const verificationsByEntityId = new Map<string, typeof allVerifications>();
    for (const v of allVerifications) {
      if (!verificationsByEntityId.has(v.entityId)) {
        verificationsByEntityId.set(v.entityId, []);
      }
      verificationsByEntityId.get(v.entityId)!.push(v);
    }

    // Tracker to know which components are already attached to an IKU
    const attachedComponentIds = new Set<string>();

    // 4. Build IKU rows (Hierarchy: IKU -> Component -> Realization)
    const ikuRows = ikus.map((iku) => {
      // Direct IKU realizations (if any, usually if isDirectInput = true)
      const results = ikuResults.filter((r) => r.idIku === iku.id);
      const realizations = results.map((r) => {
        const verifs = verificationsByEntityId.get(r.idResult) || [];
        return {
          entityType: "IKU_RESULT",
          entityId: r.idResult,
          month: r.month,
          monthName: r.month >= 1 && r.month <= 12 ? MONTH_NAMES[r.month - 1] : null,
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
      }).sort((a, b) => (a.month || 0) - (b.month || 0));

      // Map its components
      const componentRows = iku.components.map((ic) => {
        const comp = ic.component;
        attachedComponentIds.add(comp.id);
        
        const compResults = componentRealizations.filter((r) => r.idComponent === comp.id);
        const compRealizations = compResults.map((r) => {
          const verifs = verificationsByEntityId.get(r.idRealization) || [];
          return {
            entityType: "COMPONENT_REALIZATION",
            entityId: r.idRealization,
            month: r.month,
            monthName: r.month != null && r.month >= 1 && r.month <= 12 ? MONTH_NAMES[r.month - 1] : null,
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
        }).sort((a, b) => (a.month || 0) - (b.month || 0));

        return {
          metricType: "COMPONENT",
          metricId: comp.id,
          metricCode: comp.code,
          metricName: comp.name,
          realizations: compRealizations,
        };
      }).sort((a: any, b: any) => a.metricCode.localeCompare(b.metricCode));

      return {
        metricType: "IKU",
        metricId: iku.id,
        metricCode: iku.code,
        metricName: iku.name,
        isDirectInput: iku.isDirectInput,
        realizations,
        components: componentRows,
      };
    });

    // 5. Build Independent Component rows (Root components not attached to any IKU)
    const independentComponents = allComponents.filter(c => c.parentId === null && !attachedComponentIds.has(c.id));
    const independentComponentRows = independentComponents.map((comp) => {
        const compResults = componentRealizations.filter((r) => r.idComponent === comp.id);
        const compRealizations = compResults.map((r) => {
          const verifs = verificationsByEntityId.get(r.idRealization) || [];
          return {
            entityType: "COMPONENT_REALIZATION",
            entityId: r.idRealization,
            month: r.month,
            monthName: r.month != null && r.month >= 1 && r.month <= 12 ? MONTH_NAMES[r.month - 1] : null,
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
        }).sort((a, b) => (a.month || 0) - (b.month || 0));

        return {
          metricType: "COMPONENT",
          metricId: comp.id,
          metricCode: comp.code,
          metricName: comp.name,
          realizations: compRealizations,
          components: [] // consistent structure
        };
    });

    // 6. Merge and sort by code
    const allRows = [...ikuRows, ...independentComponentRows].sort((a: any, b: any) =>
      a.metricCode.localeCompare(b.metricCode)
    );

    // 7. Summary stats
    let totalRecords = 0;
    let totalWithRealization = 0;
    let totalVerified = 0;
    let totalUnverified = 0;

    const countRealizations = (realizations: any[]) => {
      if (realizations.length === 0) {
        totalRecords++;
      } else {
        totalRecords += realizations.length;
        totalWithRealization += realizations.length;
        for (const real of realizations) {
          if (real.verificationStatus === "TERVERIFIKASI") totalVerified++;
          else if (real.verificationStatus === "BELUM_DIVERIFIKASI") totalUnverified++;
        }
      }
    };

    for (const row of allRows) {
      if (row.metricType === "IKU" && (row as any).isDirectInput) {
         countRealizations(row.realizations);
      }
      if (row.components) {
        for (const comp of row.components) {
          countRealizations(comp.realizations);
        }
      }
      if (row.metricType === "COMPONENT") {
          countRealizations(row.realizations);
      }
    }
    
    // Total no realization is derived
    const totalNoRealization = totalRecords - totalWithRealization;

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
