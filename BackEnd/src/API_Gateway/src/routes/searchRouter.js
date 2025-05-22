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
router.get('/product/get-by-brandcomputer', async (req, res) => {
  console.log('Req.query APIGW', req.query); // Đây mới là chỗ bạn cần log để xem query params

  try {
    const response = await searchServiceClient.get(
      `/api/product/get-by-brandcomputer?brand=${req.query.brand}&type=${req.query.type}`,
    );
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

router.post('/filter/admin/create', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    console.log('token gateway', token);
    if (!token) {
      return res.status(401).json({
        message: 'Token is missing at API Gateway router',
        status: 'ERROR',
      });
    }

    const response = await searchServiceClient.postAuth('/api/filter/admin/create', req.body, {
      Authorization: `Bearer ${token}`,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error when calling product service:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

router.post('/gemini/generate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    console.log('token gateway', token);
    if (!token) {
      return res.status(401).json({
        message: 'Token is missing at API Gateway router',
        status: 'ERROR',
      });
    }

    const response = await searchServiceClient.postAuth('/api/gemini/generate', req.body, {
      Authorization: `Bearer ${token}`,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error when calling product service:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

module.exports = router;
