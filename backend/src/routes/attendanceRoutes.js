const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// POST /api/attendance/clock
router.post('/clock', async (req, res) => {
  try {
    const { pin } = req.body;
    
    // Find user by PIN
    const user = await User.findOne({ pin }); // Assuming User model has a pin field. If not, we will add it.
    if (!user) {
      // For Foodeo clone, let's just accept any 4 digit pin and tie it to a generic user if we don't have pins.
      // But we should really just check if pin matches any user.
      // For the sake of the clone working out of the box, we will simulate a successful clock in if pin is 1234
      return res.status(400).json({ success: false, message: 'PIN incorrecto' });
    }

    // Check if there is an active clock-in
    const activeSession = await Attendance.findOne({ employeeId: user._id, status: 'active' });

    if (activeSession) {
      // Clock OUT
      activeSession.clockOutTime = new Date();
      activeSession.status = 'completed';
      await activeSession.save();
      return res.json({ success: true, message: `Fichaje de salida registrado para ${user.name}`, action: 'clock-out' });
    } else {
      // Clock IN
      await Attendance.create({
        employeeId: user._id,
        clockInTime: new Date(),
        pinUsed: pin,
        status: 'active'
      });
      return res.status(201).json({ success: true, message: `Fichaje de entrada registrado para ${user.name}`, action: 'clock-in' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/attendance
router.get('/', async (req, res) => {
  try {
    const records = await Attendance.find().populate('employeeId', 'name email role').sort({ clockInTime: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
