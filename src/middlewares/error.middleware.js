"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = exports.errorMiddleware = exports.ApiError = void 0;
const logger_1 = require("../config/logger");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
// Custom error class for API errors
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
// Global error handling middleware
const errorMiddleware = (err, req, res, next) => {
    logger_1.logger.error(`Error: ${err.message}`, { stack: err.stack });
    // Handle specific error types
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            error: err.name,
            message: err.message,
        });
    }
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid request data',
            details: err.errors,
        });
    }
    // Handle Drizzle ORM errors
    if (err instanceof drizzle_orm_1.DrizzleError) {
        return res.status(500).json({
            error: 'Database Error',
            message: 'An error occurred while processing your request',
        });
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token',
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token expired',
        });
    }
    // Default to 500 server error
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message || 'Internal Server Error';
    res.status(statusCode).json({
        error: 'Internal Server Error',
        message,
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    });
};
exports.errorMiddleware = errorMiddleware;
// Not found middleware for undefined routes
const notFoundMiddleware = (req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
    });
};
exports.notFoundMiddleware = notFoundMiddleware;
