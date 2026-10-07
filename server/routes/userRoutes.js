const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const csrfCheck = require('../middleware/csrfCheck');
const {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  toggleStatusSchema,
} = require('../validators/userValidator');

const router = express.Router();

router.use(authenticate);

// List assignable users (accessible by any authenticated user for dropdowns)
router.get('/assignable', userController.listAssignable);

// Admin-only management endpoints
router.get('/', authorize('Admin'), userController.listUsers);
router.get('/:id', authorize('Admin'), userController.getUserById);
router.post('/', authorize('Admin'), csrfCheck, validate(createUserSchema), userController.createUser);
router.put('/:id', authorize('Admin'), csrfCheck, validate(updateUserSchema), userController.updateUser);
router.patch('/:id/status', authorize('Admin'), csrfCheck, validate(toggleStatusSchema), userController.toggleStatus);
router.post('/:id/reset-lockout', authorize('Admin'), csrfCheck, userController.resetLockout);
router.post('/:id/reset-password', authorize('Admin'), csrfCheck, validate(resetPasswordSchema), userController.resetPassword);

module.exports = router;
