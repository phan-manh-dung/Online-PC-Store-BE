const Inventory = require('../models/Inventory_Model');
const redisService = require('../services/Redis_Service');

class InventoryService {
  // Lấy danh sách tồn kho
  async getAllInventory() {
    const cacheKey = 'inventory:all';

    const cachedInventory = await redisService.getCache(cacheKey);
    if (cachedInventory) {
      console.log('Data retrieved from Redis cache');
      return cachedInventory;
    }

    try {
      const inventory = await Inventory.find();
      await redisService.setCache(cacheKey, inventory, 3600); // Lưu cache trong 1 giờ
      return inventory;
    } catch (error) {
      throw new Error('Error retrieving inventory');
    }
  }

  // Lấy thông tin tồn kho theo ID
  async getInventoryById(id) {
    const cacheKey = `inventory:${id}`;

    const cachedInventory = await redisService.getCache(cacheKey);
    if (cachedInventory) {
      console.log('Data retrieved from Redis cache');
      return cachedInventory;
    }

    try {
      const inventory = await Inventory.findById(id);
      if (!inventory) {
        throw new Error('Inventory not found');
      }
      await redisService.setCache(cacheKey, inventory, 3600); // Lưu cache trong 1 giờ
      return inventory;
    } catch (error) {
      throw new Error('Error retrieving inventory by id');
    }
  }
}

module.exports = new InventoryService();
