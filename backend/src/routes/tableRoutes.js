const express = require('express');
const router = express.Router();
const Table = require('../models/Table');

// GET /api/tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().populate('currentOrder').sort({ zone: 1, number: 1, name: 1 });
    res.json({ success: true, count: tables.length, data: tables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tables
router.post('/', async (req, res) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tables/:id
router.put('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!table) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/tables/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, currentOrder } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Not found' });
    if (status) table.status = status;
    if (typeof currentOrder !== 'undefined') table.currentOrder = currentOrder;
    await table.save();
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/tables/:id
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
