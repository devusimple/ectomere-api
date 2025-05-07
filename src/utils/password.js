"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = require("../config/logger");
const SALT_ROUNDS = 10;
/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    try {
        const salt = await bcrypt_1.default.genSalt(SALT_ROUNDS);
        return bcrypt_1.default.hash(password, salt);
    }
    catch (error) {
        logger_1.logger.error('Error hashing password:', error);
        throw new Error('Error hashing password');
    }
}
exports.hashPassword = hashPassword;
/**
 * Compare a password with a hash
 */
async function comparePassword(password, hash) {
    try {
        return bcrypt_1.default.compare(password, hash);
    }
    catch (error) {
        logger_1.logger.error('Error comparing password:', error);
        throw new Error('Error comparing password');
    }
}
exports.comparePassword = comparePassword;
