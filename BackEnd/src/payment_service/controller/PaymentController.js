const paymentService = require('../service/PaymentService');
const axios = require('axios');

// Lưu trữ các client SSE theo orderId
const clients = new Map(); // Map<orderId, response>

const createPayment = async (req, res) => {
  try {
    const { amount, orderInfo, orderId } = req.body;
    const result = await paymentService.createPayment({ amount, orderInfo, orderId });
    res.json(result);
  } catch (error) {
    console.log('Error controller:', error);
    res.status(500).json({ message: 'Error creating payment', error });
  }
};

const handleCallback = async (req, res) => {
  console.log('Callback request body:', req.body);
  try {
    if (req.body.requestId === 'processed') {
      return res.status(200).end();
    }
    req.body.requestId = 'processed';
    await paymentService.handleCallback(req.body);

    // Thông báo cho client về trạng thái thanh toán
    const status = req.body.resultCode === 0 ? 'SUCCESS' : 'FAILED';
    const notificationData = {
      status,
      message: req.body.message,
      resultCode: req.body.resultCode,
      transId: req.body.transId,
    };

    // Thông báo qua API Gateway
    try {
      await axios.post('http://localhost:5555/api/payment/notify-client', {
        orderId: req.body.orderId,
        data: notificationData,
      });
    } catch (notifyError) {
      console.error('Error notifying client through API Gateway:', notifyError);
    }

    // Thông báo trực tiếp nếu có client kết nối
    await notifyClients(req.body.orderId, notificationData);

    res.status(200).json(req.body);
  } catch (error) {
    console.log('Error callback:', error);
    res.status(500).json({ message: 'Error handling callback', error });
  }
};

const checkTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId || !/^[0-9a-zA-Z]+([-_.:]+[0-9a-zA-Z]+)*$/.test(orderId)) {
      return res.status(400).json({ message: 'Invalid orderId format' });
    }
    const result = await paymentService.checkTransactionStatus(orderId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error checking transaction status', error });
  }
};

// Hàm xử lý SSE
const streamPaymentStatus = async (req, res) => {
  const orderId = req.query.orderId;
  if (!orderId) {
    return res.status(400).json({ message: 'orderId is required' });
  }

  // Thiết lập header cho SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Lưu client vào danh sách chờ
  clients.set(orderId, res);

  // Gửi thông báo "connected" để FE biết kết nối thành công
  res.write(`data: ${JSON.stringify({ message: 'Connected', orderId })}\n\n`);

  // Xóa client khi FE ngắt kết nối
  req.on('close', () => {
    clients.delete(orderId);
    res.end();
  });
};

// Hàm gửi thông báo tới client
const notifyClients = async (orderId, data) => {
  const client = clients.get(orderId);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
    client.end(); // Đóng kết nối sau khi gửi
    clients.delete(orderId); // Xóa client khỏi danh sách
  }
};

module.exports = {
  createPayment,
  handleCallback,
  checkTransactionStatus,
  streamPaymentStatus,
  notifyClients,
};
