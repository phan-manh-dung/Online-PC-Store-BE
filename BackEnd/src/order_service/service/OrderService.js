const { Order } = require('../model/OrderModel');

const createOrder = (userId, customerInformation, shippingAddress, orderDetails, totalPrice) => {
  return new Promise(async (resolve, reject) => {
    try {
      const newOrder = new Order({
        userId,
        customerInformation,
        shippingAddress,
        orderDetails,
        totalPrice,
      });

      await newOrder.save();
      resolve(newOrder);
    } catch (e) {
      reject(e);
    }
  });
};

const getOrderDetail = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await Order.findOne({
        _id: id,
      });
      if (order === null) {
        resolve({
          status: 'ERR',
          message: 'Id order is not defined',
        });
      }
      resolve({
        status: 'OK',
        message: 'SUCCESS',
        data: order,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllOrder = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const allOrder = await Order.find().sort({ createdAt: -1, updatedAt: -1 });
      resolve({
        status: 'OK',
        message: 'Success',
        data: allOrder,
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = { createOrder, getOrderDetail, getAllOrder };
