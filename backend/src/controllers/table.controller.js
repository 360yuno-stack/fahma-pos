const Table = require('../models/Table');

// GET /api/tables - Get all tables
exports.getAll = async (req, res) => {
  try {
    const { zone, status } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (status) filter.status = status;

    const tables = await Table.find(filter)
      .populate('currentOrder')
      .sort({ zone: 1, number: 1 });
    res.json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    console.error('Error getting tables:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/tables/:id - Get table by ID
exports.getById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).populate('currentOrder');
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    res.json({ success: true, data: table });
  } catch (error) {
    console.error('Error getting table:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/tables - Create table
exports.create = async (req, res) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ success: true, data: table });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/tables/:id - Update table
exports.update = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    res.json({ success: true, data: table });
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/tables/:id - Delete table
exports.delete = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/tables/:id/status - Update table status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    table.status = status;
    if (status === 'free') {
      table.currentOrder = null;
    }
    await table.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('table:updated', table);
    }

    res.json({ success: true, data: table });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/tables/requesting - Get tables with requesting status
exports.getRequestingTables = async (req, res) => {
  try {
    const tables = await Table.find({ status: 'requesting' })
      .populate('currentOrder')
      .sort({ updatedAt: 1 });
    res.json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    console.error('Error getting requesting tables:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
