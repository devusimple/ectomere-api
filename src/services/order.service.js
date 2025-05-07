"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const cart_service_1 = require("./cart.service");
const orderNumber_1 = require("../utils/orderNumber");
class OrderService {
    constructor() {
        this.cartService = new cart_service_1.CartService();
    }
    /**
     * Create order from cart
     */
    async createOrderFromCart(userId, orderData) {
        // Start database transaction
        return await db_1.db.transaction(async (tx) => {
            // Get user's cart
            const cart = await this.cartService.getCartByUserId(userId);
            if (!cart || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }
            // Verify addresses exist and belong to user
            const [shippingAddress] = await tx
                .select()
                .from(schema_1.addresses)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.id, orderData.shippingAddressId), (0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId)));
            if (!shippingAddress) {
                throw new Error('Address not found');
            }
            let billingAddress = null;
            if (orderData.billingAddressId) {
                [billingAddress] = await tx
                    .select()
                    .from(schema_1.addresses)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.id, orderData.billingAddressId), (0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId)));
                if (!billingAddress) {
                    throw new Error('Address not found');
                }
            }
            // Check inventory for all items
            for (const item of cart.items) {
                let inventory = 0;
                if (item.variantId) {
                    const [variant] = await tx
                        .select({ inventory: schema_1.productVariants.inventory })
                        .from(schema_1.productVariants)
                        .where((0, drizzle_orm_1.eq)(schema_1.productVariants.id, item.variantId));
                    inventory = variant?.inventory || 0;
                }
                else {
                    const [product] = await tx
                        .select({ inventory: schema_1.products.inventory })
                        .from(schema_1.products)
                        .where((0, drizzle_orm_1.eq)(schema_1.products.id, item.productId));
                    inventory = product?.inventory || 0;
                }
                if (inventory < item.quantity) {
                    throw new Error('Not enough inventory');
                }
            }
            // Calculate order totals
            const subtotal = cart.subtotal;
            const tax = subtotal * 0.1; // 10% tax
            const shippingCost = 0; // Free shipping for now
            const total = subtotal + tax + shippingCost;
            // Create order
            const orderNumber = (0, orderNumber_1.generateOrderNumber)();
            const [order] = await tx
                .insert(schema_1.orders)
                .values({
                userId,
                orderNumber,
                status: schema_1.OrderStatus.PENDING,
                subtotal,
                tax,
                shippingCost,
                total,
                shippingAddressId: shippingAddress.id,
                billingAddressId: billingAddress?.id || null,
                paymentMethod: orderData.paymentMethod,
                paymentStatus: 'pending',
                notes: orderData.notes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
                .returning();
            // Create order items
            for (const item of cart.items) {
                // Get product details
                const [product] = await tx
                    .select()
                    .from(schema_1.products)
                    .where((0, drizzle_orm_1.eq)(schema_1.products.id, item.productId));
                // Create order item
                await tx.insert(schema_1.orderItems).values({
                    orderId: order.id,
                    productId: item.productId,
                    variantId: item.variantId,
                    name: product.name,
                    sku: item.sku,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                });
                // Update inventory
                if (item.variantId) {
                    await tx
                        .update(schema_1.productVariants)
                        .set({
                        inventory: (0, drizzle_orm_1.sql) `${schema_1.productVariants.inventory} - ${item.quantity}`,
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.productVariants.id, item.variantId));
                }
                else {
                    await tx
                        .update(schema_1.products)
                        .set({
                        inventory: (0, drizzle_orm_1.sql) `${schema_1.products.inventory} - ${item.quantity}`,
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.products.id, item.productId));
                }
            }
            // Clear cart
            const [userCart] = await tx
                .select()
                .from(schema_1.carts)
                .where((0, drizzle_orm_1.eq)(schema_1.carts.userId, userId));
            if (userCart) {
                await tx
                    .delete(schema_1.cartItems)
                    .where((0, drizzle_orm_1.eq)(schema_1.cartItems.cartId, userCart.id));
            }
            // Get complete order with items
            const completeOrder = await this.getOrderById(order.id);
            return completeOrder;
        });
    }
    /**
     * Get order by ID
     */
    async getOrderById(id) {
        const [order] = await db_1.db
            .select()
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.eq)(schema_1.orders.id, id));
        if (!order) {
            return null;
        }
        // Get order items
        const orderItemsResult = await db_1.db
            .select()
            .from(schema_1.orderItems)
            .where((0, drizzle_orm_1.eq)(schema_1.orderItems.orderId, id));
        // Get shipping and billing addresses
        let shippingAddress = null;
        if (order.shippingAddressId) {
            [shippingAddress] = await db_1.db
                .select()
                .from(schema_1.addresses)
                .where((0, drizzle_orm_1.eq)(schema_1.addresses.id, order.shippingAddressId));
        }
        let billingAddress = null;
        if (order.billingAddressId) {
            [billingAddress] = await db_1.db
                .select()
                .from(schema_1.addresses)
                .where((0, drizzle_orm_1.eq)(schema_1.addresses.id, order.billingAddressId));
        }
        return {
            ...order,
            items: orderItemsResult,
            shippingAddress,
            billingAddress,
        };
    }
    /**
     * Get user orders
     */
    async getUserOrders(userId, options = {}) {
        const { page = 1, limit = 10, status } = options;
        const offset = (page - 1) * limit;
        // Build query
        let query = db_1.db
            .select()
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.eq)(schema_1.orders.userId, userId));
        if (status) {
            query = query.where((0, drizzle_orm_1.eq)(schema_1.orders.status, status));
        }
        // Count total orders
        let countQuery = db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.eq)(schema_1.orders.userId, userId));
        if (status) {
            countQuery = countQuery.where((0, drizzle_orm_1.eq)(schema_1.orders.status, status));
        }
        // Apply pagination and sorting
        query = query
            .orderBy((0, drizzle_orm_1.desc)(schema_1.orders.createdAt))
            .limit(limit)
            .offset(offset);
        // Execute queries
        const [totalResult] = await countQuery;
        const ordersResult = await query;
        // Get order items for each order
        const orderIds = ordersResult.map(order => order.id);
        let orderItems = {};
        if (orderIds.length > 0) {
            const allOrderItems = await db_1.db
                .select()
                .from(orderItems)
                .where((0, drizzle_orm_1.inArray)(orderItems.orderId, orderIds));
            // Group by order ID
            orderItems = allOrderItems.reduce((acc, item) => {
                if (!acc[item.orderId]) {
                    acc[item.orderId] = [];
                }
                acc[item.orderId].push(item);
                return acc;
            }, {});
        }
        // Add items to orders
        const ordersWithItems = ordersResult.map(order => ({
            ...order,
            items: orderItems[order.id] || [],
        }));
        const total = totalResult?.count || 0;
        const totalPages = Math.ceil(total / limit);
        return {
            data: ordersWithItems,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    /**
     * Get all orders (admin only)
     */
    async getAllOrders(options = {}) {
        const { page = 1, limit = 10, status } = options;
        const offset = (page - 1) * limit;
        // Build query
        let query = db_1.db
            .select()
            .from(schema_1.orders);
        if (status) {
            query = query.where((0, drizzle_orm_1.eq)(schema_1.orders.status, status));
        }
        // Count total orders
        let countQuery = db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.orders);
        if (status) {
            countQuery = countQuery.where((0, drizzle_orm_1.eq)(schema_1.orders.status, status));
        }
        // Apply pagination and sorting
        query = query
            .orderBy((0, drizzle_orm_1.desc)(schema_1.orders.createdAt))
            .limit(limit)
            .offset(offset);
        // Execute queries
        const [totalResult] = await countQuery;
        const ordersResult = await query;
        // Get order items for each order
        const orderIds = ordersResult.map(order => order.id);
        let orderItemsMap = {};
        if (orderIds.length > 0) {
            const allOrderItems = await db_1.db
                .select()
                .from(schema_1.orderItems)
                .where((0, drizzle_orm_1.inArray)(schema_1.orderItems.orderId, orderIds));
            // Group by order ID
            orderItemsMap = allOrderItems.reduce((acc, item) => {
                if (!acc[item.orderId]) {
                    acc[item.orderId] = [];
                }
                acc[item.orderId].push(item);
                return acc;
            }, {});
        }
        // Add items to orders
        const ordersWithItems = ordersResult.map(order => ({
            ...order,
            items: orderItemsMap[order.id] || [],
        }));
        const total = totalResult?.count || 0;
        const totalPages = Math.ceil(total / limit);
        return {
            data: ordersWithItems,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    /**
     * Cancel order
     */
    async cancelOrder(orderId) {
        // Start database transaction
        return await db_1.db.transaction(async (tx) => {
            // Get order
            const [order] = await tx
                .select()
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId));
            if (!order) {
                throw new Error('Order not found');
            }
            // Check if order can be cancelled
            if (order.status !== schema_1.OrderStatus.PENDING &&
                order.status !== schema_1.OrderStatus.PROCESSING) {
                throw new Error('Order cannot be cancelled');
            }
            // Update order status
            await tx
                .update(schema_1.orders)
                .set({
                status: schema_1.OrderStatus.CANCELLED,
                updatedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId));
            // Get order items
            const orderItemsList = await tx
                .select()
                .from(schema_1.orderItems)
                .where((0, drizzle_orm_1.eq)(schema_1.orderItems.orderId, orderId));
            // Restore inventory
            for (const item of orderItemsList) {
                if (item.variantId) {
                    await tx
                        .update(schema_1.productVariants)
                        .set({
                        inventory: (0, drizzle_orm_1.sql) `${schema_1.productVariants.inventory} + ${item.quantity}`,
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.productVariants.id, item.variantId));
                }
                else {
                    await tx
                        .update(schema_1.products)
                        .set({
                        inventory: (0, drizzle_orm_1.sql) `${schema_1.products.inventory} + ${item.quantity}`,
                    })
                        .where((0, drizzle_orm_1.eq)(schema_1.products.id, item.productId));
                }
            }
            // Get updated order
            return this.getOrderById(orderId);
        });
    }
    /**
     * Update order status
     */
    async updateOrderStatus(orderId, status) {
        // Validate status
        if (!Object.values(schema_1.OrderStatus).includes(status)) {
            throw new Error('Invalid order status');
        }
        const [updatedOrder] = await db_1.db
            .update(schema_1.orders)
            .set({
            status: status,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId))
            .returning();
        return this.getOrderById(updatedOrder.id);
    }
}
exports.OrderService = OrderService;
