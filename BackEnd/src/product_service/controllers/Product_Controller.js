const Product = require('../models/Product_Model');
const productService = require('../services/Product_Service');
const fs = require('fs')


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

//Danh sách product theo loại (danh mục)
const getProductsByType = async (req, res) => {
    try {
        // Lấy tham số 'type' từ query string (req.query)
        const { type } = req.query;  // req.query chứa các query parameters
        console.log(`Searching for products with type: ${type}`);
        
        // Gọi service để lấy sản phẩm theo type
        const products = await productService.getProductsByType(type);
        console.log(products);

        res.status(200).json(products);  // Trả về danh sách sản phẩm
    } catch (error) {
        res.status(500).json({ message: error.message });  // Xử lý lỗi nếu có
    }
};


const getProductsByTypeSupplier = async (req, res) => {
    const { supplierId, type } = req.query;  // Lấy tham số từ query string

    if (!supplierId || !type) {
        return res.status(400).json({ message: 'SupplierId and type are required' });
    }

    try {
        const products = await productService.getProductsByTypeSupplier(supplierId, type);
        res.status(200).json(products);  // Trả về danh sách sản phẩm
    } catch (error) {
        res.status(500).json({ message: error.message });  // Xử lý lỗi
    }
};

const getProductsByCategorySupplier = async (req, res) => {
    const { supplierId, categoryId } = req.query;  

    if (!supplierId || !categoryId) {
        return res.status(400).json({ message: 'SupplierId and categoryId are required' });
    }

    try {
        const products = await productService.getProductsByCategorySupplier(supplierId, categoryId);
        res.status(200).json(products);  
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

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsSortedbyPrice,
    getProductsByType,
    getProductsByTypeSupplier,
    getProductsByCategorySupplier
};
