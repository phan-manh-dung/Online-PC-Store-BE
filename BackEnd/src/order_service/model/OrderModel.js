const mongoose = require('mongoose');

const orderDetailSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Order' },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String },
    discount: { type: Number, required: true },
    color: { type: String },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true },
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    customerInformation: {
      name: { type: String, require: true },
      phone: { type: String, require: true },
    },
    shippingAddress: {
      ward: { type: String, require: true },
      district: { type: String, required: true },
      city: { type: String, require: true },
      country: { type: String, require: true },
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CREDIT_CARD', 'INTERNET_BANKING', 'MOMO'],
      default: 'CASH',
    },
    statusOrder: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    totalPrice: { type: Number, required: true },
    orderDetailIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderDetail' }],
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  },
);
const Order = mongoose.model('Order', orderSchema);
const OrderDetail = mongoose.model('OrderDetail', orderDetailSchema);
module.exports = { Order, OrderDetail };
