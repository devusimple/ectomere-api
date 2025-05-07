"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const cart_service_1 = require("../services/cart.service");
const logger_1 = require("../config/logger");
const error_middleware_1 = require("../middlewares/error.middleware");
class CartController {
    constructor() {
        /**
         * Get user's cart
         */
        this.getCart = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const cart = await this.cartService.getCartByUserId(req.user.id);
                res.status(200).json({
                    cart,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Add item to cart
         */
        this.addToCart = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const { productId, variantId, quantity } = req.body;
                const cartItem = await this.cartService.addToCart(req.user.id, {
                    productId,
                    variantId,
                    quantity: quantity || 1,
                });
                logger_1.logger.info(`Item added to cart for user ${req.user.id}`);
                res.status(200).json({
                    message: 'Item added to cart',
                    cartItem,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.message === 'Product not found') {
                        return next(new error_middleware_1.ApiError(404, 'Product not found'));
                    }
                    if (error.message === 'Not enough inventory') {
                        return next(new error_middleware_1.ApiError(400, 'Not enough inventory available'));
                    }
                }
                next(error);
            }
        };
        /**
         * Update cart item
         */
        this.updateCartItem = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const cartItemId = Number(req.params.itemId);
                const { quantity } = req.body;
                // Validate cart item belongs to user
                const cartItem = await this.cartService.getCartItemById(cartItemId);
                if (!cartItem) {
                    return next(new error_middleware_1.ApiError(404, 'Cart item not found'));
                }
                const cart = await this.cartService.getCartById(cartItem.cartId);
                if (!cart || cart.userId !== req.user.id) {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to update this cart item'));
                }
                const updatedCartItem = await this.cartService.updateCartItem(cartItemId, {
                    quantity,
                });
                logger_1.logger.info(`Cart item updated for user ${req.user.id}`);
                res.status(200).json({
                    message: 'Cart item updated',
                    cartItem: updatedCartItem,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message === 'Not enough inventory') {
                    return next(new error_middleware_1.ApiError(400, 'Not enough inventory available'));
                }
                next(error);
            }
        };
        /**
         * Remove item from cart
         */
        this.removeFromCart = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const cartItemId = Number(req.params.itemId);
                // Validate cart item belongs to user
                const cartItem = await this.cartService.getCartItemById(cartItemId);
                if (!cartItem) {
                    return next(new error_middleware_1.ApiError(404, 'Cart item not found'));
                }
                const cart = await this.cartService.getCartById(cartItem.cartId);
                if (!cart || cart.userId !== req.user.id) {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to remove this cart item'));
                }
                await this.cartService.removeFromCart(cartItemId);
                logger_1.logger.info(`Item removed from cart for user ${req.user.id}`);
                res.status(200).json({
                    message: 'Item removed from cart',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Clear cart
         */
        this.clearCart = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                await this.cartService.clearCart(req.user.id);
                logger_1.logger.info(`Cart cleared for user ${req.user.id}`);
                res.status(200).json({
                    message: 'Cart cleared',
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.cartService = new cart_service_1.CartService();
    }
}
exports.CartController = CartController;
