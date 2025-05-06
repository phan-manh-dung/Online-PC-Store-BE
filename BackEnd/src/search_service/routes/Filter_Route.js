const express = require('express');
const router = express.Router();
const filterController = require('../controllers/Filter_Controller');

router.get('/get-all/', filterController.getAll);
router.get('/get-by-id/:id', filterController.getById);
router.post('/admin/create', filterController.create);
router.put('/admin/update/:id', filterController.update);
router.delete('/admin/delete/:id', filterController.remove);

module.exports = router;
