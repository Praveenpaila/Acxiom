const User = require('../models/User');
const AppError = require('../utils/appError');
const auditService = require('./auditService');
const bcrypt = require('bcryptjs');

class UserService {
  async listUsers(query = {}) {
    const filter = {};

    if (query.role && query.role !== 'All') {
      filter.role = query.role;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      const regex = new RegExp(s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .populate('reportingTo', 'name email role');

    return users;
  }

  async getUserById(id) {
    const user = await User.findById(id).populate('reportingTo', 'name email role');
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }

  async createUser(data, adminUser, req) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: data.phone.trim() }],
    });

    if (existing) {
      throw new AppError('A user with this email or phone number already exists.', 409);
    }

    const user = new User({
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      password: data.password,
      role: data.role || 'SalesExecutive',
      reportingTo: data.reportingTo || null,
      isActive: true,
    });

    await user.save();

    await auditService.log({
      req,
      userId: adminUser._id,
      userEmail: adminUser.email,
      action: 'CREATE',
      entityName: 'USER',
      recordId: user._id,
      newValue: { name: user.name, email: user.email, role: user.role },
    });

    return user;
  }

  async updateUser(id, data, adminUser, req) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const oldValue = {
      name: user.name,
      phone: user.phone,
      role: user.role,
      reportingTo: user.reportingTo,
    };

    let roleChanged = false;
    if (data.role && data.role !== user.role) {
      user.role = data.role;
      roleChanged = true;
    }

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.reportingTo !== undefined) user.reportingTo = data.reportingTo || null;

    await user.save();

    const newValue = {
      name: user.name,
      phone: user.phone,
      role: user.role,
      reportingTo: user.reportingTo,
    };

    await auditService.log({
      req,
      userId: adminUser._id,
      userEmail: adminUser.email,
      action: roleChanged ? 'ROLE_CHANGE' : 'UPDATE',
      entityName: 'USER',
      recordId: user._id,
      oldValue,
      newValue,
    });

    return user.populate('reportingTo', 'name email role');
  }

  async toggleUserStatus(id, isActive, adminUser, req) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === adminUser._id.toString() && !isActive) {
      throw new AppError('You cannot deactivate your own admin account.', 400);
    }

    const oldStatus = user.isActive;
    user.isActive = Boolean(isActive);
    await user.save();

    await auditService.log({
      req,
      userId: adminUser._id,
      userEmail: adminUser.email,
      action: 'STATUS_CHANGE',
      entityName: 'USER',
      recordId: user._id,
      oldValue: { isActive: oldStatus },
      newValue: { isActive: user.isActive },
    });

    return user;
  }

  async resetLockout(id, adminUser, req) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    user.failedLoginCount = 0;
    user.lockoutUntil = null;
    await user.save();

    await auditService.log({
      req,
      userId: adminUser._id,
      userEmail: adminUser.email,
      action: 'LOCKOUT_RESET',
      entityName: 'USER',
      recordId: user._id,
      newValue: { isLocked: false, failedLoginCount: 0 },
    });

    return user;
  }

  async resetPassword(id, newPassword, adminUser, req) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    user.password = newPassword; // Will trigger bcrypt hash in pre-save hook
    user.failedLoginCount = 0;
    user.lockoutUntil = null;
    await user.save();

    await auditService.log({
      req,
      userId: adminUser._id,
      userEmail: adminUser.email,
      action: 'PASSWORD_RESET',
      entityName: 'USER',
      recordId: user._id,
      newValue: { passwordReset: true },
    });

    return { message: 'Password has been reset successfully.' };
  }
}

module.exports = new UserService();
