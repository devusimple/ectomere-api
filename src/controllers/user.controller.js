"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const logger_1 = require("../config/logger");
const error_middleware_1 = require("../middlewares/error.middleware");
class UserController {
    constructor() {
        /**
         * Get user profile
         */
        this.getUserProfile = async (req, res, next) => {
            try {
                const userId = Number(req.params.id);
                // Check if user is accessing their own profile or is an admin
                if (req.user?.id !== userId && req.user?.role !== 'admin') {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to access this resource'));
                }
                const user = await this.userService.getUserById(userId);
                if (!user) {
                    return next(new error_middleware_1.ApiError(404, 'User not found'));
                }
                res.status(200).json({
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        role: user.role,
                        createdAt: user.createdAt,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Update user profile
         */
        this.updateUserProfile = async (req, res, next) => {
            try {
                const userId = Number(req.params.id);
                // Check if user is updating their own profile or is an admin
                if (req.user?.id !== userId && req.user?.role !== 'admin') {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to update this profile'));
                }
                const { firstName, lastName, phone } = req.body;
                const updatedUser = await this.userService.updateUser(userId, {
                    firstName,
                    lastName,
                    phone,
                });
                if (!updatedUser) {
                    return next(new error_middleware_1.ApiError(404, 'User not found'));
                }
                logger_1.logger.info(`User profile updated: ${updatedUser.email}`);
                res.status(200).json({
                    message: 'Profile updated successfully',
                    user: {
                        id: updatedUser.id,
                        email: updatedUser.email,
                        firstName: updatedUser.firstName,
                        lastName: updatedUser.lastName,
                        phone: updatedUser.phone,
                        role: updatedUser.role,
                        updatedAt: updatedUser.updatedAt,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Change user password
         */
        this.changePassword = async (req, res, next) => {
            try {
                const userId = Number(req.params.id);
                // Check if user is changing their own password or is an admin
                if (req.user?.id !== userId && req.user?.role !== 'admin') {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to change this password'));
                }
                const { currentPassword, newPassword } = req.body;
                // Change password
                const success = await this.userService.changePassword(userId, currentPassword, newPassword);
                if (!success) {
                    return next(new error_middleware_1.ApiError(400, 'Current password is incorrect'));
                }
                logger_1.logger.info(`Password changed for user ID: ${userId}`);
                res.status(200).json({
                    message: 'Password changed successfully',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get user addresses
         */
        this.getUserAddresses = async (req, res, next) => {
            try {
                const userId = Number(req.params.id);
                // Check if user is accessing their own addresses or is an admin
                if (req.user?.id !== userId && req.user?.role !== 'admin') {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to access these addresses'));
                }
                const addresses = await this.userService.getUserAddresses(userId);
                res.status(200).json({
                    addresses,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Add user address
         */
        this.addUserAddress = async (req, res, next) => {
            try {
                const userId = Number(req.params.id);
                // Check if user is adding to their own addresses or is an admin
                if (req.user?.id !== userId && req.user?.role !== 'admin') {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to add addresses for this user'));
                }
                const { type, addressLine1, addressLine2, city, state, postalCode, country, isDefault, } = req.body;
                const newAddress = await this.userService.addUserAddress(userId, {
                    type,
                    addressLine1,
                    addressLine2,
                    city,
                    state,
                    postalCode,
                    country,
                    isDefault,
                });
                logger_1.logger.info(`Address added for user ID: ${userId}`);
                res.status(201).json({
                    message: 'Address added successfully',
                    address: newAddress,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Update user address
         */
        this.updateUserAddress = async (req, res, next) => {
            try {
                const userId = Number(req.params.id);
                const addressId = Number(req.params.addressId);
                // Check if user is updating their own address or is an admin
                if (req.user?.id !== userId && req.user?.role !== 'admin') {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to update this address'));
                }
                const { type, addressLine1, addressLine2, city, state, postalCode, country, isDefault, } = req.body;
                const updatedAddress = await this.userService.updateUserAddress(userId, addressId, {
                    type,
                    addressLine1,
                    addressLine2,
                    city,
                    state,
                    postalCode,
                    country,
                    isDefault,
                });
                if (!updatedAddress) {
                    return next(new error_middleware_1.ApiError(404, 'Address not found'));
                }
                logger_1.logger.info(`Address updated for user ID: ${userId}`);
                res.status(200).json({
                    message: 'Address updated successfully',
                    address: updatedAddress,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Delete user address
         */
        this.deleteUserAddress = async (req, res, next) => {
            try {
                const userId = Number(req.params.id);
                const addressId = Number(req.params.addressId);
                // Check if user is deleting their own address or is an admin
                if (req.user?.id !== userId && req.user?.role !== 'admin') {
                    return next(new error_middleware_1.ApiError(403, 'You do not have permission to delete this address'));
                }
                const success = await this.userService.deleteUserAddress(userId, addressId);
                if (!success) {
                    return next(new error_middleware_1.ApiError(404, 'Address not found'));
                }
                logger_1.logger.info(`Address deleted for user ID: ${userId}`);
                res.status(200).json({
                    message: 'Address deleted successfully',
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.userService = new user_service_1.UserService();
    }
}
exports.UserController = UserController;
