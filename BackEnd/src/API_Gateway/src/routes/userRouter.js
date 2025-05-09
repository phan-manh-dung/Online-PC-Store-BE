// src/routes/userRouter.js
const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const ServiceClient = require('../services/serviceClient');
const userServiceClient = new ServiceClient('user_service');
// redis
const { readData, createData } = require('../../redis/v1/service/redisService');
// Middleware verify token
const authenticateToken = require('../middleware/authenMiddleware');

const errorHandler = (error, res) => {
  console.error('Service Error:', error);
  const status = error.response?.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error.response?.data?.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    message,
    error: error.message,
  });
};

// Bỏ qua xác thực cho API đăng nhập
router.use((req, res, next) => {
  if (req.path === '/sign-in' || req.path === '/sign-up') {
    return next();
  }
  authenticateToken(req, res, next);
});

router.post('/sign-in', async (req, res) => {
  try {
    const response = await userServiceClient.post('/api/user/sign-in', req.body);
    const data = response.data;
    res.status(response.status).json(data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/sign-up', async (req, res) => {
  try {
    const response = await userServiceClient.post('/api/user/sign-up', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/get-detail/:id', async (req, res) => {
  try {
    const response = await userServiceClient.get(`/api/user/get-detail/${req.params.id}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/admin/get-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token is missing at API Gateway',
        status: 'ERROR',
      });
    }

    const response = await userServiceClient.getAuth('/api/user/admin/get-all', token);

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error when calling user service:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

router.delete('/admin/delete-user/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token is missing at API Gateway',
        status: 'ERROR',
      });
    }

    const response = await userServiceClient.deleteAuth(`/api/user/admin/delete-user/${req.params.id}`, token);

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error when calling user service:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

router.post('/log-out', async (req, res) => {
  try {
    const response = await userServiceClient.post('/api/user/log-out', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'Token is missing at API Gateway',
        status: 'ERROR',
      });
    }

    const response = await userServiceClient.postAuth('/api/user/refresh-token', token);

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error when calling user service:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

router.put('/update-user/:id', async (req, res) => {
  try {
    const response = await userServiceClient.put(`/api/user/update-user/${req.params.id}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error when calling user service:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

router.get('/verify-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Gateway verify-token - Token:', token);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const response = await userServiceClient.getAuth('/api/user/verify-token', token);
    console.log('Gateway verify-token - Response from user_service:', response.data);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/check-deletable/:id', async (req, res) => {
  try {
    const response = await userServiceClient.get(`/api/user/check-deletable/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/admin/stats/:id', async (req, res) => {
  try {
    const response = await userServiceClient.get(`/api/user/admin/stats/${req.params.id}`);
    console.log('Gateway stats - Response from user_service:', response.data);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

module.exports = router;
