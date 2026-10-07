const express = require('express');
const opportunityController = require('../controllers/opportunityController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const csrfCheck = require('../middleware/csrfCheck');
const {
  createOpportunitySchema,
  updateOpportunitySchema,
} = require('../validators/opportunityValidator');

const router = express.Router();

router.use(authenticate);

router.get('/', opportunityController.getOpportunities);
router.get('/pipeline', opportunityController.getPipelineReport);
router.get('/:id', opportunityController.getOpportunityById);
router.post('/', csrfCheck, validate(createOpportunitySchema), opportunityController.createOpportunity);
router.put('/:id', csrfCheck, validate(updateOpportunitySchema), opportunityController.updateOpportunity);
router.delete('/:id', csrfCheck, opportunityController.deleteOpportunity);

module.exports = router;
