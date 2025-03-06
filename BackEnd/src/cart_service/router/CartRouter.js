const express = require('express');
const cartController = require('../controller/CartController');
const router = express.Router();

router.post('/create-cart', express.json({ limit: '50mb' }), cartController.createCart);
router.delete('/delete-cart/:id', cartController.deleteCart);
router.get('/get-cart/:id', cartController.getCartUser);

module.exports = router;
