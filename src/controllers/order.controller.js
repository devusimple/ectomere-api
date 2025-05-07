"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_service_1 = require("../services/order.service");
const cart_service_1 = require("../services/cart.service");
const logger_1 = require("../config/logger");
const error_middleware_1 = require("../middlewares/error.middleware");
const schema_1 = require("../db/schema");
class OrderController {
    constructor() {
        /**
         * Create a new order from cart
         */
        this.createOrder = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const { shippingAddressId, billingAddressId, paymentMethod, notes } = req.body;
                // Check if cart has items
                const cart = await this.cartService.getCartByUserId(req.user.id);
                if (!cart || cart.items.length === 0) {
                    return next(new error_middleware_1.ApiError(400, 'Your cart is empty'));
                }
                // Create order from cart
                const order = await this.orderService.createOrderFromCart(req.user.id, {
                    shippingAddressId,
                    billingAddressId,
                    paymentMethod,
                    notes,
                });
                logger_1.logger.info(`Order created: ${order.id} for user ${req.user.id}`);
                res.status(201).json({
                    message: 'Order created successfully',
                    order,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.message === 'Address not found') {
                        return next(new error_middleware_1.ApiError(404, 'Shipping or billing address not found'));
                    }
                    if (error.message === 'Not enough inventory') {
                        return next(new error_middleware_1.ApiError(400, 'One or more products do not have enough inventory'));
                    }
                }
                next(error);
            }
        };
        /**
         * Get user orders
         */
        this.getUserOrders = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const { page = '1', limit = '10', status } = req.query;
                const orders = await this.orderService.getUserOrders(req.user.id, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    status: status,
                });
                res.status(200).json({
                    orders: orders.data,
                    pagination: orders.pagination,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get order by ID
         */
        this.getOrderById = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const orderId = Number(req.params.id);
                const order = await this.orderService.getOrderById(orderId);
                if (!order) {
                    return next(new error_middleware_1.ApiError(404, 'Order not found'));
                }
                // Check if user owns this order or is admin
                if (order.userId !== req.user.id && req.user.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to view this order'));
                }
                res.status(200).json({
                    order,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Cancel order
         */
        this.cancelOrder = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const orderId = Number(req.params.id);
                const order = await this.orderService.getOrderById(orderId);
                if (!order) {
                    return next(new error_middleware_1.ApiError(404, 'Order not found'));
                }
                // Check if user owns this order or is admin
                if (order.userId !== req.user.id && req.user.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to cancel this order'));
                }
                // Check if order can be cancelled
                if (order.status !== 'pending' && order.status !== 'processing') {
                    return next(new error_middleware_1.ApiError(400, 'This order cannot be cancelled'));
                }
                const cancelledOrder = await this.orderService.cancelOrder(orderId);
                logger_1.logger.info(`Order cancelled: ${orderId}`);
                res.status(200).json({
                    message: 'Order cancelled successfully',
                    order: cancelledOrder,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Update order status (admin only)
         */
        this.updateOrderStatus = async (req, res, next) => {
            try {
                // Only admins can update order status
                if (req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only admins can update order status'));
                }
                const orderId = Number(req.params.id);
                const { status } = req.body;
                const order = await this.orderService.getOrderById(orderId);
                if (!order) {
                    return next(new error_middleware_1.ApiError(404, 'Order not found'));
                }
                const updatedOrder = await this.orderService.updateOrderStatus(orderId, status);
                logger_1.logger.info(`Order status updated: ${orderId} to ${status}`);
                res.status(200).json({
                    message: 'Order status updated successfully',
                    order: updatedOrder,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message === 'Invalid order status') {
                    return next(new error_middleware_1.ApiError(400, 'Invalid order status'));
                }
                next(error);
            }
        };
        /**
         * Get all orders (admin only)
         */
        this.getAllOrders = async (req, res, next) => {
            try {
                // Only admins can view all orders
                if (req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only admins can view all orders'));
                }
                const { page = '1', limit = '10', status } = req.query;
                const orders = await this.orderService.getAllOrders({
                    page: parseInt(page),
                    limit: parseInt(limit),
                    status: status,
                });
                res.status(200).json({
                    orders: orders.data,
                    pagination: orders.pagination,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.orderService = new order_service_1.OrderService();
        this.cartService = new cart_service_1.CartService();
    }
}
exports.OrderController = OrderController;
