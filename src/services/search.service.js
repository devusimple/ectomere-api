"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const logger_1 = require("../config/logger");
class SearchService {
    /**
     * Search products
     */
    async searchProducts(options) {
        const { query, page = 1, limit = 10, category, minPrice, maxPrice, sort = 'relevance', } = options;
        const offset = (page - 1) * limit;
        const searchTerms = query.split(' ').filter(Boolean);
        // Build base query - only active products
        let baseQuery = db_1.db
            .select({
            id: schema_1.products.id,
            vendorId: schema_1.products.vendorId,
            name: schema_1.products.name,
            slug: schema_1.products.slug,
            description: schema_1.products.description,
            price: schema_1.products.price,
            comparePrice: schema_1.products.comparePrice,
            sku: schema_1.products.sku,
            inventory: schema_1.products.inventory,
            isActive: schema_1.products.isActive,
            createdAt: schema_1.products.createdAt,
            updatedAt: schema_1.products.updatedAt,
        })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.isActive, true));
        // Apply search terms
        if (searchTerms.length > 0) {
            const searchConditions = searchTerms.map(term => (0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.products.name, `%${term}%`), (0, drizzle_orm_1.like)(schema_1.products.description, `%${term}%`), (0, drizzle_orm_1.like)(schema_1.products.sku, `%${term}%`)));
            baseQuery = baseQuery.where((0, drizzle_orm_1.and)(...searchConditions));
        }
        // Apply category filter if provided
        if (category) {
            // Get category ID from slug
            const [categoryRecord] = await db_1.db
                .select({ id: schema_1.categories.id })
                .from(schema_1.categories)
                .where((0, drizzle_orm_1.eq)(schema_1.categories.slug, category));
            if (categoryRecord) {
                // Get product IDs in this category
                const categoryProducts = await db_1.db
                    .select({ productId: schema_1.productCategories.productId })
                    .from(schema_1.productCategories)
                    .where((0, drizzle_orm_1.eq)(schema_1.productCategories.categoryId, categoryRecord.id));
                const productIds = categoryProducts.map((cp) => cp.productId);
                if (productIds.length > 0) {
                    baseQuery = baseQuery.where((0, drizzle_orm_1.inArray)(schema_1.products.id, productIds));
                }
                else {
                    // No products in this category
                    return {
                        data: [],
                        pagination: {
                            total: 0,
                            page,
                            limit,
                            totalPages: 0,
                        },
                    };
                }
            }
        }
        // Apply price filters if provided
        if (minPrice !== undefined) {
            baseQuery = baseQuery.where((0, drizzle_orm_1.gt)(schema_1.products.price, minPrice));
        }
        if (maxPrice !== undefined) {
            baseQuery = baseQuery.where((0, drizzle_orm_1.lt)(schema_1.products.price, maxPrice));
        }
        // Apply sorting
        let sortQuery = baseQuery;
        switch (sort) {
            case 'price_asc':
                sortQuery = baseQuery.orderBy((0, drizzle_orm_1.asc)(schema_1.products.price));
                break;
            case 'price_desc':
                sortQuery = baseQuery.orderBy((0, drizzle_orm_1.desc)(schema_1.products.price));
                break;
            case 'newest':
                sortQuery = baseQuery.orderBy((0, drizzle_orm_1.desc)(schema_1.products.createdAt));
                break;
            case 'oldest':
                sortQuery = baseQuery.orderBy((0, drizzle_orm_1.asc)(schema_1.products.createdAt));
                break;
            case 'relevance':
            default:
                // For relevance sorting, we keep the order based on search match
                // This is simplified - in a real implementation, you'd use a more sophisticated relevance algorithm
                sortQuery = baseQuery;
                break;
        }
        // Count total results
        const [countResult] = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(sortQuery.as('search_results'));
        const total = countResult?.count || 0;
        const totalPages = Math.ceil(total / limit);
        // Apply pagination
        const paginatedQuery = sortQuery.limit(limit).offset(offset);
        // Execute final query
        const results = await paginatedQuery;
        // Get categories for each product
        const productIds = results.map((p) => p.id);
        if (productIds.length > 0) {
            const productCategoriesResult = await db_1.db
                .select({
                productId: schema_1.productCategories.productId,
                categoryId: schema_1.productCategories.categoryId,
                categoryName: schema_1.categories.name,
                categorySlug: schema_1.categories.slug,
            })
                .from(schema_1.productCategories)
                .innerJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.productCategories.categoryId, schema_1.categories.id))
                .where((0, drizzle_orm_1.inArray)(schema_1.productCategories.productId, productIds));
            // Group categories by product ID
            const productCategoriesMap = productCategoriesResult.reduce((acc, curr) => {
                if (!acc[curr.productId]) {
                    acc[curr.productId] = [];
                }
                acc[curr.productId].push({
                    id: curr.categoryId,
                    name: curr.categoryName,
                    slug: curr.categorySlug,
                });
                return acc;
            }, {});
            // Add categories to each product
            results.forEach((product) => {
                product.categories = productCategoriesMap[product.id] || [];
            });
        }
        // Record search query for analytics (in a real app)
        this.recordSearchQuery(query);
        return {
            data: results,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    /**
     * Get product suggestions based on query
     */
    async getProductSuggestions(query, limit = 5) {
        const searchTerms = query.split(' ').filter(Boolean);
        if (searchTerms.length === 0) {
            return [];
        }
        // Build search conditions
        const searchConditions = searchTerms.map(term => (0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.products.name, `%${term}%`), (0, drizzle_orm_1.like)(schema_1.products.description, `%${term}%`)));
        // Query products matching search terms
        const results = await db_1.db
            .select({
            id: schema_1.products.id,
            name: schema_1.products.name,
            slug: schema_1.products.slug,
        })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.isActive, true), ...searchConditions))
            .limit(limit);
        return results;
    }
    /**
     * Record search query for analytics
     * This is a simplified implementation - in a real app, you would store this in a dedicated table
     */
    async recordSearchQuery(query) {
        // In a real implementation, you would record the search query in a database
        logger_1.logger.info(`Search query recorded: ${query}`);
    }
    /**
     * Get popular search terms
     * This is a simplified implementation - in a real app, you would have a proper analytics system
     */
    async getPopularSearchTerms(limit = 10) {
        // In a real implementation, you would query your analytics table for popular search terms
        // For this example, return some dummy data
        return [
            { term: 'phone', count: 120 },
            { term: 'laptop', count: 98 },
            { term: 'headphones', count: 85 },
            { term: 'speaker', count: 72 },
            { term: 'camera', count: 65 },
        ].slice(0, limit);
    }
}
exports.SearchService = SearchService;
