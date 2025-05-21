// const http = require('http');
const router = require('./router');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const axios = require('axios');
const { Kafka } = require('kafkajs');

// Cấu hình Kafka với Confluent Cloud
const kafka = new Kafka({
  clientId: 'payment-service',
  brokers: [process.env.KAFKA_BROKER],
  ssl: true,
  sasl: {
    mechanism: process.env.KAFKA_SASL_MECHANISM,
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD,
  },
});
const consumer = kafka.consumer({ groupId: process.env.KAFKA_CONSUMER_GROUP });
const producer = kafka.producer();

// Kết nối consumer và producer
const connectKafka = async () => {
  try {
    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topic: process.env.KAFKA_TOPIC_ORDER_PAYMENT, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const orderData = JSON.parse(message.value.toString());
        console.log('Received order from Kafka:', orderData);

        // Xử lý thanh toán với MoMo (gọi API create-payment)
        const payUrl = await processMoMoPayment(orderData);
        if (payUrl) {
          // Gửi payUrl về cho order service
          await producer.send({
            topic: process.env.KAFKA_TOPIC_PAYMENT_URL,
            messages: [
              {
                value: JSON.stringify({
                  orderId: orderData.orderId,
                  payUrl: payUrl,
                }),
              },
            ],
          });
        }
      },
    });
    console.log('Kafka Consumer and Producer connected');
  } catch (error) {
    console.error('Error connecting Kafka:', error);
  }
};
connectKafka();

// Hàm xử lý thanh toán MoMo (sẽ gọi API create-payment)
const processMoMoPayment = async (orderData) => {
  try {
    // Gọi API create-payment trong payment_service
    const response = await axios.post(`${process.env.GATEWAY_URL}/api/payment/create-payment-momo`, orderData, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('MoMo payment created:', response.data);
    return response.data.payUrl; // Return payUrl from the response
  } catch (error) {
    console.error('Error processing MoMo payment:', error.message);
    return null;
  }
};

const app = express();
// Thêm middleware để parse JSON
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'], // Thêm 'OPTIONS' để hỗ trợ preflight request
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Nếu có dùng cookies hoặc token
  }),
);

// const actualPort = process.env.PORT || 5005;

const SERVICE_INFO = {
  name: 'payment_service',
  //host: 'payment_service',
  //host: 'localhost',
  baseUrl: process.env.SERVICE_URL || 'https://payment-service-422663804011.asia-southeast1.run.app',
  endpoints: [
    '/api/payment/create-payment-momo',
    '/api/payment/callback',
    '/api/payment/status',
    '/api/payment/transaction-status-momo',
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
  try {
    console.log(`Attempting to register with API Gateway: ${process.env.GATEWAY_URL}`);
    console.log('Service info:', JSON.stringify(SERVICE_INFO));

    const response = await axios.post(`${process.env.GATEWAY_URL}/register`, SERVICE_INFO);
    serviceId = response.data.serviceId;
    registrationAttempts = 0;

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
  await consumer.disconnect();
  await producer.disconnect();
  console.log('Kafka Consumer and Producer disconnected');
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

router(app);

mongoose
  .connect(`${process.env.MONGO_DB}`)
  .then(() => {
    console.log('Connect to Database success');
  })
  .catch(() => {
    console.log('Connect database ERROR');
  });

// app.listen(actualPort, () => {
//   console.log(`Payment Service running on http://localhost:${actualPort}`);
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
