const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = (req, res, next) => {
    const token = req.headers.token.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
        if (err) {
            return res.status(404).json({
                message: 'The author 1 err verify',
                status: 'ERR',
            });
        }
        if (user?.isAdmin) {
            next();
        } else if (user?.id === req.params.id) {
            next();
        } else {
            return res.status(404).json({
                message: 'The author user err',
                status: 'ERR',
            });
        }
    });
};

const authMiddlewareOne = (req, res, next) => {
    const token = req.headers.token.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
        if (err) {
            return res.status(404).json({
                message: 'The author 1 err verify',
                status: 'ERR',
            });
        }
        if (user?.isAdmin) {
            next();
        } else if (user?.id === req.params.id) {
            next();
        } else {
            return res.status(404).json({
                message: 'The author user err',
                status: 'ERR',
            });
        }
    });
};

const authMiddlewareUpdate = (req, res, next) => {
    const token = req.headers.token.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
        if (err) {
            return res.status(404).json({
                message: 'The author 1 err verify',
                status: 'ERR',
            });
        }
        if (user?.isAdmin) {
            next();
        } else if (user?.id) {
            next();
        } else {
            return res.status(404).json({
                message: 'The author user err',
                status: 'ERR',
            });
        }
    });
};

const authUserMiddleware = (req, res, next) => {
    const token = req.headers.token.split(' ')[1];
    const userId = req.params.id;
    try {
        const decoded = jwt.decode(token);
        if (decoded.exp < Date.now() / 1000) {
            return res.status(401).json({
                message: 'Token has expired',
                status: 'ERROR',
            });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
            if (err) {
                return res.status(404).json({
                    message: 'The author 1 err verify authUser',
                    status: 'ERROR',
                });
            }
            if (user?.isAdmin || user?.id === userId) {
                next();
            } else {
                return res.status(404).json({
                    message: 'The authentication 2',
                    status: 'ERROR',
                });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            status: 'ERROR',
        });
    }
};

module.exports = {
    authMiddleware,
    authUserMiddleware,
    authMiddlewareOne,
    authMiddlewareUpdate,
};
