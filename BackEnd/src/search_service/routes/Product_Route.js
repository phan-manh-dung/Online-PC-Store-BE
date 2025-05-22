const express = require('express');
const productController = require('../controllers/Product_Controller');
const { authMiddleware } = require('../middleware/authMiddleware');
router = express.Router();

router.get('/get-all', productController.getAllProducts);
router.get('/get-by-id/:id', productController.getProductById);
router.get('/get-sorted', productController.getProductsSortedbyPrice);
router.get('/get-type', productController.getProductsByType);
router.get('/get-products-by-type-supplier', productController.getProductsByTypeSupplier);
router.get('/get-products-by-category-supplier', productController.getProductsByCategorySupplier);

router.get('/brands/:categoryId', productController.getBrandsByCategory);
router.get('/series', productController.getSeriesByBrand);
router.get('/get-by-brandcomputer', productController.getProductsByBrandComputer);

module.exports = router;
