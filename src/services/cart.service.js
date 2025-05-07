"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema_1 = require("../db/schema");
class CartService {
    /**
     * Get cart by user ID
     */
    async getCartByUserId(userId) {
        // Find or create cart
        let cart = await this.findOrCreateCart(userId);
        // Get cart items with product details
        const cartItemsWithProducts = await this.getCartItemsWithProducts(cart.id);
        // Calculate cart totals
        const subtotal = cartItemsWithProducts.reduce((acc, item) => acc + item.price * item.quantity, 0);
        return {
            id: cart.id,
            userId: cart.userId,
            items: cartItemsWithProducts,
            itemCount: cartItemsWithProducts.length,
            subtotal,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
        };
    }
    /**
     * Get cart by ID
     */
    async getCartById(cartId) {
        const [cart] = await db_1.db
            .select()
            .from(schema_1.carts)
            .where((0, drizzle_orm_1.eq)(schema_1.carts.id, cartId));
        if (!cart) {
            return null;
        }
        // Get cart items with product details
        const cartItemsWithProducts = await this.getCartItemsWithProducts(cartId);
        return {
            ...cart,
            items: cartItemsWithProducts,
        };
    }
    /**
     * Find or create cart for user
     */
    async findOrCreateCart(userId) {
        // Check if user already has a cart
        const [existingCart] = await db_1.db
            .select()
            .from(schema_1.carts)
            .where((0, drizzle_orm_1.eq)(schema_1.carts.userId, userId));
        if (existingCart) {
            return existingCart;
        }
        // Create new cart for user
        const [newCart] = await db_1.db
            .insert(schema_1.carts)
            .values({
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
            .returning();
        return newCart;
    }
    /**
     * Get cart items with product details
     */
    async getCartItemsWithProducts(cartId) {
        const cartItemsResult = await db_1.db
            .select({
            id: schema_1.cartItems.id,
            cartId: schema_1.cartItems.cartId,
            productId: schema_1.cartItems.productId,
            variantId: schema_1.cartItems.variantId,
            quantity: schema_1.cartItems.quantity,
            createdAt: schema_1.cartItems.createdAt,
            updatedAt: schema_1.cartItems.updatedAt,
            // Product details
            productName: schema_1.products.name,
            productSlug: schema_1.products.slug,
            productPrice: schema_1.products.price,
            productSku: schema_1.products.sku,
        })
            .from(schema_1.cartItems)
            .innerJoin(schema_1.products, (0, drizzle_orm_1.eq)(schema_1.cartItems.productId, schema_1.products.id))
            .where((0, drizzle_orm_1.eq)(schema_1.cartItems.cartId, cartId));
        // Get variant details for items with variantId
        const cartItemsWithVariants = await Promise.all(cartItemsResult.map(async (item) => {
            let price = item.productPrice;
            let sku = item.productSku;
            // If item has a variant, get variant details
            if (item.variantId) {
                const [variant] = await db_1.db
                    .select()
                    .from(schema_1.productVariants)
                    .where((0, drizzle_orm_1.eq)(schema_1.productVariants.id, item.variantId));
                if (variant) {
                    price = variant.price || price;
                    sku = variant.sku || sku;
                }
            }
            return {
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                name: item.productName,
                slug: item.productSlug,
                price,
                sku,
                subtotal: price * item.quantity,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        }));
        return cartItemsWithVariants;
    }
    /**
     * Get cart item by ID
     */
    async getCartItemById(cartItemId) {
        const [cartItem] = await db_1.db
            .select()
            .from(schema_1.cartItems)
            .where((0, drizzle_orm_1.eq)(schema_1.cartItems.id, cartItemId));
        return cartItem;
    }
    /**
     * Add item to cart
     */
    async addToCart(userId, itemData) {
        // Check if product exists and is active
        const [product] = await db_1.db
            .select()
            .from(schema_1.products)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.id, itemData.productId), (0, drizzle_orm_1.eq)(schema_1.products.isActive, true)));
        if (!product) {
            throw new Error('Product not found');
        }
        // Check inventory
        let inventory = product.inventory;
        let price = product.price;
        let sku = product.sku;
        // If variant is specified, check variant inventory
        if (itemData.variantId) {
            const [variant] = await db_1.db
                .select()
                .from(schema_1.productVariants)
                .where((0, drizzle_orm_1.eq)(schema_1.productVariants.id, itemData.variantId));
            if (variant) {
                inventory = variant.inventory;
                price = variant.price || price;
                sku = variant.sku || sku;
            }
        }
        if (inventory < itemData.quantity) {
            throw new Error('Not enough inventory');
        }
        // Find or create cart
        const cart = await this.findOrCreateCart(userId);
        // Check if item already exists in cart
        const [existingCartItem] = await db_1.db
            .select()
            .from(schema_1.cartItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cartItems.cartId, cart.id), (0, drizzle_orm_1.eq)(schema_1.cartItems.productId, itemData.productId), itemData.variantId
            ? (0, drizzle_orm_1.eq)(schema_1.cartItems.variantId, itemData.variantId)
            : (0, drizzle_orm_1.sql) `cartItems.variant_id IS NULL`));
        if (existingCartItem) {
            // Update quantity
            const newQuantity = existingCartItem.quantity + itemData.quantity;
            // Check if enough inventory for combined quantity
            if (inventory < newQuantity) {
                throw new Error('Not enough inventory');
            }
            const [updatedCartItem] = await db_1.db
                .update(schema_1.cartItems)
                .set({
                quantity: newQuantity,
                updatedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.cartItems.id, existingCartItem.id))
                .returning();
            return {
                ...updatedCartItem,
                name: product.name,
                price,
                sku,
                subtotal: price * updatedCartItem.quantity,
            };
        }
        else {
            // Add new item to cart
            const [newCartItem] = await db_1.db
                .insert(schema_1.cartItems)
                .values({
                cartId: cart.id,
                productId: itemData.productId,
                variantId: itemData.variantId,
                quantity: itemData.quantity,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
                .returning();
            return {
                ...newCartItem,
                name: product.name,
                price,
                sku,
                subtotal: price * newCartItem.quantity,
            };
        }
    }
    /**
     * Update cart item
     */
    async updateCartItem(cartItemId, itemData) {
        // Get cart item
        const [cartItem] = await db_1.db
            .select()
            .from(schema_1.cartItems)
            .where((0, drizzle_orm_1.eq)(schema_1.cartItems.id, cartItemId));
        if (!cartItem) {
            throw new Error('Cart item not found');
        }
        // Check inventory
        const [product] = await db_1.db
            .select()
            .from(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, cartItem.productId));
        if (!product) {
            throw new Error('Product not found');
        }
        let inventory = product.inventory;
        let price = product.price;
        let sku = product.sku;
        // If variant is specified, check variant inventory
        if (cartItem.variantId) {
            const [variant] = await db_1.db
                .select()
                .from(schema_1.productVariants)
                .where((0, drizzle_orm_1.eq)(schema_1.productVariants.id, cartItem.variantId));
            if (variant) {
                inventory = variant.inventory;
                price = variant.price || price;
                sku = variant.sku || sku;
            }
        }
        if (inventory < itemData.quantity) {
            throw new Error('Not enough inventory');
        }
        // Update cart item
        const [updatedCartItem] = await db_1.db
            .update(schema_1.cartItems)
            .set({
            quantity: itemData.quantity,
            updatedAt: new Date().toISOString(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cartItems.id, cartItemId))
            .returning();
        return {
            ...updatedCartItem,
            name: product.name,
            price,
            sku,
            subtotal: price * updatedCartItem.quantity,
        };
    }
    /**
     * Remove item from cart
     */
    async removeFromCart(cartItemId) {
        await db_1.db
            .delete(schema_1.cartItems)
            .where((0, drizzle_orm_1.eq)(schema_1.cartItems.id, cartItemId));
        return true;
    }
    /**
     * Clear cart
     */
    async clearCart(userId) {
        // Get user's cart
        const [cart] = await db_1.db
            .select()
            .from(schema_1.carts)
            .where((0, drizzle_orm_1.eq)(schema_1.carts.userId, userId));
        if (cart) {
            // Delete all cart items
            await db_1.db
                .delete(schema_1.cartItems)
                .where((0, drizzle_orm_1.eq)(schema_1.cartItems.cartId, cart.id));
        }
        return true;
    }
}
exports.CartService = CartService;
