const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const csrfCheck = require('../middleware/csrfCheck');

const router = express.Router();

// Apply rate limiting and CSRF defense to auth mutations
router.post('/register', authLimiter, csrfCheck, validate(registerSchema), authController.register);
router.post('/login', authLimiter, csrfCheck, validate(loginSchema), authController.login);
router.post('/logout', csrfCheck, authController.logout);

// Authenticated session status
router.get('/me', authenticate, authController.me);

module.exports = router;
