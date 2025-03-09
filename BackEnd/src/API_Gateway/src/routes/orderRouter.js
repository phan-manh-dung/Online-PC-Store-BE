const express = require('express');
const router = express.Router();
const ServiceClient = require('../services/serviceClient');
const orderServiceClient = new ServiceClient('order_service');

const errorHandler = (error, res) => {
  console.error('Service Error:', error);
  const status = error.response?.status || 500;
  const message = error.response?.data?.message || 'Internal Server Error';
  res.status(status).json({ success: false, message, error: error.message });
};

router.post('/create-order', async (req, res) => {
  try {
    const response = await orderServiceClient.post('/api/order/create-order', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/get-detail-order/:id', async (req, res) => {
  try {
    const response = await orderServiceClient.get(`/api/order/get-detail-order/${req.params.id}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/admin/get-all-order', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'Token is missing at API Gateway router',
        status: 'ERROR',
      });
    }
    const response = await orderServiceClient.getAuth('/api/order/admin/get-all-order', token);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error when calling user service:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

router.delete('/cancel-order/:id', async (req, res) => {
  try {
    const response = await orderServiceClient.delete(`/api/order/cancel-order/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

module.exports = router;
