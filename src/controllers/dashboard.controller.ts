import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { IkuResultType } from "../generated/prisma/enums";

const formatDecimal = (val: any): number | null => {
  if (val == null) return null;
  const num = Number(val);
  return isNaN(num) ? null : Number(num.toFixed(2));
};

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

    const ikus = await prisma.iKU.findMany({ orderBy: { code: "asc" } });

    const targets = await prisma.ikuTarget.findMany({ where: { year } });
    const targetMap = new Map(targets.map(t => [t.ikuId, t]));

    // Ambil semua iku_result untuk tahun ini (monthly + quarterly + yearly)
    const results = await prisma.ikuResult.findMany({
      where: { year },
      orderBy: [{ idIku: "asc" }, { month: "asc" }],
    });

    // Kelompokkan per IKU
    const resultsByIku = new Map<string, typeof results>();
    for (const r of results) {
      if (!resultsByIku.has(r.idIku)) resultsByIku.set(r.idIku, []);
      resultsByIku.get(r.idIku)!.push(r);
    }

    const dashboardData = ikus.map(iku => {
      const target = targetMap.get(iku.id);
      const ikuResults = resultsByIku.get(iku.id) || [];

      // Quarterly: month = nomor kuartal (1-4), resultType = quarterly
      const getQuarterRealization = (quarter: number): number | null => {
        const row = ikuResults.find(
          r => r.resultType === IkuResultType.quarterly && r.month === quarter
        );
        return formatDecimal(row?.calculatedValue);
      };

      // Yearly: resultType = yearly, month = 0
      const getYearlyRealization = (): number | null => {
        const row = ikuResults.find(r => r.resultType === IkuResultType.yearly);
        return formatDecimal(row?.calculatedValue);
      };

      return {
        ikuId: iku.id,
        ikuCode: iku.code,
        ikuName: iku.name,
        chartData: [
          {
            period: "Q1",
            target: formatDecimal(target?.targetQ1),
            realization: getQuarterRealization(1),
          },
          {
            period: "Q2",
            target: formatDecimal(target?.targetQ2),
            realization: getQuarterRealization(2),
          },
          {
            period: "Q3",
            target: formatDecimal(target?.targetQ3),
            realization: getQuarterRealization(3),
          },
          {
            period: "Q4",
            target: formatDecimal(target?.targetQ4),
            realization: getQuarterRealization(4),
          },
          {
            period: "Year",
            target: formatDecimal(target?.targetYear),
            realization: getYearlyRealization(),
          },
        ],
      };
    });

    res.json(successResponse(dashboardData));
  } catch (error) {
    next(error);
  }
};


export const getComponentDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const yearStr = req.query.year as string;
    const componentId = (req.query.componentId as string) || (req.query.component_id as string);
    if (!yearStr) {
      return res.status(400).json(errorResponse("Year is required in query params"));
    }
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return res.status(400).json(errorResponse("Invalid year format"));
    }

    const componentFilter: any = {};
    if (componentId) {
      componentFilter.id = componentId;
    }

    const components = await prisma.component.findMany({
      where: componentFilter,
      orderBy: { code: "asc" },
    });

    if (componentId && components.length === 0) {
      return res.status(404).json(errorResponse("Component not found"));
    }

    const targetWhere: any = { year };
    const realizationWhere: any = { year };
    if (componentId) {
      targetWhere.componentId = componentId;
      realizationWhere.idComponent = componentId;
    }

    const targets = await prisma.componentTarget.findMany({ where: targetWhere });
    const realizations = await prisma.componentRealization.findMany({ where: realizationWhere });

    const targetMap = new Map(targets.map((t) => [t.componentId, t]));
    const realizationMap = new Map<string, any[]>();

    for (const realization of realizations) {
      const items = realizationMap.get(realization.idComponent) || [];
      items.push(realization);
      realizationMap.set(realization.idComponent, items);
    }

    const dashboardData = components.map((component) => {
      const target = targetMap.get(component.id);
      const componentRealizations = realizationMap.get(component.id) || [];

      const getRealization = (periodType: string, periodValue: number) => {
        let filtered = componentRealizations;
        if (periodType === "quarter") {
          filtered = filtered.filter((r) => quarterMonths[periodValue]?.includes(r.month));
        }

        if (!filtered.length) return null;
        const sum = filtered.reduce((sum, item) => sum + Number(item.value), 0);
        return formatDecimal(sum);
      };

      return {
        componentId: component.id,
        componentCode: component.code,
        componentName: component.name,
        chartData: [
          {
            period: "Q1",
            target: formatDecimal(target?.targetQ1),
            realization: getRealization("quarter", 1),
          },
          {
            period: "Q2",
            target: formatDecimal(target?.targetQ2),
            realization: getRealization("quarter", 2),
          },
          {
            period: "Q3",
            target: formatDecimal(target?.targetQ3),
            realization: getRealization("quarter", 3),
          },
          {
            period: "Q4",
            target: formatDecimal(target?.targetQ4),
            realization: getRealization("quarter", 4),
          },
          {
            period: "Year",
            target: formatDecimal(target?.targetYear),
            realization: getRealization("year", 1),
          },
        ],
      };
    });

    const responseData = componentId ? dashboardData[0] : dashboardData;

    res.json(successResponse(responseData));
  } catch (error) {
    next(error);
  }
};
