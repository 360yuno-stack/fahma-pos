const Category = require('../models/Category');

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find({ restaurant: req.user.restaurant });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const category = new Category({ ...req.body, restaurant: req.user.restaurant });
    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

module.exports = exports;

