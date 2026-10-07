const User = require('../models/User');
const AppError = require('../utils/appError');
const { signToken } = require('../utils/token');
const auditService = require('./auditService');

class AuthService {
  async login({ email, password }, req = null) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      await auditService.log({
        req,
        userEmail: normalizedEmail,
        action: 'FAILED_LOGIN',
        entityName: 'AUTH',
        newValue: { reason: 'User not found' },
      });
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
    }

    // Check account lockout status
    if (user.isLocked()) {
      await auditService.log({
        req,
        userId: user._id,
        userEmail: user.email,
        action: 'LOCKOUT',
        entityName: 'AUTH',
        newValue: { lockoutUntil: user.lockoutUntil },
      });

      const minutesRemaining = Math.max(1, Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000));
      throw new AppError(
        `Account is temporarily locked due to multiple failed attempts. Try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`,
        403
      );
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await user.recordFailedAttempt();

      if (user.isLocked()) {
        await auditService.log({
          req,
          userId: user._id,
          userEmail: user.email,
          action: 'LOCKOUT',
          entityName: 'AUTH',
          newValue: { failedLoginCount: user.failedLoginCount },
        });

        throw new AppError(
          'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.',
          403
        );
      }

      await auditService.log({
        req,
        userId: user._id,
        userEmail: user.email,
        action: 'FAILED_LOGIN',
        entityName: 'AUTH',
        newValue: { failedLoginCount: user.failedLoginCount },
      });

      const attemptsRemaining = Math.max(0, 5 - user.failedLoginCount);
      throw new AppError('Invalid email or password.', 401, { attemptsRemaining });
    }

    // Reset failed counter upon successful login
    await user.resetLockout();

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: 'LOGIN',
      entityName: 'AUTH',
    });

    const token = signToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    return { user, token };
  }

  async register(data, req = null) {
    const normalizedEmail = data.email.trim().toLowerCase();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw new AppError('A user with this email address already exists.', 409);
    }

    const existingPhone = await User.findOne({ phone: data.phone.trim() });
    if (existingPhone) {
      throw new AppError('A user with this phone number already exists.', 409);
    }

    const user = new User({
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      password: data.password,
      role: data.role || 'SalesExecutive',
      reportingTo: data.reportingTo || null,
    });

    await user.save();

    await auditService.log({
      req,
      userId: user._id,
      userEmail: user.email,
      action: 'CREATE',
      entityName: 'USER',
      recordId: user._id,
      newValue: { name: user.name, email: user.email, role: user.role },
    });

    const token = signToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    return { user, token };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }
}

module.exports = new AuthService();
