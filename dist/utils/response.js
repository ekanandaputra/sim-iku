"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function successResponse(data, message) {
    const response = {
        success: true,
        data,
    };
    if (message) {
        response.message = message;
    }
    return response;
}
function errorResponse(message, errors) {
    const response = {
        success: false,
        message,
    };
    if (errors && Object.keys(errors).length > 0) {
        response.errors = errors;
    }
    return response;
}
