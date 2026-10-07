const userService = require('../services/userService');
const { toUserDto } = require('../utils/userDto');

class UserController {
  async listUsers(req, res, next) {
    try {
      const users = await userService.listUsers(req.query);
      res.status(200).json({
        success: true,
        users: users.map(toUserDto),
      });
    } catch (err) {
      next(err);
    }
  }

  async listAssignable(req, res, next) {
    try {
      const users = await userService.listUsers({ isActive: 'true' });
      res.status(200).json({
        success: true,
        users: users.map(toUserDto),
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        user: toUserDto(user),
      });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body, req.user, req);
      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: toUserDto(user),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user, req);
      res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        user: toUserDto(user),
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const user = await userService.toggleUserStatus(req.params.id, req.body.isActive, req.user, req);
      res.status(200).json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
        user: toUserDto(user),
      });
    } catch (err) {
      next(err);
    }
  }

  async resetLockout(req, res, next) {
    try {
      const user = await userService.resetLockout(req.params.id, req.user, req);
      res.status(200).json({
        success: true,
        message: 'User lockout cleared successfully.',
        user: toUserDto(user),
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await userService.resetPassword(req.params.id, req.body.password, req.user, req);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
