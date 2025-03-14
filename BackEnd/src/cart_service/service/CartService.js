const { Cart } = require('../model/CartModel');
const { ObjectId } = require('mongoose').Types;

const createCart = async ({
  userId,
  productId,
  nameProduct,
  amountProduct,
  imageProduct,
  priceProduct,
  colorProduct,
  discount,
  type,
}) => {
  // validation logic nghiệp vụ
  if (amountProduct <= 0) throw new Error('amountProduct must be greater than 0');
  if (priceProduct < 0) throw new Error('priceProduct cannot be negative');

  const newCartItem = {
    productId,
    nameProduct,
    amountProduct,
    imageProduct,
    priceProduct,
    colorProduct,
    discount,
    type,
  };

  try {
    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.cartItems.push(newCartItem);
      await cart.save(); // Lưu thay đổi
    } else {
      cart = await Cart.create({
        userId,
        cartItems: [newCartItem],
      });
    }

    return {
      status: 'OK',
      message: 'Success Create Cart',
      data: cart,
    };
  } catch (error) {
    throw new Error(`Failed to create cart: ${error.message}`);
  }
};

const deleteCart = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cart = await Cart.findOne({ 'cartItems._id': id });
      if (!cart) {
        return resolve({
          status: 'ERR',
          message: 'Cart or cart item does not exist',
        });
      }

      const initialLength = cart.cartItems.length; // 1.lấy độ dài của cart
      // 2.filter() để tạo một mảng mới chỉ chứa những phần tử có _id khác với id được truyền vào.
      cart.cartItems = cart.cartItems.filter((item) => item._id.toString() !== id);

      if (initialLength === cart.cartItems.length) {
        return resolve({
          status: 'ERR',
          message: 'Cart item not found in cart',
        });
      }
      // 3. có mảng mới lọc bằng filter rồi thì save lại các id được chọn chừa id đã lọc ra
      await cart.save();
      // Chỉ xóa document nếu cartItems rỗng
      if (cart.cartItems.length === 0) {
        await Cart.deleteOne({ _id: cart._id });
        return resolve({
          status: 'OK',
          message: 'Cart and all items deleted',
          data: null,
        });
      }

      return resolve({
        status: 'OK',
        message: 'Delete cart item success',
        data: cart,
      });
    } catch (e) {
      console.error('Error in deleteCart service:', e);
      reject(e);
    }
  });
};

const getCartUser = async (userId) => {
  try {
    const userCarts = await Cart.find({ userId });
    return userCarts;
  } catch (error) {
    throw error;
  }
};

const deleteManyCart = (ids) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Chuyển đổi mảng ids (chuỗi) thành mảng ObjectId
      const objectIds = ids.map((id) => new ObjectId(id));
      // Thay đổi cách truy vấn để tìm các cart có cartItems._id khớp với các ID đã cho
      const result = await Cart.updateMany(
        { 'cartItems._id': { $in: objectIds } },
        { $pull: { cartItems: { _id: { $in: objectIds } } } },
      );

      if (result.modifiedCount === 0) {
        resolve({
          status: 'OK',
          message: 'No cart items found to delete',
        });
      } else {
        resolve({
          status: 'OK',
          message: `Deleted ${result.modifiedCount} cart items successfully`,
        });
      }
    } catch (e) {
      reject({
        status: 'ERR',
        message: e.message,
      });
    }
  });
};

module.exports = { createCart, deleteCart, getCartUser, deleteManyCart };
