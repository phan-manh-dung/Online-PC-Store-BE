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

const getCategoriesBySupplier = async (req, res) => {
    try {
      const type = req.query.type || "default"; // Lấy giá trị `type` từ query params
      const categories = await categoryService.getCategoriesWithSuppliers(type);
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving data", error: error.message });
    }
  };


// Handler để lấy category theo ID
const getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await categoryService.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    getCategoriesBySupplier
};
