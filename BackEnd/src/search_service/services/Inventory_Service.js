const Inventory = require('../models/Inventory_Model');

class InventoryService {
    // Lấy danh sách tồn kho
    async getAllInventory() {
        return await Inventory.find();
    }

    // Lấy thông tin tồn kho theo ID
    async getInventoryById(id) {
        return await Inventory.findById(id);
    }
}

module.exports = new InventoryService();
