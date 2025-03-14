const express = require('express');
const orderController = require('../controller/OrderController');
const { authMiddlewareOrder } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create-order', express.json({ limit: '50mb' }), orderController.createOrder);
router.get('/get-detail-order/:id', orderController.getDetailOrder);
router.delete('/cancel-order/:id', orderController.deleteOrderToCancelled);

router.get('/admin/get-all-order', authMiddlewareOrder, orderController.getAllOrder);

module.exports = router;
