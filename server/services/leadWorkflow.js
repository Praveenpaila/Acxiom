const AppError = require('../utils/appError');

// Valid status transitions map for the sales lead lifecycle
const ALLOWED_TRANSITIONS = {
  New: ['Contacted', 'Unqualified', 'Lost'],
  Contacted: ['Qualified', 'Unqualified', 'Lost'],
  Qualified: ['Converted', 'Lost'],
  Unqualified: ['Contacted'],
  Lost: ['Contacted'],
  Converted: [], // Terminal status
};

const validateStatusTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) {
    return true;
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    throw new AppError(
      `Invalid status transition: Cannot move lead from "${currentStatus}" to "${targetStatus}".`,
      400
    );
  }

  return true;
};

const getAvailableTransitions = (currentStatus) => {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
};

module.exports = {
  ALLOWED_TRANSITIONS,
  validateStatusTransition,
  getAvailableTransitions,
};
