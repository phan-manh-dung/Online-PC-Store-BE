const express = require('express');
const orderController = require('../controller/OrderController');
const { authMiddlewareOrder } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create-order', express.json({ limit: '50mb' }), orderController.createOrder);
router.get('/get-detail-order/:id', orderController.getDetailOrder);
router.patch('/cancel-order/:id', orderController.deleteOrderToCancelled);
// get all order of user(lấy tất cả các đơn order của 1 user)
router.get('/get-all-order-user/:id', orderController.getAllOrderOfUser);
// get order of all user(lấy tất cả order của all user)
router.get('/admin/get-all-order', authMiddlewareOrder, orderController.getAllOrder);
// update status order
router.put('/update-status', orderController.updateStatusOrder);
// đếm số đơn hàng của từng user
router.get('/order-count/:id', orderController.countOrderByUser);
// thống kê doanh thu theo từng user
router.get('/admin/sales-stats', authMiddlewareOrder, orderController.getSalesStats);
// lấy tất cả các đơn hàng và doanh thu trong db
router.get('/admin/summary-stats', authMiddlewareOrder, orderController.getSummaryStats);
// thống kê doanh thu theo ngày tháng năm
router.get('/admin/revenue-stats', authMiddlewareOrder, orderController.getRevenueStatsByDate);
// thống kê doanh thu theo tháng năm
router.get('/admin/revenue-stats-by-year', authMiddlewareOrder, orderController.getRevenueStatsByYear);

module.exports = router;
