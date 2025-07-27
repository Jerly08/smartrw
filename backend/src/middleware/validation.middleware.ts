import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

// Middleware to validate request body against a Zod schema
export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request against schema
      // Validate req.body directly against the schema
      await schema.parseAsync(req.body);
      
      // If validation passes, continue
      return next();
    } catch (error) {
      // If validation fails, return error response
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      
      // For other errors, pass to error handler
      return next(error);
    }
  };
};
