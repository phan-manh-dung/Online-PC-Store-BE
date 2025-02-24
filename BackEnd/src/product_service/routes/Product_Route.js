const express = require('express');
const productController = require('../controllers/Product_Controller');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/get-all', productController.getAllProducts);
router.get('/get-by-id/:id', productController.getProductById);

router.post('/admin/create', productController.createProduct);
router.put('/admin/update/:id', productController.updateProduct);
router.delete('/admin/delete/:id', authMiddleware, productController.deleteProduct);
router.post('/admin/create', authMiddleware, productController.createProduct);
router.put('/admin/update/:id', authMiddleware, productController.updateProduct);
router.delete('/admin/delete/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
