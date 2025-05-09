const express = require('express');
const userController = require('../controller/UserController');
const { authMiddleware } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const { User } = require('../model/UserModel');
const router = express.Router();

router.post('/sign-up', userController.createUser);
router.post('/sign-in', userController.loginUser);
router.post('/refresh-token', userController.refreshToken);
router.post('/log-out', userController.logUotUser);

// api check data user
router.get('/check-deletable/:id', userController.checkDeletableUser);

router.delete('/admin/delete-user/:id', authMiddleware, userController.deleteUser);
router.get('/admin/get-all', authMiddleware, userController.getAllUser);
// API để lấy thống kê đơn hàng của người dùng
router.get('/admin/stats/:id', authMiddleware, userController.getUserStats);
router.get('/get-detail/:id', userController.getDetailsUser);
router.put('/update-user/:id', userController.updateUser);

// router.get('/verify-token', async (req, res) => {
//   try {
//     const authHeader = req.headers.authorization;
//     const token = authHeader && authHeader.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ message: 'No token provided' });
//     }
//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
//     const user = await User.findById(decoded.id);
//     if (!user) {
//       return res.status(401).json({ message: 'User not found' });
//     }
//     res.json({ status: 'OK', message: 'Token valid', data: user });
//   } catch (error) {
//     console.error('User service verify-token - Error:', error.message);
//     res.status(401).json({ message: 'Invalid token' });
//   }
// });

router.get('/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Token is missing',
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Token has expired',
      });
    }

    // Lấy thông tin user và populate account
    const user = await User.findById(decoded.id).populate('account');
    if (!user || !user.account) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'User or account not found',
      });
    }

    // Tạo dữ liệu trả về, bao gồm roles từ account
    const userData = {
      ...user.toObject(),
      roles: user.account.roles.map((role) => role.name), // Lấy roles từ account
    };

    return res.status(200).json({
      status: 'OK',
      message: 'Token valid',
      data: userData,
    });
  } catch (error) {
    console.error('Error in verify-token:', error.message);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Error verifying token',
      error: error.message,
    });
  }
});

module.exports = router;
