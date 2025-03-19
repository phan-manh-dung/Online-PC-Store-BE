const supplierService = require('../services/Supplier_Service'); 

// Lấy tất cả Suppliers
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await supplierService.getAllSuppliers();
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(400).json({
            message: 'Error fetching suppliers',
            error: error.message,
        });
    }
};

// Lấy một Supplier theo ID
const getSupplierById = async (req, res) => {
    try {
        const supplierId = req.params.id;
        const supplier = await supplierService.getSupplierById(supplierId);
        res.status(200).json(supplier);
    } catch (error) {
        res.status(400).json({
            message: 'Error fetching supplier',
            error: error.message,
        });
    }
};

const getSuppliersByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params; 
        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required' });
        }

        const suppliers = await supplierService.getUniqueSuppliersByCategory(categoryId);

        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllSuppliers, getSupplierById, getSuppliersByCategory };
