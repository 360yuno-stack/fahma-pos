const Settings = require('../models/Settings');

// GET /api/settings - Get settings (create default if none exist)
exports.get = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        restaurantName: 'FAHMA',
        currency: 'EUR',
        taxRate: 10
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/settings - Update settings
exports.update = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
