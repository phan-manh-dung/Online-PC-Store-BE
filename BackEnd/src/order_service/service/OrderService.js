const createOrder = (userId, orderDetails, totalPrice) => {
  return new Promise(async (resolve, reject) => {
    try {
      const newOrder = new Order({
        userId,
        orderDetails,
        totalPrice,
      });

      await newOrder.save();
      resolve(newOrder); // Trả về kết quả, không dùng res.json()
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createOrder,
};
