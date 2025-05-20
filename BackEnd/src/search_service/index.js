const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const router = require('./routes');
const app = express();

dotenv.config();

app.use(express.json());

let host = 'search_service';
if (process.env.NODE_ENV === 'localhost') {
  host = 'localhost';
}

const SERVICE_INFO = {
  name: 'search_service',
  host: host,
  port: process.env.PORT || 5005,
  endpoints: [
    '/api/product/get-all',
    '/api/product/get-by-id/:id',

    //Filter
    '/api/product/get-type',
    '/api/product/get-sorted',
    '/api/product/get-products-by-type-supplier',
    '/api/product/get-products-by-category-supplier',
    '/api/product/brands/:categoryId',
    '/api/product/get-by-brandcomputer',
    '/api/filter/get-all',
    '/api/filter/get-by-id/:id',
    '/api/filter/admin/create',
    '/api/filter/admin/update',
    '/api/filter/admin/delete',

    //For menu filter:
    '/api/get-list-by-category/:categoryId',
    '/api/series/:brand',

    //----------------------------------------
    '/api/category/get-all',
    '/api/category/get-by-id/:id',
    '/api/category/get-by-brand',
    '/api/supplier/get-all',
    '/api/supplier/get-by-id/:id',
    '/api/inventory/get-all',
    '/api/inventory/get-by-id/:id',
  ],
};

const GATEWAY_URL = 'http://localhost:5555';
let serviceId = null;
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

app.use(bodyParser.json());
app.use(cookieParser());
router(app);

// Register with API Gateway
async function registerWithGateway() {
  try {
    const response = await axios.post(`${GATEWAY_URL}/register`, SERVICE_INFO);
    serviceId = response.data.serviceId;
    console.log('Registered with API Gateway, serviceId:', serviceId);
    startHeartbeat();
  } catch (error) {
    console.error('Failed to register with API Gateway:', error.message);
    // Thử lại sau 5 giây
    setTimeout(registerWithGateway, 5000);
  }
}

// Heartbeat
function startHeartbeat() {
  setInterval(async () => {
    try {
      await axios.post(`${GATEWAY_URL}/heartbeat/${serviceId}`);
    } catch (error) {
      console.error('Heartbeat failed:', error.message);
      // Thử đăng ký lại nếu heartbeat thất bại
      serviceId = null;
      registerWithGateway();
    }
  }, 60000);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (serviceId) {
    try {
      await axios.post(`${GATEWAY_URL}/unregister/${serviceId}`);
      console.log('Unregistered from API Gateway');
    } catch (error) {
      console.error('Failed to unregister:', error.message);
    }
  }
  process.exit(0);
});

mongoose
  .connect(`${process.env.mongoURI}`)
  .then(() => {
    console.log('Connect to Database success');
  })
  .catch(() => {
    console.log('Connect database ERROR');
  });

// Start server
app.listen(SERVICE_INFO.port, () => {
  console.log(`Search Service running on http://localhost:${SERVICE_INFO.port}`);
  setTimeout(registerWithGateway, 1000);
});
