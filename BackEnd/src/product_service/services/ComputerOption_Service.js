const ComputerOption = require('../models/ComputerOption_Model');

const createOption = async (data) => {
  return await ComputerOption.create(data);
};

const getAllOptions = async () => {
  return await ComputerOption.find();
};

const getGroupedOptionsService = async () => {
  const options = await ComputerOption.find();

  const grouped = {};

  options.forEach((opt) => {
    if (!grouped[opt.key]) {
      grouped[opt.key] = [];
    }

    if (!grouped[opt.key].includes(opt.value)) {
      grouped[opt.key].push(opt.value);
    }
  });

  return grouped;
};

const getOptionsByKey = async (key) => {
  return await ComputerOption.find({ key });
};

const updateOption = async (id, data) => {
  return await ComputerOption.findByIdAndUpdate(id, data, { new: true });
};

const deleteOption = async (id) => {
  return await ComputerOption.findByIdAndDelete(id);
};

module.exports = {
  createOption,
  getAllOptions,
  getOptionsByKey,
  updateOption,
  deleteOption,
  getGroupedOptionsService,
};
