const customerService = require('../services/customerService');
const { toCustomerDto } = require('../utils/customerDto');

class CustomerController {
  async getCustomers(req, res, next) {
    try {
      const { customers, pagination } = await customerService.listCustomers(req.query, req.user);

      res.status(200).json({
        success: true,
        customers: customers.map(toCustomerDto),
        pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id, req.user);

      res.status(200).json({
        success: true,
        customer: toCustomerDto(customer),
      });
    } catch (err) {
      next(err);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const customer = await customerService.createCustomer(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully.',
        customer: toCustomerDto(customer),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body, req.user);

      res.status(200).json({
        success: true,
        message: 'Customer updated successfully.',
        customer: toCustomerDto(customer),
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      const result = await customerService.deleteCustomer(req.params.id, req.user);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CustomerController();
