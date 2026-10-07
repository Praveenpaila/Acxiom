const toOpportunityDto = (opp) => {
  if (!opp) return null;

  const weightedAmount = Math.round(((opp.amount || 0) * (opp.probability || 0)) / 100);

  return {
    id: opp._id ? opp._id.toString() : opp.id,
    name: opp.name,
    customerId: opp.customerId
      ? typeof opp.customerId === 'object' && opp.customerId._id
        ? {
            id: opp.customerId._id.toString(),
            customerCode: opp.customerId.customerCode,
            company: opp.customerId.company,
            name: opp.customerId.name,
          }
        : { id: opp.customerId.toString() }
      : null,
    leadId: opp.leadId
      ? typeof opp.leadId === 'object' && opp.leadId._id
        ? {
            id: opp.leadId._id.toString(),
            leadCode: opp.leadId.leadCode,
            company: opp.leadId.company,
          }
        : { id: opp.leadId.toString() }
      : null,
    amount: opp.amount,
    stage: opp.stage,
    probability: opp.probability,
    weightedAmount,
    expectedCloseDate: opp.expectedCloseDate,
    status: opp.status,
    assignedTo: opp.assignedTo
      ? typeof opp.assignedTo === 'object' && opp.assignedTo._id
        ? {
            id: opp.assignedTo._id.toString(),
            name: opp.assignedTo.name,
            role: opp.assignedTo.role,
          }
        : { id: opp.assignedTo.toString() }
      : null,
    createdBy: opp.createdBy
      ? typeof opp.createdBy === 'object' && opp.createdBy._id
        ? {
            id: opp.createdBy._id.toString(),
            name: opp.createdBy.name,
            role: opp.createdBy.role,
          }
        : { id: opp.createdBy.toString() }
      : null,
    notes: opp.notes || '',
    createdAt: opp.createdAt,
    updatedAt: opp.updatedAt,
  };
};

module.exports = { toOpportunityDto };
