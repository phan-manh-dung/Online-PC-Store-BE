const Supplier = require('../models/Supplier_Model');
const redisService = require('../services/Redis_Service');

const createSupplier = async (supplierData) => {
    try {
        const newSupplier = new Supplier(supplierData);
        await newSupplier.save();

        await redisService.deleteCache('suppliers:all');

        return newSupplier;
    } catch (error) {
        throw new Error('Error creating supplier: ' + error.message);
    }
};

const getAllSuppliers = async () => {
    const cacheKey = 'suppliers:all';
    const cachedSuppliers = await redisService.getCache(cacheKey);
    if (cachedSuppliers) {
        return cachedSuppliers;
    }
    try {
        const suppliers = await Supplier.find();
        await redisService.setCache(cacheKey, suppliers, 3600); 
        return suppliers;
    } catch (error) {
        throw new Error('Error fetching suppliers: ' + error.message);
    }
};

const getSupplierById = async (supplierId) => {
    const cacheKey = `supplier:${supplierId}`;
    const cachedSupplier = await redisService.getCache(cacheKey);
    if (cachedSupplier) {
        return cachedSupplier;
    }
    try {
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            throw new Error('Supplier not found');
        }
        await redisService.setCache(cacheKey, supplier, 3600); 
        return supplier;
    } catch (error) {
        throw new Error('Error fetching supplier: ' + error.message);
    }
};

const updateSupplier = async (supplierId, supplierData) => {
    try {
        const updatedSupplier = await Supplier.findByIdAndUpdate(supplierId, supplierData, {
            new: true,
            runValidators: true,
        });
        if (!updatedSupplier) {
            throw new Error('Supplier not found');
        }

        const cacheKey = `supplier:${supplierId}`;
        await redisService.setCache(cacheKey, updatedSupplier, 3600); 

        await redisService.deleteCache('suppliers:all');

        return updatedSupplier;
    } catch (error) {
        throw new Error('Error updating supplier: ' + error.message);
    }
};

const deleteSupplier = async (supplierId) => {
    try {
        const deletedSupplier = await Supplier.findByIdAndDelete(supplierId);
        if (!deletedSupplier) {
            throw new Error('Supplier not found');
        }

        const cacheKey = `supplier:${supplierId}`;
        await redisService.deleteCache(cacheKey); 
        await redisService.deleteCache('suppliers:all');

        return deletedSupplier;
    } catch (error) {
        throw new Error('Error deleting supplier: ' + error.message);
    }
};

module.exports = { createSupplier, getAllSuppliers, getSupplierById, updateSupplier, deleteSupplier };
