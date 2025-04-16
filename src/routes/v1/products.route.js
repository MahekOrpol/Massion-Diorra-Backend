const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const { productController } = require('../../controllers');

const router = express.Router();

router.post('/create',validate(productController.createProduct.validation), catchAsync(productController.createProduct.handler));
router.get('/get',validate(productController.getAllProducts.validation),catchAsync(productController.getAllProducts.handler));
router.get('/get-related-product',validate(productController.getLatestProductsByCategory.validation),catchAsync(productController.getLatestProductsByCategory.handler));
router.get('/getTopRated',catchAsync(productController.getTrendingProducts.handler));
router.get('/getProductsByPrice',catchAsync(productController.getProductsByPrice.handler));
router.get('/getOnSale',catchAsync(productController.getOnSale.handler));
router.get('/getBestSelling',catchAsync(productController.getBestSelling.handler));
router.put('/update/:_id', catchAsync(productController.updateProducts.handler));
router.delete('/delete/:_id', catchAsync(productController.deleteProduct.handler));
router.delete('/multi-delete', validate(productController.multiDeleteProducts.validation), catchAsync(productController.multiDeleteProducts.handler));
router.get('/getSingleProduct/:productId', validate(productController.getSingleProduct.validation), catchAsync(productController.getSingleProduct.handler));
router.get("/get-product-id/:id", validate(productController.getProductById.validation), catchAsync(productController.getProductById.handler));
module.exports = router;

