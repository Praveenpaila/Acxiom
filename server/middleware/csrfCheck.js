// CSRF mitigation for cookie-based authentication
// Non-browser or bearer-token requests are immune to cross-site cookie injection
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const csrfCheck = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // If client explicitly authenticates using Bearer token, cookie CSRF does not apply
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  // For state-changing cookie requests or browser clients, enforce anti-CSRF custom header
  // Note: Standard browser forms cannot attach custom headers without CORS preflight approval
  const hasCustomHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];

  // If there are no auth cookies present at all (e.g., initial public login or register), allow
  const hasAuthCookie = Boolean(req.cookies?.token);

  if (hasAuthCookie && !hasCustomHeader) {
    return res.status(403).json({
      success: false,
      message: 'Security validation failed: missing custom request header.',
    });
  }

  next();
};

module.exports = csrfCheck;
