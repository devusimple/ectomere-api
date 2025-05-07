"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vendor_controller_1 = require("../controllers/vendor.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const user_schema_1 = require("../validation/user.schema");
const schema_1 = require("../db/schema");
const router = (0, express_1.Router)();
const vendorController = new vendor_controller_1.VendorController();
// Protect all vendor routes with authentication
router.use(auth_middleware_1.authenticate);
// Register as a vendor
router.post('/register', (0, validation_middleware_1.validate)(user_schema_1.vendorSchema), vendorController.registerVendor);
// Get vendor profile
router.get('/:id', vendorController.getVendorProfile);
// Update vendor profile
router.put('/:id', (0, validation_middleware_1.validate)(user_schema_1.vendorSchema), vendorController.updateVendorProfile);
// Approve vendor (admin only)
router.put('/:id/approve', (0, auth_middleware_1.authorize)([schema_1.UserRole.ADMIN]), vendorController.approveVendor);
// Get all vendors (admin only)
router.get('/', (0, auth_middleware_1.authorize)([schema_1.UserRole.ADMIN]), vendorController.getAllVendors);
// Get pending vendor applications (admin only)
router.get('/pending', (0, auth_middleware_1.authorize)([schema_1.UserRole.ADMIN]), vendorController.getPendingVendors);
exports.default = router;
