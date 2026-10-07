const express = require('express');
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Strict Admin-only access for audit trail inspection
router.use(authenticate, authorize('Admin'));

router.get('/', auditController.listLogs);

module.exports = router;
