const express = require('express');
const router = express.Router();
const ServiceClient = require('../services/serviceClient');
const cartServiceClient = new ServiceClient('cart_service');

const errorHandler = (error, res) => {
  console.error('Service Error:', error);
  const status = error.response?.status || 500;
  const message = error.response?.data?.message || 'Internal Server Error';
  res.status(status).json({ success: false, message, error: error.message });
};

router.post('/create-cart', async (req, res) => {
  try {
    const response = await cartServiceClient.post('/api/cart/create-cart', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.delete('/delete-cart/:id', async (req, res) => {
  try {
    const response = await cartServiceClient.delete(`/api/cart/delete-cart/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

router.get('/get-cart/:id', async (req, res) => {
  try {
    const response = await cartServiceClient.get(`/api/cart/get-cart/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

module.exports = router;
