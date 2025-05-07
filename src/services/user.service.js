"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const password_1 = require("../utils/password");
class UserService {
    /**
     * Get user by ID
     */
    async getUserById(id) {
        const [user] = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user;
    }
    /**
     * Update user
     */
    async updateUser(id, userData) {
        const [user] = await db_1.db
            .update(schema_1.users)
            .set({
            ...userData,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user;
    }
    /**
     * Change user password
     */
    async changePassword(id, currentPassword, newPassword) {
        // Get user
        const [user] = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        if (!user) {
            return false;
        }
        // Verify current password
        const isPasswordValid = await (0, password_1.comparePassword)(currentPassword, user.password);
        if (!isPasswordValid) {
            return false;
        }
        // Hash new password
        const hashedPassword = await (0, password_1.hashPassword)(newPassword);
        // Update password
        await db_1.db
            .update(schema_1.users)
            .set({
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return true;
    }
    /**
     * Get user addresses
     */
    async getUserAddresses(userId) {
        const userAddresses = await db_1.db
            .select()
            .from(schema_1.addresses)
            .where((0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId));
        return userAddresses;
    }
    /**
     * Add user address
     */
    async addUserAddress(userId, addressData) {
        // If this is the default address, unset any other default addresses
        if (addressData.isDefault) {
            await db_1.db
                .update(schema_1.addresses)
                .set({ isDefault: false })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId), (0, drizzle_orm_1.eq)(schema_1.addresses.type, addressData.type)));
        }
        // Add new address
        const [address] = await db_1.db
            .insert(schema_1.addresses)
            .values({
            userId,
            type: addressData.type,
            addressLine1: addressData.addressLine1,
            addressLine2: addressData.addressLine2,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.postalCode,
            country: addressData.country,
            isDefault: addressData.isDefault || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
            .returning();
        return address;
    }
    /**
     * Update user address
     */
    async updateUserAddress(userId, addressId, addressData) {
        // If this is the default address, unset any other default addresses
        if (addressData.isDefault) {
            await db_1.db
                .update(schema_1.addresses)
                .set({ isDefault: false })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId), (0, drizzle_orm_1.eq)(schema_1.addresses.type, addressData.type || 'shipping')));
        }
        // Update address
        const [address] = await db_1.db
            .update(schema_1.addresses)
            .set({
            ...addressData,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.id, addressId), (0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId)))
            .returning();
        return address;
    }
    /**
     * Delete user address
     */
    async deleteUserAddress(userId, addressId) {
        const result = await db_1.db
            .delete(schema_1.addresses)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.addresses.id, addressId), (0, drizzle_orm_1.eq)(schema_1.addresses.userId, userId)));
        return result.changes > 0;
    }
}
exports.UserService = UserService;
