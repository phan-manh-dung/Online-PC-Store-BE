const InventoryService = require('../services/Inventory_Service');

const getAllInventory = async (req, res) => {
    try {
        const inventory = await InventoryService.getAllInventory();
        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

const getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const inventory = await InventoryService.getInventoryById(id);

        if (!inventory) {
            return res.status(404).json({ success: false, message: 'Inventory not found' });
        }

        res.status(200).json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getAllInventory,
    getInventoryById,
};
