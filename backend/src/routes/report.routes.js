const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/sales', reportController.getSalesReport);
router.get('/dashboard', reportController.getDashboard);

module.exports = router;
