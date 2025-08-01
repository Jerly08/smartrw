import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

// Middleware to validate request body against a Zod schema
export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For simple schemas (like login, register), validate body directly
      // For complex schemas with nested structure, handle accordingly
      const schemaShape = (schema as any)._def?.shape;
      
      let validationData: any;
      
      // Check if this is a nested schema with body/query/params
      if (schemaShape && (schemaShape.body || schemaShape.query || schemaShape.params)) {
        validationData = {};
        if (schemaShape.body) {
          validationData.body = req.body;
        }
        if (schemaShape.query) {
          validationData.query = req.query;
        }
        if (schemaShape.params) {
          validationData.params = req.params;
        }
      } else {
        // For simple schemas, validate the body directly
        validationData = req.body;
      }
      
      // Validate request against schema
      const result = await schema.parseAsync(validationData);
      
      // Replace req.body with validated data for simple schemas
      if (!schemaShape || (!schemaShape.body && !schemaShape.query && !schemaShape.params)) {
        req.body = result;
      }
      
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
