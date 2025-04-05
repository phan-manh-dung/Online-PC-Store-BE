const jwt = require('jsonwebtoken');

// Middleware kiểm tra token
const authenticateToken = (req, res, next) => {
  // Lấy token từ header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    // Kiểm tra token (thay JWT_SECRET bằng secret key từ user-service)
    const JWT_SECRET = process.env.ACCESS_TOKEN;
    console.log('JWT_SECRET', JWT_SECRET);
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
      }
      // Token hợp lệ, lưu thông tin decoded vào req
      req.user = decoded; // Ví dụ: decoded chứa userId, role
      next(); // Chuyển tiếp request
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = authenticateToken;
