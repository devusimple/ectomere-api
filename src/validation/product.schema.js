"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categorySchema = exports.updateProductSchema = exports.productSchema = void 0;
const zod_1 = require("zod");
// Create product schema
exports.productSchema = zod_1.z.object({
    body: zod_1.z.object({
        vendorId: zod_1.z.number().optional(), // Optional for vendors, required for admins
        name: zod_1.z
            .string()
            .min(3, 'Product name must be at least 3 characters')
            .max(100, 'Product name must be less than 100 characters'),
        description: zod_1.z
            .string()
            .max(2000, 'Description must be less than 2000 characters')
            .optional(),
        price: zod_1.z
            .number()
            .positive('Price must be positive')
            .min(0.01, 'Price must be at least 0.01'),
        comparePrice: zod_1.z
            .number()
            .positive('Compare price must be positive')
            .optional(),
        sku: zod_1.z
            .string()
            .max(50, 'SKU must be less than 50 characters')
            .optional(),
        inventory: zod_1.z
            .number()
            .int('Inventory must be an integer')
            .nonnegative('Inventory must be non-negative'),
        categories: zod_1.z
            .array(zod_1.z.number())
            .optional(),
        tags: zod_1.z
            .array(zod_1.z.string())
            .optional(),
    }),
});
// Update product schema
exports.updateProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(3, 'Product name must be at least 3 characters')
            .max(100, 'Product name must be less than 100 characters')
            .optional(),
        description: zod_1.z
            .string()
            .max(2000, 'Description must be less than 2000 characters')
            .optional(),
        price: zod_1.z
            .number()
            .positive('Price must be positive')
            .min(0.01, 'Price must be at least 0.01')
            .optional(),
        comparePrice: zod_1.z
            .number()
            .positive('Compare price must be positive')
            .optional()
            .nullable(),
        sku: zod_1.z
            .string()
            .max(50, 'SKU must be less than 50 characters')
            .optional(),
        inventory: zod_1.z
            .number()
            .int('Inventory must be an integer')
            .nonnegative('Inventory must be non-negative')
            .optional(),
        isActive: zod_1.z
            .boolean()
            .optional(),
        categories: zod_1.z
            .array(zod_1.z.number())
            .optional(),
        tags: zod_1.z
            .array(zod_1.z.string())
            .optional(),
    }),
});
// Category schema
exports.categorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(2, 'Category name must be at least 2 characters')
            .max(50, 'Category name must be less than 50 characters'),
        description: zod_1.z
            .string()
            .max(500, 'Description must be less than 500 characters')
            .optional(),
        parentId: zod_1.z
            .number()
            .optional()
            .nullable(),
    }),
});
