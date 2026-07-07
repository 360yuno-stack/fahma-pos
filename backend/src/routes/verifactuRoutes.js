const express = require('express');
const router = express.Router();
const VerifactuConfig = require('../models/VerifactuConfig');

// GET /api/verifactu/config
router.get('/config', async (req, res) => {
  try {
    let config = await VerifactuConfig.findOne();
    if (!config) {
      config = await VerifactuConfig.create({});
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/verifactu/config
router.put('/config', async (req, res) => {
  try {
    let config = await VerifactuConfig.findOne();
    if (!config) {
      config = await VerifactuConfig.create(req.body);
    } else {
      config = await VerifactuConfig.findByIdAndUpdate(config._id, req.body, { new: true });
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
