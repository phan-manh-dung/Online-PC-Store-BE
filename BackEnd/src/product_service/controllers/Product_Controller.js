const Product = require('../models/Product_Model');
const productService = require('../services/Product_Service');
const { calculateDiscountedPrice } = require('../services/Promotion_Service');
const fs = require('fs');
const { producer } = require('../index');
// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await productService.getAllProducts({ page, limit });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
};

// Lấy sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handler để thêm mới một sản phẩm
const createProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Lấy dữ liệu sản phẩm từ request body
    const productData = {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      computer: JSON.parse(req.body.computer), // Chuyển chuỗi JSON thành object
      inventory: req.body.inventory,
      category: req.body.category,
      supplier: req.body.supplier,
    };

    console.log(productData);

    // Gọi service để tạo sản phẩm
    const newProduct = await productService.createProduct(productData, req.file.path);

    // Xóa file tạm sau khi upload xong
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handler để cập nhật thông tin sản phẩm
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const updatedProduct = await productService.updateProduct(id, updateData);
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Handler để xóa sản phẩm
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedProduct = await productService.deleteProduct(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductWithDiscount = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await calculateDiscountedPrice(productId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addPromotion = async (req, res) => {
  try {
    const { productId, promotionId } = req.body;
    const updatedProduct = await productService.addPromotionToProduct(productId, promotionId);

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error adding promotion to product', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductWithDiscount,
  createProduct,
  updateProduct,
  deleteProduct,
  addPromotion,
};
