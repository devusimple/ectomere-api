"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const logger_1 = require("../config/logger");
const error_middleware_1 = require("../middlewares/error.middleware");
class AuthController {
    constructor() {
        /**
         * Register a new user
         */
        this.register = async (req, res, next) => {
            try {
                const { email, password, firstName, lastName, role } = req.body;
                const user = await this.authService.register({
                    email,
                    password,
                    firstName,
                    lastName,
                    role,
                });
                // Generate tokens
                const { accessToken, refreshToken } = await this.authService.generateTokens(user);
                logger_1.logger.info(`User registered successfully: ${user.email}`);
                res.status(201).json({
                    message: 'Registration successful',
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                    },
                    accessToken,
                    refreshToken,
                });
            }
            catch (error) {
                // Handle duplicate email
                if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
                    return next(new error_middleware_1.ApiError(409, 'Email is already in use'));
                }
                next(error);
            }
        };
        /**
         * Login user
         */
        this.login = async (req, res, next) => {
            try {
                const { email, password } = req.body;
                // Authenticate user
                const user = await this.authService.login(email, password);
                if (!user) {
                    return next(new error_middleware_1.ApiError(401, 'Invalid email or password'));
                }
                // Generate tokens
                const { accessToken, refreshToken } = await this.authService.generateTokens(user);
                logger_1.logger.info(`User logged in: ${user.email}`);
                res.status(200).json({
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                    },
                    accessToken,
                    refreshToken,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Refresh access token
         */
        this.refreshToken = async (req, res, next) => {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    return next(new error_middleware_1.ApiError(400, 'Refresh token is required'));
                }
                // Verify and generate new tokens
                const tokens = await this.authService.refreshTokens(refreshToken);
                res.status(200).json({
                    message: 'Token refreshed successfully',
                    ...tokens,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message === 'Invalid refresh token') {
                    return next(new error_middleware_1.ApiError(401, 'Invalid refresh token'));
                }
                next(error);
            }
        };
        /**
         * Logout user
         */
        this.logout = async (req, res, next) => {
            try {
                const { refreshToken } = req.body;
                if (refreshToken) {
                    // Revoke refresh token
                    await this.authService.revokeRefreshToken(refreshToken);
                }
                res.status(200).json({
                    message: 'Logout successful',
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get current user profile
         */
        this.getCurrentUser = async (req, res, next) => {
            try {
                if (!req.user) {
                    return next(new error_middleware_1.ApiError(401, 'Authentication required'));
                }
                const user = await this.authService.getUserById(req.user.id);
                if (!user) {
                    return next(new error_middleware_1.ApiError(404, 'User not found'));
                }
                res.status(200).json({
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.authService = new auth_service_1.AuthService();
    }
}
exports.AuthController = AuthController;
