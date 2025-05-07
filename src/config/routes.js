"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRoutes = void 0;
const auth_routes_1 = __importDefault(require("../routes/auth.routes"));
const user_routes_1 = __importDefault(require("../routes/user.routes"));
const vendor_routes_1 = __importDefault(require("../routes/vendor.routes"));
const product_routes_1 = __importDefault(require("../routes/product.routes"));
const category_routes_1 = __importDefault(require("../routes/category.routes"));
const cart_routes_1 = __importDefault(require("../routes/cart.routes"));
const order_routes_1 = __importDefault(require("../routes/order.routes"));
const search_routes_1 = __importDefault(require("../routes/search.routes"));
const logger_1 = require("./logger");
function configureRoutes(app) {
    // Since Flask proxy strips the /api prefix, we don't need a prefix here
    const API_PREFIX = '';
    // Configure routes without the /api prefix
    app.use(`${API_PREFIX}/auth`, auth_routes_1.default);
    app.use(`${API_PREFIX}/users`, user_routes_1.default);
    app.use(`${API_PREFIX}/vendors`, vendor_routes_1.default);
    app.use(`${API_PREFIX}/products`, product_routes_1.default);
    app.use(`${API_PREFIX}/categories`, category_routes_1.default);
    app.use(`${API_PREFIX}/cart`, cart_routes_1.default);
    app.use(`${API_PREFIX}/orders`, order_routes_1.default);
    app.use(`${API_PREFIX}/search`, search_routes_1.default);
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date(),
            uptime: process.uptime(),
        });
    });
    // 404 handler for undefined routes
    app.use((req, res) => {
        logger_1.logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
        res.status(404).json({
            error: 'Not Found',
            message: 'The requested resource was not found',
        });
    });
}
exports.configureRoutes = configureRoutes;
