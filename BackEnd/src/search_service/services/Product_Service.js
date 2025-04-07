const Product = require('../models/Product_Model');
const supplierService = require('../services/Supplier_Service');
const categoryService = require('../services/Category_Service');
const redisService = require('../services/Redis_Service');

// Lấy tất cả sản phẩm
const getAllProducts = async () => {

  const cacheKey = 'products:all';  
  const cachedProducts = await redisService.getCache(cacheKey);

  if (cachedProducts) {
    console.log('Data retrieved from Redis cache');
    return cachedProducts;
  }

  try {
    const products = await Product.find();
    await redisService.setCache(cacheKey, products, 3600);

    console.log('Data retrieved from MongoDB and cached in Redis');
    return products;
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw new Error(error.message);
  }
};

// Lấy sản phẩm theo ID
const getProductById = async (productId) => {
  const cacheKey = `product:${productId}`;

  const cachedProduct = await redisService.getCache(cacheKey);
  if (cachedProduct) {
    console.log('Data retrieved from Redis cache');
    return cachedProduct;
  }

  try {
    const product = await Product.findById(productId);
    if (product) {
      await redisService.setCache(cacheKey, product, 3600); // Lưu vào cache 1 giờ
    }
    return product;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw new Error(error.message);
  }
};

// Lấy sản phẩm theo loại
const getProductsByType = async (type) => {
  const cacheKey = `products:type:${type}`;

  const cachedProducts = await redisService.getCache(cacheKey);
  if (cachedProducts) {
    console.log('Data retrieved from Redis cache');
    return cachedProducts;
  }

  try {
    const products = await Product.find({ 'computer.type': type });
    await redisService.setCache(cacheKey, products, 3600); // Lưu vào cache 1 giờ

    console.log('Data retrieved from MongoDB and cached in Redis');
    return products;
  } catch (error) {
    console.error('Error fetching products by type:', error);
    throw new Error(error.message);
  }
};

// Lấy sản phẩm theo nhà cung cấp và loại
const getProductsByTypeSupplier = async (supplierId, type) => {

  const cacheKey = `products:supplier:${supplierId}:type:${type}`;
  const cachedProducts = await redisService.getCache(cacheKey);

  if (cachedProducts) {
    console.log('Data retrieved from Redis cache');
    return cachedProducts;
  }

  try {
    const supplierInfo = await supplierService.getSupplierById(supplierId);
    
    if (!supplierInfo) {
      throw new Error('Supplier not found');
    }

    console.log(`Searching for products from supplier: ${supplierInfo.name}, type: ${type}`);

    const products = await Product.find({
      'supplier': supplierId,
      'computer.type': type
    });

    await redisService.setCache(cacheKey, products, 3600); // Lưu vào cache 1 giờ

    return products;
  } catch (error) {
    console.error('Error fetching products by supplier and type:', error);
    throw new Error(error.message);
  }
};

// Lấy sản phẩm theo nhà cung cấp và danh mục
const getProductsByCategorySupplier = async (supplierId, categoryId) => {
  const cacheKey = `products:supplier:${supplierId}:category:${categoryId}`;

  // Kiểm tra xem dữ liệu đã có trong Redis chưa
  const cachedProducts = await redisService.getCache(cacheKey);
  if (cachedProducts) {
    console.log('Data retrieved from Redis cache');
    return cachedProducts;
  }

  try {
    const supplierInfo = await supplierService.getSupplierById(supplierId);
    const categoryInfo = await categoryService.getCategoryById(categoryId);

    if (!supplierInfo) {
      throw new Error('Supplier not found');
    } else if (!categoryInfo) {
      throw new Error('Category not found');
    }

    console.log(`Searching for products from supplier: ${supplierInfo.name}, category: ${categoryInfo.name}`);

    const products = await Product.find({
      supplier: supplierId,
      category: categoryId,
    });

    await redisService.setCache(cacheKey, products, 3600); // Lưu vào cache 1 giờ

    return products;
  } catch (error) {
    console.error('Error fetching products by supplier and category:', error);
    throw new Error(error.message);
  }
};

// Hàm lấy sản phẩm đã sắp xếp theo giá
const getProductsSortedbyPrice = async ({ price_min, price_max, sort_by, page, limit }) => {

  const cacheKey = `products:sorted:price:${price_min}:${price_max}:${sort_by}:${page}:${limit}`;
  const cachedProducts = await redisService.getCache(cacheKey);

  if (cachedProducts) {
    console.log('Data retrieved from Redis cache');
    return cachedProducts;
  }

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

    await redisService.setCache(cacheKey, products, 3600); // Lưu vào cache 1 giờ

    console.log('Data retrieved from MongoDB and cached in Redis');
    return products;
  } catch (error) {
    console.error('Error fetching products sorted by price:', error);
    throw new Error(error.message);
  }
};

// Hàm đếm tổng số sản phẩm (để tính số trang)
const getProductCount = async ({ price_min, price_max }) => {
  const cacheKey = `products:count:${price_min}:${price_max}`;

  const cachedCount = await redisService.getCache(cacheKey);
  if (cachedCount) {
    console.log('Data retrieved from Redis cache');
    return cachedCount;
  }

  try {
    const filterOptions = {};
    if (price_min) filterOptions.price = { $gte: parseFloat(price_min) };
    if (price_max) filterOptions.price = { $lte: parseFloat(price_max) };

    const count = await Product.countDocuments(filterOptions);

    await redisService.setCache(cacheKey, count, 3600); // Lưu vào cache 1 giờ

    return count;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Lấy các nhãn hiệu theo danh mục
const getBrandsByCategory = async (categoryId) => {
  const cacheKey = `brands:category:${categoryId}`;

  const cachedBrands = await redisService.getCache(cacheKey);
  if (cachedBrands) {
    console.log('Data retrieved from Redis cache');
    return cachedBrands;
  }

  try {
    const brands = await Product.distinct('computer.brand', { category: categoryId });
    await redisService.setCache(cacheKey, brands, 3600); // Lưu vào cache 1 giờ
    return brands;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Lấy các series theo nhãn hiệu và loại
const getSeriesByBrand = async (brand, type) => {
  const cacheKey = `series:brand:${brand}:type:${type}`;

  const cachedSeries = await redisService.getCache(cacheKey);
  if (cachedSeries) {
    console.log('Data retrieved from Redis cache');
    return cachedSeries;
  }

  try {
    const result = await Product.aggregate([
      { $match: { 'computer.brand': brand, 'computer.type': type } },
      { $group: { _id: null, series: { $addToSet: { $concat: ['$computer.series', ' series'] } } } },
      { $project: { _id: 0, series: 1 } },
    ]);

    const series = result.length > 0 ? result[0].series : [];

    await redisService.setCache(cacheKey, series, 3600); // Lưu vào cache 1 giờ

    return series;
  } catch (error) {
    throw new Error('Error fetching series: ' + error.message);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsSortedbyPrice,
  getProductCount,
  getProductsByType,
  getProductsByTypeSupplier,
  getProductsByCategorySupplier,
  getBrandsByCategory,
  getSeriesByBrand,
};
