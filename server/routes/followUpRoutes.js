const express = require('express');
const followUpController = require('../controllers/followUpController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const csrfCheck = require('../middleware/csrfCheck');
const {
  createFollowUpSchema,
  rescheduleFollowUpSchema,
  completeFollowUpSchema,
} = require('../validators/followUpValidator');

const router = express.Router();

router.use(authenticate);

router.get('/', followUpController.getFollowUps);
router.get('/:id', followUpController.getFollowUpById);
router.post('/', csrfCheck, validate(createFollowUpSchema), followUpController.createFollowUp);
router.patch('/:id/reschedule', csrfCheck, validate(rescheduleFollowUpSchema), followUpController.rescheduleFollowUp);
router.patch('/:id/complete', csrfCheck, validate(completeFollowUpSchema), followUpController.completeFollowUp);
router.delete('/:id', csrfCheck, followUpController.deleteFollowUp);

module.exports = router;
