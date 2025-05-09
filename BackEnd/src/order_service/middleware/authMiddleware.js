const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const authMiddlewareOrder = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Gọi user_service qua Gateway để xác thực token
    const response = await axios.get(`${process.env.GATEWAY_URL}/api/user/verify-token`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = response.data;
    if (!userData || !userData.data) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Kiểm tra quyền admin
    const roles = userData.data.roles || [];
    const isAdmin = roles.some((role) => role.toUpperCase() === 'ADMIN');
    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }

    req.user = userData.data; // Lưu thông tin user vào req
    next();
  } catch (error) {
    console.error('Error verifying token:', error.message, error.response?.data);
    return res.status(401).json({ message: 'Token verification failed', error: error.message });
  }
};

module.exports = { authMiddlewareOrder };
