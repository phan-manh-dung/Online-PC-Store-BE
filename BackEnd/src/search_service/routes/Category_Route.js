const express = require('express');
const categoryController = require('../controllers/Category_Controller');

const router = express.Router();

// Route để lấy tất cả các categories
router.get('/get-all', categoryController.getAllCategories);

// Route để lấy category theo id
router.get('/get-by-id/:id', categoryController.getCategoryById);

router.get("/get-by-brand", categoryController.getCategoriesBySupplier);

module.exports = router;
