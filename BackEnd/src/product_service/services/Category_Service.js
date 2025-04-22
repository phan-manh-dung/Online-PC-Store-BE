const Category = require('../models/Category_Model');
const redisService = require('../services/Redis_Service');

const getAllCategories = async () => {
    const cacheKey = 'categories:all';
    const cachedCategories = await redisService.getCache(cacheKey);
    if (cachedCategories) {
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

const getCategoryById = async (id) => {
    const cacheKey = `category:${id}`;
    const cachedCategory = await redisService.getCache(cacheKey);
    if (cachedCategory) {
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

const createCategory = async (categoryData) => {
    try {
        const newCategory = new Category(categoryData);
        await newCategory.save();
        await redisService.deleteCache('categories:all');
        return newCategory;
    } catch (error) {
        throw new Error('Error creating category');
    }
};

const updateCategory = async (categoryId, categoryData) => {
    try {
        const updatedCategory = await Category.findByIdAndUpdate(categoryId, categoryData, {
            new: true,
            runValidators: true,
        });

        if (!updatedCategory) {
            throw new Error('Category not found');
        }

        const cacheKey = `category:${categoryId}`;
        await redisService.setCache(cacheKey, updatedCategory, 3600);
        await redisService.deleteCache('categories:all');
        return updatedCategory;
    } catch (error) {
        throw new Error('Error updating category: ' + error.message);
    }
};

const deleteCategory = async (categoryId) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            throw new Error('Category not found');
        }

        const cacheKey = `category:${categoryId}`;
        await redisService.deleteCache(cacheKey);
        await redisService.deleteCache('categories:all');
        return deletedCategory;
    } catch (error) {
        throw new Error('Error deleting category: ' + error.message);
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
