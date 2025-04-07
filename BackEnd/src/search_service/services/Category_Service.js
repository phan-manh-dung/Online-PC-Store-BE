const Category = require('../models/Category_Model');
const redisService = require('../services/Redis_Service');

// Lấy tất cả các category
const getAllCategories = async () => {
  const cacheKey = 'categories:all';

  const cachedCategories = await redisService.getCache(cacheKey);
  if (cachedCategories) {
    console.log('Data retrieved from Redis cache');
    return cachedCategories;
  }

  try {
    const categories = await Category.find();
    await redisService.setCache(cacheKey, categories, 3600);
    return categories;
  } catch (error) {
    throw new Error('Error retrieving categories');
  }
};

// Lấy category theo id
const getCategoryById = async (id) => {
  const cacheKey = `category:${id}`;

  const cachedCategory = await redisService.getCache(cacheKey);
  if (cachedCategory) {
    console.log('Data retrieved from Redis cache');
    return cachedCategory;
  }

  try {
    const category = await Category.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    await redisService.setCache(cacheKey, category, 3600);
    return category;
  } catch (error) {
    throw new Error('Error retrieving category by id');
  }
};

const getCategoriesWithSuppliers = async (type) => {
  const cacheKey = `categories:suppliers:type:${type}`;

  const cachedCategories = await redisService.getCache(cacheKey);
  if (cachedCategories) {
    console.log('Data retrieved from Redis cache');
    return cachedCategories;
  }

  try {
    const categoriesWithSuppliers = await Category.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "products_info"
        }
      },
      { $unwind: { path: "$products_info", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "suppliers",
          localField: "products_info.supplier",
          foreignField: "_id",
          as: "suppliers_info"
        }
      },
      { $unwind: { path: "$suppliers_info", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          description: { $first: "$description" },
          suppliers: {
            $addToSet: {
              _id: "$suppliers_info._id",
              name: "$suppliers_info.name"
            }
          }
        }
      },
      {
        $addFields: {
          type: type || "default"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          suppliers: 1,
          type: 1
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    await redisService.setCache(cacheKey, categoriesWithSuppliers, 3600);
    return categoriesWithSuppliers;
  } catch (error) {
    throw new Error('Error retrieving categories with suppliers');
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoriesWithSuppliers
};
