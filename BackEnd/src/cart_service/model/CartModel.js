const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cartItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        nameProduct: { type: String, required: true },
        amountProduct: { type: Number, required: true },
        imageProduct: { type: String, required: true },
        priceProduct: { type: Number, required: true },
        colorProduct: { type: String },
        discount: { type: Number },
        type: { type: String },
        totalPrice: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

const Cart = mongoose.model('Cart', cartSchema);

module.exports = { Cart };
