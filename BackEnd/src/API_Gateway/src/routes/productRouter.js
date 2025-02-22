const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { product: productServiceClient } = require('../services/serviceRegistry');

const errorHandler = (error, res) => {
    console.error('Service Error:', error);
    const status = error.response?.status || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.response?.data?.message || 'Internal Server Error';
    
    res.status(status).json({
        success: false,
        message,
        error: error.message
    });
};

router.get('/get-all', async (req, res) => {
    try {
        const response = await productServiceClient.get('/api/product/get-all', {
            params: req.query
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

router.get('/get-by-id/:id', async (req, res) => {
    try {
        const response = await productServiceClient.get(`/api/product/get-by-id/${req.params.id}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

router.post('/admin/create', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; 
    
    if (!token) {
        return res.status(401).json({
            message: 'Token is missing',
            status: 'ERROR',
        });
    }

    try {
        const response = await productServiceClient.post('/api/product/admin/create', req.body, {
            headers: {
                'Authorization': `Bearer ${token}`  
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

// Cập nhật thông tin sản phẩm
router.put('/admin/update/:id', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; 
    
    if (!token) {
        return res.status(401).json({
            message: 'Token is missing',
            status: 'ERROR',
        });
    }

    try {
        const response = await productServiceClient.put(`/api/product/admin/update/${req.params.id}`, req.body, {
            headers: {
                'Authorization': `Bearer ${token}`  
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

// Xóa sản phẩm
router.delete('/admin/delete/:id', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; 
    
    if (!token) {
        return res.status(401).json({
            message: 'Token is missing',
            status: 'ERROR',
        });
    }

    try {
        const response = await productServiceClient.delete(`/api/product/admin/delete/${req.params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`  
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});



// CATEGORIES --------------------------------------------------------------------------------------------------


router.get('/category/get-all', async (req, res) => {
    try {
        const response = await productServiceClient.get('/api/category/get-all', {
            params: req.query
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

router.get('/category/get-by-id/:id', async (req, res) => {
    try {
        const response = await productServiceClient.get(`/api/category/get-by-id/${req.params.id}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

//Tạo mới category
router.post('/category/admin/create', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; 
    
    if (!token) {
        return res.status(401).json({
            message: 'Token is missing',
            status: 'ERROR',
        });
    }

    try {
        const response = await productServiceClient.post('/api/category/admin/create', req.body, {
            headers: {
                'Authorization': `Bearer ${token}`  
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

// Cập nhật thông tin sản phẩm
router.put('/category/admin/update/:id', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; 
    
    if (!token) {
        return res.status(401).json({
            message: 'Token is missing',
            status: 'ERROR',
        });
    }

    try {
        const response = await productServiceClient.put(`/api/category/admin/update/${req.params.id}`, req.body, {
            headers: {
                'Authorization': `Bearer ${token}`  
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

// Xóa sản phẩm
router.delete('/category/admin/delete/:id', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; 
    
    if (!token) {
        return res.status(401).json({
            message: 'Token is missing',
            status: 'ERROR',
        });
    }

    try {
        const response = await productServiceClient.delete(`/api/category/admin/delete/${req.params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`  
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});


module.exports = router;
