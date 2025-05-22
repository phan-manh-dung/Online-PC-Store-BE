// const http = require('http');
const router = require('./router');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');

dotenv.config();
const app = express();

const SERVICE_INFO = {
  name: 'cart_service',
  host: 'localhost',
  //host: 'cart_service',
  port: process.env.PORT || 5004,
  endpoints: [
    '/api/cart/create-cart',
    '/apt/cart/delete-cart/:id',
    '/api/cart/get-cart/:id',
    '/api/cart/delete-many-cart',
    '/api/cart/cart-count/:id',
  ],
};

let serviceId = null;

// Register with API Gateway
async function registerWithGateway() {
  try {
    const response = await axios.post(`${process.env.GATEWAY_URL}/register`, SERVICE_INFO);
    serviceId = response.data.serviceId;
    console.log('Registered with API Gateway, serviceId:', serviceId);
    startHeartbeat();
  } catch (error) {
    console.error('Failed to register with API Gateway:', error.message);
    // Thử lại sau 4 giây
    setTimeout(registerWithGateway, 4000);
  }
}

// Heartbeat
function startHeartbeat() {
  setInterval(async () => {
    try {
      await axios.post(`${process.env.GATEWAY_URL}/heartbeat/${serviceId}`);
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
      await axios.post(`${process.env.GATEWAY_URL}/unregister/${serviceId}`);
      console.log('Unregistered from API Gateway');
    } catch (error) {
      console.error('Failed to unregister:', error.message);
    }
  }
  process.exit(0);
});

// Middleware để truyền io vào req
app.use((req, res, next) => {
  next();
});

// app.use(bodyParser.json());
app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb' }));

app.use(cookieParser());

router(app);

mongoose
  .connect(`${process.env.MONGO_DB}`)
  .then(() => {
    console.log('Connect to Database success');
  })
  .catch(() => {
    console.log('Connect database ERROR');
  });

// port 4000
app.listen(SERVICE_INFO.port, () => {
  console.log(`Cart Service running on http://localhost:${SERVICE_INFO.port}`);
  setTimeout(registerWithGateway, 1000);
});

module.exports = { app };
