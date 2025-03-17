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

module.exports = { getAllSuppliers, getSupplierById };
