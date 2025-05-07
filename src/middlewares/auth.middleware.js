"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeOwnership = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../config/logger");
const schema_1 = require("../db/schema");
/**
 * Middleware to authenticate JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = await (0, jwt_1.verifyToken)(token);
            // Add user info to request object
            req.user = decoded;
            next();
        }
        catch (error) {
            logger_1.logger.error('Token verification failed:', error);
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token',
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error:', error);
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to check if user has required role
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to access this resource',
            });
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Middleware to check if user is accessing their own data or is an admin
 */
const authorizeOwnership = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }
    const resourceUserId = parseInt(req.params.id);
    // Allow if user is admin or accessing their own data
    if (req.user.role === schema_1.UserRole.ADMIN || req.user.id === resourceUserId) {
        return next();
    }
    return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
    });
};
exports.authorizeOwnership = authorizeOwnership;
