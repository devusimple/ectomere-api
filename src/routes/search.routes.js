"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("../controllers/search.controller");
const router = (0, express_1.Router)();
const searchController = new search_controller_1.SearchController();
// Search products
router.get('/', searchController.searchProducts);
// Get product suggestions
router.get('/suggestions', searchController.getProductSuggestions);
// Get popular search terms
router.get('/popular', searchController.getPopularSearchTerms);
exports.default = router;
