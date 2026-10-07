const toFollowUpDto = (item) => {
  if (!item) return null;

  const isOverdue =
    item.status === 'Pending' && new Date(item.dueDate).getTime() < Date.now();

  return {
    id: item._id ? item._id.toString() : item.id,
    type: item.type,
    title: item.title,
    description: item.description || '',
    customerId: item.customerId
      ? typeof item.customerId === 'object' && item.customerId._id
        ? {
            id: item.customerId._id.toString(),
            customerCode: item.customerId.customerCode,
            company: item.customerId.company,
            name: item.customerId.name,
          }
        : { id: item.customerId.toString() }
      : null,
    leadId: item.leadId
      ? typeof item.leadId === 'object' && item.leadId._id
        ? {
            id: item.leadId._id.toString(),
            leadCode: item.leadId.leadCode,
            company: item.leadId.company,
            name: item.leadId.name,
          }
        : { id: item.leadId.toString() }
      : null,
    opportunityId: item.opportunityId
      ? typeof item.opportunityId === 'object' && item.opportunityId._id
        ? {
            id: item.opportunityId._id.toString(),
            name: item.opportunityId.name,
          }
        : { id: item.opportunityId.toString() }
      : null,
    dueDate: item.dueDate,
    status: item.status,
    priority: item.priority,
    isOverdue,
    completedAt: item.completedAt || null,
    completedNotes: item.completedNotes || '',
    assignedTo: item.assignedTo
      ? typeof item.assignedTo === 'object' && item.assignedTo._id
        ? {
            id: item.assignedTo._id.toString(),
            name: item.assignedTo.name,
            role: item.assignedTo.role,
          }
        : { id: item.assignedTo.toString() }
      : null,
    createdBy: item.createdBy
      ? typeof item.createdBy === 'object' && item.createdBy._id
        ? {
            id: item.createdBy._id.toString(),
            name: item.createdBy.name,
            role: item.createdBy.role,
          }
        : { id: item.createdBy.toString() }
      : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

module.exports = { toFollowUpDto };
