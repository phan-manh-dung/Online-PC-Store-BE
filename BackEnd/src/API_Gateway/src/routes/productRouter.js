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

router.get('/', async (req, res) => {
    try {
        const response = await productServiceClient.get('/api/products', {
            params: req.query
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

router.get('/:id', async (req, res) => {
    try {
        const response = await productServiceClient.get(`/api/products/${req.params.id}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

module.exports = router;
