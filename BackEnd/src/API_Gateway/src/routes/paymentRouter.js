const express = require('express');
const router = express.Router();
const ServiceClient = require('../services/serviceClient');
const paymentServiceClient = new ServiceClient('payment_service');
// Middleware verify token
const authenticateToken = require('../middleware/authenMiddleware');
// lỗi
const errorHandler = (error, res) => {
  console.error('Service Error:', error);
  const status = error.response?.status || 500;
  const message = error.response?.data?.message || 'Internal Server Error';
  res.status(status).json({ success: false, message, error: error.message });
};

router.post('/create-payment-momo', async (req, res) => {
  try {
    const response = await paymentServiceClient.post('/api/payment/create-payment-momo', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/callback', async (req, res) => {
  console.log('Gateway received callback:', req.body);
  try {
    const response = await paymentServiceClient.post('/api/payment/callback', req.body);
    console.log('Callback response:', response.data);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/transaction-status-momo', async (req, res) => {
  try {
    const response = await paymentServiceClient.post('/api/payment/transaction-status-momo', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/status', async (req, res) => {
  try {
    const response = await productServiceClient.get('/api/payment/status', {
      params: req.query,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

// Route cho SSE (Server-Sent Events)
router.get('/stream-status', async (req, res) => {
  try {
    // Thiết lập headers cho SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Forward request đến payment service
    const response = await paymentServiceClient.get('/api/payment/stream-status', {
      params: req.query,
      // Không sử dụng responseType: 'stream'
    });

    // Nếu có lỗi từ payment service
    if (response.status !== 200) {
      throw new Error(response.data.message || 'Payment service error');
    }

    // Gửi thông báo kết nối thành công
    res.write(`data: ${JSON.stringify({ message: 'Connected', orderId: req.query.orderId })}\n\n`);

    // Lưu client vào danh sách để xử lý callback sau này
    const orderId = req.query.orderId;
    if (orderId) {
      // Lưu response object để có thể gửi thông báo sau
      paymentServiceClient.clients = paymentServiceClient.clients || new Map();
      paymentServiceClient.clients.set(orderId, res);

      // Xử lý khi client ngắt kết nối
      req.on('close', () => {
        if (paymentServiceClient.clients) {
          paymentServiceClient.clients.delete(orderId);
        }
        res.end();
      });
    }
  } catch (error) {
    console.error('SSE Error:', error);
    // Gửi lỗi dưới dạng SSE event
    res.write(
      `data: ${JSON.stringify({
        error: 'Connection error',
        message: error.message || 'Failed to connect to payment service',
      })}\n\n`,
    );
    res.end();
  }
});

// Route để nhận thông báo từ payment service và forward đến client
router.post('/notify-client', async (req, res) => {
  try {
    const { orderId, data } = req.body;
    if (!orderId || !data) {
      return res.status(400).json({ message: 'Missing orderId or data' });
    }

    // Lấy client từ danh sách
    const client = paymentServiceClient.clients?.get(orderId);
    if (client) {
      // Gửi thông báo đến client
      client.write(`data: ${JSON.stringify(data)}\n\n`);
      client.end();
      paymentServiceClient.clients.delete(orderId);
      res.status(200).json({ message: 'Notification sent' });
    } else {
      res.status(404).json({ message: 'No client found for this order' });
    }
  } catch (error) {
    console.error('Notify client error:', error);
    res.status(500).json({ message: 'Error notifying client', error: error.message });
  }
});

module.exports = router;
