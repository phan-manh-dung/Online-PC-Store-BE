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
  //host: 'localhost',
  //host: 'cart_service',
  // port: process.env.PORT || 5004,
  //port: process.env.PORT || 8080,
  baseUrl: process.env.SERVICE_URL || 'https://cart-service-422663804011.asia-southeast1.run.app',
  endpoints: [
    '/api/cart/create-cart',
    '/apt/cart/delete-cart/:id',
    '/api/cart/get-cart/:id',
    '/api/cart/delete-many-cart',
    '/api/cart/cart-count/:id',
  ],
};

let serviceId = null;

// Add health check endpoint for Google Cloud Run
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// Add debug endpoint to see service status
app.get('/_debug/info', (req, res) => {
  res.json({
    service: SERVICE_INFO.name,
    baseUrl: SERVICE_INFO.baseUrl,
    registered: serviceId !== null,
    serviceId,
    gatewayUrl: process.env.GATEWAY_URL,
    environment: process.env.NODE_ENV,
  });
});

// Register with API Gateway
// async function registerWithGateway() {
//   try {
//     const response = await axios.post(`${process.env.GATEWAY_URL}/register`, SERVICE_INFO);
//     serviceId = response.data.serviceId;
//     console.log('Registered with API Gateway, serviceId:', serviceId);
//     startHeartbeat();
//   } catch (error) {
//     console.error('Failed to register with API Gateway:', error.message);
//     // Thử lại sau 4 giây
//     setTimeout(registerWithGateway, 4000);
//   }
// }

async function registerWithGateway() {
  let registrationAttempts = 0;
  const MAX_REGISTRATION_ATTEMPTS = 3;

  try {
    console.log(`Attempting to register with API Gateway: ${process.env.GATEWAY_URL}`);
    console.log('Service info:', JSON.stringify(SERVICE_INFO));

    const response = await axios.post(`${process.env.GATEWAY_URL}/register`, SERVICE_INFO);
    serviceId = response.data.serviceId;

    console.log('Successfully registered with API Gateway, serviceId:', serviceId);
    startHeartbeat();
  } catch (error) {
    registrationAttempts++;
    console.error(
      `Failed to register with API Gateway (attempt ${registrationAttempts}/${MAX_REGISTRATION_ATTEMPTS}):`,
      error.message,
    );

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    // Try again with backoff
    const retryDelay = Math.min(30000, 4000 * Math.pow(2, registrationAttempts));
    console.log(`Will retry in ${retryDelay / 1000} seconds`);

    if (registrationAttempts < MAX_REGISTRATION_ATTEMPTS) {
      setTimeout(registerWithGateway, retryDelay);
    } else {
      console.error('Max registration attempts reached. Service will run without API Gateway registration.');
    }
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
// app.listen(SERVICE_INFO.port, () => {
//   console.log(`Cart Service running on http://localhost:${SERVICE_INFO.port}`);
//   setTimeout(registerWithGateway, 1000);
// });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
  console.log(`Service URL: ${SERVICE_INFO.baseUrl}`);

  // Wait a bit for everything to initialize before registering
  setTimeout(registerWithGateway, 2000);
});

module.exports = { app };
