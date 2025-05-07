"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatusSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const schema_1 = require("../db/schema");
// Create order schema
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        shippingAddressId: zod_1.z.number().int().positive('Shipping address ID must be positive'),
        billingAddressId: zod_1.z
            .number()
            .int()
            .positive('Billing address ID must be positive')
            .optional(),
        paymentMethod: zod_1.z
            .string()
            .min(2, 'Payment method must be at least 2 characters'),
        notes: zod_1.z
            .string()
            .max(500, 'Notes must be less than 500 characters')
            .optional(),
    }),
});
// Update order status schema
exports.updateOrderStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum([
            schema_1.OrderStatus.PENDING,
            schema_1.OrderStatus.PROCESSING,
            schema_1.OrderStatus.SHIPPED,
            schema_1.OrderStatus.DELIVERED,
            schema_1.OrderStatus.CANCELLED,
        ], {
            errorMap: () => ({ message: 'Invalid order status' }),
        }),
    }),
});
