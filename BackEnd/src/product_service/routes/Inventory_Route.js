const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/Inventory_Controller');

router.get('/get-all', inventoryController.getAllInventory);
router.get('/get-by-id/:id', inventoryController.getInventoryById);

module.exports = router;
