const express = require('express');
const router = express.Router();
const Printer = require('../models/Printer');

// GET /api/printers
router.get('/', async (req, res) => {
  try {
    const printers = await Printer.find().sort({ name: 1 });
    res.json({ success: true, count: printers.length, data: printers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/printers
router.post('/', async (req, res) => {
  try {
    const printer = await Printer.create(req.body);
    res.status(201).json({ success: true, data: printer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/printers/:id
router.put('/:id', async (req, res) => {
  try {
    const printer = await Printer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!printer) return res.status(404).json({ success: false, message: 'Printer not found' });
    res.json({ success: true, data: printer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/printers/:id
router.delete('/:id', async (req, res) => {
  try {
    const printer = await Printer.findByIdAndDelete(req.params.id);
    if (!printer) return res.status(404).json({ success: false, message: 'Printer not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
