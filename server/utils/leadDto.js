const toLeadDto = (lead) => {
  if (!lead) return null;

  return {
    id: lead._id ? lead._id.toString() : lead.id,
    leadCode: lead.leadCode,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    source: lead.source,
    status: lead.status,
    expectedValue: lead.expectedValue || 0,
    assignedTo: lead.assignedTo
      ? typeof lead.assignedTo === 'object' && lead.assignedTo._id
        ? {
            id: lead.assignedTo._id.toString(),
            name: lead.assignedTo.name,
            email: lead.assignedTo.email,
            role: lead.assignedTo.role,
          }
        : { id: lead.assignedTo.toString() }
      : null,
    convertedCustomerId: lead.convertedCustomerId
      ? typeof lead.convertedCustomerId === 'object' && lead.convertedCustomerId._id
        ? {
            id: lead.convertedCustomerId._id.toString(),
            customerCode: lead.convertedCustomerId.customerCode,
            company: lead.convertedCustomerId.company,
          }
        : { id: lead.convertedCustomerId.toString() }
      : null,
    convertedOpportunityId: lead.convertedOpportunityId
      ? typeof lead.convertedOpportunityId === 'object' && lead.convertedOpportunityId._id
        ? {
            id: lead.convertedOpportunityId._id.toString(),
            name: lead.convertedOpportunityId.name,
            amount: lead.convertedOpportunityId.amount,
          }
        : { id: lead.convertedOpportunityId.toString() }
      : null,
    convertedAt: lead.convertedAt || null,
    createdBy: lead.createdBy
      ? typeof lead.createdBy === 'object' && lead.createdBy._id
        ? {
            id: lead.createdBy._id.toString(),
            name: lead.createdBy.name,
            role: lead.createdBy.role,
          }
        : { id: lead.createdBy.toString() }
      : null,
    notes: lead.notes || '',
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
};

module.exports = { toLeadDto };
