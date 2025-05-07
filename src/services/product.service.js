"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const slugify_1 = require("../utils/slugify");
class ProductService {
    /**
     * Get all products with pagination and filtering
     */
    async getAllProducts(options = {}) {
        const { page = 1, limit = 10, category, sort = 'newest', minPrice, maxPrice, } = options;
        const offset = (page - 1) * limit;
        // Build base query
        let query = db_1.db
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
                    query = query.where((0, drizzle_orm_1.inArray)(schema_1.products.id, productIds));
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
            query = query.where((0, drizzle_orm_1.gt)(schema_1.products.price, minPrice));
        }
        if (maxPrice !== undefined) {
            query = query.where((0, drizzle_orm_1.lt)(schema_1.products.price, maxPrice));
        }
        // Apply sorting
        switch (sort) {
            case 'price_asc':
                query = query.orderBy((0, drizzle_orm_1.asc)(schema_1.products.price));
                break;
            case 'price_desc':
                query = query.orderBy((0, drizzle_orm_1.desc)(schema_1.products.price));
                break;
            case 'oldest':
                query = query.orderBy((0, drizzle_orm_1.asc)(schema_1.products.createdAt));
                break;
            case 'newest':
            default:
                query = query.orderBy((0, drizzle_orm_1.desc)(schema_1.products.createdAt));
                break;
        }
        // Count total products
        const countQuery = db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.isActive, true));
        // Apply the same filters to count query
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
                    countQuery.where((0, drizzle_orm_1.inArray)(schema_1.products.id, productIds));
                }
            }
        }
        if (minPrice !== undefined) {
            countQuery.where((0, drizzle_orm_1.gt)(schema_1.products.price, minPrice));
        }
        if (maxPrice !== undefined) {
            countQuery.where((0, drizzle_orm_1.lt)(schema_1.products.price, maxPrice));
        }
        // Execute queries
        const [totalResult] = await countQuery;
        const total = totalResult?.count || 0;
        const totalPages = Math.ceil(total / limit);
        // Apply pagination
        query = query.limit(limit).offset(offset);
        // Execute final query
        const results = await query;
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
     * Get product by ID
     */
    async getProductById(id) {
        const [product] = await db_1.db
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
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
        if (!product) {
            return null;
        }
        // Get product categories
        const productCategoriesResult = await db_1.db
            .select({
            categoryId: schema_1.productCategories.categoryId,
            categoryName: schema_1.categories.name,
            categorySlug: schema_1.categories.slug,
        })
            .from(schema_1.productCategories)
            .innerJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.productCategories.categoryId, schema_1.categories.id))
            .where((0, drizzle_orm_1.eq)(schema_1.productCategories.productId, id));
        // Get product tags
        const productTagsResult = await db_1.db
            .select({
            tagId: schema_1.productTags.tagId,
            tagName: schema_1.tags.name,
            tagSlug: schema_1.tags.slug,
        })
            .from(schema_1.productTags)
            .innerJoin(schema_1.tags, (0, drizzle_orm_1.eq)(schema_1.productTags.tagId, schema_1.tags.id))
            .where((0, drizzle_orm_1.eq)(schema_1.productTags.productId, id));
        // Add categories and tags to product
        product.categories = productCategoriesResult.map((c) => ({
            id: c.categoryId,
            name: c.categoryName,
            slug: c.categorySlug,
        }));
        product.tags = productTagsResult.map((t) => ({
            id: t.tagId,
            name: t.tagName,
            slug: t.tagSlug,
        }));
        return product;
    }
    /**
     * Create a new product
     */
    async createProduct(productData) {
        // Generate slug
        const slug = (0, slugify_1.slugify)(productData.name);
        // Create product
        const [product] = await db_1.db
            .insert(schema_1.products)
            .values({
            vendorId: productData.vendorId,
            name: productData.name,
            slug,
            description: productData.description,
            price: productData.price,
            comparePrice: productData.comparePrice,
            sku: productData.sku,
            inventory: productData.inventory,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
            .returning();
        // Add categories if provided
        if (productData.categories && productData.categories.length > 0) {
            const categoryValues = productData.categories.map((categoryId) => ({
                productId: product.id,
                categoryId,
            }));
            await db_1.db.insert(schema_1.productCategories).values(categoryValues);
        }
        // Add tags if provided
        if (productData.tags && productData.tags.length > 0) {
            // Create tags that don't exist
            for (const tagName of productData.tags) {
                const tagSlug = (0, slugify_1.slugify)(tagName);
                // Check if tag exists
                const [existingTag] = await db_1.db
                    .select()
                    .from(schema_1.tags)
                    .where((0, drizzle_orm_1.eq)(schema_1.tags.slug, tagSlug));
                if (!existingTag) {
                    // Create new tag
                    await db_1.db.insert(schema_1.tags).values({
                        name: tagName,
                        slug: tagSlug,
                    });
                }
            }
            // Get tag IDs
            const tagSlugs = productData.tags.map((tagName) => (0, slugify_1.slugify)(tagName));
            const tagRecords = await db_1.db
                .select()
                .from(schema_1.tags)
                .where((0, drizzle_orm_1.inArray)(schema_1.tags.slug, tagSlugs));
            // Add tags to product
            if (tagRecords.length > 0) {
                const tagValues = tagRecords.map((tag) => ({
                    productId: product.id,
                    tagId: tag.id,
                }));
                await db_1.db.insert(schema_1.productTags).values(tagValues);
            }
        }
        // Return created product with full details
        return this.getProductById(product.id);
    }
    /**
     * Update product
     */
    async updateProduct(id, productData) {
        let updateData = {
            ...productData,
            updatedAt: new Date().toISOString(),
        };
        // Generate new slug if name is changed
        if (productData.name) {
            updateData.slug = (0, slugify_1.slugify)(productData.name);
        }
        // Update product
        await db_1.db
            .update(schema_1.products)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
        // Update categories if provided
        if (productData.categories) {
            // Delete existing categories
            await db_1.db
                .delete(schema_1.productCategories)
                .where((0, drizzle_orm_1.eq)(schema_1.productCategories.productId, id));
            // Add new categories
            if (productData.categories.length > 0) {
                const categoryValues = productData.categories.map((categoryId) => ({
                    productId: id,
                    categoryId,
                }));
                await db_1.db.insert(schema_1.productCategories).values(categoryValues);
            }
        }
        // Update tags if provided
        if (productData.tags) {
            // Delete existing tags
            await db_1.db
                .delete(schema_1.productTags)
                .where((0, drizzle_orm_1.eq)(schema_1.productTags.productId, id));
            // Add new tags
            if (productData.tags.length > 0) {
                // Create tags that don't exist
                for (const tagName of productData.tags) {
                    const tagSlug = (0, slugify_1.slugify)(tagName);
                    // Check if tag exists
                    const [existingTag] = await db_1.db
                        .select()
                        .from(schema_1.tags)
                        .where((0, drizzle_orm_1.eq)(schema_1.tags.slug, tagSlug));
                    if (!existingTag) {
                        // Create new tag
                        await db_1.db.insert(schema_1.tags).values({
                            name: tagName,
                            slug: tagSlug,
                        });
                    }
                }
                // Get tag IDs
                const tagSlugs = productData.tags.map((tagName) => (0, slugify_1.slugify)(tagName));
                const tagRecords = await db_1.db
                    .select()
                    .from(schema_1.tags)
                    .where((0, drizzle_orm_1.inArray)(schema_1.tags.slug, tagSlugs));
                // Add tags to product
                if (tagRecords.length > 0) {
                    const tagValues = tagRecords.map((tag) => ({
                        productId: id,
                        tagId: tag.id,
                    }));
                    await db_1.db.insert(schema_1.productTags).values(tagValues);
                }
            }
        }
        // Return updated product with full details
        return this.getProductById(id);
    }
    /**
     * Delete product
     */
    async deleteProduct(id) {
        // Delete product
        await db_1.db
            .delete(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
        return true;
    }
    /**
     * Get products by vendor
     */
    async getProductsByVendor(vendorId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;
        // Get products
        const query = db_1.db
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
            .where((0, drizzle_orm_1.eq)(schema_1.products.vendorId, vendorId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.products.createdAt))
            .limit(limit)
            .offset(offset);
        // Count total products
        const [totalResult] = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.vendorId, vendorId));
        const total = totalResult?.count || 0;
        const totalPages = Math.ceil(total / limit);
        // Execute query
        const results = await query;
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
}
exports.ProductService = ProductService;
