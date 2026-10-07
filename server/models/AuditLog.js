const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    userEmail: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'FAILED_LOGIN',
        'LOCKOUT',
        'CREATE',
        'UPDATE',
        'DELETE',
        'STATUS_CHANGE',
        'ROLE_CHANGE',
        'PASSWORD_RESET',
        'LOCKOUT_RESET',
        'LEAD_CONVERTED',
      ],
      index: true,
    },
    entityName: {
      type: String,
      required: true,
      enum: ['AUTH', 'USER', 'CUSTOMER', 'LEAD', 'OPPORTUNITY', 'FOLLOWUP'],
      index: true,
    },
    recordId: {
      type: String,
      default: null,
      index: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only timestamp
  }
);

// Enforce append-only semantics on Mongoose level
auditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs are immutable and cannot be updated.');
});
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs are immutable and cannot be updated.');
});
auditLogSchema.pre('deleteOne', function () {
  throw new Error('Audit logs are immutable and cannot be deleted.');
});
auditLogSchema.pre('findOneAndDelete', function () {
  throw new Error('Audit logs are immutable and cannot be deleted.');
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
