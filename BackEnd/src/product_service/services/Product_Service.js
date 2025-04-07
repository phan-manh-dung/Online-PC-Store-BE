const Product = require('../models/Product_Model');
const cloudinary = require('../config/cloudinaryConfig');
const redisService = require('../services/Redis_Service');

const getAllProducts = async () => {
    const cacheKey = 'products:all';
    const cachedProducts = await redisService.getCache(cacheKey);
    if (cachedProducts) {
        console.log('All Products retrieved from Redis cache');
        return cachedProducts;
    }
    try {
        const products = await Product.find();
        await redisService.setCache(cacheKey, products, 3600); 
        console.log('All Products retrieved from MongoDB and cached in Redis');
        return products;
    } catch (error) {
        throw new Error('Error retrieving all products: ' + error.message);
    }
};

const getProductById = async (productId) => {
    const cacheKey = `product:${productId}`;
    const cachedProduct = await redisService.getCache(cacheKey);
    if (cachedProduct) {
        return cachedProduct;
    }
    try {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        await redisService.setCache(cacheKey, product, 3600); 
        return product;
    } catch (error) {
        throw new Error('Error retrieving product by id: ' + error.message);
    }
};

const createProduct = async (productData, filePath) => {
    try {
        const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
            folder: 'products',
        });

        const newProduct = new Product({
            ...productData,
            image: cloudinaryResponse.secure_url,
        });

        console.log(newProduct);
        
        await newProduct.save();

        await redisService.deleteCache('products:all');
        
        return newProduct;
    } catch (error) {
        throw new Error('Error creating product: ' + error.message);
    }
};

const updateProduct = async (productId, updateData) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
        if (!updatedProduct) {
            throw new Error('Product not found');
        }

        const cacheKey = `product:${productId}`;
        await redisService.setCache(cacheKey, updatedProduct, 3600); 
        await redisService.deleteCache('products:all');

        return updatedProduct;
    } catch (error) {
        throw new Error('Error updating product: ' + error.message);
    }
};

const deleteProduct = async (productId) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(productId);
        if (!deletedProduct) {
            throw new Error('Product not found');
        }

        const cacheKey = `product:${productId}`;
        await redisService.deleteCache(cacheKey); 

        await redisService.deleteCache('products:all');

        return deletedProduct;
    } catch (error) {
        throw new Error('Error deleting product: ' + error.message);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
