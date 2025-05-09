const Product = require('../models/Product_Model');
const cloudinary = require('../config/cloudinaryConfig');
const redisService = require('../services/Redis_Service');

const getAllProducts = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const cacheKey = `getall-products:page=${page}:limit=${limit}`;

  const cachedProducts = await redisService.getCache(cacheKey);
  if (cachedProducts) {
    console.log('✅ Products retrieved from Redis cache');
    return cachedProducts;
  }

  try {
    const [products, total] = await Promise.all([
      Product.find().populate('promotion').skip(skip).limit(Number(limit)),
      Product.countDocuments(),
    ]);

    const total_pages = Math.ceil(total / limit);
    const result = {
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages,
      },
    };

    await redisService.setCache(cacheKey, result, 3600); // cache 1 giờ
    console.log('✅ Products retrieved from MongoDB and cached in Redis');
    return result;
  } catch (error) {
    throw new Error('Error retrieving paginated products: ' + error.message);
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

async function addPromotionToProduct(productId, promotionId) {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error('Product not found');
  }
  product.promotion = promotionId;

  return await product.save();
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addPromotionToProduct,
};
