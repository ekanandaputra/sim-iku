"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const response_1 = require("../utils/response");
const jwt_1 = require("../utils/jwt");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json((0, response_1.errorResponse)("Unauthorized"));
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = (0, jwt_1.verifyJwt)(token);
        // validasi payload
        if (!payload.userId || !payload.email) {
            return res.status(401).json((0, response_1.errorResponse)("Invalid token payload"));
        }
        // attach user ke request
        req.user = {
            id: payload.userId,
            email: payload.email,
        };
        next();
    }
    catch (err) {
        return res.status(401).json((0, response_1.errorResponse)("Invalid or expired token"));
    }
}
