const express = require('express');
const router = express.Router();
const Ingredient = require('../models/Ingredient');

// GET /api/ingredients
router.get('/', async (req, res) => {
  try {
    const ingredients = await Ingredient.find().populate('provider').sort({ name: 1 });
    res.json({ success: true, count: ingredients.length, data: ingredients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ingredients
router.post('/', async (req, res) => {
  try {
    const ingredient = await Ingredient.create(req.body);
    const populated = await Ingredient.findById(ingredient._id).populate('provider');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/ingredients/:id
router.put('/:id', async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('provider');
    if (!ingredient) return res.status(404).json({ success: false, message: 'Ingredient not found' });
    res.json({ success: true, data: ingredient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/ingredients/:id
router.delete('/:id', async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) return res.status(404).json({ success: false, message: 'Ingredient not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
