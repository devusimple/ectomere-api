"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
class VendorService {
    /**
     * Register as a vendor
     */
    async registerVendor(userId, vendorData) {
        const [vendor] = await db_1.db
            .insert(schema_1.vendors)
            .values({
            userId,
            businessName: vendorData.businessName,
            description: vendorData.description,
            isApproved: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
            .returning();
        return vendor;
    }
    /**
     * Get vendor by ID
     */
    async getVendorById(id) {
        const [vendor] = await db_1.db
            .select()
            .from(schema_1.vendors)
            .where((0, drizzle_orm_1.eq)(schema_1.vendors.id, id));
        return vendor;
    }
    /**
     * Get vendor by user ID
     */
    async getVendorByUserId(userId) {
        const [vendor] = await db_1.db
            .select()
            .from(schema_1.vendors)
            .where((0, drizzle_orm_1.eq)(schema_1.vendors.userId, userId));
        return vendor;
    }
    /**
     * Update vendor profile
     */
    async updateVendor(id, vendorData) {
        const [vendor] = await db_1.db
            .update(schema_1.vendors)
            .set({
            ...vendorData,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.vendors.id, id))
            .returning();
        return vendor;
    }
    /**
     * Approve vendor
     */
    async approveVendor(id) {
        const [vendor] = await db_1.db
            .update(schema_1.vendors)
            .set({
            isApproved: true,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.vendors.id, id))
            .returning();
        return vendor;
    }
    /**
     * Update user role to vendor
     */
    async updateUserToVendorRole(userId) {
        await db_1.db
            .update(schema_1.users)
            .set({
            role: schema_1.UserRole.VENDOR,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        return true;
    }
    /**
     * Get all vendors
     */
    async getAllVendors() {
        const allVendors = await db_1.db
            .select()
            .from(schema_1.vendors);
        return allVendors;
    }
    /**
     * Get pending vendors
     */
    async getPendingVendors() {
        const pendingVendors = await db_1.db
            .select()
            .from(schema_1.vendors)
            .where((0, drizzle_orm_1.eq)(schema_1.vendors.isApproved, false));
        return pendingVendors;
    }
}
exports.VendorService = VendorService;
