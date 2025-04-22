const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/Promotion_Controller');
const { authMiddleware } = require('../middleware/authMiddleware');


router.get('/get-all', promotionController.getAllPromotions);
router.get('/get-by-id/:id', promotionController.getPromotionById);

router.post('/admin/create',authMiddleware, promotionController.createPromotion);
router.put('/admin/update/:id',authMiddleware, promotionController.updatePromotion);
router.delete('/admin/delete/:id',authMiddleware, promotionController.deletePromotion);

module.exports = router;
