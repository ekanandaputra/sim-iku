import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import { searchAuthUnits } from "../utils/authService";

export const getUnits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const authResult = await searchAuthUnits(search, page, limit);

    if (!authResult) {
      return res.json(
        successResponse(
          { data: [], pagination: { page, limit, total: 0, totalPages: 0 } },
          "Successfully fetched units"
        )
      );
    }

    res.json(
      successResponse(
        authResult,
        "Successfully fetched units"
      )
    );
  } catch (error) {
    next(error);
  }
};
