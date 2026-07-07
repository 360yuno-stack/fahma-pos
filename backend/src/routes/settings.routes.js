const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', settingsController.get);
router.put('/', authorize('administrador'), settingsController.update);

module.exports = router;
