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

const getCategoriesWithSuppliers = async (type) => {
  return await Category.aggregate([
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
};

module.exports = {
    getAllCategories,
    getCategoryById,
    getCategoriesWithSuppliers
};
