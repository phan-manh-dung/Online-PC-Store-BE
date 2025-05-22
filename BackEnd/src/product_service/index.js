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

let host = 'product_service';
if (process.env.NODE_ENV === 'localhost') {
  host = 'localhost';
}

const SERVICE_INFO = {
  name: 'product_service',
  //host: 'product_service',
  host: 'localhost',
  port: process.env.PORT || 5002,
  // baseUrl: process.env.SERVICE_URL || 'https://product-service-422663804011.asia-southeast1.run.app',
  endpoints: [
    '/api/product/get-all',
    '/api/product/get-by-id/:id',

    //----------------------------------------
    '/api/category/get-all',
    '/api/category/get-by-id/:id',
    '/api/supplier/get-all',
    '/api/supplier/get-by-id/:id',
    '/api/inventory/get-all',
    '/api/inventory/get-by-id/:id',
    '/api/promotion/get-all',
    '/api/promotion/get-by-id/:id',

    '/api/computerOption/admin/get-all',
    '/api/computerOption/admin/get-by-key/:key',
    '/api/computerOption/admin/get-grouped',

    //Create with auth  Admin-------------------
    '/api/product/admin/create',
    '/api/category/admin/create',
    '/api/supplier/admin/create',
    '/api/inventory/admin/create',
    '/api/promotion/admin/create',
    '/api/computerOption/admin/create',

    //Update with auth Admin-------------------
    '/api/product/admin/update/:id',
    '/api/supplier/admin/update/:id',
    '/api/category/admin/update/:id',
    '/api/inventory/admin/update/:id',
    '/api/promotion/admin/update/:id',
    '/api/computerOption/admin/update/:id',

    //Delete with auth Admin-------------------
    '/api/product/admin/delete/:id',
    '/api/supplier/admin/delete/:id',
    '/api/category/admin/delete/:id',
    '/api/inventory/admin/delete/:id',
    '/api/promotion/admin/delete/:id',
    '/api/computerOption/admin/delete/:id',
  ],
};

// const GATEWAY_URL = 'http://localhost:5555';

let serviceId = null;
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

app.use(bodyParser.json());
app.use(cookieParser());
router(app);

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
async function registerWithGateway() {
  try {
    const response = await axios.post(`${process.env.GATEWAY_URL}/register`, SERVICE_INFO);
    serviceId = response.data.serviceId;
    console.log('Registered with API Gateway, serviceId:', serviceId);
    startHeartbeat();
  } catch (error) {
    console.error('Failed to register with API Gateway:', error.message);
    // Thử lại sau 5 giây
    setTimeout(registerWithGateway, 5000);
  }
}

// async function registerWithGateway() {
//   try {
//     console.log(`Attempting to register with API Gateway: ${process.env.GATEWAY_URL}`);
//     console.log('Service info:', JSON.stringify(SERVICE_INFO));

//     const response = await axios.post(`${process.env.GATEWAY_URL}/register`, SERVICE_INFO);
//     serviceId = response.data.serviceId;
//     registrationAttempts = 0;

//     console.log('Successfully registered with API Gateway, serviceId:', serviceId);
//     startHeartbeat();
//   } catch (error) {
//     registrationAttempts++;
//     console.error(
//       `Failed to register with API Gateway (attempt ${registrationAttempts}/${MAX_REGISTRATION_ATTEMPTS}):`,
//       error.message,
//     );

//     if (error.response) {
//       console.error('Response status:', error.response.status);
//       console.error('Response data:', error.response.data);
//     }

//     // Try again with backoff
//     const retryDelay = Math.min(30000, 4000 * Math.pow(2, registrationAttempts));
//     console.log(`Will retry in ${retryDelay / 1000} seconds`);

//     if (registrationAttempts < MAX_REGISTRATION_ATTEMPTS) {
//       setTimeout(registerWithGateway, retryDelay);
//     } else {
//       console.error('Max registration attempts reached. Service will run without API Gateway registration.');
//     }
//   }
// }

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
  console.log(`Product Service running on http://localhost:${SERVICE_INFO.port}`);
  setTimeout(registerWithGateway, 1000);
});

// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`User Service running on port ${PORT}`);
//   console.log(`Service URL: ${SERVICE_INFO.baseUrl}`);

//   // Wait a bit for everything to initialize before registering
//   setTimeout(registerWithGateway, 2000);
// });
