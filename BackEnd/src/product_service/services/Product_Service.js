const Product = require('../models/Product_Model');

// Lấy tất cả sản phẩm
const getAllProducts = async () => {
    return await Product.find();
};

// Lấy sản phẩm theo ID
const getProductById = async (productId) => {
    return await Product.findById(productId);
};

// Hàm lấy sản phẩm đã sắp xếp theo giá
const getProductsSortedbyPrice = async ({ price_min, price_max, sort_by, page, limit }) => {
    try {
        const filterOptions = {};
        if (price_min) filterOptions.price = { $gte: parseFloat(price_min) };
        if (price_max) filterOptions.price = { $lte: parseFloat(price_max) };

        let sortOptions = {};
        if (sort_by === 'price_asc') {
            sortOptions = { price: 1 }; 
        } else if (sort_by === 'price_desc') {
            sortOptions = { price: -1 }; 
        } else {
            sortOptions = { price: 1 }; 
        }

        const skip = (page - 1) * limit;

        const products = await Product.find(filterOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sortOptions); 

        return products;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Hàm đếm tổng số sản phẩm (để tính số trang)
const getProductCount = async ({ price_min, price_max }) => {
    try {
        const filterOptions = {};
        if (price_min) filterOptions.price = { $gte: parseFloat(price_min) };
        if (price_max) filterOptions.price = { $lte: parseFloat(price_max) };

        // Đếm tổng số sản phẩm trong database
        return await Product.countDocuments(filterOptions);
    } catch (error) {
        throw new Error(error.message);
    }
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
    getProductsSortedbyPrice,
    getProductCount,
};
