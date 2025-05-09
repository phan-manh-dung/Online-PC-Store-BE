const { User, Account, Role } = require('../model/UserModel');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { generalAccessToken, refreshAccessToken } = require('../service/JwtServices');

const createUser = async (newUser) => {
  return new Promise(async (resolve, reject) => {
    const { username, password } = newUser;
    try {
      const checkUser = await User.findOne({ username });
      if (checkUser) {
        return resolve({
          status: 'ERR_USER',
          message: 'The name user is already in use',
        });
      }

      const hash = bcrypt.hashSync(String(password), 10);

      // Tìm role CUSTOMER
      const customerRole = await Role.findOne({ name: 'CUSTOMER' });
      if (!customerRole) {
        return resolve({
          status: 'ERR',
          message: 'Role CUSTOMER does not exist',
        });
      }

      // **Tạo User trước**
      const user = new User({ username, password: hash });
      await user.save(); // Lưu user vào database

      // **Tạo Account với `user_id`**
      const account = new Account({
        account_id: Date.now(),
        user_id: user._id,
        roles: [{ _id: customerRole._id, name: customerRole.name }],
      });
      await account.save(); // Lưu account vào database
      // **Cập nhật User với Account**
      user.account = account._id;
      await user.save(); // Lưu lại user với account mới

      resolve({
        status: 'OK',
        message: 'User created successfully',
        data: user,
      });
    } catch (e) {
      console.error('Error in service:', e);
      reject(e);
    }
  });
};

const loginUser = (userLogin) => {
  return new Promise(async (resolve, reject) => {
    const { username, password } = userLogin;
    try {
      const checkUser = await User.findOne({ username }).populate('account');
      if (!checkUser) {
        return resolve({
          status: 'ERR USER NOT IN THE DATABASE',
          message: 'User is not in the database',
        });
      }

      const comparePassword = bcrypt.compareSync(password, checkUser.password);
      if (!comparePassword) {
        return resolve({
          status: 'ERR_PASSWORD',
          message: 'The password is incorrect',
        });
      }

      const roles = checkUser.account?.roles?.map((role) => role.name) || [];

      const access_token = await generalAccessToken({
        id: checkUser.id,
        roles,
      });

      const refresh_token = await refreshAccessToken({
        id: checkUser.id,
      });

      resolve({
        status: 'OK',
        message: 'Success',
        userId: checkUser.id,
        access_token,
        refresh_token,
      });
    } catch (e) {
      console.error('Error in loginUser service:', e);
      reject(e);
    }
  });
};

const getAllUser = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const allUser = await User.find();
      resolve({
        status: 'OK',
        message: 'Get all Success',
        data: allUser,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        return resolve({
          status: 'ERR',
          message: 'The user does not exist',
        });
      }

      if (user.account) {
        await Account.findByIdAndDelete(user.account);
      }
      await User.findByIdAndDelete(id);
      resolve({
        status: 'OK',
        message: 'Delete User Success',
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updateUser = async (id, data) => {
  try {
    // Kiểm tra nếu data trống thì không cập nhật
    if (!Object.keys(data).length) {
      return { status: 'ERROR', message: 'No data to update' };
    }

    // Tạo object updateData chứa các trường cần cập nhật
    let updateData = { ...data };

    // Xóa trường address khỏi updateData để tránh xung đột với $push
    if (data.address) {
      // Lấy thông tin người dùng hiện tại
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return { status: 'ERROR', message: 'User not found' };
      }

      // Lấy mảng address hiện tại
      const existingAddresses = existingUser.address || [];

      // Lọc các địa chỉ mới, loại bỏ những địa chỉ đã tồn tại
      const newAddresses = data.address.filter((newAddr) => {
        return !existingAddresses.some((existingAddr) => JSON.stringify(existingAddr) === JSON.stringify(newAddr));
      });

      // Nếu có địa chỉ mới không trùng lặp, thực hiện $push
      if (newAddresses.length > 0) {
        delete updateData.address;
        updateData.$push = { address: { $each: newAddresses } };
      } else {
        // Nếu không có địa chỉ mới nào không trùng lặp, xóa address khỏi updateData
        delete updateData.address;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return { status: 'ERROR', message: 'User not found' };
    }

    return { status: 'OK', message: 'SUCCESS', data: updatedUser };
  } catch (error) {
    console.error('Error updating user:', error);
    return { status: 'ERROR', message: 'Internal server error' };
  }
};

const getDetailsUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({
        _id: id,
      });
      if (user === null) {
        resolve({
          status: 'ERR',
          message: 'The user is not exists getDetail',
        });
      }
      resolve({
        status: 'OK',
        message: 'Success getDetail',
        data: user,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const checkDeletableUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const [cartCount, orderCount] = await Promise.all([
      axios.get(`${process.env.CART_SERVICE_URL}/api/cart/cart-count/${userId}`).then((res) => res.data.count),
      axios.get(`${process.env.ORDER_SERVICE_URL}/api/order/order-count/${userId}`).then((res) => res.data.count),
    ]);

    const isDeletable = cartCount === 0 && orderCount === 0;

    return {
      isDeletable: isDeletable,
      reason: isDeletable ? 'Allowed to delete this user' : 'User has cart or orders',
    };
  } catch (error) {
    console.error('UserService checkDeletableUser - Error:', error.message);
    throw new Error(error.message);
  }
};

const getUserStats = async (userId) => {
  try {
    if (!userId) {
      return {
        status: 400,
        message: 'User ID is required',
      };
    }

    // Gọi Order Service để lấy số lượng đơn hàng
    const orderCountResponse = await axios.get(`${process.env.ORDER_SERVICE_URL}/api/order/order-count/${userId}`);
    const orderCount = orderCountResponse.data.count || 0;

    // Gọi Order Service để lấy tất cả đơn hàng của user
    const ordersResponse = await axios.get(`${process.env.ORDER_SERVICE_URL}/api/order/get-all-order-user/${userId}`);
    // Lấy mảng orders từ response
    let orders = [];
    const ordersData = ordersResponse.data?.data;
    if (ordersData?.orders && Array.isArray(ordersData.orders)) {
      orders = ordersData.orders;
    } else if (ordersData && !Array.isArray(ordersData)) {
      orders = [ordersData]; // Trường hợp 1 đơn hàng
    } else {
      orders = [];
    }

    // Tính toán tổng tiền và phân loại theo trạng thái
    let totalAmount = 0;
    let pendingAmount = 0;
    let successfulAmount = 0;
    let cancelledAmount = 0;

    const statusCounts = {
      pending: 0,
      successful: 0,
      cancelled: 0,
    };

    if (orders.length > 0) {
      orders.forEach((order) => {
        const orderTotal = order.totalPrice || 0;
        totalAmount += orderTotal;

        if (order.statusOrder === 'successful') {
          successfulAmount += orderTotal;
          statusCounts.successful += 1;
        } else if (order.statusOrder === 'pending') {
          pendingAmount += orderTotal;
          statusCounts.pending += 1;
        } else if (order.statusOrder === 'cancelled') {
          cancelledAmount += orderTotal;
          statusCounts.cancelled += 1;
        }
      });
    } else {
      console.log('No orders found to process');
    }

    return {
      status: 200,
      message: 'User order statistics retrieved successfully',
      data: {
        totalOrders: orderCount,
        totalAmount,
        pendingAmount,
        successfulAmount,
        cancelledAmount,
        statusCounts,
      },
    };
  } catch (error) {
    console.error('Error in getUserStats service:', error.message);
    return {
      status: 500,
      message: 'Error retrieving order data',
      error: error.message,
    };
  }
};

module.exports = {
  createUser,
  loginUser,
  getAllUser,
  deleteUser,
  updateUser,
  getDetailsUser,
  checkDeletableUser,
  getUserStats,
};
