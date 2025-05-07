"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const search_service_1 = require("../services/search.service");
const error_middleware_1 = require("../middlewares/error.middleware");
class SearchController {
    constructor() {
        /**
         * Search products
         */
        this.searchProducts = async (req, res, next) => {
            try {
                const { q, page = '1', limit = '10', category, minPrice, maxPrice, sort } = req.query;
                if (!q) {
                    return next(new error_middleware_1.ApiError(400, 'Search query is required'));
                }
                const results = await this.searchService.searchProducts({
                    query: q,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    category: category,
                    minPrice: minPrice ? parseFloat(minPrice) : undefined,
                    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                    sort: sort,
                });
                res.status(200).json({
                    results: results.data,
                    pagination: results.pagination,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get product suggestions
         */
        this.getProductSuggestions = async (req, res, next) => {
            try {
                const { q, limit = '5' } = req.query;
                if (!q) {
                    return next(new error_middleware_1.ApiError(400, 'Search query is required'));
                }
                const suggestions = await this.searchService.getProductSuggestions(q, parseInt(limit));
                res.status(200).json({
                    suggestions,
                });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get popular search terms
         */
        this.getPopularSearchTerms = async (req, res, next) => {
            try {
                const { limit = '10' } = req.query;
                const terms = await this.searchService.getPopularSearchTerms(parseInt(limit));
                res.status(200).json({
                    terms,
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.searchService = new search_service_1.SearchService();
    }
}
exports.SearchController = SearchController;
