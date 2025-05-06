const express = require('express');
const cartController = require('../controller/CartController');
const router = express.Router();

router.post('/create-cart', express.json({ limit: '50mb' }), cartController.createCart);
router.delete('/delete-cart/:id', cartController.deleteCart);
router.get('/get-cart/:id', cartController.getCartUser);
router.post('/delete-many-cart', express.json({ limit: '50mb' }), cartController.deleteManyCart);
router.put('/update-cart/:userId/:productId', express.json({ limit: '50mb' }), cartController.updateCart);
router.get('/cart-count/:id', cartController.countCartByUser);
module.exports = router;
