const { deleteModel } = require('mongoose');
const CartService = require('../service/CartService');

const createCart = async (req, res) => {
  try {
    const { userId, productId, nameProduct, amountProduct, imageProduct, priceProduct, colorProduct, discount, type } =
      req.body;

    if (!userId) return res.status(400).json({ status: 'ERR', message: 'userId is required' });
    if (!productId) return res.status(400).json({ status: 'ERR', message: 'productId is required' });
    const requiredFields = { nameProduct, amountProduct, imageProduct, priceProduct };
    const missingField = Object.keys(requiredFields).find((key) => !requiredFields[key]);
    if (missingField) {
      return res.status(400).json({ status: 'ERR', message: `${missingField} is required` });
    }

    const cartData = {
      userId,
      productId,
      nameProduct,
      amountProduct,
      imageProduct,
      priceProduct,
      colorProduct,
      discount,
      type,
    };
    const response = await CartService.createCart(cartData);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      message: e.message || 'Internal server error at controller',
    });
  }
};

const deleteCart = async (req, res) => {
  try {
    const cartId = req.params.id;
    if (!cartId) {
      return res.status(200).json({
        status: 'ERR',
        message: 'The CartID is required',
      });
    }
    const response = await CartService.deleteCart(cartId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const getCartUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userCarts = await CartService.getCartUser(userId);
    return res.status(200).json(userCarts);
  } catch (e) {
    return res.status(404).json({ message: e.message });
  }
};

const deleteManyCart = async (req, res) => {
  try {
    const cartIdObjects = req.body;
    console.log('cartIdObjects', cartIdObjects);

    // Kiểm tra xem cartIdObjects có phải mảng không
    if (!cartIdObjects || !Array.isArray(cartIdObjects)) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The request body must be an array',
      });
    }

    const ids = cartIdObjects.map((item) => item.cartId);
    console.log('ids', ids);

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        status: 'ERR',
        message: 'The ids are required and must not be empty',
      });
    }

    const response = await CartService.deleteManyCart(ids);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      message: e.message,
      status: 'ERROR',
    });
  }
};

module.exports = { createCart, deleteCart, getCartUser, deleteManyCart };
