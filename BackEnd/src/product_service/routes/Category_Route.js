const express = require('express');
const categoryController = require('../controllers/Category_Controller');

const router = express.Router();

router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);

module.exports = router;
