const AuditLog = require('../models/AuditLog');

const SENSITIVE_KEYS = new Set([
  'password',
  'hash',
  'token',
  'secret',
  'authorization',
  'cookie',
  'cookies',
  'jwt',
]);

// Strip sensitive security fields recursively
const sanitizeAuditPayload = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeAuditPayload);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      continue; // Omit sensitive field
    }

    if (value && typeof value === 'object' && !(value instanceof Date)) {
      clean[key] = sanitizeAuditPayload(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
};

class AuditService {
  async log({
    req,
    userId = null,
    userEmail = '',
    action,
    entityName,
    recordId = null,
    oldValue = null,
    newValue = null,
  }) {
    try {
      let ip = '';
      let userAgent = '';

      if (req) {
        ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
        userAgent = req.headers['user-agent'] || '';

        if (!userId && req.user?._id) {
          userId = req.user._id;
        }
        if (!userEmail && req.user?.email) {
          userEmail = req.user.email;
        }
      }

      await AuditLog.create({
        userId,
        userEmail,
        action,
        entityName,
        recordId: recordId ? String(recordId) : null,
        oldValue: sanitizeAuditPayload(oldValue),
        newValue: sanitizeAuditPayload(newValue),
        ipAddress: ip,
        userAgent,
      });
    } catch (err) {
      // Never crash the primary request if logging fails, but log error internally
      console.error('[AUDIT_LOG_ERROR]', err.message);
    }
  }

  async listLogs(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.action && query.action !== 'All') {
      filter.action = query.action;
    }

    if (query.entityName && query.entityName !== 'All') {
      filter.entityName = query.entityName;
    }

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.userEmail) {
      filter.userEmail = new RegExp(query.userEmail.trim(), 'i');
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role'),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

module.exports = new AuditService();
module.exports.sanitizeAuditPayload = sanitizeAuditPayload;
