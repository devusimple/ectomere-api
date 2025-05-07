"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const user_schema_1 = require("../validation/user.schema");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
// Protect all user routes with authentication
router.use(auth_middleware_1.authenticate);
// Get user profile
router.get('/:id', auth_middleware_1.authorizeOwnership, userController.getUserProfile);
// Update user profile
router.put('/:id', auth_middleware_1.authorizeOwnership, (0, validation_middleware_1.validate)(user_schema_1.updateUserSchema), userController.updateUserProfile);
// Change password
router.put('/:id/password', auth_middleware_1.authorizeOwnership, (0, validation_middleware_1.validate)(user_schema_1.changePasswordSchema), userController.changePassword);
// Get user addresses
router.get('/:id/addresses', auth_middleware_1.authorizeOwnership, userController.getUserAddresses);
// Add user address
router.post('/:id/addresses', auth_middleware_1.authorizeOwnership, (0, validation_middleware_1.validate)(user_schema_1.addressSchema), userController.addUserAddress);
// Update user address
router.put('/:id/addresses/:addressId', auth_middleware_1.authorizeOwnership, (0, validation_middleware_1.validate)(user_schema_1.updateAddressSchema), userController.updateUserAddress);
// Delete user address
router.delete('/:id/addresses/:addressId', auth_middleware_1.authorizeOwnership, userController.deleteUserAddress);
exports.default = router;
