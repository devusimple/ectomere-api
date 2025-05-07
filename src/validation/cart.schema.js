"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCartItemSchema = exports.addToCartSchema = void 0;
const zod_1 = require("zod");
// Add to cart schema
exports.addToCartSchema = zod_1.z.object({
    body: zod_1.z.object({
        productId: zod_1.z.number().int().positive('Product ID must be positive'),
        variantId: zod_1.z.number().int().positive('Variant ID must be positive').optional(),
        quantity: zod_1.z
            .number()
            .int('Quantity must be an integer')
            .positive('Quantity must be positive')
            .default(1),
    }),
});
// Update cart item schema
exports.updateCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        quantity: zod_1.z
            .number()
            .int('Quantity must be an integer')
            .positive('Quantity must be positive'),
    }),
});
