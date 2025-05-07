"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const auth_schema_1 = require("../validation/auth.schema");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rate_limiter_middleware_1 = require("../middlewares/rate-limiter.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Apply rate limiter to auth routes
router.use(rate_limiter_middleware_1.authRateLimiter);
// Register new user
router.post('/register', (0, validation_middleware_1.validate)(auth_schema_1.registerSchema), authController.register);
// Login
router.post('/login', (0, validation_middleware_1.validate)(auth_schema_1.loginSchema), authController.login);
// Refresh token
router.post('/refresh-token', (0, validation_middleware_1.validate)(auth_schema_1.refreshTokenSchema), authController.refreshToken);
// Logout
router.post('/logout', authController.logout);
// Get current user profile
router.get('/me', auth_middleware_1.authenticate, authController.getCurrentUser);
exports.default = router;
