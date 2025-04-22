const Promotion = require('../models/Promotion_Model');
const Product = require('../models/Product_Model')
const { applyPromotion } = require('../utils/promotionUtils');

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

const calculateDiscountedPrice = async (productId) => {
  const product = await Product.findById(productId).populate('promotion');

  if (!product) throw new Error('Product not found');

  const finalPrice = applyPromotion(product.price, product.promotion);

  return {
    originalPrice: product.price,
    finalPrice,
    promotion: product.promotion,
  };
};

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
};
