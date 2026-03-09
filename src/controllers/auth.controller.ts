import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { successResponse, errorResponse } from "../utils/response";
import { signJwt } from "../utils/jwt";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json(errorResponse("Email is already registered"));
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
      },
    });

    const userSafe = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json(successResponse(userSafe, "User registered successfully"));
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json(errorResponse("Invalid email or password"));
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json(errorResponse("Invalid email or password"));
    }

    const token = signJwt({ userId: user.id, email: user.email });

    res.json(successResponse({ token }, "Logged in successfully"));
  } catch (error) {
    next(error);
  }
};
