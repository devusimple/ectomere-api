"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migrator_1 = require("drizzle-orm/better-sqlite3/migrator");
const db_1 = require("../config/db");
const path_1 = require("path");
const logger_1 = require("../config/logger");
// This file is used for manually running migrations
// It's typically used for development and CI/CD
async function runMigrations() {
    try {
        logger_1.logger.info('Running migrations...');
        (0, migrator_1.migrate)(db_1.db, { migrationsFolder: (0, path_1.resolve)(__dirname, './migrations') });
        logger_1.logger.info('Migrations completed successfully');
    }
    catch (error) {
        logger_1.logger.error('Migration failed:', error);
        process.exit(1);
    }
}
// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations();
}
