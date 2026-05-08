import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { SaveBreakdownDto } from "../dtos/componentBreakdown.dto";
import { calculateIkuResultsForComponentRealization } from "./componentRealization.controller";

type RealizationParams = { realizationId: string };

/**
 * GET BREAKDOWN FOR A REALIZATION
 * GET /api/component-realizations/:realizationId/breakdown
 */
export const getBreakdown = async (
  req: Request<RealizationParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { realizationId } = req.params;

    const realization = await prisma.componentRealization.findUnique({
      where: { idRealization: realizationId },
      include: {
        component: { select: { id: true, code: true, name: true, hasBreakdown: true } },
        breakdowns: {
          include: { prodi: true },
          orderBy: { prodi: { name: "asc" } },
        },
      },
    });

    if (!realization) {
      return res.status(404).json(errorResponse("Component realization not found"));
    }
    if (!realization.component.hasBreakdown) {
      return res.status(400).json(errorResponse("This component does not have breakdown enabled"));
    }

    const total = realization.breakdowns.reduce(
      (sum, b) => sum + Number(b.value),
      0
    );

    res.json(
      successResponse({
        realization: {
          id: realization.idRealization,
          month: realization.month,
          year: realization.year,
          totalValue: Number(realization.value),
        },
        component: realization.component,
        breakdowns: realization.breakdowns.map((b) => ({
          id: b.id,
          prodi: b.prodi,
          value: Number(b.value),
        })),
        total,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * SAVE (BULK UPSERT) BREAKDOWN FOR A REALIZATION
 * POST /api/component-realizations/:realizationId/breakdown
 *
 * Upserts all breakdown entries, then auto-sums and updates ComponentRealization.value.
 */
export const saveBreakdown = async (
  req: Request<RealizationParams, {}, SaveBreakdownDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { realizationId } = req.params;
    const { breakdowns } = req.body;

    // Validate realization exists and component has breakdown enabled
    const realization = await prisma.componentRealization.findUnique({
      where: { idRealization: realizationId },
      include: { component: true },
    });
    if (!realization) {
      return res.status(404).json(errorResponse("Component realization not found"));
    }
    if (!realization.component.hasBreakdown) {
      return res.status(400).json(errorResponse("This component does not have breakdown enabled"));
    }

    // Validate all prodiIds exist
    const prodiIds = breakdowns.map((b) => b.prodiId);
    const existingProdi = await prisma.prodi.findMany({
      where: { id: { in: prodiIds } },
      select: { id: true },
    });
    const existingProdiIds = new Set(existingProdi.map((p) => p.id));
    const invalidIds = prodiIds.filter((id) => !existingProdiIds.has(id));
    if (invalidIds.length > 0) {
      return res.status(400).json(
        errorResponse(`Prodi not found: ${invalidIds.join(", ")}`)
      );
    }

    // Upsert each breakdown entry
    await prisma.$transaction(
      breakdowns.map((b) =>
        prisma.componentRealizationBreakdown.upsert({
          where: {
            realizationId_prodiId: {
              realizationId,
              prodiId: b.prodiId,
            },
          },
          create: { realizationId, prodiId: b.prodiId, value: b.value },
          update: { value: b.value },
        })
      )
    );

    // Auto-sum all breakdown values and update ComponentRealization.value
    const allBreakdowns = await prisma.componentRealizationBreakdown.findMany({
      where: { realizationId },
    });
    const total = allBreakdowns.reduce((sum, b) => sum + Number(b.value), 0);

    await prisma.componentRealization.update({
      where: { idRealization: realizationId },
      data: { value: total },
    });

    // Trigger IKU recalculation
    if (realization.month != null) {
      await calculateIkuResultsForComponentRealization(
        realization.idComponent,
        realization.month,
        realization.year
      );
    }

    // Return updated state
    const updated = await prisma.componentRealizationBreakdown.findMany({
      where: { realizationId },
      include: { prodi: true },
      orderBy: { prodi: { name: "asc" } },
    });

    res.json(
      successResponse(
        {
          totalValue: total,
          breakdowns: updated.map((b) => ({
            id: b.id,
            prodi: b.prodi,
            value: Number(b.value),
          })),
        },
        "Breakdown saved and total updated successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE A SINGLE BREAKDOWN ENTRY
 * DELETE /api/component-realizations/:realizationId/breakdown/:prodiId
 *
 * Removes one prodi entry then re-sums and updates ComponentRealization.value.
 */
export const deleteBreakdownEntry = async (
  req: Request<{ realizationId: string; prodiId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { realizationId, prodiId } = req.params;

    const realization = await prisma.componentRealization.findUnique({
      where: { idRealization: realizationId },
      include: { component: true },
    });
    if (!realization) {
      return res.status(404).json(errorResponse("Component realization not found"));
    }

    const entry = await prisma.componentRealizationBreakdown.findUnique({
      where: { realizationId_prodiId: { realizationId, prodiId } },
    });
    if (!entry) {
      return res.status(404).json(errorResponse("Breakdown entry not found"));
    }

    await prisma.componentRealizationBreakdown.delete({
      where: { realizationId_prodiId: { realizationId, prodiId } },
    });

    // Re-sum after deletion
    const remaining = await prisma.componentRealizationBreakdown.findMany({
      where: { realizationId },
    });
    const total = remaining.reduce((sum, b) => sum + Number(b.value), 0);

    await prisma.componentRealization.update({
      where: { idRealization: realizationId },
      data: { value: total },
    });

    // Trigger IKU recalculation
    if (realization.month != null) {
      await calculateIkuResultsForComponentRealization(
        realization.idComponent,
        realization.month,
        realization.year
      );
    }

    res.json(successResponse({ totalValue: total }, "Breakdown entry deleted"));
  } catch (error) {
    next(error);
  }
};
