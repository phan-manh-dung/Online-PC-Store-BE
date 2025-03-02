const Product = require('../models/Product_Model');
const productService = require('../services/Product_Service');


// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
// Lấy sản phẩm đã sắp xếp theo giá và phân trang
const getProductsSortedbyPrice = async (req, res) => {
    const { sort_by, page = 1, limit = 10, price_min, price_max } = req.query;

    try {
        const products = await productService.getProductsSortedbyPrice({
            price_min,
            price_max,
            sort_by,
            page,
            limit
        });

        //tính số trang
        const totalProducts = await productService.getProductCount({
            price_min,
            price_max
        });

        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            type : 'PRICE',
            products,
            pagination: {
                page,
                limit,
                total: totalProducts,
                total_pages: totalPages
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Handler để thêm mới một sản phẩm
const createProduct = async (req, res) => {
    const newProductData = req.body;
    try {
        const newProduct = await productService.createProduct(newProductData);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
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

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsSortedbyPrice,
};
