const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Dashboard live stats
router.get('/dashboard/stats', reportController.getDashboardStats);

// Tabular report data & CSV downloads
router.get('/reports/:type', reportController.getReport);
router.get('/reports/:type/export', reportController.exportCsv);

module.exports = router;
