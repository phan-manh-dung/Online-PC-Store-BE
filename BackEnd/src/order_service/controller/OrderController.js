const axios = require('axios');
const OrderService = require('../service/OrderService');

const createOrder = async (req, res) => {
  try {
    const { userId, products, shippingPrice = 0 } = req.body;
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
    // Gọi product_service qua Gateway
    for (const item of products) {
      const productResponse = await axios.get(
        `${process.env.GATEWAY_URL}/api/product/product/get-by-id/${item.productId}`,
      );
      const productData = productResponse;
      if (!productData || !productData.data) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      const product = productData.data;
      const totalItemPrice = product.price * item.quantity;
      orderDetails.push({
        order_detail_id: orderDetailIdCounter++,
        name: product.name,
        amount: item.quantity,
        image: product.image,
        productId: item.productId,
        quantity: item.quantity,
        discount: item.discount || 0,
        color: product.color || null,
        total_price: totalItemPrice,
      });
      totalPrice += totalItemPrice;
    }
    totalPrice += shippingPrice;
    const response = await OrderService.createOrder(
      userId,
      customerInformation,
      shippingAddress,
      orderDetails,
      totalPrice,
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
    // console.log(e)
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
    // console.log(e)
    return res.status(404).json({
      message: e,
    });
  }
};

module.exports = { createOrder, getDetailOrder, getAllOrder, deleteOrderToCancelled };
