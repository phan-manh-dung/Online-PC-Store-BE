const express = require('express');
const userController = require('../controller/UserController');
const { authUserMiddleware, authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/sign-up', userController.createUser);
router.post('/sign-in', userController.loginUser);
router.post('/refresh-token', userController.refreshToken);
router.get('/get-all', userController.getAllUser);

module.exports = router;