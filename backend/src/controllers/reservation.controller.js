const Reservation = require('../models/Reservation');

// GET /api/reservations - Get all reservations with date filter
exports.getAll = async (req, res) => {
  try {
    const { date, status } = req.query;
    const filter = {};

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.date = { $gte: dayStart, $lte: dayEnd };
    }
    if (status) {
      filter.status = status;
    }

    const reservations = await Reservation.find(filter)
      .populate('table', 'name number zone')
      .populate('createdBy', 'username')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, count: reservations.length, data: reservations });
  } catch (error) {
    console.error('Error getting reservations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/reservations - Create reservation
exports.create = async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();

    const populated = await Reservation.findById(reservation._id)
      .populate('table', 'name number zone');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/reservations/:id - Update reservation
exports.update = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('table', 'name number zone');

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/reservations/:id - Delete reservation
exports.delete = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/reservations/:id/status - Update reservation status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('table', 'name number zone');

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
