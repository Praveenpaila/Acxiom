const express = require('express');
const authRoutes = require('./authRoutes');

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

module.exports = router;
