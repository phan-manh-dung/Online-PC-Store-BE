const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'], //Percentage: theo %, fixed: theo số tiền
    required: true,
  },
  discountValue: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Promotion', promotionSchema);
