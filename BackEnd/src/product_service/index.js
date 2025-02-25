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

<<<<<<< HEAD
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
=======
const SERVICE_INFO = {
  name: 'product_service',
  host: 'localhost',
  port: process.env.PORT || 5002,
  endpoints: ['/api/product/get-all'],
};
>>>>>>> c94e077cac42146c92d33bb2152936a4314f041f

const GATEWAY_URL = 'http://localhost:5555';
let serviceId = null;
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

<<<<<<< HEAD
app.listen(port, () => {
  console.log(`Product Service running at http://localhost:${port}`);
=======
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
  }, 30000);
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
  console.log(`Product Service running on http://localhost:${SERVICE_INFO.port}`);
  setTimeout(registerWithGateway, 1000);
>>>>>>> c94e077cac42146c92d33bb2152936a4314f041f
});
