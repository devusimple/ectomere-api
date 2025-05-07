"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
const slugify_1 = require("../utils/slugify");
class CategoryService {
    /**
     * Get all categories
     */
    async getAllCategories() {
        const allCategories = await db_1.db
            .select()
            .from(schema_1.categories)
            .orderBy((0, drizzle_orm_1.asc)(schema_1.categories.name));
        // Group into hierarchy
        const categoryMap = new Map();
        const rootCategories = [];
        // First pass: create map of id to category with children array
        allCategories.forEach(category => {
            categoryMap.set(category.id, { ...category, children: [] });
        });
        // Second pass: build hierarchy
        allCategories.forEach(category => {
            const categoryWithChildren = categoryMap.get(category.id);
            if (category.parentId) {
                const parent = categoryMap.get(category.parentId);
                if (parent) {
                    parent.children.push(categoryWithChildren);
                }
                else {
                    rootCategories.push(categoryWithChildren);
                }
            }
            else {
                rootCategories.push(categoryWithChildren);
            }
        });
        return rootCategories;
    }
    /**
     * Get category by ID
     */
    async getCategoryById(id) {
        const [category] = await db_1.db
            .select()
            .from(schema_1.categories)
            .where((0, drizzle_orm_1.eq)(schema_1.categories.id, id));
        if (!category) {
            return null;
        }
        // Get subcategories
        const subcategories = await db_1.db
            .select()
            .from(schema_1.categories)
            .where((0, drizzle_orm_1.eq)(schema_1.categories.parentId, id));
        return {
            ...category,
            subcategories,
        };
    }
    /**
     * Create category
     */
    async createCategory(categoryData) {
        // Generate slug
        const slug = (0, slugify_1.slugify)(categoryData.name);
        const [category] = await db_1.db
            .insert(schema_1.categories)
            .values({
            name: categoryData.name,
            slug,
            description: categoryData.description,
            parentId: categoryData.parentId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
            .returning();
        return category;
    }
    /**
     * Update category
     */
    async updateCategory(id, categoryData) {
        let updateData = {
            ...categoryData,
            updatedAt: new Date().toISOString(),
        };
        // Generate new slug if name is changed
        if (categoryData.name) {
            updateData.slug = (0, slugify_1.slugify)(categoryData.name);
        }
        // Check if trying to set as parent of itself
        if (categoryData.parentId === id) {
            throw new Error('A category cannot be its own parent');
        }
        // Check if trying to set as parent one of its descendants
        if (categoryData.parentId) {
            let currentParentId = categoryData.parentId;
            while (currentParentId) {
                // Check if parent id is the same as the category being updated
                if (currentParentId === id) {
                    throw new Error('Cannot set a descendant as parent');
                }
                // Get the parent's parent
                const [parent] = await db_1.db
                    .select({ parentId: schema_1.categories.parentId })
                    .from(schema_1.categories)
                    .where((0, drizzle_orm_1.eq)(schema_1.categories.id, currentParentId));
                currentParentId = parent?.parentId || null;
            }
        }
        const [category] = await db_1.db
            .update(schema_1.categories)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.categories.id, id))
            .returning();
        return category;
    }
    /**
     * Delete category
     */
    async deleteCategory(id) {
        const result = await db_1.db
            .delete(schema_1.categories)
            .where((0, drizzle_orm_1.eq)(schema_1.categories.id, id));
        return result.changes > 0;
    }
    /**
     * Check if category has subcategories
     */
    async hasSubcategories(id) {
        const [result] = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.categories)
            .where((0, drizzle_orm_1.eq)(schema_1.categories.parentId, id));
        return result.count > 0;
    }
    /**
     * Check if category has products
     */
    async hasProducts(id) {
        const [result] = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.productCategories)
            .where((0, drizzle_orm_1.eq)(schema_1.productCategories.categoryId, id));
        return result.count > 0;
    }
    /**
     * Get products by category
     */
    async getProductsByCategory(categoryId, options = {}) {
        const { page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;
        // Get product IDs in this category
        const productIdsInCategory = await db_1.db
            .select({ productId: schema_1.productCategories.productId })
            .from(schema_1.productCategories)
            .where((0, drizzle_orm_1.eq)(schema_1.productCategories.categoryId, categoryId));
        const productIds = productIdsInCategory.map(p => p.productId);
        if (productIds.length === 0) {
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
        // Get products
        const productResults = await db_1.db
            .select()
            .from(schema_1.products)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.products.id, productIds), (0, drizzle_orm_1.eq)(schema_1.products.isActive, true)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.products.createdAt))
            .limit(limit)
            .offset(offset);
        // Count total products
        const [totalResult] = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.products)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.products.id, productIds), (0, drizzle_orm_1.eq)(schema_1.products.isActive, true)));
        const total = totalResult?.count || 0;
        const totalPages = Math.ceil(total / limit);
        // Get categories for each product
        const resultProductIds = productResults.map(p => p.id);
        const productCategoriesResult = await db_1.db
            .select({
            productId: schema_1.productCategories.productId,
            categoryId: schema_1.productCategories.categoryId,
            categoryName: schema_1.categories.name,
            categorySlug: schema_1.categories.slug,
        })
            .from(schema_1.productCategories)
            .innerJoin(schema_1.categories, (0, drizzle_orm_1.eq)(schema_1.productCategories.categoryId, schema_1.categories.id))
            .where((0, drizzle_orm_1.inArray)(schema_1.productCategories.productId, resultProductIds));
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
        const productsWithCategories = productResults.map(product => ({
            ...product,
            categories: productCategoriesMap[product.id] || [],
        }));
        return {
            data: productsWithCategories,
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
}
exports.CategoryService = CategoryService;
