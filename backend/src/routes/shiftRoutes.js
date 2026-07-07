const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');

// GET /api/shifts
router.get('/', async (req, res) => {
  try {
    const shifts = await Shift.find().populate('user', 'firstName lastName username').sort({ startTime: -1 });
    res.json({ success: true, count: shifts.length, data: shifts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/shifts (Start a shift)
router.post('/', async (req, res) => {
  try {
    const shift = await Shift.create(req.body);
    const populated = await Shift.findById(shift._id).populate('user', 'firstName lastName username');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/shifts/:id (End a shift or update)
router.put('/:id', async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('user', 'firstName lastName username');
    if (!shift) return res.status(404).json({ success: false, message: 'Shift not found' });
    res.json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
