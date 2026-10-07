const express = require('express');
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const csrfCheck = require('../middleware/csrfCheck');
const {
  createCustomerSchema,
  updateCustomerSchema,
} = require('../validators/customerValidator');

const router = express.Router();

// Require authentication for all customer endpoints
router.use(authenticate);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', csrfCheck, validate(createCustomerSchema), customerController.createCustomer);
router.put('/:id', csrfCheck, validate(updateCustomerSchema), customerController.updateCustomer);
router.delete('/:id', csrfCheck, customerController.deleteCustomer);

module.exports = router;
