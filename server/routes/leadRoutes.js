const express = require('express');
const leadController = require('../controllers/leadController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const csrfCheck = require('../middleware/csrfCheck');
const {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  convertLeadSchema,
} = require('../validators/leadValidator');

const router = express.Router();

router.use(authenticate);

router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLeadById);
router.post('/', csrfCheck, validate(createLeadSchema), leadController.createLead);
router.put('/:id', csrfCheck, validate(updateLeadSchema), leadController.updateLead);
router.patch('/:id/status', csrfCheck, validate(updateLeadStatusSchema), leadController.updateLeadStatus);
router.post('/:id/convert', csrfCheck, validate(convertLeadSchema), leadController.convertLead);
router.delete('/:id', csrfCheck, leadController.deleteLead);

module.exports = router;
