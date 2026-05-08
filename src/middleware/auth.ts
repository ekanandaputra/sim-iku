import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";
import { verifyJwt } from "../utils/jwt";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
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
    // validasi payload
    if (!payload.userId || !payload.email) {
      return res.status(401).json(errorResponse("Invalid token payload"));
    }

    // attach user ke request
    req.user = {
      id: payload.userId,
      email: payload.email,
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
    if (payload.userId && payload.email) {
      (req as AuthRequest).user = {
        id: payload.userId,
        email: payload.email,
      };
    }
  } catch {
    // invalid token — silently ignore, proceed without user context
  }

  next();
}

