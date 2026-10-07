const toCustomerDto = (customer) => {
  if (!customer) return null;

  return {
    id: customer._id ? customer._id.toString() : customer.id,
    customerCode: customer.customerCode,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    status: customer.status,
    createdBy: customer.createdBy
      ? typeof customer.createdBy === 'object' && customer.createdBy._id
        ? {
            id: customer.createdBy._id.toString(),
            name: customer.createdBy.name,
            email: customer.createdBy.email,
            role: customer.createdBy.role,
          }
        : { id: customer.createdBy.toString() }
      : null,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
};

module.exports = { toCustomerDto };
