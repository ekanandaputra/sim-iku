import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";

const quarterMonths: Record<number, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
};

export const getIkuDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const yearStr = req.query.year as string;
    if (!yearStr) {
      return res.status(400).json(errorResponse("Year is required in query params"));
    }
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return res.status(400).json(errorResponse("Invalid year format"));
    }

    const ikus = await prisma.iKU.findMany({ orderBy: { code: 'asc' } });

    const targets = await prisma.ikuTarget.findMany({ where: { year } });
    const targetMap = new Map(targets.map(t => [t.ikuId, t]));

    const results = await prisma.ikuResult.findMany({
      where: { year },
      orderBy: [{ idIku: "asc" }, { month: "asc" }],
    });

    const resultMap = new Map<string, any[]>();
    for (const r of results) {
      if (!resultMap.has(r.idIku)) resultMap.set(r.idIku, []);
      resultMap.get(r.idIku)!.push(r);
    }

    const dashboardData = ikus.map(iku => {
      const target = targetMap.get(iku.id);
      const ikuResults = resultMap.get(iku.id) || [];

      const getRealization = (periodType: string, periodValue: number) => {
        const filtered = periodType === "year"
          ? ikuResults
          : ikuResults.filter(r => quarterMonths[periodValue]?.includes(r.month));

        if (!filtered.length) return null;
        return filtered.reduce((sum, item) => sum + Number(item.calculatedValue), 0);
      };

      return {
        ikuId: iku.id,
        ikuCode: iku.code,
        ikuName: iku.name,
        chartData: [
          {
            period: "Q1",
            target: target && target.targetQ1 !== null ? Number(target.targetQ1) : null,
            realization: getRealization("quarter", 1),
          },
          {
            period: "Q2",
            target: target && target.targetQ2 !== null ? Number(target.targetQ2) : null,
            realization: getRealization("quarter", 2),
          },
          {
            period: "Q3",
            target: target && target.targetQ3 !== null ? Number(target.targetQ3) : null,
            realization: getRealization("quarter", 3),
          },
          {
            period: "Q4",
            target: target && target.targetQ4 !== null ? Number(target.targetQ4) : null,
            realization: getRealization("quarter", 4),
          },
          {
            period: "Year",
            target: target && target.targetYear !== null ? Number(target.targetYear) : null,
            realization: getRealization("year", 1),
          },
        ],
      };
    });

    res.json(successResponse(dashboardData));
  } catch (error) {
    next(error);
  }
};
