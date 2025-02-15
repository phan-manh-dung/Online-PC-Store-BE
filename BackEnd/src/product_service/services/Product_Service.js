const Product = require('../models/Product_Model');

// Lấy tất cả sản phẩm
const getAllProducts = async () => {
    return await Product.find();
};

// Lấy sản phẩm theo ID
const getProductById = async (productId) => {
    return await Product.findById(productId);
};


// Tạo mới sản phẩm
const createProduct = async (productData) => {
    try {
        const newProduct = new Product(productData);
        await newProduct.save();
        return newProduct;
    } catch (error) {
        throw new Error(`Error creating product: ${error.message}`);
    }
};

// Cập nhật sản phẩm theo ID
const updateProduct = async (productId, updateData) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
        if (!updatedProduct) {
            throw new Error('Product not found');
        }
        return updatedProduct;
    } catch (error) {
        throw new Error(`Error updating product: ${error.message}`);
    }
};

// Xóa sản phẩm theo ID
const deleteProduct = async (productId) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(productId);
        if (!deletedProduct) {
            throw new Error('Product not found');
        }
        return deletedProduct;
    } catch (error) {
        throw new Error(`Error deleting product: ${error.message}`);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
