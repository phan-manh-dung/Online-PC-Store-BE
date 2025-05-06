const mongoose = require('mongoose');

const computerOptionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { timestamps: true },
);

const ComputerOption = mongoose.model('ComputerOption', computerOptionSchema);

module.exports = ComputerOption;
