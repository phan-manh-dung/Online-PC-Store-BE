const Filter = require('../models/Filter_Model');

const getAll = () => {
  return Filter.find().populate('categoryId');
};

const getById = (id) => {
  return Filter.findById(id).populate('categoryId');
};

const create = (data) => {
  const filter = new Filter(data);
  return filter.save();
};

const update = (id, data) => {
  return Filter.findByIdAndUpdate(id, data, { new: true });
};

const remove = (id) => {
  return Filter.findByIdAndDelete(id);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
