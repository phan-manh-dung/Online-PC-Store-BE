const router = require('./router');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const Redis = require('ioredis');
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const axios = require('axios');
dotenv.config();
const app = express();
// cấu hình kafka
const { Kafka } = require('kafkajs');

// Cấu hình Kafka với Confluent Cloud
const kafka = new Kafka({
  clientId: 'order_service',
  brokers: [process.env.KAFKA_BROKER],
  ssl: true,
  sasl: {
    mechanism: process.env.KAFKA_SASL_MECHANISM,
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD,
  },
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: process.env.KAFKA_CONSUMER_GROUP });

const redis = new Redis({
  host: 'redis-11521.c292.ap-southeast-1-1.ec2.redns.redis-cloud.com',
  port: 11521,
  password: process.env.REDIS_PASSWORD,
  tls: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});
app.locals.redis = redis;

// Store payUrls temporarily
//const payUrlStore = new Map();

//Kết nối producer và consumer
const connectKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();
    await consumer.subscribe({ topic: process.env.KAFKA_TOPIC_PAYMENT_URL, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const data = JSON.parse(message.value.toString());
        console.log('Received payment URL from Kafka:', data);
        // Store payUrl with orderId
        // payUrlStore.set(data.orderId, data.payUrl);
        await redis.set(`payUrl:${data.orderId}`, data.payUrl, 'EX', 300); // set timeout 5 phút
      },
    });
    console.log('Kafka Producer and Consumer connected');
  } catch (error) {
    console.error('Error connecting Kafka:', error);
  }
};
connectKafka();

// Đưa producer và payUrlStore vào app.locals để các router/controller có thể sử dụng
app.locals.producer = producer;
app.locals.redis = redis;

const SERVICE_INFO = {
  name: 'order_service',
  baseUrl: process.env.SERVICE_URL || 'https://order-service-422663804011.asia-southeast1.run.app',
  endpoints: [
    '/api/order/create-order',
    '/api/order/get-detail-order/:id',
    '/api/order/admin/get-all-order',
    '/api/order/cancel-order/:id',
    '/api/order/get-all-order-user/:id',
    '/api/order/update-status',
    '/api/order/order-count/:id',
    '/api/order/admin/sales-stats',
  ],
};

let serviceId = null;
let registrationAttempts = 0;
const MAX_REGISTRATION_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
let heartbeatInterval = null;
let registrationTimeout = null;

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

async function registerWithGateway() {
  try {
    console.log(`Attempting to register with API Gateway: ${process.env.GATEWAY_URL}`);
    console.log('Service info:', JSON.stringify(SERVICE_INFO));

    const response = await axios.post(`${process.env.GATEWAY_URL}/register`, SERVICE_INFO);

    if (!response.data || !response.data.serviceId) {
      throw new Error('Invalid response from gateway: missing serviceId');
    }

    serviceId = response.data.serviceId;
    registrationAttempts = 0;

    console.log('Successfully registered with API Gateway, serviceId:', serviceId);

    // Start heartbeat after successful registration
    startHeartbeat();

    // Clear any existing registration retry timeout
    if (registrationTimeout) {
      clearTimeout(registrationTimeout);
    }
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

    // Try again with exponential backoff
    const retryDelay = Math.min(30000, 4000 * Math.pow(2, registrationAttempts));
    console.log(`Will retry registration in ${retryDelay / 1000} seconds`);

    if (registrationAttempts < MAX_REGISTRATION_ATTEMPTS) {
      registrationTimeout = setTimeout(registerWithGateway, retryDelay);
    } else {
      console.error('Max registration attempts reached. Service will run without API Gateway registration.');
      // Try one final time after 5 minutes
      registrationTimeout = setTimeout(() => {
        registrationAttempts = 0;
        registerWithGateway();
      }, 300000);
    }
  }
}

function startHeartbeat() {
  // Clear any existing heartbeat interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(async () => {
    if (!serviceId) {
      console.log('No serviceId available, attempting to register...');
      registerWithGateway();
      return;
    }

    try {
      const response = await axios.post(`${process.env.GATEWAY_URL}/heartbeat/${serviceId}`);
      if (response.status !== 200) {
        throw new Error(`Heartbeat failed with status ${response.status}`);
      }
      console.log('Heartbeat successful');
    } catch (error) {
      console.error('Heartbeat failed:', error.message);
      // If heartbeat fails, try to re-register
      serviceId = null;
      registerWithGateway();
    }
  }, HEARTBEAT_INTERVAL);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down service...');

  // Clear intervals
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  if (registrationTimeout) {
    clearTimeout(registrationTimeout);
  }

  // Disconnect Kafka
  try {
    await producer.disconnect();
    await consumer.disconnect();
    console.log('Kafka Producer and Consumer disconnected');
  } catch (error) {
    console.error('Error disconnecting Kafka:', error);
  }

  // Unregister from API Gateway
  if (serviceId) {
    try {
      await axios.post(`${process.env.GATEWAY_URL}/unregister/${serviceId}`);
      console.log('Successfully unregistered from API Gateway');
    } catch (error) {
      console.error('Failed to unregister:', error.message);
    }
  }

  // Give some time for cleanup
  setTimeout(() => {
    console.log('Service shutdown complete');
    process.exit(0);
  }, 1000);
});

app.use(bodyParser.json());
app.use(cors());
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
//   console.log(`Order Service running on http://localhost:${SERVICE_INFO.port}`);
//   setTimeout(registerWithGateway, 1000);
// });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
  console.log(`Service URL: ${SERVICE_INFO.baseUrl}`);

  // Wait a bit for everything to initialize before registering
  setTimeout(registerWithGateway, 2000);
});

module.exports = { app };
