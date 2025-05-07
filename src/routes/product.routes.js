"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const product_schema_1 = require("../validation/product.schema");
const schema_1 = require("../db/schema");
const router = (0, express_1.Router)();
const productController = new product_controller_1.ProductController();
// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/vendor/:vendorId', productController.getVendorProducts);
// Protected routes (require authentication)
router.use(auth_middleware_1.authenticate);
// Create product (vendor and admin only)
router.post('/', (0, auth_middleware_1.authorize)([schema_1.UserRole.VENDOR, schema_1.UserRole.ADMIN]), (0, validation_middleware_1.validate)(product_schema_1.productSchema), productController.createProduct);
// Update product (vendor and admin only)
router.put('/:id', (0, auth_middleware_1.authorize)([schema_1.UserRole.VENDOR, schema_1.UserRole.ADMIN]), (0, validation_middleware_1.validate)(product_schema_1.updateProductSchema), productController.updateProduct);
// Delete product (vendor and admin only)
router.delete('/:id', (0, auth_middleware_1.authorize)([schema_1.UserRole.VENDOR, schema_1.UserRole.ADMIN]), productController.deleteProduct);
exports.default = router;
