const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const { productController } = require('../../controllers');

const router = express.Router();

// Create product
router.post(
  '/create',
  validate(productController.createProduct.validation),
  catchAsync(productController.createProduct.handler)
);

// Get all products with filters
router.get(
  '/get',
  validate(productController.getAllProducts.validation),
  catchAsync(productController.getAllProducts.handler)
);

// Get related products by category
router.get(
  '/get-related-product',
  validate(productController.getLatestProductsByCategory.validation),
  catchAsync(productController.getLatestProductsByCategory.handler)
);

// Get trending products (latest products)
router.get(
  '/get-trending',
  validate(productController.getTrendingProducts.validation),
  catchAsync(productController.getTrendingProducts.handler)
);

// Get products by price range
router.get(
  '/get-products-by-price',
  catchAsync(productController.getProductsByPrice.handler)
);

// Get products on sale
router.get(
  '/get-on-sale',
  catchAsync(productController.getOnSale.handler)
);

// Get best selling products
router.get(
  '/get-best-selling',
  validate(productController.getBestSelling.validation),
  catchAsync(productController.getBestSelling.handler)
);

// Update product
router.put(
  '/update/:_id',
  catchAsync(productController.updateProducts.handler)
);

// Delete single product
router.delete(
  '/delete/:_id',
  catchAsync(productController.deleteProduct.handler)
);

// Delete multiple products
router.delete(
  '/multi-delete',
  validate(productController.multiDeleteProducts.validation),
  catchAsync(productController.multiDeleteProducts.handler)
);

// Get product by ID
router.get(
  '/get-product-id/:id',
  validate(productController.getProductById.validation),
  catchAsync(productController.getProductById.handler)
);

module.exports = router;

