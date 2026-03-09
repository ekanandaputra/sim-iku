"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const response_1 = require("../utils/response");
const jwt_1 = require("../utils/jwt");
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json((0, response_1.errorResponse)("Email is already registered"));
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
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
        res.status(201).json((0, response_1.successResponse)(userSafe, "User registered successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json((0, response_1.errorResponse)("Invalid email or password"));
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json((0, response_1.errorResponse)("Invalid email or password"));
        }
        const token = (0, jwt_1.signJwt)({ userId: user.id, email: user.email });
        res.json((0, response_1.successResponse)({ token }, "Logged in successfully"));
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
