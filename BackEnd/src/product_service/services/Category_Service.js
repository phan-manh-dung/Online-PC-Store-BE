const Category = require('../models/Category_Model');

// Lấy tất cả các category
const getAllCategories = async () => {
    try {
        const categories = await Category.find();
        return categories;
    } catch (error) {
        throw new Error('Error retrieving categories');
    }
};

// Lấy category theo id
const getCategoryById = async (id) => {
    try {
        const category = await Category.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    } catch (error) {
        throw new Error('Error retrieving category by id');
    }
};

module.exports = { getAllCategories, getCategoryById };
