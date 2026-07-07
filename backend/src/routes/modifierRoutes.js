const express = require('express');
const router = express.Router();
const Modifier = require('../models/Modifier');

// GET /api/modifiers
router.get('/', async (req, res) => {
  try {
    const modifiers = await Modifier.find().sort({ name: 1 });
    res.json({ success: true, count: modifiers.length, data: modifiers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/modifiers
router.post('/', async (req, res) => {
  try {
    const modifier = await Modifier.create(req.body);
    res.status(201).json({ success: true, data: modifier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/modifiers/:id
router.put('/:id', async (req, res) => {
  try {
    const modifier = await Modifier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!modifier) return res.status(404).json({ success: false, message: 'Modifier not found' });
    res.json({ success: true, data: modifier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/modifiers/:id
router.delete('/:id', async (req, res) => {
  try {
    const modifier = await Modifier.findByIdAndDelete(req.params.id);
    if (!modifier) return res.status(404).json({ success: false, message: 'Modifier not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
