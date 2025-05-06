const express = require('express');
const router = express.Router();
const optionController = require('../controllers/ComputerOption_Controller');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/admin/create/', authMiddleware, optionController.createOption);

router.get('/admin/get-all', authMiddleware, optionController.getAllOptions);

router.get('/admin/get-grouped', authMiddleware, optionController.getGroupedOptions);

router.get('/admin/get-by-key/:key', authMiddleware, optionController.getOptionsByKey);

router.put('/admin/update/:id', authMiddleware, optionController.updateOption);

router.delete('/admin/delete/:id', authMiddleware, optionController.deleteOption);

module.exports = router;
