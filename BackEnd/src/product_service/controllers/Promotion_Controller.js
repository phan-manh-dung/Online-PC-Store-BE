const promotionService = require('../services/Promotion_Service');

// Tạo khuyến mãi mới
const createPromotion = async (req, res) => {
  try {
    const promotion = await promotionService.createPromotion(req.body);
    res.status(201).json(promotion);
  } catch (error) {
    res.status(500).json({ message: 'Error creating promotion', error });
  }
};

// Lấy tất cả khuyến mãi
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await promotionService.getAllPromotions();
    res.status(200).json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching promotions', error });
  }
};

// Lấy khuyến mãi theo ID
const getPromotionById = async (req, res) => {
  try {
    const promotion = await promotionService.getPromotionById(req.params.id);
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });
    res.status(200).json(promotion);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching promotion', error });
  }
};

// Cập nhật khuyến mãi
const updatePromotion = async (req, res) => {
  try {
    const updatedPromotion = await promotionService.updatePromotion(req.params.id, req.body);
    if (!updatedPromotion) return res.status(404).json({ message: 'Promotion not found' });
    res.status(200).json(updatedPromotion);
  } catch (error) {
    res.status(500).json({ message: 'Error updating promotion', error });
  }
};

// Xoá khuyến mãi
const deletePromotion = async (req, res) => {
  try {
    const deletedPromotion = await promotionService.deletePromotion(req.params.id);
    if (!deletedPromotion) return res.status(404).json({ message: 'Promotion not found' });
    res.status(200).json({ message: 'Deleted successfully', data: deletedPromotion });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting promotion', error });
  }
};

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion
};
