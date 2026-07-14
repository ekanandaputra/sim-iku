import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import { searchAuthUnits, assignAuthUnitUsers, getAuthUnitUsers } from "../utils/authService";

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

export const assignUnitUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { users } = req.body as { users: { userId: string; type: string }[] };

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ success: false, message: "Invalid payload: users array is required" });
    }

    const authResult = await assignAuthUnitUsers(id, users);

    if (!authResult) {
      return res.status(500).json({ success: false, message: "Failed to assign users to unit via auth service" });
    }

    if (!authResult.success) {
      return res.status(400).json(authResult);
    }

    res.json(authResult);
  } catch (error) {
    next(error);
  }
};

export const getUnitUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const authResult = await getAuthUnitUsers(id, search, page, limit);

    if (!authResult) {
      return res.json(
        successResponse(
          { data: [], pagination: { page, limit, total: 0, totalPages: 0 } },
          "Successfully fetched unit users"
        )
      );
    }

    res.json(
      successResponse(
        authResult,
        "Successfully fetched unit users"
      )
    );
  } catch (error) {
    next(error);
  }
};
