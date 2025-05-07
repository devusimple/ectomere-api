"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("../services/product.service");
const logger_1 = require("../config/logger");
const error_middleware_1 = require("../middlewares/error.middleware");
const schema_1 = require("../db/schema");
const vendor_service_1 = require("../services/vendor.service");
class ProductController {
    constructor() {
        /**
         * Get all products
         */
        this.getAllProducts = async (req, res, next) => {
            try {
                const { page = '1', limit = '10', category, sort, minPrice, maxPrice } = req.query;
                const products = await this.productService.getAllProducts({
                    page: parseInt(page),
                    limit: parseInt(limit),
                    category: category,
                    sort: sort,
                    minPrice: minPrice ? parseFloat(minPrice) : undefined,
                    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                });
                res.status(200).json({
                    products: products.data,
                    pagination: products.pagination,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get product by ID
         */
        this.getProductById = async (req, res, next) => {
            try {
                const productId = Number(req.params.id);
                const product = await this.productService.getProductById(productId);
                if (!product) {
                    return next(new error_middleware_1.ApiError(404, 'Product not found'));
                }
                res.status(200).json({
                    product,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Create a new product (vendor only)
         */
        this.createProduct = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                // Only vendors and admins can create products
                if (req.user.role !== schema_1.UserRole.VENDOR && req.user.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only vendors can create products'));
                }
                // Get vendor ID
                let vendorId;
                if (req.user.role === schema_1.UserRole.VENDOR) {
                    const vendor = await this.vendorService.getVendorByUserId(req.user.id);
                    if (!vendor) {
                        return next(new error_middleware_1.ApiError(404, 'Vendor profile not found'));
                    }
                    if (!vendor.isApproved) {
                        return next(new error_middleware_1.ApiError(403, 'Your vendor account is not yet approved'));
                    }
                    vendorId = vendor.id;
                }
                else {
                    // Admin can create product for a specific vendor
                    vendorId = Number(req.body.vendorId);
                    if (!vendorId) {
                        return next(new error_middleware_1.ApiError(400, 'Vendor ID is required when admin creates a product'));
                    }
                }
                const { name, description, price, comparePrice, sku, inventory, categories, tags, } = req.body;
                const product = await this.productService.createProduct({
                    vendorId,
                    name,
                    description,
                    price,
                    comparePrice,
                    sku,
                    inventory,
                    categories,
                    tags,
                });
                logger_1.logger.info(`Product created: ${product.id}`);
                res.status(201).json({
                    message: 'Product created successfully',
                    product,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
                    return next(new error_middleware_1.ApiError(400, 'Invalid category or tag ID'));
                }
                next(error);
            }
        };
        /**
         * Update product (vendor only)
         */
        this.updateProduct = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const productId = Number(req.params.id);
                // Get the product
                const product = await this.productService.getProductById(productId);
                if (!product) {
                    return next(new error_middleware_1.ApiError(404, 'Product not found'));
                }
                // If user is a vendor, ensure they own the product
                if (req.user.role === schema_1.UserRole.VENDOR) {
                    const vendor = await this.vendorService.getVendorByUserId(req.user.id);
                    if (!vendor) {
                        return next(new error_middleware_1.ApiError(404, 'Vendor profile not found'));
                    }
                    if (product.vendorId !== vendor.id) {
                        return next(new error_middleware_1.ApiError(403, 'You can only update your own products'));
                    }
                }
                else if (req.user.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only vendors and admins can update products'));
                }
                const { name, description, price, comparePrice, sku, inventory, isActive, categories, tags, } = req.body;
                const updatedProduct = await this.productService.updateProduct(productId, {
                    name,
                    description,
                    price,
                    comparePrice,
                    sku,
                    inventory,
                    isActive,
                    categories,
                    tags,
                });
                logger_1.logger.info(`Product updated: ${productId}`);
                res.status(200).json({
                    message: 'Product updated successfully',
                    product: updatedProduct,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Delete product (vendor or admin only)
         */
        this.deleteProduct = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const productId = Number(req.params.id);
                // Get the product
                const product = await this.productService.getProductById(productId);
                if (!product) {
                    return next(new error_middleware_1.ApiError(404, 'Product not found'));
                }
                // If user is a vendor, ensure they own the product
                if (req.user.role === schema_1.UserRole.VENDOR) {
                    const vendor = await this.vendorService.getVendorByUserId(req.user.id);
                    if (!vendor) {
                        return next(new error_middleware_1.ApiError(404, 'Vendor profile not found'));
                    }
                    if (product.vendorId !== vendor.id) {
                        return next(new error_middleware_1.ApiError(403, 'You can only delete your own products'));
                    }
                }
                else if (req.user.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only vendors and admins can delete products'));
                }
                // Delete the product
                await this.productService.deleteProduct(productId);
                logger_1.logger.info(`Product deleted: ${productId}`);
                res.status(200).json({
                    message: 'Product deleted successfully',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get vendor products
         */
        this.getVendorProducts = async (req, res, next) => {
            try {
                const vendorId = Number(req.params.vendorId);
                const { page = '1', limit = '10' } = req.query;
                // Check if vendor exists
                const vendor = await this.vendorService.getVendorById(vendorId);
                if (!vendor) {
                    return next(new error_middleware_1.ApiError(404, 'Vendor not found'));
                }
                const products = await this.productService.getProductsByVendor(vendorId, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                });
                res.status(200).json({
                    products: products.data,
                    pagination: products.pagination,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.productService = new product_service_1.ProductService();
        this.vendorService = new vendor_service_1.VendorService();
    }
}
exports.ProductController = ProductController;
