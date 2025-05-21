const axios = require('axios');
const OrderService = require('../service/OrderService');

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      products,
      shippingPrice = 0,
      totalPrice,
      statusOrder = '',
      paymentMethod = '',
      isDelivered = false,
    } = req.body;
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let access_token = null;

    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      access_token = authHeader.slice(7).trim();
    }
    if (!access_token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required in Authorization header',
      });
    }

    let userData;
    try {
      const userResponse = await axios.get(`${process.env.GATEWAY_URL}/api/user/get-detail/${userId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      userData = userResponse.data;

      // Kiểm tra cấu trúc response từ API Gateway
      if (!userData || (!userData.data && !userData.success)) {
        throw new Error('Invalid response structure from user API');
      }

      // API Gateway có thể trả về { success: true, data: {...} }
      userData = userData.success ? userData.data : userData;
    } catch (error) {
      console.log('er', error);
      console.error(`Error fetching user: ${error.message}`);
      return res.status(404).json({ message: 'User not found from API' });
    }

    // Check user and get address
    const user = userData.data;
    const userAddress = user?.address?.[0] || null;

    const customerInformation = {
      fullname: user?.fullname,
      phone: user?.phone,
    };

    const shippingAddress = {
      ward: userAddress?.ward,
      district: userAddress?.district,
      province: userAddress?.province,
      country: userAddress?.country,
    };

    if (!userData) {
      return res.status(404).json({ message: 'User not found controller' });
    } else if (!user?.phone && !userAddress) {
      return res.status(404).json({ message: 'Phone and address not found controller' });
    } else if (!user?.phone) {
      return res.status(404).json({ message: 'Phone not found controller' });
    } else if (!userAddress) {
      return res.status(400).json({ message: 'User has no address' });
    } else if (!statusOrder || !paymentMethod) {
      return res.status(400).json({ message: 'Status Order or payment method is required' });
    } else {
      console.log('');
    }

    // Kiểm tra totalPrice từ request
    if (!totalPrice || typeof totalPrice !== 'number' || totalPrice <= 0) {
      return res.status(400).json({ message: 'Total price is required and must be a positive number' });
    }

    // Tạo order details (không tính lại totalPrice)
    const orderDetails = [];
    let orderDetailIdCounter = 1;

    // Sử dụng Promise.all để gọi API song song
    const productPromises = products.map((item) =>
      axios.get(`${process.env.GATEWAY_URL}/api/product/product/get-by-id/${item.productId}`),
    );
    const productResponses = await Promise.all(productPromises);

    // Xử lý dữ liệu từ các response
    productResponses.forEach((productResponse, index) => {
      const productData = productResponse;
      if (!productData || !productData.data) {
        throw new Error(`Product ${products[index].productId} not found`);
      }
      const product = productData.data;

      // Tính totalItemPrice để hiển thị trong orderDetails (không ảnh hưởng đến totalPrice của order)
      const totalItemPrice = product.price * products[index].quantity * (1 - (products[index].discount || 0) / 100);

      orderDetails.push({
        order_detail_id: orderDetailIdCounter++,
        name: product.name,
        amount: products[index].quantity,
        price: product.price,
        description: product.description,
        image: product.image,
        productId: products[index].productId,
        discount: products[index].discount || 0,
        color: product.color || null,
        total_price: totalItemPrice,
      });
    });

    // Tạo order với totalPrice từ request
    let response;
    try {
      response = await OrderService.createOrder(
        userId,
        customerInformation,
        shippingAddress,
        orderDetails,
        totalPrice,
        statusOrder,
        paymentMethod,
        isDelivered,
      );

      // Convert Mongoose document to plain object
      if (response.data && response.data.toObject) {
        response.data = response.data.toObject();
      }
    } catch (e) {
      console.error('Error calling OrderService.createOrder:', e);
      return res.status(500).json({
        success: false,
        message: 'Order service failed',
        error: e.message || e,
      });
    }

    // Kiểm tra response từ service
    if (response.status !== 200) {
      return res.status(response.status).json({ message: response.message });
    }

    // Nếu paymentMethod là MOMO, gửi message đến Kafka
    if (paymentMethod.toUpperCase() === 'MOMO') {
      const producer = req.app.locals.producer;
      const payUrlStore = req.app.locals.payUrlStore;
      const orderId = response?.data?._id.toString();
      console.log('Order ID for payment:', orderId);

      const orderData = {
        orderId,
        userId,
        amount: totalPrice,
        orderInfo: `Thanh toán đơn hàng ${orderId}`,
      };

      try {
        await producer.send({
          topic: 'order-payment',
          messages: [
            {
              value: JSON.stringify(orderData),
            },
          ],
        });
        console.log('Order sent to Kafka:', orderData);

        // Đợi payUrl với Promise và timeout
        const waitForPayUrl = new Promise((resolve) => {
          const checkPayUrl = () => {
            const payUrl = payUrlStore.get(orderId);
            console.log('Checking payUrl for orderId:', orderId, 'Current payUrl:', payUrl);
            if (payUrl) {
              payUrlStore.delete(orderId);
              resolve(payUrl);
            } else {
              setTimeout(checkPayUrl, 100);
            }
          };
          checkPayUrl();
        });

        const payUrl = await Promise.race([
          waitForPayUrl,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for payment URL')), 10000)),
        ]).catch((error) => {
          console.log('Timeout or error waiting for payment URL:', error.message);
          return null;
        });

        console.log('Final payUrl received:', payUrl);

        if (payUrl) {
          console.log('Adding payUrl to response');
          // Ensure response.data is a plain object
          if (typeof response.data === 'object') {
            response.data = { ...response.data, payUrl };
            console.log('Response after adding payUrl:', JSON.stringify(response, null, 2));
          }
        } else {
          console.log('No payUrl received within timeout');
        }
      } catch (kafkaError) {
        console.error('Error in payment process:', kafkaError);
        if (typeof response.data === 'object') {
          response.data = { ...response.data, paymentError: 'Payment processing failed, but order was created' };
        }
      }
    }

    return res.status(200).json(response);
  } catch (e) {
    console.error('Error in createOrder controller:', e.message);
    return res.status(500).json({
      message: e.message || 'Internal server error',
    });
  }
};

const getDetailOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId) {
      return res.status(200).json({
        status: 'ERR',
        message: 'The userId is required',
      });
    }
    const response = await OrderService.getOrderDetail(orderId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const getAllOrder = async (req, res) => {
  try {
    const data = await OrderService.getAllOrder();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const deleteOrderToCancelled = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!orderId) {
      return res.status(200).json({
        status: 'ERR',
        message: 'The orderId is required',
      });
    }
    const response = await OrderService.deleteOrderToCancelled(orderId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const getAllOrderOfUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const statusOrder = req.query.statusOrder || '';

    if (!userId) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The userId is required',
      });
    }

    const response = await OrderService.getAllOrderOfUser(userId, statusOrder);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      message: 'Internal Server Error',
      error: e,
    });
  }
};

const updateStatusOrder = async (req, res) => {
  try {
    const { orderId, statusOrder } = req.body;

    if (!orderId || !statusOrder) {
      return res.status(400).json({ message: 'orderId and statusOrder are required' });
    }

    const result = await OrderService.updateStatusOrder(orderId, statusOrder);
    res.status(result.status).json({ message: result.message, data: result.data });
  } catch (error) {
    console.error('Error in updateStatusOrder controller:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const countOrderByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const count = await OrderService.countOrderByUser(userId);
    res.status(200).json({
      status: 'OK',
      message: 'Order count retrieved successfully',
      count: count,
    });
  } catch (error) {
    res.status(400).json({
      status: 'ERR',
      message: error.message,
    });
  }
};

const getSalesStats = async (req, res) => {
  try {
    const result = await OrderService.getSalesStats(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error in getSalesStats controller:', error);
    return res.status(500).json({
      status: 'ERR',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getSummaryStats = async (req, res) => {
  try {
    const result = await OrderService.getSummaryStats(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error in getSummaryStats controller:', error);
    return res.status(500).json({
      status: 'ERR',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getRevenueStatsByDate = async (req, res) => {
  try {
    const result = await OrderService.getRevenueStatsByDate(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error in getRevenueStatsByDate controller:', error);
    return res.status(500).json({
      status: 'ERR',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getRevenueStatsByYear = async (req, res) => {
  try {
    const result = await OrderService.getRevenueStatsByYear(req);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error('Error in getRevenueStatsByYear controller:', error);
    return res.status(500).json({
      status: 'ERR',
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getDetailOrder,
  getAllOrder,
  deleteOrderToCancelled,
  getAllOrderOfUser,
  updateStatusOrder,
  countOrderByUser,
  getSalesStats,
  getSummaryStats,
  getRevenueStatsByDate,
  getRevenueStatsByYear,
};
