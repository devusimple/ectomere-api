"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const order_schema_1 = require("../validation/order.schema");
const schema_1 = require("../db/schema");
const router = (0, express_1.Router)();
const orderController = new order_controller_1.OrderController();
// Protect all order routes with authentication
router.use(auth_middleware_1.authenticate);
// Create order
router.post('/', (0, validation_middleware_1.validate)(order_schema_1.createOrderSchema), orderController.createOrder);
// Get user orders
router.get('/', orderController.getUserOrders);
// Get order by ID
router.get('/:id', orderController.getOrderById);
// Cancel order
router.put('/:id/cancel', orderController.cancelOrder);
// Admin routes
// Update order status (admin only)
router.put('/:id/status', (0, auth_middleware_1.authorize)([schema_1.UserRole.ADMIN]), (0, validation_middleware_1.validate)(order_schema_1.updateOrderStatusSchema), orderController.updateOrderStatus);
// Get all orders (admin only)
router.get('/admin/all', (0, auth_middleware_1.authorize)([schema_1.UserRole.ADMIN]), orderController.getAllOrders);
exports.default = router;
