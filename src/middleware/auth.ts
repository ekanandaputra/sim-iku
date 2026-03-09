import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";
import { verifyJwt } from "../utils/jwt";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(errorResponse("Unauthorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyJwt(token);
    // Attach user info to request object for later use
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json(errorResponse("Invalid or expired token"));
  }
}
