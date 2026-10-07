const Customer = require('../models/Customer');
const User = require('../models/User');
const AppError = require('../utils/appError');
const auditService = require('./auditService');

class CustomerService {
  // Build role-based scoping filter
  async getScopedUserFilter(user) {
    if (user.role === 'Admin') {
      return {};
    }

    if (user.role === 'Manager') {
      // Find all executives reporting to this manager + the manager themselves
      const teamExecutives = await User.find({ reportingTo: user._id }).select('_id');
      const teamUserIds = [user._id, ...teamExecutives.map((exec) => exec._id)];
      return { createdBy: { $in: teamUserIds } };
    }

    // SalesExecutive sees only records created by or assigned to them
    return { createdBy: user._id };
  }

  // Ensure user has access to a specific record (service-level security check)
  async verifyCustomerAccess(customer, user) {
    if (!customer) {
      throw new AppError('Customer not found.', 404);
    }

    if (user.role === 'Admin') {
      return true;
    }

    const creatorId = customer.createdBy._id
      ? customer.createdBy._id.toString()
      : customer.createdBy.toString();

    if (user.role === 'Manager') {
      const teamExecutives = await User.find({ reportingTo: user._id }).select('_id');
      const allowedIds = new Set([
        user._id.toString(),
        ...teamExecutives.map((e) => e._id.toString()),
      ]);

      if (!allowedIds.has(creatorId)) {
        throw new AppError('Access denied: You do not have permission to access this customer record.', 403);
      }
      return true;
    }

    if (creatorId !== user._id.toString()) {
      throw new AppError('Access denied: You do not have permission to access this customer record.', 403);
    }

    return true;
  }

  // Generate unique formatted customer code like CUST-1001
  async generateCustomerCode() {
    const lastCustomer = await Customer.findOne().sort({ createdAt: -1 }).select('customerCode');
    if (!lastCustomer || !lastCustomer.customerCode) {
      return 'CUST-1001';
    }

    const match = lastCustomer.customerCode.match(/CUST-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `CUST-${nextNum}`;
    }

    return `CUST-${Date.now().toString().slice(-4)}`;
  }

  // List customers with pagination, search, and status filter
  async listCustomers(query, user) {
    const roleFilter = await this.getScopedUserFilter(user);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { ...roleFilter };

    // Status filter
    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    // Search across name, email, phone, company
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      const searchRegex = new RegExp(s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { customerCode: searchRegex },
      ];
    }

    // Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email role'),
      Customer.countDocuments(filter),
    ]);

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // Get single customer with ownership check
  async getCustomerById(id, user) {
    const customer = await Customer.findById(id).populate('createdBy', 'name email role');
    await this.verifyCustomerAccess(customer, user);
    return customer;
  }

  // Create customer with duplicate checks
  async createCustomer(data, user) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedPhone = data.phone.trim();

    // Duplicate check on email
    const existingEmail = await Customer.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw new AppError('A customer with this email address already exists.', 409);
    }

    // Duplicate check on phone
    const existingPhone = await Customer.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      throw new AppError('A customer with this phone number already exists.', 409);
    }

    const customerCode = await this.generateCustomerCode();

    const customer = new Customer({
      customerCode,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      company: data.company.trim(),
      address: (data.address || '').trim(),
      city: (data.city || '').trim(),
      state: (data.state || '').trim(),
      status: data.status || 'Active',
      createdBy: user._id,
    });

    await customer.save();

    await auditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'CREATE',
      entityName: 'CUSTOMER',
      recordId: customer._id,
      newValue: {
        customerCode: customer.customerCode,
        name: customer.name,
        company: customer.company,
      },
    });

    return customer.populate('createdBy', 'name email role');
  }

  // Update customer with duplicate checks & ownership validation
  async updateCustomer(id, data, user) {
    const customer = await Customer.findById(id);
    await this.verifyCustomerAccess(customer, user);

    const oldValue = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      status: customer.status,
    };

    if (data.email) {
      const normalizedEmail = data.email.trim().toLowerCase();
      if (normalizedEmail !== customer.email) {
        const existingEmail = await Customer.findOne({
          email: normalizedEmail,
          _id: { $ne: customer._id },
        });
        if (existingEmail) {
          throw new AppError('A customer with this email address already exists.', 409);
        }
        customer.email = normalizedEmail;
      }
    }

    if (data.phone) {
      const normalizedPhone = data.phone.trim();
      if (normalizedPhone !== customer.phone) {
        const existingPhone = await Customer.findOne({
          phone: normalizedPhone,
          _id: { $ne: customer._id },
        });
        if (existingPhone) {
          throw new AppError('A customer with this phone number already exists.', 409);
        }
        customer.phone = normalizedPhone;
      }
    }

    if (data.name !== undefined) customer.name = data.name.trim();
    if (data.company !== undefined) customer.company = data.company.trim();
    if (data.address !== undefined) customer.address = data.address.trim();
    if (data.city !== undefined) customer.city = data.city.trim();
    if (data.state !== undefined) customer.state = data.state.trim();
    if (data.status !== undefined) customer.status = data.status;

    await customer.save();

    const newValue = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      status: customer.status,
    };

    await auditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'UPDATE',
      entityName: 'CUSTOMER',
      recordId: customer._id,
      oldValue,
      newValue,
    });

    return customer.populate('createdBy', 'name email role');
  }

  // Delete or deactivate customer
  async deleteCustomer(id, user) {
    const customer = await Customer.findById(id);
    await this.verifyCustomerAccess(customer, user);

    // SalesExecutive soft deactivates, Admin/Manager can remove or deactivate
    if (user.role === 'SalesExecutive') {
      customer.status = 'Inactive';
      await customer.save();

      await auditService.log({
        userId: user._id,
        userEmail: user.email,
        action: 'STATUS_CHANGE',
        entityName: 'CUSTOMER',
        recordId: customer._id,
        newValue: { status: 'Inactive' },
      });

      return { message: 'Customer deactivated successfully.', deactivated: true };
    }

    await Customer.findByIdAndDelete(id);

    await auditService.log({
      userId: user._id,
      userEmail: user.email,
      action: 'DELETE',
      entityName: 'CUSTOMER',
      recordId: customer._id,
    });

    return { message: 'Customer deleted successfully.', deleted: true };
  }
}

module.exports = new CustomerService();
