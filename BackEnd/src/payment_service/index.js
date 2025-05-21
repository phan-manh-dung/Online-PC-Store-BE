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

// Cấu hình Kafka
const kafka = new Kafka({
  clientId: 'payment_service',
  brokers: ['localhost:9092'],
  //brokers: ['kafka:9092'],
});
const consumer = kafka.consumer({ groupId: 'payment-group' });
const producer = kafka.producer();

// Kết nối consumer và producer
const connectKafka = async () => {
  try {
    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topic: 'order-payment', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const orderData = JSON.parse(message.value.toString());
        console.log('Received order from Kafka:', orderData);

        // Xử lý thanh toán với MoMo (gọi API create-payment)
        const payUrl = await processMoMoPayment(orderData);
        if (payUrl) {
          // Gửi payUrl về cho order service
          await producer.send({
            topic: 'payment-url',
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
    const response = await axios.post('http://localhost:5555/api/payment/create-payment-momo', orderData, {
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

const SERVICE_INFO = {
  name: 'payment_service',
  //host: 'payment_service',
  host: 'localhost',
  port: process.env.PORT_PAYMENT_SERVICE || 5005,
  endpoints: [
    '/api/payment/create-payment-momo',
    '/api/payment/callback',
    '/api/payment/status',
    'api/payment/transaction-status-momo',
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

// port 4000
app.listen(SERVICE_INFO.port, () => {
  console.log(`Cart Service running on http://localhost:${SERVICE_INFO.port}`);
  setTimeout(registerWithGateway, 1000);
});

module.exports = { app };
