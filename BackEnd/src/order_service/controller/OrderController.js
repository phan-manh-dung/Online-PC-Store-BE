const axios = require('axios');
const OrderService = require('../service/OrderService');

const createOrder = async (req, res) => {
  try {
    const { userId, products, shippingPrice = 0, statusOrder = '', statusPayment = '' } = req.body;
    const userResponse = await axios.get(`${process.env.GATEWAY_URL}/api/user/get-detail/${userId}`);
    const userData = userResponse.data;
    // check user and get address and user
    const user = userData.data;
    const userAddress = user.address && user.address.length > 0 ? user.address[0] : null;

    const customerInformation = [];
    const shippingAddress = [];
    if (!userData) {
      return res.status(404).json({ message: 'User not found controller' });
    } else if (!user?.phone && !userAddress) {
      return res.status(404).json({ message: 'Phone and address not found controller' });
    } else if (!user?.phone) {
      return res.status(404).json({ message: 'Phone not found controller' });
    } else if (!userAddress) {
      return res.status(400).json({ message: 'User has no address' });
    } else if (!statusOrder || !statusPayment) {
      return res.status(400).json({ message: 'Status Order or Status Payment is required' });
    } else {
      customerInformation.push({
        name: user?.name,
        phone: user?.phone,
      });
      shippingAddress.push({
        ward: userAddress?.ward,
        district: userAddress?.district,
        city: userAddress?.city,
        country: userAddress?.country,
      });
    }

    let totalPrice = 0;
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
      const totalItemPrice = product.price * products[index].quantity;
      orderDetails.push({
        order_detail_id: orderDetailIdCounter++,
        name: product.name,
        amount: products[index].quantity,
        image: product.image,
        productId: products[index].productId,
        discount: products[index].discount || 0,
        color: product.color || null,
        total_price: totalItemPrice,
      });
      totalPrice += totalItemPrice;
    });

    totalPrice += shippingPrice;
    const response = await OrderService.createOrder(
      userId,
      customerInformation,
      shippingAddress,
      orderDetails,
      totalPrice,
      statusOrder,
      statusPayment,
    );
    return res.status(200).json(response);
  } catch (e) {
    console.error('Error in createOrder:', e.message);
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

module.exports = { createOrder, getDetailOrder, getAllOrder, deleteOrderToCancelled, getAllOrderOfUser };
