const express = require('express');
const axios = require('axios');
const OrderService = require('../service/OrderService');

const USER_SERVICE_URL = 'http://localhost:5555/api/user/get-detail';
const PRODUCT_SERVICE_URL = 'http://localhost:5555/api/product/get-by-id';

const createOrder = async (req, res) => {
  try {
    const { userId, products } = req.body;
    const userResponse = await axios.get(`${USER_SERVICE_URL}/${userId}`);

    const dataUser = [];
    console.log('dataUser 1', dataUser);

    if (!userResponse.data) {
      return res.status(404).json({ message: 'User not found controller' });
    }
    const user = userResponse.data;
    dataUser.push({
      name: user.data?.data?.name,
      phone: user.data?.data?.phone,
    });

    let totalPrice = 0;
    const orderDetails = [];

    for (const item of products) {
      const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/${item.productId}`);
      if (!productResponse.data) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      const product = productResponse.data;

      const totalItemPrice = product.price * item.quantity;

      orderDetails.push({
        productId: item.productId,
        name: product.name,
        quantity: item.quantity,
        discount: 0,
        price: product.price,
        total_price: totalItemPrice,
      });

      totalPrice += totalItemPrice;
    }

    const response = await OrderService.createOrder(userId, orderDetails, totalPrice);

    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      message: e.message || 'Internal server error',
    });
  }
};

module.exports = {
  createOrder,
};
