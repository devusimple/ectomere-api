"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const product_schema_1 = require("../validation/product.schema");
const schema_1 = require("../db/schema");
const router = (0, express_1.Router)();
const categoryController = new category_controller_1.CategoryController();
// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/products', categoryController.getProductsByCategory);
// Protected routes (require authentication and admin role)
router.use(auth_middleware_1.authenticate);
router.use((0, auth_middleware_1.authorize)([schema_1.UserRole.ADMIN]));
// Create category (admin only)
router.post('/', (0, validation_middleware_1.validate)(product_schema_1.categorySchema), categoryController.createCategory);
// Update category (admin only)
router.put('/:id', (0, validation_middleware_1.validate)(product_schema_1.categorySchema), categoryController.updateCategory);
// Delete category (admin only)
router.delete('/:id', categoryController.deleteCategory);
exports.default = router;
