const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('table', 'number name')
      .sort({ date: 1, time: 1 });
    res.json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const reservation = await Reservation.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
