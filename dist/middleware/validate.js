"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const response_1 = require("../utils/response");
function formatErrors(errors) {
    const formatted = {};
    for (const error of errors) {
        if (error.children && error.children.length > 0) {
            Object.assign(formatted, formatErrors(error.children));
            continue;
        }
        if (error.constraints) {
            // Grab the first constraint message
            const [first] = Object.values(error.constraints);
            formatted[error.property] = first;
        }
    }
    return formatted;
}
function validateBody(dtoClass) {
    return async (req, res, next) => {
        const instance = (0, class_transformer_1.plainToInstance)(dtoClass, req.body);
        const errors = await (0, class_validator_1.validate)(instance, { whitelist: true, forbidNonWhitelisted: true });
        if (errors.length > 0) {
            return res.status(400).json((0, response_1.errorResponse)("Validation failed", formatErrors(errors)));
        }
        // Replace body with validated object (useful if you want to ensure types)
        req.body = instance;
        next();
    };
}
