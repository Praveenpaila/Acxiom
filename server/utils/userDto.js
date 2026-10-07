// Convert user model or document to safe client-facing DTO
const toUserDto = (user) => {
  if (!user) return null;

  return {
    id: user._id ? user._id.toString() : user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    reportingTo: user.reportingTo || null,
    isActive: Boolean(user.isActive),
    isLocked: typeof user.isLocked === 'function' ? user.isLocked() : Boolean(user.lockoutUntil && new Date(user.lockoutUntil) > new Date()),
    lockoutUntil: user.lockoutUntil || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

module.exports = { toUserDto };
