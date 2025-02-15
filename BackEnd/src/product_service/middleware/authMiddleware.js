const jwt = require('jsonwebtoken');
const { User, Account } = require("../../user_service/model/UserModel");
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = async (req, res, next) => {
    const token = req.headers.token?.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            message: 'Token is missing',
            status: 'ERROR',
        });
    }

    try {
        // Giải mã token lấy id và roles
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);

        if (decoded.exp < Date.now() / 1000) {
            return res.status(401).json({
                message: 'Token has expired',
                status: 'ERROR',
            });
        }

        const isAdmin = decoded.roles.includes("ADMIN");
        if (isAdmin) {
            req.user = decoded; 
            next();
        } else {
            return res.status(403).json({
                message: 'Access denied: You are not an admin',
                status: 'ERROR',
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Invalid token',
            status: 'ERROR',
        });
    }
};

module.exports = {
    authMiddleware
};
