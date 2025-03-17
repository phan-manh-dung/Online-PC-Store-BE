const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/Supplier_Controller');
const { authMiddleware } = require('../middleware/authMiddleware');

// Lấy tất cả Suppliers
router.get('/get-all', supplierController.getAllSuppliers);

// Lấy Supplier theo ID
router.get('/get-by-id/:id', supplierController.getSupplierById);

module.exports = router;


