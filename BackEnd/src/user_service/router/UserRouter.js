const express = require('express');
const userController = require('../controller/UserController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/sign-up', userController.createUser);
router.post('/sign-in', userController.loginUser);
router.post('/refresh-token', userController.refreshToken);
router.post('/log-out', userController.logUotUser);

router.delete('/admin/delete-user/:id', authMiddleware, userController.deleteUser);
router.get('/admin/get-all', authMiddleware, userController.getAllUser);
router.get('/get-detail/:id', userController.getDetailsUser);
router.put('/update-user/:id', userController.updateUser);

module.exports = router;
