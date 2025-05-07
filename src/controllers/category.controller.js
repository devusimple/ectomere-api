"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("../services/category.service");
const logger_1 = require("../config/logger");
const error_middleware_1 = require("../middlewares/error.middleware");
const schema_1 = require("../db/schema");
class CategoryController {
    constructor() {
        /**
         * Get all categories
         */
        this.getAllCategories = async (req, res, next) => {
            try {
                const categories = await this.categoryService.getAllCategories();
                res.status(200).json({
                    categories,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get category by ID
         */
        this.getCategoryById = async (req, res, next) => {
            try {
                const categoryId = Number(req.params.id);
                const category = await this.categoryService.getCategoryById(categoryId);
                if (!category) {
                    return next(new error_middleware_1.ApiError(404, 'Category not found'));
                }
                res.status(200).json({
                    category,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Create a new category (admin only)
         */
        this.createCategory = async (req, res, next) => {
            try {
                // Only admins can create categories
                if (req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only admins can create categories'));
                }
                const { name, description, parentId } = req.body;
                const category = await this.categoryService.createCategory({
                    name,
                    description,
                    parentId,
                });
                logger_1.logger.info(`Category created: ${category.id}`);
                res.status(201).json({
                    message: 'Category created successfully',
                    category,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
                    return next(new error_middleware_1.ApiError(409, 'A category with this name already exists'));
                }
                next(error);
            }
        };
        /**
         * Update category (admin only)
         */
        this.updateCategory = async (req, res, next) => {
            try {
                // Only admins can update categories
                if (req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only admins can update categories'));
                }
                const categoryId = Number(req.params.id);
                const { name, description, parentId } = req.body;
                const updatedCategory = await this.categoryService.updateCategory(categoryId, {
                    name,
                    description,
                    parentId,
                });
                if (!updatedCategory) {
                    return next(new error_middleware_1.ApiError(404, 'Category not found'));
                }
                logger_1.logger.info(`Category updated: ${categoryId}`);
                res.status(200).json({
                    message: 'Category updated successfully',
                    category: updatedCategory,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
                    return next(new error_middleware_1.ApiError(409, 'A category with this name already exists'));
                }
                next(error);
            }
        };
        /**
         * Delete category (admin only)
         */
        this.deleteCategory = async (req, res, next) => {
            try {
                // Only admins can delete categories
                if (req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only admins can delete categories'));
                }
                const categoryId = Number(req.params.id);
                // Check if the category has subcategories
                const hasSubcategories = await this.categoryService.hasSubcategories(categoryId);
                if (hasSubcategories) {
                    return next(new error_middleware_1.ApiError(400, 'Cannot delete a category that has subcategories'));
                }
                // Check if the category is assigned to products
                const hasProducts = await this.categoryService.hasProducts(categoryId);
                if (hasProducts) {
                    return next(new error_middleware_1.ApiError(400, 'Cannot delete a category that is assigned to products'));
                }
                const success = await this.categoryService.deleteCategory(categoryId);
                if (!success) {
                    return next(new error_middleware_1.ApiError(404, 'Category not found'));
                }
                logger_1.logger.info(`Category deleted: ${categoryId}`);
                res.status(200).json({
                    message: 'Category deleted successfully',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get products by category
         */
        this.getProductsByCategory = async (req, res, next) => {
            try {
                const categoryId = Number(req.params.id);
                const { page = '1', limit = '10' } = req.query;
                // Check if category exists
                const category = await this.categoryService.getCategoryById(categoryId);
                if (!category) {
                    return next(new error_middleware_1.ApiError(404, 'Category not found'));
                }
                const products = await this.categoryService.getProductsByCategory(categoryId, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                });
                res.status(200).json({
                    category,
                    products: products.data,
                    pagination: products.pagination,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.categoryService = new category_service_1.CategoryService();
    }
}
exports.CategoryController = CategoryController;
