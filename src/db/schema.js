"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokens = exports.orderItems = exports.orders = exports.wishlistItems = exports.wishlists = exports.cartItems = exports.carts = exports.productVariantAttributes = exports.productVariants = exports.attributeValues = exports.attributes = exports.productTags = exports.tags = exports.productCategories = exports.products = exports.categories = exports.addresses = exports.vendors = exports.users = exports.OrderStatus = exports.UserRole = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
// User Role Enum
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["VENDOR"] = "vendor";
    UserRole["CUSTOMER"] = "customer";
})(UserRole || (exports.UserRole = UserRole = {}));
// Order Status Enum
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
// User Schema
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    email: (0, sqlite_core_1.text)('email').notNull().unique(),
    password: (0, sqlite_core_1.text)('password').notNull(),
    role: (0, sqlite_core_1.text)('role').$type().notNull().default(UserRole.CUSTOMER),
    firstName: (0, sqlite_core_1.text)('first_name'),
    lastName: (0, sqlite_core_1.text)('last_name'),
    phone: (0, sqlite_core_1.text)('phone'),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default(String(new Date().toISOString())),
});
// Vendor Schema
exports.vendors = (0, sqlite_core_1.sqliteTable)('vendors', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    businessName: (0, sqlite_core_1.text)('business_name').notNull(),
    description: (0, sqlite_core_1.text)('description'),
    isApproved: (0, sqlite_core_1.integer)('is_approved', { mode: 'boolean' }).notNull().default(false),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default(String(new Date().toISOString())),
});
// Address Schema
exports.addresses = (0, sqlite_core_1.sqliteTable)('addresses', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    type: (0, sqlite_core_1.text)('type').notNull().default('shipping'), // shipping or billing
    addressLine1: (0, sqlite_core_1.text)('address_line1').notNull(),
    addressLine2: (0, sqlite_core_1.text)('address_line2'),
    city: (0, sqlite_core_1.text)('city').notNull(),
    state: (0, sqlite_core_1.text)('state').notNull(),
    postalCode: (0, sqlite_core_1.text)('postal_code').notNull(),
    country: (0, sqlite_core_1.text)('country').notNull(),
    isDefault: (0, sqlite_core_1.integer)('is_default', { mode: 'boolean' }).notNull().default(false),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default(String(new Date().toISOString())),
});
// Category Schema
exports.categories = (0, sqlite_core_1.sqliteTable)('categories', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    slug: (0, sqlite_core_1.text)('slug').notNull().unique(),
    description: (0, sqlite_core_1.text)('description'),
    parentId: (0, sqlite_core_1.integer)('parent_id').references(() => exports.categories.id),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default(String(new Date().toISOString())),
});
// Product Schema
exports.products = (0, sqlite_core_1.sqliteTable)('products', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    vendorId: (0, sqlite_core_1.integer)('vendor_id').notNull().references(() => exports.vendors.id, { onDelete: 'cascade' }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    slug: (0, sqlite_core_1.text)('slug').notNull().unique(),
    description: (0, sqlite_core_1.text)('description'),
    price: (0, sqlite_core_1.real)('price').notNull(),
    comparePrice: (0, sqlite_core_1.real)('compare_price'),
    sku: (0, sqlite_core_1.text)('sku'),
    inventory: (0, sqlite_core_1.integer)('inventory').notNull().default(0),
    isActive: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default(String(new Date().toISOString())),
});
// Product Categories (many-to-many relationship)
exports.productCategories = (0, sqlite_core_1.sqliteTable)('product_categories', {
    productId: (0, sqlite_core_1.integer)('product_id').notNull().references(() => exports.products.id, { onDelete: 'cascade' }),
    categoryId: (0, sqlite_core_1.integer)('category_id').notNull().references(() => exports.categories.id, { onDelete: 'cascade' }),
}, (table) => {
    return {
        pk: (0, sqlite_core_1.primaryKey)({ columns: [table.productId, table.categoryId] }),
    };
});
// Product Tags
exports.tags = (0, sqlite_core_1.sqliteTable)('tags', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull().unique(),
    slug: (0, sqlite_core_1.text)('slug').notNull().unique(),
});
// Product Tags (many-to-many relationship)
exports.productTags = (0, sqlite_core_1.sqliteTable)('product_tags', {
    productId: (0, sqlite_core_1.integer)('product_id').notNull().references(() => exports.products.id, { onDelete: 'cascade' }),
    tagId: (0, sqlite_core_1.integer)('tag_id').notNull().references(() => exports.tags.id, { onDelete: 'cascade' }),
}, (table) => {
    return {
        pk: (0, sqlite_core_1.primaryKey)({ columns: [table.productId, table.tagId] }),
    };
});
// Product Attributes
exports.attributes = (0, sqlite_core_1.sqliteTable)('attributes', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
});
// Product Attribute Values
exports.attributeValues = (0, sqlite_core_1.sqliteTable)('attribute_values', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    attributeId: (0, sqlite_core_1.integer)('attribute_id').notNull().references(() => exports.attributes.id, { onDelete: 'cascade' }),
    value: (0, sqlite_core_1.text)('value').notNull(),
});
// Product Variants
exports.productVariants = (0, sqlite_core_1.sqliteTable)('product_variants', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    productId: (0, sqlite_core_1.integer)('product_id').notNull().references(() => exports.products.id, { onDelete: 'cascade' }),
    sku: (0, sqlite_core_1.text)('sku'),
    price: (0, sqlite_core_1.real)('price'),
    inventory: (0, sqlite_core_1.integer)('inventory').notNull().default(0),
});
// Product Variant Attributes
exports.productVariantAttributes = (0, sqlite_core_1.sqliteTable)('product_variant_attributes', {
    variantId: (0, sqlite_core_1.integer)('variant_id').notNull().references(() => exports.productVariants.id, { onDelete: 'cascade' }),
    attributeValueId: (0, sqlite_core_1.integer)('attribute_value_id').notNull().references(() => exports.attributeValues.id, { onDelete: 'cascade' }),
}, (table) => {
    return {
        pk: (0, sqlite_core_1.primaryKey)({ columns: [table.variantId, table.attributeValueId] }),
    };
});
// Cart Schema
exports.carts = (0, sqlite_core_1.sqliteTable)('carts', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }),
    sessionId: (0, sqlite_core_1.text)('session_id'), // For guest users
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default(String(new Date().toISOString())),
});
// Cart Items Schema
exports.cartItems = (0, sqlite_core_1.sqliteTable)('cart_items', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    cartId: (0, sqlite_core_1.integer)('cart_id').notNull().references(() => exports.carts.id, { onDelete: 'cascade' }),
    productId: (0, sqlite_core_1.integer)('product_id').notNull().references(() => exports.products.id, { onDelete: 'cascade' }),
    variantId: (0, sqlite_core_1.integer)('variant_id').references(() => exports.productVariants.id, { onDelete: 'set null' }),
    quantity: (0, sqlite_core_1.integer)('quantity').notNull().default(1),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default(String(new Date().toISOString())),
});
// Wishlist Schema
exports.wishlists = (0, sqlite_core_1.sqliteTable)('wishlists', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
});
// Wishlist Items Schema
exports.wishlistItems = (0, sqlite_core_1.sqliteTable)('wishlist_items', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    wishlistId: (0, sqlite_core_1.integer)('wishlist_id').notNull().references(() => exports.wishlists.id, { onDelete: 'cascade' }),
    productId: (0, sqlite_core_1.integer)('product_id').notNull().references(() => exports.products.id, { onDelete: 'cascade' }),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
});
// Order Schema
exports.orders = (0, sqlite_core_1.sqliteTable)('orders', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    orderNumber: (0, sqlite_core_1.text)('order_number').notNull().unique(),
    status: (0, sqlite_core_1.text)('status').$type().notNull().default(OrderStatus.PENDING),
    subtotal: (0, sqlite_core_1.real)('subtotal').notNull(),
    tax: (0, sqlite_core_1.real)('tax').notNull(),
    shippingCost: (0, sqlite_core_1.real)('shipping_cost').notNull(),
    total: (0, sqlite_core_1.real)('total').notNull(),
    shippingAddressId: (0, sqlite_core_1.integer)('shipping_address_id').references(() => exports.addresses.id),
    billingAddressId: (0, sqlite_core_1.integer)('billing_address_id').references(() => exports.addresses.id),
    paymentMethod: (0, sqlite_core_1.text)('payment_method'),
    paymentStatus: (0, sqlite_core_1.text)('payment_status').notNull().default('pending'),
    notes: (0, sqlite_core_1.text)('notes'),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
    updatedAt: (0, sqlite_core_1.text)('updated_at').notNull().default(String(new Date().toISOString())),
});
// Order Items Schema
exports.orderItems = (0, sqlite_core_1.sqliteTable)('order_items', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    orderId: (0, sqlite_core_1.integer)('order_id').notNull().references(() => exports.orders.id, { onDelete: 'cascade' }),
    productId: (0, sqlite_core_1.integer)('product_id').notNull().references(() => exports.products.id, { onDelete: 'restrict' }),
    variantId: (0, sqlite_core_1.integer)('variant_id').references(() => exports.productVariants.id, { onDelete: 'set null' }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    sku: (0, sqlite_core_1.text)('sku'),
    price: (0, sqlite_core_1.real)('price').notNull(),
    quantity: (0, sqlite_core_1.integer)('quantity').notNull(),
    subtotal: (0, sqlite_core_1.real)('subtotal').notNull(),
});
// Refresh Token Schema
exports.refreshTokens = (0, sqlite_core_1.sqliteTable)('refresh_tokens', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)('user_id').notNull().references(() => exports.users.id, { onDelete: 'cascade' }),
    token: (0, sqlite_core_1.text)('token').notNull().unique(),
    expires: (0, sqlite_core_1.text)('expires').notNull(),
    createdAt: (0, sqlite_core_1.text)('created_at').notNull().default(String(new Date().toISOString())),
    createdByIp: (0, sqlite_core_1.text)('created_by_ip'),
    revokedAt: (0, sqlite_core_1.text)('revoked_at'),
    revokedByIp: (0, sqlite_core_1.text)('revoked_by_ip'),
    replacedByToken: (0, sqlite_core_1.text)('replaced_by_token'),
});
