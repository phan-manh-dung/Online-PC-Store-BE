function applyPromotion(originalPrice, promotion) {
  if (!promotion) return originalPrice;

  if (promotion.discountType === 'percentage') {
    return originalPrice * (1 - promotion.discountValue / 100);
  } else if (promotion.discountType === 'fixed') {
    return originalPrice - promotion.discountValue;
  }

  return originalPrice;
}

module.exports = { applyPromotion };
