// src/routes/userRouter.js
const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const ServiceClient = require('../services/serviceClient');

const productServiceClient = new ServiceClient('product_service');

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

router.get('/product/get-all', async (req, res) => {
  try {
    const response = await productServiceClient.get('/api/product/get-all', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/product/get-by-id/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const response = await productServiceClient.get(`/api/product/get-by-id/${id}`, {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});


router.get('/category/get-all', async (req, res) => {
  try {
    const response = await productServiceClient.get('/api/category/get-all', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});


router.get('/category/get-by-id/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const response = await productServiceClient.get(`/api/category/get-by-id/${id}`, {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});


router.get('/supplier/get-all', async (req, res) => {
  try {
    const response = await productServiceClient.get('/api/supplier/get-all', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});


router.get('/supplier/get-by-id/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const response = await productServiceClient.get(`/api/supplier/get-by-id/${id}`, {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});


router.get('/inventory/get-all', async (req, res) => {
  try {
    const response = await productServiceClient.get('/api/inventory/get-all', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});


router.get('/inventory/get-by-id/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const response = await productServiceClient.get(`/api/inventory/get-by-id/${id}`, {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});


module.exports = router;
