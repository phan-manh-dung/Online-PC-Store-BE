const User = require('../model/UserModel');
const bcrypt = require('bcryptjs');
const { generalAccessToken, refreshAccessToken } = require('../service/JwtServices');

const createUser = (newUser) => {
    return new Promise(async (resolve, reject) => {
        const { name, password } = newUser;
        try {
            const checkUser = await User.findOne({
                name: name,
            });
            if (checkUser !== null) {
                await checkUser.save();
                resolve({
                    status: 'ERR',
                    message: 'The name is already service',
                });
            }
            const hash = bcrypt.hashSync(String(password), 10);
            const createUser = await User.create({
                name,
                password: hash,
            });
            if (createUser) {
                resolve({
                    status: 'OK',
                    message: 'Success user service',
                    data: createUser,
                });
            }
        } catch (e) {
            console.error('Error service:', e);
            reject(e);
        }
    });
};

const loginUser = (userLogin) => {
    return new Promise(async (resolve, reject) => {
        const { name, password } = userLogin;
        try {
            const checkUser = await User.findOne({
                name: name,
            });
            if (checkUser === null) {
                resolve({
                    status: 'ERR',
                    message: 'The user is not database service',
                });
            }
            const comparePassword = bcrypt.compareSync(password, checkUser.password);
            if (!comparePassword) {
                resolve({
                    status: 'ERR',
                    message: 'The password or user is incorrect service',
                });
            }
            const access_token = await generalAccessToken({
                id: checkUser.id,
                isAdmin: checkUser.isAdmin,
            });
            const refresh_token = await refreshAccessToken({
                id: checkUser.id,
                isAdmin: checkUser.isAdmin,
            });
            resolve({
                status: 'OK',
                message: 'Success',
                access_token,
                refresh_token,
                userId: checkUser.id,
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createUser,
    loginUser,
};