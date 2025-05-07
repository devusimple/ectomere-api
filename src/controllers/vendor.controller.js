"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorController = void 0;
const vendor_service_1 = require("../services/vendor.service");
const logger_1 = require("../config/logger");
const error_middleware_1 = require("../middlewares/error.middleware");
const schema_1 = require("../db/schema");
class VendorController {
    constructor() {
        /**
         * Register as a vendor
         */
        this.registerVendor = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                // Only customers can register as vendors
                if (req.user.role !== schema_1.UserRole.CUSTOMER) {
                    return next(new error_middleware_1.ApiError(400, 'Only customers can register as vendors'));
                }
                const { businessName, description } = req.body;
                // Check if user already registered as vendor
                const existingVendor = await this.vendorService.getVendorByUserId(req.user.id);
                if (existingVendor) {
                    return next(new error_middleware_1.ApiError(409, 'You are already registered as a vendor'));
                }
                const vendor = await this.vendorService.registerVendor(req.user.id, {
                    businessName,
                    description,
                });
                logger_1.logger.info(`User ${req.user.id} registered as vendor: ${businessName}`);
                res.status(201).json({
                    message: 'Vendor registration submitted successfully. Pending approval.',
                    vendor: {
                        id: vendor.id,
                        businessName: vendor.businessName,
                        description: vendor.description,
                        isApproved: vendor.isApproved,
                        createdAt: vendor.createdAt,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get vendor profile
         */
        this.getVendorProfile = async (req, res, next) => {
            try {
                const vendorId = Number(req.params.id);
                const vendor = await this.vendorService.getVendorById(vendorId);
                if (!vendor) {
                    return next(new error_middleware_1.ApiError(404, 'Vendor not found'));
                }
                // Only allow vendor to view their own profile or admin
                if (req.user?.id !== vendor.userId &&
                    req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to view this vendor profile'));
                }
                res.status(200).json({
                    vendor: {
                        id: vendor.id,
                        businessName: vendor.businessName,
                        description: vendor.description,
                        isApproved: vendor.isApproved,
                        createdAt: vendor.createdAt,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Update vendor profile
         */
        this.updateVendorProfile = async (req, res, next) => {
            try {
                const vendorId = Number(req.params.id);
                const vendor = await this.vendorService.getVendorById(vendorId);
                if (!vendor) {
                    return next(new error_middleware_1.ApiError(404, 'Vendor not found'));
                }
                // Only allow vendor to update their own profile or admin
                if (req.user?.id !== vendor.userId &&
                    req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to update this vendor profile'));
                }
                const { businessName, description } = req.body;
                const updatedVendor = await this.vendorService.updateVendor(vendorId, {
                    businessName,
                    description,
                });
                logger_1.logger.info(`Vendor profile updated: ${updatedVendor.id}`);
                res.status(200).json({
                    message: 'Vendor profile updated successfully',
                    vendor: {
                        id: updatedVendor.id,
                        businessName: updatedVendor.businessName,
                        description: updatedVendor.description,
                        isApproved: updatedVendor.isApproved,
                        updatedAt: updatedVendor.updatedAt,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Approve vendor (admin only)
         */
        this.approveVendor = async (req, res, next) => {
            try {
                // Only admins can approve vendors
                if (req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only admins can approve vendors'));
                }
                const vendorId = Number(req.params.id);
                const vendor = await this.vendorService.getVendorById(vendorId);
                if (!vendor) {
                    return next(new error_middleware_1.ApiError(404, 'Vendor not found'));
                }
                if (vendor.isApproved) {
                    return next(new error_middleware_1.ApiError(400, 'Vendor is already approved'));
                }
                const approvedVendor = await this.vendorService.approveVendor(vendorId);
                // Update user role to vendor
                await this.vendorService.updateUserToVendorRole(vendor.userId);
                logger_1.logger.info(`Vendor approved: ${vendorId}`);
                res.status(200).json({
                    message: 'Vendor approved successfully',
                    vendor: {
                        id: approvedVendor.id,
                        businessName: approvedVendor.businessName,
                        isApproved: approvedVendor.isApproved,
                        updatedAt: approvedVendor.updatedAt,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get all vendors (admin only)
         */
        this.getAllVendors = async (req, res, next) => {
            try {
                // Only admins can view all vendors
                if (req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only admins can view all vendors'));
                }
                const vendors = await this.vendorService.getAllVendors();
                res.status(200).json({
                    vendors: vendors.map(vendor => ({
                        id: vendor.id,
                        userId: vendor.userId,
                        businessName: vendor.businessName,
                        description: vendor.description,
                        isApproved: vendor.isApproved,
                        createdAt: vendor.createdAt,
                    })),
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get pending vendor applications (admin only)
         */
        this.getPendingVendors = async (req, res, next) => {
            try {
                // Only admins can view pending vendors
                if (req.user?.role !== schema_1.UserRole.ADMIN) {
                    return next(new error_middleware_1.ApiError(403, 'Only admins can view pending vendors'));
                }
                const pendingVendors = await this.vendorService.getPendingVendors();
                res.status(200).json({
                    vendors: pendingVendors.map(vendor => ({
                        id: vendor.id,
                        userId: vendor.userId,
                        businessName: vendor.businessName,
                        description: vendor.description,
                        createdAt: vendor.createdAt,
                    })),
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.vendorService = new vendor_service_1.VendorService();
    }
}
exports.VendorController = VendorController;
