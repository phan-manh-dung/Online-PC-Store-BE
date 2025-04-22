const Promotion = require('../models/Promotion_Model');

// Create promotion
async function createPromotion(data) {
  const promo = new Promotion(data);
  return await promo.save();
}

// Get all promotions
async function getAllPromotions() {
  return await Promotion.find().sort({ startDate: -1 });
}

// Get promotion by ID
async function getPromotionById(id) {
  return await Promotion.findById(id);
}

// Update promotion
async function updatePromotion(id, data) {
  return await Promotion.findByIdAndUpdate(id, data, { new: true });
}

// Delete promotion
async function deletePromotion(id) {
  return await Promotion.findByIdAndDelete(id);
}

// Apply promotion logic (calculate price)
function applyPromotion(originalPrice, promotion) {
  if (!promotion) return originalPrice;

  if (promotion.discountType === 'percentage') {
    return originalPrice * (1 - promotion.discountValue / 100);
  } else if (promotion.discountType === 'fixed') {
    return originalPrice - promotion.discountValue;
  }
  return originalPrice;
}

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  applyPromotion
};
