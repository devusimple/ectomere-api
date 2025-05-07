"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const middleware_1 = require("./config/middleware");
const routes_1 = require("./config/routes");
const error_middleware_1 = require("./middlewares/error.middleware");
const logger_1 = require("./config/logger");
const db_1 = require("./config/db");
async function bootstrap() {
    // Initialize Express app
    const app = (0, express_1.default)();
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;
    // Apply security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Configure custom middleware
    (0, middleware_1.configureMiddleware)(app);
    // Initialize database
    await (0, db_1.initializeDatabase)();
    // Configure API routes
    (0, routes_1.configureRoutes)(app);
    // Global error handler - using 'any' to avoid type issues during development
    app.use(error_middleware_1.errorMiddleware);
    // Start server
    app.listen(PORT, () => {
        logger_1.logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
    // Handle unexpected errors
    process.on("uncaughtException", (error) => {
        logger_1.logger.error("Uncaught Exception:", error);
        process.exit(1);
    });
    process.on("unhandledRejection", (reason, promise) => {
        logger_1.logger.error("Unhandled Rejection at:", promise, "reason:", reason);
        process.exit(1);
    });
}
bootstrap().catch((error) => {
    logger_1.logger.error("Failed to start server:", error);
    process.exit(1);
});
