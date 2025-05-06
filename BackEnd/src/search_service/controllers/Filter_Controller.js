const filterService = require('../services/Filter_Service');

const getAll = async (req, res) => {
  try {
    const filters = await filterService.getAll();
    res.json(filters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const filter = await filterService.getById(req.params.id);
    if (!filter) return res.status(404).json({ message: 'Filter not found' });
    res.json(filter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const newFilter = await filterService.create(req.body);
    res.status(201).json(newFilter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updated = await filterService.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Filter not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await filterService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Filter not found' });
    res.json({ message: 'Filter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
