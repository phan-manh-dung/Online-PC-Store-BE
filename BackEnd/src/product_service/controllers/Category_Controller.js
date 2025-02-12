const categoryService = require('../services/Category_Service');

// Handler để lấy tất cả các categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Handler để lấy category theo ID
const getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await categoryService.getCategoryById(id);
        res.status(200).json(category);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

module.exports = { getAllCategories, getCategoryById };
