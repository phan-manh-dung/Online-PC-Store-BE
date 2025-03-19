const Supplier = require('../models/Supplier_Model'); 
const Product = require('../models/Product_Model');

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

const getUniqueSuppliersByCategory = async (categoryId) => {
    try {
        const supplierIds = await Product.distinct('supplier', { category: categoryId });

        const suppliers = await Supplier.find({ _id: { $in: supplierIds } }).select('_id name');

        return {
            hasSuppliers: suppliers.length > 0,
            suppliers: suppliers
        };
    } catch (error) {
        throw new Error(error.message);
    }
};



module.exports = { getSupplierById, getUniqueSuppliersByCategory };
