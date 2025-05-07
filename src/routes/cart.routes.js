"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const cart_schema_1 = require("../validation/cart.schema");
const router = (0, express_1.Router)();
const cartController = new cart_controller_1.CartController();
// Protect all cart routes with authentication
router.use(auth_middleware_1.authenticate);
// Get user's cart
router.get('/', cartController.getCart);
// Add item to cart
router.post('/items', (0, validation_middleware_1.validate)(cart_schema_1.addToCartSchema), cartController.addToCart);
// Update cart item
router.put('/items/:itemId', (0, validation_middleware_1.validate)(cart_schema_1.updateCartItemSchema), cartController.updateCartItem);
// Remove item from cart
router.delete('/items/:itemId', cartController.removeFromCart);
// Clear cart
router.delete('/', cartController.clearCart);
exports.default = router;
