import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";
import { decodeJwt } from "../utils/jwt";
import { validateAuthToken } from "../utils/authService";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    permissions?: string[];
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(errorResponse("Unauthorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const authUserId = await validateAuthToken(token);
    if (!authUserId) {
      return res.status(401).json(errorResponse("Invalid or expired token"));
    }

    const payload = decodeJwt(token);
    if (!payload) {
      return res.status(401).json(errorResponse("Invalid token payload"));
    }

    const userId = payload.userId || payload.user?.id || authUserId;
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
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // no token — proceed without user context
  }

  const token = authHeader.split(" ")[1];

  try {
    const authUserId = await validateAuthToken(token);
    if (authUserId) {
      const payload = decodeJwt(token);
      if (payload) {
        const userId = payload.userId || payload.user?.id || authUserId;
        if (userId) {
          const extractedRoles = payload.roles || payload.user?.roles || [];
          const roleKeys = extractedRoles.map((r: any) => r.key);
          const combinedPermissions = [...(payload.permissions || []), ...roleKeys];

          (req as AuthRequest).user = {
            id: userId,
            email: payload.email || payload.user?.email || "",
            permissions: combinedPermissions,
          };
        }
      }
    }
  } catch {
    // invalid token — silently ignore, proceed without user context
  }

  next();
}

