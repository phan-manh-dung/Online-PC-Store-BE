const mongoose = require('mongoose');

const orderDetailSchema = new mongoose.Schema({
  order_detail_id: { type: Number, required: true, unique: true },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true },
  discount: { type: Number, required: true },
  total_price: { type: Double, require: true },
});

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ['CASH', 'CREDIT_CARD', 'INTERNET_BANKING'],
      default: 'pending',
    },
    shippingPrice: { type: Number },
    totalPrice: { type: Number },
    status: {
      type: String,
      enum: ['wait_pay', 'pending', 'deliver', 'completed', 'cancelled'],
      default: 'pending',
    },
    orderDetails: [orderDetailSchema],
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  },
);
const Order = mongoose.model('Order', orderSchema);
const Order_Detail = mongoose.model('Order_Detail', orderDetailSchema);
module.exports = { Order, Order_Detail };
