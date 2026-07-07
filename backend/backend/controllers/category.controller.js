const Category = require('../models/Category');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parentCategory').sort({ order: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener categorías', error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parentCategory');
    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener categoría', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({ success: true, data: category, message: 'Categoría creada' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al crear categoría', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    res.json({ success: true, data: category, message: 'Categoría actualizada' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error al actualizar categoría', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar categoría', error: error.message });
  }
};

exports.updateCategoriesOrder = async (req, res) => {
  try {
    const { categories } = req.body;
    await Promise.all(categories.map((cat, i) => Category.findByIdAndUpdate(cat.id, { order: i })));
    res.json({ success: true, message: 'Orden actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar orden', error: error.message });
  }
};
