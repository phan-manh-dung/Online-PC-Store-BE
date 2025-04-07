const Inventory = require('../models/Inventory_Model');
const redisService = require('../services/Redis_Service');

class InventoryService {
    async getAllInventory() {
        const cacheKey = 'inventory:all';
        const cachedInventory = await redisService.getCache(cacheKey);
        if (cachedInventory) {
            return cachedInventory;
        }
        const inventory = await Inventory.find();
        await redisService.setCache(cacheKey, inventory, 3600);
        return inventory;
    }

    async getInventoryById(id) {
        const cacheKey = `inventory:${id}`;
        const cachedInventory = await redisService.getCache(cacheKey);
        if (cachedInventory) {
            return cachedInventory;
        }
        const inventory = await Inventory.findById(id);
        if (!inventory) {
            throw new Error('Inventory not found');
        }
        await redisService.setCache(cacheKey, inventory, 3600);
        return inventory;
    }

    async createInventory(data) {
        const newInventory = new Inventory(data);
        const createdInventory = await newInventory.save();
        await redisService.deleteCache('inventory:all');
        return createdInventory;
    }

    async updateInventory(id, data) {
        const updatedInventory = await Inventory.findByIdAndUpdate(id, data, { new: true });
        if (!updatedInventory) {
            throw new Error('Inventory not found');
        }
        const cacheKey = `inventory:${id}`;
        await redisService.setCache(cacheKey, updatedInventory, 3600);
        await redisService.deleteCache('inventory:all');
        return updatedInventory;
    }

    async deleteInventory(id) {
        const deletedInventory = await Inventory.findByIdAndDelete(id);
        if (!deletedInventory) {
            throw new Error('Inventory not found');
        }
        const cacheKey = `inventory:${id}`;
        await redisService.deleteCache(cacheKey);
        await redisService.deleteCache('inventory:all');
        return deletedInventory;
    }
}

module.exports = new InventoryService();
