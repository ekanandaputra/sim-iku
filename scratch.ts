import { Request, Response, NextFunction } from "express";

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
      where: { year },
    });

    // 2. Fetch all root Components (some might not be in IKU, but usually are)
    // Actually, maybe we only fetch components that are part of IKUs + independent root ones?
    // Let's just fetch all component realizations for the year
    const allComponents = await prisma.component.findMany({
      orderBy: { code: "asc" },
    });
    
    const componentRealizations = await prisma.componentRealization.findMany({
      where: { year },
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
      if (row.metricType === "IKU" && row.isDirectInput) {
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
