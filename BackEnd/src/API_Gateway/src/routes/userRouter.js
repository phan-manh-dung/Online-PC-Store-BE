const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const { user: userServiceClient } = require('../services/serviceRegistry');

// Middleware xử lý lỗi
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

// Sign-in endpoint
router.post('/sign-in', async (req, res) => {
    try {
        const response = await userServiceClient.post('/api/user/sign-in', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

// Các endpoints khác
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization;
        const response = await userServiceClient.get('/api/user/profile', {
            headers: { Authorization: token }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        errorHandler(error, res);
    }
});

module.exports = router;
