import { Request, Response, NextFunction } from 'express';

// Error interface
interface AppError extends Error {
  statusCode?: number;
  errors?: any[];
}

// Error handler middleware
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  next(error);
};

// Custom error class
export class ApiError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
} 