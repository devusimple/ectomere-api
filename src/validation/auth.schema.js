"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const schema_1 = require("../db/schema");
// Register schema
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .email('Invalid email address')
            .min(5, 'Email must be at least 5 characters')
            .max(100, 'Email must be less than 100 characters'),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password must be less than 100 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        firstName: zod_1.z
            .string()
            .min(2, 'First name must be at least 2 characters')
            .max(50, 'First name must be less than 50 characters')
            .optional(),
        lastName: zod_1.z
            .string()
            .min(2, 'Last name must be at least 2 characters')
            .max(50, 'Last name must be less than 50 characters')
            .optional(),
        role: zod_1.z
            .enum([schema_1.UserRole.ADMIN, schema_1.UserRole.VENDOR, schema_1.UserRole.CUSTOMER])
            .optional(),
    }),
});
// Login schema
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .email('Invalid email address')
            .min(5, 'Email must be at least 5 characters')
            .max(100, 'Email must be less than 100 characters'),
        password: zod_1.z
            .string()
            .min(1, 'Password is required')
            .max(100, 'Password must be less than 100 characters'),
    }),
});
// Refresh token schema
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    }),
});
