import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET ?? "change-me";
const JWT_EXPIRES_IN: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) ?? "7d";

export interface JwtPayload {
  userId: string;
  email?: string;
}

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt<T extends JwtPayload = JwtPayload>(token: string): T {
  return jwt.verify(token, JWT_SECRET) as T;
}
