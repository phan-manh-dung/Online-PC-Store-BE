const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const ServiceClient = require('../services/serviceClient');

const searchServiceClient = new ServiceClient('search_service');

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
    const response = await searchServiceClient.get('/api/product/get-all', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/product/get-by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await searchServiceClient.get(`/api/product/get-by-id/${id}`, {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/product/get-sorted', async (req, res) => {
  try {
    const response = await searchServiceClient.get('/api/product/get-sorted', {
      params: req.query.type,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/product/get-type', async (req, res) => {
  try {
    const response = await searchServiceClient.get(`/api/product/get-type?type=${req.query.type}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/product/get-products-by-type-supplier', async (req, res) => {
  try {
    const response = await searchServiceClient.get('/api/product/get-products-by-type-supplier', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/product/get-products-by-category-supplier', async (req, res) => {
  try {
    const response = await searchServiceClient.get('/api/product/get-products-by-type-supplier', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/category/get-all', async (req, res) => {
  try {
    const response = await searchServiceClient.get('/api/category/get-all', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/category/get-by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await searchServiceClient.get(`/api/category/get-by-id/${id}`, {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/supplier/get-all', async (req, res) => {
  try {
    const response = await searchServiceClient.get('/api/supplier/get-all', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/supplier/get-by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await searchServiceClient.get(`/api/supplier/get-by-id/${id}`, {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/inventory/get-all', async (req, res) => {
  try {
    const response = await searchServiceClient.get('/api/inventory/get-all', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/inventory/get-by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await searchServiceClient.get(`/api/inventory/get-by-id/${id}`, {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/filter/get-all', async (req, res) => {
  try {
    const response = await searchServiceClient.get('/api/filter/get-all', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

module.exports = router;
