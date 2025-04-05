const { Cart } = require('../model/CartModel');
const { ObjectId } = require('mongoose').Types;

const { readData, updateData, deleteData, createData } = require('../../redis/v1/service/redisService');

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
  // Validation logic nghiệp vụ
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
      const isProductExist = cart.cartItems.some((item) => item.productId.toString() === productId.toString());
      if (isProductExist) {
        throw new Error('Product already exists in the cart');
      }
      cart.cartItems.push(newCartItem);
      await cart.save(); // Lưu thay đổi
    } else {
      cart = await Cart.create({
        userId,
        cartItems: [newCartItem],
      });
    }

    // Xử lý Redis
    const cacheKey = `get-cart-user:${userId}`;
    const cachedData = await readData(cacheKey).catch(() => null);

    if (cachedData) {
      let updatedCart;

      // Kiểm tra và bỏ "0" nếu tồn tại
      if (cachedData['0']) {
        updatedCart = cachedData['0'];
      } else {
        updatedCart = cachedData;
      }

      // Lấy cartItems từ updatedCart
      let updatedCartItems = updatedCart.cartItems || [];

      // Đảm bảo updatedCartItems là mảng
      if (!Array.isArray(updatedCartItems)) {
        updatedCartItems = [updatedCartItems];
      }

      // Thêm newCartItem vào mảng
      updatedCartItems.push(newCartItem);

      updatedCart.cartItems = updatedCartItems;
      updatedCart.updatedAt = new Date().toISOString(); // Cập nhật thời gian
      updatedCart.__v = (updatedCart.__v || 0) + 1; // Tăng version

      // Lưu trực tiếp object
      try {
        await updateData(cacheKey, updatedCart, 3600);
        console.log(`Cache updated for key: ${cacheKey}`);
      } catch (redisError) {
        console.error('Error updating Redis:', redisError);
      }
    } else {
      console.log('No cache found for key, skipping cache creation as per request');
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

// const deleteCart = (id) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const cart = await Cart.findOne({ 'cartItems._id': id });
//       if (!cart) {
//         return resolve({
//           status: 'ERR',
//           message: 'Cart or cart item does not exist',
//         });
//       }

//       const initialLength = cart.cartItems.length; // 1.lấy độ dài của cart
//       // 2.filter() để tạo một mảng mới chỉ chứa những phần tử có _id khác với id được truyền vào.
//       cart.cartItems = cart.cartItems.filter((item) => item._id.toString() !== id);

//       if (initialLength === cart.cartItems.length) {
//         return resolve({
//           status: 'ERR',
//           message: 'Cart item not found in cart',
//         });
//       }
//       // 3. có mảng mới lọc bằng filter rồi thì save lại các id được chọn chừa id đã lọc ra
//       await cart.save();
//       // Chỉ xóa document nếu cartItems rỗng
//       if (cart.cartItems.length === 0) {
//         await Cart.deleteOne({ _id: cart._id });
//         return resolve({
//           status: 'OK',
//           message: 'Cart and all items deleted',
//           data: null,
//         });
//       }

//       return resolve({
//         status: 'OK',
//         message: 'Delete cart item success',
//         data: cart,
//       });
//     } catch (e) {
//       console.error('Error in deleteCart service:', e);
//       reject(e);
//     }
//   });
// };

const deleteCart = (id) => {
  console.log('id', id);
  return new Promise(async (resolve, reject) => {
    try {
      const cart = await Cart.findOne({ 'cartItems._id': id });
      console.log('cart', cart);
      if (!cart) {
        return resolve({
          status: 'ERR',
          message: 'Cart or cart item does not exist',
        });
      }

      const initialLength = cart.cartItems.length; // 1. Lấy độ dài của cart
      // 2. Filter để tạo mảng mới chỉ chứa những phần tử có _id khác với id được truyền vào
      cart.cartItems = cart.cartItems.filter((item) => item._id.toString() !== id);

      if (initialLength === cart.cartItems.length) {
        return resolve({
          status: 'ERR',
          message: 'Cart item not found in cart',
        });
      }

      // 3. Lưu lại các thay đổi vào database
      await cart.save();

      // Xử lý Redis
      const cacheKey = `get-cart-user:${cart.userId}`;
      const cachedData = await readData(cacheKey).catch(() => null);

      // Log dữ liệu cache để debug
      console.log('Cached data from Redis:', cachedData);

      // Chỉ cập nhật cache nếu đã có cache
      if (cachedData) {
        let updatedCart;

        // Kiểm tra và bỏ "0" nếu tồn tại
        if (cachedData['0']) {
          updatedCart = cachedData['0'];
        } else {
          updatedCart = cachedData;
        }

        // Lấy cartItems từ updatedCart
        let updatedCartItems = updatedCart.cartItems || [];

        // Đảm bảo updatedCartItems là mảng
        if (!Array.isArray(updatedCartItems)) {
          updatedCartItems = [updatedCartItems];
        }

        // Filter cartItems trong cache để loại bỏ item đã xóa
        updatedCartItems = updatedCartItems.filter((item) => item._id.toString() !== id);

        // Cập nhật lại cartItems trong updatedCart
        updatedCart.cartItems = updatedCartItems;
        updatedCart.updatedAt = new Date().toISOString(); // Cập nhật thời gian
        updatedCart.__v = (updatedCart.__v || 0) + 1; // Tăng version

        // Lưu trực tiếp object mà không bao bọc trong "0"
        const dataToUpdate = cachedData['0'] ? { 0: updatedCart } : updatedCart;
        try {
          await updateData(
            cacheKey,
            dataToUpdate,
            3600, // TTL 1 giờ
          );
          console.log(`Cache updated for key: ${cacheKey}`);
        } catch (redisError) {
          console.error('Error updating Redis:', redisError);
        }
      } else {
        console.log('No cache found for key, skipping cache update');
      }

      // Xóa document nếu cartItems rỗng
      if (cart.cartItems.length === 0) {
        await Cart.deleteOne({ _id: cart._id });
        // Xóa cache nếu cart bị xóa
        if (cachedData) {
          try {
            await deleteData(cacheKey);
            console.log(`Cache deleted for key: ${cacheKey}`);
          } catch (redisError) {
            console.error('Error deleting Redis cache:', redisError);
          }
        }
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
