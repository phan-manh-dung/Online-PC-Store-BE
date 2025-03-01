const express = require('express');
const orderController = require('../controller/OrderController');
const { authMiddlewareOrder } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create-order', orderController.createOrder);
router.get('/get-detail-order/:id', orderController.getDetailOrder);
router.get('/admin/get-all-order', authMiddlewareOrder, orderController.getAllOrder);

module.exports = router;
