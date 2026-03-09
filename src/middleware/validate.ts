import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { RequestHandler } from "express";
import { errorResponse } from "../utils/response";

function formatErrors(errors: ValidationError[]): Record<string, string> {
  const formatted: Record<string, string> = {};

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

export function validateBody<T extends object>(dtoClass: new () => T): RequestHandler {
  return async (req, res, next) => {
    const instance = plainToInstance(dtoClass, req.body);
    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });

    if (errors.length > 0) {
      return res.status(400).json(errorResponse("Validation failed", formatErrors(errors)));
    }

    // Replace body with validated object (useful if you want to ensure types)
    req.body = instance;
    next();
  };
}
