"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorSchema = exports.updateAddressSchema = exports.addressSchema = exports.changePasswordSchema = exports.updateUserSchema = void 0;
const zod_1 = require("zod");
// Update user schema
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
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
        phone: zod_1.z
            .string()
            .regex(/^\+?[1-9]\d{1,14}$/, 'Phone number must be a valid international format')
            .optional(),
    }),
});
// Change password schema
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password must be less than 100 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    }),
});
// Address schema
exports.addressSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['shipping', 'billing']),
        addressLine1: zod_1.z
            .string()
            .min(5, 'Address line 1 must be at least 5 characters')
            .max(100, 'Address line 1 must be less than 100 characters'),
        addressLine2: zod_1.z
            .string()
            .max(100, 'Address line 2 must be less than 100 characters')
            .optional(),
        city: zod_1.z
            .string()
            .min(2, 'City must be at least 2 characters')
            .max(50, 'City must be less than 50 characters'),
        state: zod_1.z
            .string()
            .min(2, 'State must be at least 2 characters')
            .max(50, 'State must be less than 50 characters'),
        postalCode: zod_1.z
            .string()
            .min(2, 'Postal code must be at least 2 characters')
            .max(20, 'Postal code must be less than 20 characters'),
        country: zod_1.z
            .string()
            .min(2, 'Country must be at least 2 characters')
            .max(50, 'Country must be less than 50 characters'),
        isDefault: zod_1.z.boolean().optional(),
    }),
});
// Update address schema
exports.updateAddressSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['shipping', 'billing']).optional(),
        addressLine1: zod_1.z
            .string()
            .min(5, 'Address line 1 must be at least 5 characters')
            .max(100, 'Address line 1 must be less than 100 characters')
            .optional(),
        addressLine2: zod_1.z
            .string()
            .max(100, 'Address line 2 must be less than 100 characters')
            .optional(),
        city: zod_1.z
            .string()
            .min(2, 'City must be at least 2 characters')
            .max(50, 'City must be less than 50 characters')
            .optional(),
        state: zod_1.z
            .string()
            .min(2, 'State must be at least 2 characters')
            .max(50, 'State must be less than 50 characters')
            .optional(),
        postalCode: zod_1.z
            .string()
            .min(2, 'Postal code must be at least 2 characters')
            .max(20, 'Postal code must be less than 20 characters')
            .optional(),
        country: zod_1.z
            .string()
            .min(2, 'Country must be at least 2 characters')
            .max(50, 'Country must be less than 50 characters')
            .optional(),
        isDefault: zod_1.z.boolean().optional(),
    }),
});
// Vendor schema
exports.vendorSchema = zod_1.z.object({
    body: zod_1.z.object({
        businessName: zod_1.z
            .string()
            .min(2, 'Business name must be at least 2 characters')
            .max(100, 'Business name must be less than 100 characters'),
        description: zod_1.z
            .string()
            .max(1000, 'Description must be less than 1000 characters')
            .optional(),
    }),
});
