import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";
import { verifyJwt } from "../utils/jwt";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    permissions?: string[];
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(errorResponse("Unauthorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyJwt(token);
    const userId = payload.userId || payload.user?.id;
    if (!userId) {
      return res.status(401).json(errorResponse("Invalid token payload"));
    }

    const extractedRoles = payload.roles || payload.user?.roles || [];
    const roleKeys = extractedRoles.map((r: any) => r.key);
    const combinedPermissions = [...(payload.permissions || []), ...roleKeys];

    // attach user ke request
    req.user = {
      id: userId,
      email: payload.email || payload.user?.email || "",
      permissions: combinedPermissions,
    };
    next();
  } catch (err) {
    return res.status(401).json(errorResponse("Invalid or expired token"));
  }
}

/**
 * Optional authenticate — parses the Bearer token if present and attaches
 * req.user, but does NOT reject the request when the token is absent.
 * Use this for endpoints that are public by default but need user context
 * when ENABLE_USER_FILTER=true.
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // no token — proceed without user context
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyJwt(token);
    const userId = payload.userId || payload.user?.id;
    if (userId) {
      console.log(payload);
      const extractedRoles = payload.roles || payload.user?.roles || [];
      const roleKeys = extractedRoles.map((r: any) => r.key);
      const combinedPermissions = [...(payload.permissions || []), ...roleKeys];

      (req as AuthRequest).user = {
        id: userId,
        email: payload.email || payload.user?.email || "",
        permissions: combinedPermissions,
      };
    }
  } catch {
    // invalid token — silently ignore, proceed without user context
  }

  next();
}

