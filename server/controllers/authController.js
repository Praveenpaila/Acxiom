const authService = require('../services/authService');
const { setAuthCookie, clearAuthCookie } = require('../utils/token');
const { toUserDto } = require('../utils/userDto');

class AuthController {
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body, req);
      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        user: toUserDto(user),
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body, req);
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        user: toUserDto(user),
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res) {
    clearAuthCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }

  async me(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        user: toUserDto(req.user),
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
