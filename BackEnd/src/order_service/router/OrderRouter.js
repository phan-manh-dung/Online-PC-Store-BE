const express = require('express');
const orderController = require('../controller/OrderController');
const router = express.Router();

router.post('/create-order', orderController.createOrder);

module.exports = router;
