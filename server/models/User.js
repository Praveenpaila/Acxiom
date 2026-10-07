const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USER_ROLES = ['Admin', 'Manager', 'SalesExecutive'];
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'SalesExecutive',
      index: true,
    },
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginCount: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare incoming password with hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is currently locked out
userSchema.methods.isLocked = function () {
  return Boolean(this.lockoutUntil && this.lockoutUntil.getTime() > Date.now());
};

// Track failed login attempt and apply 15 min lock on 5th failure
userSchema.methods.recordFailedAttempt = async function () {
  // If lock expired already, reset count before continuing
  if (this.lockoutUntil && this.lockoutUntil.getTime() <= Date.now()) {
    this.failedLoginCount = 0;
    this.lockoutUntil = null;
  }

  this.failedLoginCount += 1;

  if (this.failedLoginCount >= LOCKOUT_THRESHOLD) {
    this.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
  }

  return this.save();
};

// Reset lockout state upon successful authentication
userSchema.methods.resetLockout = async function () {
  if (this.failedLoginCount === 0 && !this.lockoutUntil) return this;

  this.failedLoginCount = 0;
  this.lockoutUntil = null;
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.USER_ROLES = USER_ROLES;
