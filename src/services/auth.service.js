"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const error_middleware_1 = require("../middlewares/error.middleware");
class AuthService {
    /**
     * Register a new user
     */
    async register(userData) {
        // Hash password
        const hashedPassword = await (0, password_1.hashPassword)(userData.password);
        // Set default role if not provided
        const role = userData.role || schema_1.UserRole.CUSTOMER;
        // Only allow customer and vendor roles for registration
        if (role !== schema_1.UserRole.CUSTOMER && role !== schema_1.UserRole.VENDOR) {
            throw new error_middleware_1.ApiError(400, 'Invalid user role');
        }
        // Create user (without phone field which may not exist in DB yet)
        const [user] = await db_1.db
            .insert(schema_1.users)
            .values({
            email: userData.email,
            password: hashedPassword,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .returning();
        return user;
    }
    /**
     * Login user
     */
    async login(email, password) {
        // Find user by email
        const [user] = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (!user) {
            return null;
        }
        // Compare password
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            return null;
        }
        return user;
    }
    /**
     * Generate access and refresh tokens for a user
     */
    async generateTokens(user) {
        // Generate tokens
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        // Save refresh token to database
        await db_1.db.insert(schema_1.refreshTokens).values({
            user_id: user.id,
            token: refreshToken,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            created_at: new Date().toISOString(),
        });
        return {
            accessToken,
            refreshToken,
        };
    }
    /**
     * Refresh tokens
     */
    async refreshTokens(token) {
        // Find refresh token in database
        const [refreshTokenRecord] = await db_1.db
            .select()
            .from(schema_1.refreshTokens)
            .where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.token, token));
        if (!refreshTokenRecord) {
            throw new Error('Invalid refresh token');
        }
        // Check if token is expired or revoked
        if (new Date(refreshTokenRecord.expires) < new Date() ||
            refreshTokenRecord.revokedAt) {
            throw new Error('Invalid refresh token');
        }
        // Find user
        const [user] = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, refreshTokenRecord.userId));
        if (!user) {
            throw new Error('User not found');
        }
        // Generate new tokens
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const newRefreshToken = (0, jwt_1.generateRefreshToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        // Update refresh token
        await db_1.db
            .update(schema_1.refreshTokens)
            .set({
            revoked_at: new Date().toISOString(),
            replaced_by_token: newRefreshToken,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.token, token));
        // Save new refresh token
        await db_1.db.insert(schema_1.refreshTokens).values({
            user_id: user.id,
            token: newRefreshToken,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            created_at: new Date().toISOString(),
        });
        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
    /**
     * Revoke refresh token
     */
    async revokeRefreshToken(token) {
        await db_1.db
            .update(schema_1.refreshTokens)
            .set({
            revoked_at: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.token, token));
        return true;
    }
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
}
exports.AuthService = AuthService;
