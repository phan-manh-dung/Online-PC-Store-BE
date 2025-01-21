const Product = require('../models/Product_Model');

// Lấy tất cả sản phẩm
const getAllProducts = async () => {
    return await Product.find();
};

// Lấy sản phẩm theo ID
const getProductById = async (productId) => {
    return await Product.findById(productId);
};

module.exports = {
    getAllProducts,
    getProductById,
};
