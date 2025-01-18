const UserService = require('../service/UserService');
const JwtServices = require('../service/JwtServices');

const createUser = async (req, res) => {
    try {
        const { name, password, confirmPassword } = req.body;
        if (!name || !password || !confirmPassword) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Insufficient value entered controller ',
            });
        } else if (password !== confirmPassword) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Password unlike confirmPassword controller',
            });
        }
        const response = await UserService.createUser(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e,
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { name, password } = req.body;
        if (!name || !password) {
            return res.status(200).json({
                status: 'ERR',
                message: 'Insufficient value entered controller',
            });
        }
        const response = await UserService.loginUser(req.body);
        const { refresh_token, ...newResponse } = response;
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: false,
            samesite: 'strict',
            path: '/',
        });
        return res.status(200).json({ ...newResponse, refresh_token }); // lưu ý refresh token ở đây
    } catch (e) {
        return res.status(404).json({
            message: e,
        });
    }
};

module.exports = {
    createUser,
    loginUser,
};