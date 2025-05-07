"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const logger_1 = require("../config/logger");
/**
 * Middleware to validate request data against a Zod schema
 */
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate request against schema
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                logger_1.logger.warn('Validation Error:', error.errors);
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Invalid request data',
                    details: error.errors.map(e => ({
                        path: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            next(error);
        }
    };
};
exports.validate = validate;
