const optionService = require('../services/ComputerOption_Service');

const createOption = async (req, res) => {
  try {
    const option = await optionService.createOption(req.body);
    res.status(201).json(option);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getAllOptions = async (req, res) => {
  try {
    const options = await optionService.getAllOptions();
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOptionsByKey = async (req, res) => {
  try {
    const key = req.params.key;
    const options = await optionService.getOptionsByKey(key);
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGroupedOptions = async (req, res) => {
  try {
    const grouped = await optionService.getGroupedOptionsService();
    res.status(200).json(grouped);
  } catch (err) {
    console.error('❌ Error in controller:', err);
    res.status(500).json({ message: 'Failed to fetch grouped options', error: err.message });
  }
};
const updateOption = async (req, res) => {
  try {
    const updated = await optionService.updateOption(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteOption = async (req, res) => {
  try {
    await optionService.deleteOption(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createOption,
  getAllOptions,
  getOptionsByKey,
  getGroupedOptions,
  updateOption,
  deleteOption,
};
