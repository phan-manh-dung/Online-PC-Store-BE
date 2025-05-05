const Supplier = require('../models/Supplier_Model');
const Product = require('../models/Product_Model');
const redisService = require('../services/Redis_Service');

// Lấy một Supplier theo ID
const getSupplierById = async (supplierId) => {
  const cacheKey = `supplier:${supplierId}`;

  const cachedSupplier = await redisService.getCache(cacheKey);
  if (cachedSupplier) {
    console.log('Data retrieved from Redis cache');
    return cachedSupplier;
  }

  try {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    await redisService.setCache(cacheKey, supplier, 3600); // Lưu cache trong 1 giờ
    return supplier;
  } catch (error) {
    throw new Error('Error fetching supplier: ' + error.message);
  }
};

// Lấy các Supplier duy nhất theo Category ID
const getUniqueSuppliersByCategory = async (categoryId) => {
  const cacheKey = `suppliers:category:${categoryId}`;

  const cachedSuppliers = await redisService.getCache(cacheKey);
  if (cachedSuppliers) {
    console.log('Data retrieved from Redis cache');
    return cachedSuppliers;
  }

  try {
    const supplierIds = await Product.distinct('supplier', { category: categoryId });

    const suppliers = await Supplier.find({ _id: { $in: supplierIds } }).select('_id name');

    const result = {
      hasSuppliers: suppliers.length > 0,
      suppliers: suppliers
    };

    await redisService.setCache(cacheKey, result, 3600); // Lưu cache trong 1 giờ
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { getSupplierById, getUniqueSuppliersByCategory };
