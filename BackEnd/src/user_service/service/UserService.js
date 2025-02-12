const { User, Account,Role } = require('../model/UserModel');
const bcrypt = require('bcryptjs');
const { generalAccessToken, refreshAccessToken } = require('../service/JwtServices');

const createUser = async (newUser) => {
    return new Promise(async (resolve, reject) => {
        const { name, password } = newUser;
        try {
            const checkUser = await User.findOne({ name });
            if (checkUser) {
                return resolve({
                    status: 'ERR',
                    message: 'The name is already in use',
                });
            }

            const hash = bcrypt.hashSync(String(password), 10);

            // Tìm role CUSTOMER
            const customerRole = await Role.findOne({ name: "CUSTOMER" });
            if (!customerRole) {
                return resolve({
                    status: 'ERR',
                    message: 'Role CUSTOMER does not exist',
                });
            }

            // **Tạo User trước**
            const user = new User({ name,password: hash });
            await user.save(); // Lưu user vào database

            // **Tạo Account với `user_id`**
            const account = new Account({
                account_id: Date.now(),
                user_id: user._id,
                roles: [{ _id: customerRole._id, name: customerRole.name }],
            });
            await account.save(); // Lưu account vào database

            // **Cập nhật User với Account**
            user.account = account._id;
            await user.save(); // Lưu lại user với account mới

            resolve({
                status: 'OK',
                message: 'User created successfully',
                data: user,
            });
        } catch (e) {
            console.error('Error in service:', e);
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
            console.error("Error in loginUser service:", e);
            reject(e);
        }
    });
};

const getAllUser = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allUser = await User.find();
            resolve({
                status: 'OK',
                message: 'Get all Success',
                data: allUser,
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createUser,
    loginUser,
    getAllUser
};