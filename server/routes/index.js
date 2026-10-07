const express = require('express');
const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const leadRoutes = require('./leadRoutes');
const followUpRoutes = require('./followUpRoutes');
const opportunityRoutes = require('./opportunityRoutes');
const userRoutes = require('./userRoutes');
const auditRoutes = require('./auditRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AcxiomCRM API',
  });
});

// Mounted modules
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/leads', leadRoutes);
router.use('/followups', followUpRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/users', userRoutes);
router.use('/audit', auditRoutes);
router.use('/', reportRoutes);

module.exports = router;
