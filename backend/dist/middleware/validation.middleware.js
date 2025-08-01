"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
// Middleware to validate request body against a Zod schema
const validateRequest = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            // For simple schemas (like login, register), validate body directly
            // For complex schemas with nested structure, handle accordingly
            const schemaShape = (_a = schema._def) === null || _a === void 0 ? void 0 : _a.shape;
            let validationData;
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
            }
            else {
                // For simple schemas, validate the body directly
                validationData = req.body;
            }
            // Validate request against schema
            const result = yield schema.parseAsync(validationData);
            // Replace req.body with validated data for simple schemas
            if (!schemaShape || (!schemaShape.body && !schemaShape.query && !schemaShape.params)) {
                req.body = result;
            }
            // If validation passes, continue
            return next();
        }
        catch (error) {
            // If validation fails, return error response
            if (error instanceof zod_1.ZodError) {
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
    });
};
exports.validateRequest = validateRequest;
