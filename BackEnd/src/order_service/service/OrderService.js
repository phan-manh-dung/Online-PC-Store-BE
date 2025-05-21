const { Order, OrderDetail } = require('../model/OrderModel');
const mongoose = require('mongoose');
const axios = require('axios');

const { readData, updateData, deleteData, deleteDataPattern } = require('../redis/v1/service/redisService');

const createOrder = (
  userId,
  customerInformation,
  shippingAddress,
  orderDetails,
  totalPrice,
  statusOrder,
  paymentMethod,
  isDelivered = false,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !userId ||
        !customerInformation ||
        !shippingAddress ||
        !orderDetails ||
        !totalPrice ||
        !statusOrder ||
        !paymentMethod
      ) {
        return resolve({
          status: 400,
          message: 'Missing required fields',
        });
      }

      if (!totalPrice || typeof totalPrice !== 'number' || totalPrice <= 0) {
        return resolve({
          status: 400,
          message: 'Total price is required and must be a positive number',
        });
      }

      // Convert isDelivered to boolean if it's a string
      const isDeliveredBoolean =
        typeof isDelivered === 'string' ? isDelivered.toLowerCase() === 'true' : Boolean(isDelivered);

      const createdOrderDetails = await OrderDetail.insertMany(
        orderDetails.map((item) => ({
          orderId: null, // sẽ cập nhật sau
          productId: item.productId,
          name: item.name,
          amount: item.amount,
          price: item.price || 0,
          image: item.image,
          description: item.description || '',
          discount: item.discount || 0,
          color: item.color || '',
          totalPrice: item.total_price,
        })),
      );

      const newOrder = new Order({
        userId,
        customerInformation,
        shippingAddress,
        orderDetailIds: createdOrderDetails.map((detail) => detail._id),
        totalPrice,
        statusOrder: statusOrder || 'pending',
        paymentMethod: paymentMethod || 'CASH',
        isDelivered: isDeliveredBoolean,
      });

      await newOrder.save();

      await Promise.all(
        createdOrderDetails.map((detail) => OrderDetail.findByIdAndUpdate(detail._id, { orderId: newOrder._id })),
      );

      resolve({
        status: 200,
        message: 'Order created successfully',
        data: newOrder,
      });
    } catch (e) {
      console.error('Error in createOrder service:', e);
      reject({
        status: 500,
        message: 'Internal Server Error',
        error: e.message || e,
      });
    }
  });
};

const getOrderDetail = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await Order.findOne({
        _id: id,
      }).populate('orderDetailIds');
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

const deleteOrderToCancelled = async (id) => {
  try {
    const order = await Order.findById(id);
    if (!order) {
      return {
        status: 'ERR',
        message: 'Order does not exist',
      };
    }

    if (order.statusOrder === 'cancelled') {
      return {
        status: 'ERR',
        message: 'Order is already cancelled',
      };
    }

    const oldStatus = order.statusOrder;
    order.statusOrder = 'cancelled';
    await order.save();

    const userId = order.userId.toString();
    const pendingCacheKey = `cart-all-one-user:${userId}:${oldStatus}`;
    const cancelledCacheKey = `cart-all-one-user:${userId}:cancelled`;

    // Cập nhật cache pending
    const cachedPendingData = await readData(pendingCacheKey).catch((err) => {
      console.error(`Error reading Redis for ${pendingCacheKey}:`, err);
      return null;
    });

    if (cachedPendingData && cachedPendingData.data) {
      let updatedPendingOrders = Array.isArray(cachedPendingData.data.orders)
        ? cachedPendingData.data.orders
        : cachedPendingData.data;
      updatedPendingOrders = updatedPendingOrders.filter((item) => item._id.toString() !== id);

      try {
        await updateData(
          pendingCacheKey,
          {
            status: 'OK',
            message: 'SUCCESS',
            data: {
              customerInformation: cachedPendingData.data.customerInformation,
              shippingAddress: cachedPendingData.data.shippingAddress,
              orders: updatedPendingOrders,
            },
          },
          3600,
        );
        console.log(`Cache updated for key: ${pendingCacheKey} with ${updatedPendingOrders.length} orders`);
      } catch (redisError) {
        console.error(`Error updating Redis for ${pendingCacheKey}:`, redisError);
      }
    }
    // Xóa cache cancelled
    try {
      await deleteData(cancelledCacheKey);
      console.log(`Cache deleted for key: ${cancelledCacheKey}`);
    } catch (redisError) {
      console.error(`Error deleting Redis cache for ${cancelledCacheKey}:`, redisError);
    }

    return {
      status: 'OK',
      message: 'Order cancelled successfully',
      data: order,
    };
  } catch (e) {
    throw e;
  }
};

const getAllOrderOfUser = (id, statusOrder) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return resolve({
          status: 'ERR',
          message: 'User ID is required',
        });
      }

      let query = { userId: new mongoose.Types.ObjectId(id) };
      if (statusOrder) {
        query.statusOrder = statusOrder;
      }

      const order = await Order.find(query).sort({ createdAt: -1, updatedAt: -1 });
      if (!order || order.length === 0 || order === null) {
        resolve({
          status: 'ERR',
          message: 'User not found order',
        });
      } else {
        let responseData = {};
        if (order.length === 1) {
          responseData = order[0].toObject();
        } else {
          const firstOrder = order[0].toObject();

          // Kiểm tra customerInformation
          const isCustomerInfoSame = order.every((orderItem) => {
            const firstInfo = firstOrder.customerInformation;
            const currentInfo = orderItem.customerInformation;
            if (!firstInfo || !currentInfo) return false;
            return (
              (Array.isArray(firstInfo) ? firstInfo[0]?.fullname : firstInfo?.fullname) ===
                (Array.isArray(currentInfo) ? currentInfo[0]?.fullname : currentInfo?.fullname) &&
              (Array.isArray(firstInfo) ? firstInfo[0]?.phone : firstInfo?.phone) ===
                (Array.isArray(currentInfo) ? currentInfo[0]?.phone : currentInfo?.phone)
            );
          });

          // Kiểm tra shippingAddress
          const isShippingAddressSame = order.every((orderItem) => {
            const firstAddr = firstOrder.shippingAddress;
            const currentAddr = orderItem.shippingAddress;
            if (!firstAddr || !currentAddr) return false;
            return (
              (Array.isArray(firstAddr) ? firstAddr[0]?.ward : firstAddr?.ward) ===
                (Array.isArray(currentAddr) ? currentAddr[0]?.ward : currentAddr?.ward) &&
              (Array.isArray(firstAddr) ? firstAddr[0]?.district : firstAddr?.district) ===
                (Array.isArray(currentAddr) ? currentAddr[0]?.district : currentAddr?.district) &&
              (Array.isArray(firstAddr) ? firstAddr[0]?.province : firstAddr?.province) ===
                (Array.isArray(currentAddr) ? currentAddr[0]?.province : currentAddr?.province) &&
              (Array.isArray(firstAddr) ? firstAddr[0]?.country : firstAddr?.country) ===
                (Array.isArray(currentAddr) ? currentAddr[0]?.country : currentAddr?.country)
            );
          });

          // Tách dữ liệu trùng lặp ra ngoài
          if (isCustomerInfoSame) {
            responseData.customerInformation = firstOrder.customerInformation;
          }
          if (isShippingAddressSame) {
            responseData.shippingAddress = firstOrder.shippingAddress;
          }

          // Tạo danh sách orders đã loại bỏ các trường trùng lặp
          responseData.orders = order.map((orderItem) => {
            const orderData = orderItem.toObject();
            if (isCustomerInfoSame) delete orderData.customerInformation;
            if (isShippingAddressSame) delete orderData.shippingAddress;
            return orderData;
          });
        }

        resolve({
          status: 'OK',
          message: 'SUCCESS',
          data: responseData,
        });
      }
    } catch (e) {
      console.log('error', e);
      reject({
        status: 'ERR',
        message: 'An error occurred while fetching orders',
        error: e,
      });
    }
  });
};

const updateStatusOrder = (orderId, statusOrder) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Kiểm tra orderId và statusOrder
      if (!orderId || !statusOrder) {
        return resolve({
          status: 400,
          message: 'orderId and statusOrder are required',
        });
      }

      // Kiểm tra statusOrder hợp lệ
      const validStatuses = ['wait_pay', 'pending', 'deliver', 'completed', 'cancelled'];
      if (!validStatuses.includes(statusOrder)) {
        return resolve({
          status: 400,
          message: 'Invalid statusOrder value',
        });
      }

      // Tìm và update order
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { statusOrder, updatedAt: new Date() },
        { new: true }, // Trả về document đã update
      );

      if (!updatedOrder) {
        return resolve({
          status: 404,
          message: 'Order not found',
        });
      }

      resolve({
        status: 200,
        message: 'Order status updated successfully',
        data: updatedOrder,
      });
    } catch (e) {
      console.error('Error in updateStatusOrder service:', e);
      reject({
        status: 500,
        message: 'Internal Server Error',
        error: e.message || e,
      });
    }
  });
};

const countOrderByUser = async (userId) => {
  try {
    const orders = await Order.find({ userId }); // Lấy tất cả đơn hàng
    if (!orders || orders.length === 0) return 0;
    return orders.length; // Đếm số đơn hàng, không đếm số sản phẩm
  } catch (error) {
    console.error('Error counting orders:', error.message);
    throw new Error('Failed to count orders: ' + error.message);
  }
};

const getSalesStats = async (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('Token not found in request headers');
    }

    // Gọi Product Service để lấy danh sách sản phẩm
    const productsResponse = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/api/product/get-all`);
    const products = productsResponse.data.data;

    // Gọi Inventory Service để lấy trạng thái hàng
    const inventoryResponse = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/api/inventory/get-all`);
    const inventoryData = inventoryResponse.data.data;

    // Lấy tất cả đơn hàng từ Order Service
    const ordersResponse = await axios.get(`${process.env.GATEWAY_URL}/api/order/admin/get-all-order`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const orders = ordersResponse.data.data || [];

    // Lấy tất cả chi tiết đơn hàng từ collection OrderDetails
    const orderDetailIds = orders.flatMap((order) => order.orderDetailIds);
    const orderDetails = await OrderDetail.find({ _id: { $in: orderDetailIds } });

    // Tính toán thống kê
    const salesStats = products.map((product) => {
      // Tìm các chi tiết đơn hàng liên quan đến sản phẩm này
      const productOrderDetails = orderDetails.filter(
        (detail) => detail.productId.toString() === product._id.toString(),
      );

      // Tìm các đơn hàng chứa chi tiết đơn hàng của sản phẩm này
      const productOrders = orders.filter((order) =>
        order.orderDetailIds.some((detailId) =>
          productOrderDetails.some((detail) => detail._id.toString() === detailId.toString()),
        ),
      );

      // Chỉ tính các đơn hàng đã giao (hoặc điều chỉnh theo yêu cầu)
      const deliveredOrders = productOrders.filter(
        (order) => order.isDelivered === true && order.statusOrder === 'completed',
      );
      const totalOrders = deliveredOrders.length;

      // Tính revenue từ orderDetails
      const revenue = productOrderDetails
        .filter((detail) => deliveredOrders.some((order) => order._id.toString() === detail.orderId.toString()))
        .reduce((sum, detail) => sum + detail.totalPrice, 0);

      const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
      const processingTime = totalOrders > 0 ? '1d' : 'N/A';

      // Lấy trạng thái từ inventory
      const inventory = inventoryData.find((inv) => inv._id === product.inventory);
      const status = inventory ? (inventory.quantity === 0 ? 'Low Stock' : 'In Stock') : 'Unknown';

      return {
        productId: product._id,
        productName: product.name,
        status,
        totalOrders,
        revenue: `$${revenue.toFixed(2)}`,
        avgOrderValue: `$${avgOrderValue.toFixed(2)}`,
        processingTime,
      };
    });

    return {
      status: 200,
      message: 'Sales statistics retrieved successfully',
      data: salesStats,
    };
  } catch (error) {
    console.error('Error in getSalesStats service:', error.message);
    return {
      status: 500,
      message: 'Error retrieving sales data',
      error: error.message,
    };
  }
};

const getSummaryStats = async (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return {
        status: 401,
        message: 'Token not found in request headers',
      };
    }

    // Lấy tất cả đơn hàng
    const ordersResponse = await axios.get(`${process.env.GATEWAY_URL}/api/order/admin/get-all-order`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const orders = ordersResponse.data.data || [];

    // Tính số đơn hàng hoàn thành
    const completedOrders = orders.filter((order) => order.statusOrder === 'completed');
    const totalOrders = completedOrders.length;

    // Tính tổng doanh thu từ totalPrice của các đơn hàng hoàn thành
    const totalRevenue = completedOrders.reduce((sum, order) => {
      const orderPrice = parseFloat(order.totalPrice) || 0;
      return sum + orderPrice;
    }, 0);

    return {
      status: 200,
      message: 'Summary statistics retrieved successfully',
      data: {
        totalOrders,
        totalRevenue: `$${totalRevenue.toFixed(2)}`,
      },
    };
  } catch (error) {
    console.error('Error in getSummaryStats service:', error.message, error.response?.data);
    return {
      status: error.response?.status || 500,
      message: 'Error retrieving summary stats',
      error: error.response?.data?.message || error.message,
    };
  }
};

const getRevenueStatsByDate = async (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return {
        status: 401,
        message: 'Token not found in request headers',
      };
    }

    // Lấy tham số từ query
    const { day, month, year } = req.query;

    // Validate tham số
    if (!year && (day || month)) {
      return { status: 400, message: 'Year is required if day or month is specified' };
    }
    if (!month && day) {
      return { status: 400, message: 'Month is required if day is specified' };
    }

    const yearNum = year ? parseInt(year) : null;
    const monthNum = month ? parseInt(month) - 1 : null;
    const dayNum = day ? parseInt(day) : null;

    if (yearNum && (yearNum < 1970 || yearNum > 9999)) {
      return { status: 400, message: 'Invalid year' };
    }
    if (monthNum !== null && (monthNum < 0 || monthNum > 11)) {
      return { status: 400, message: 'Invalid month' };
    }
    if (dayNum !== null && (dayNum < 1 || dayNum > 31)) {
      return { status: 400, message: 'Invalid day' };
    }

    // Lấy tất cả đơn hàng
    const ordersResponse = await axios.get(`${process.env.GATEWAY_URL}/api/order/admin/get-all-order`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orders = ordersResponse.data.data || [];
    console.log('Orders from API:', orders);

    // Lọc đơn hàng completed và theo ngày/tháng/năm
    let filteredOrders = orders.filter((order) => order.statusOrder === 'completed');
    if (!yearNum && monthNum === null && dayNum === null) {
      filteredOrders = [];
    } else {
      filteredOrders = filteredOrders.filter((order) => {
        const createdAt = new Date(order.createdAt);
        const matchesYear = yearNum ? createdAt.getFullYear() === yearNum : true;
        const matchesMonth = monthNum !== null ? createdAt.getMonth() === monthNum : true;
        const matchesDay = dayNum !== null ? createdAt.getDate() === dayNum : true;
        return matchesYear && matchesMonth && matchesDay;
      });
    }
    console.log('Filtered orders:', filteredOrders);

    const totalOrders = filteredOrders.length;

    // Tính tổng doanh thu từ orders.totalPrice
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      const orderPrice = parseFloat(order.totalPrice) || 0;
      return sum + orderPrice;
    }, 0);

    return {
      status: 200,
      message: 'Revenue statistics retrieved successfully',
      data: {
        totalOrders,
        totalRevenue: `$${totalRevenue.toFixed(2)}`,
        period: {
          day: day ? parseInt(day) : undefined,
          month: month ? parseInt(month) : undefined,
          year: year ? parseInt(year) : undefined,
        },
      },
    };
  } catch (error) {
    console.error('Error in getRevenueStatsByDate service:', error.message, error.response?.data);
    return {
      status: error.response?.status || 500,
      message: 'Error retrieving revenue stats',
      error: error.response?.data?.message || error.message,
    };
  }
};

module.exports = {
  createOrder,
  getOrderDetail,
  getAllOrder,
  deleteOrderToCancelled,
  getAllOrderOfUser,
  updateStatusOrder,
  countOrderByUser,
  getSalesStats,
  getSummaryStats,
  getRevenueStatsByDate,
};
