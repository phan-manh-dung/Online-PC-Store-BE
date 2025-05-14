const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role_id: { type: Number, required: true, unique: true },
  name: { type: String, enum: ['ADMIN', 'CUSTOMER'], required: true },
});

const accountSchema = new mongoose.Schema({
  account_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roles: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
      name: { type: String },
    },
  ],
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true, index: true }, // dùng login
    fullname: { type: String, index: true, default: null },
    email: { type: String, unique: true, index: true, default: null }, // user name

    gender: { type: String, default: null },
    dateOfBirth: { type: Date, required: false, default: null },
    password: { type: String, required: true },
    phone: { type: String, index: true, default: null },
    avatar: { type: String, default: null },
    loginType: { type: String, default: 'BASIC' },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    address: [
      {
        ward: { type: String, default: null },
        district: { type: String, default: null },
        province: { type: String, default: null },
        country: { type: String, default: null },
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
  },
);
// Chỉ mục phức hợp này có thể được sử dụng nếu bạn có các truy vấn mà lọc dựa trên cả name và email.
const User = mongoose.model('User', userSchema);
const Role = mongoose.model('Role', roleSchema);
const Account = mongoose.model('Account', accountSchema);
module.exports = { Role, Account, User };
