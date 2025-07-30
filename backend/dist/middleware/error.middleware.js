"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.notFound = exports.errorHandler = void 0;
// Error handler middleware
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    // Log error for debugging
    console.error(`[ERROR] ${err.message}`);
    console.error(err.stack);
    // Add detailed logging for validation errors
    if (statusCode === 400 && err.errors) {
        console.error(`[VALIDATION ERROR DETAILS]`, JSON.stringify(err.errors, null, 2));
    }
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        errors: err.errors || undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
// Not found middleware
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};
exports.notFound = notFound;
// Custom error class
class ApiError extends Error {
    constructor(message, statusCode, errors) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
