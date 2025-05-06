const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const optionSchema = new Schema(
  {
    label: { type: String, required: true },
    api_url: { type: String, required: true },
  },
  { _id: true },
);

const filterItemSchema = new Schema(
  {
    header: { type: String, required: true },
    options: [optionSchema],
  },
  { _id: true },
);

const filterSchema = new Schema(
  {
    categoryId: { type: Types.ObjectId, required: true, ref: 'Category' },
    filters: [filterItemSchema],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Filter', filterSchema);
