const Supplier = require('../models/Supplier_Model'); 

// Lấy một Supplier theo ID
const getSupplierById = async (supplierId) => {
    try {
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            throw new Error('Supplier not found');
        }
        return supplier;
    } catch (error) {
        throw new Error('Error fetching supplier: ' + error.message);
    }
};


module.exports = { getSupplierById };
