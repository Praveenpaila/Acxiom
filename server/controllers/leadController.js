const leadService = require('../services/leadService');
const { toLeadDto } = require('../utils/leadDto');
const { toCustomerDto } = require('../utils/customerDto');

class LeadController {
  async getLeads(req, res, next) {
    try {
      const { leads, pagination } = await leadService.listLeads(req.query, req.user);

      res.status(200).json({
        success: true,
        leads: leads.map(toLeadDto),
        pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLeadById(req, res, next) {
    try {
      const lead = await leadService.getLeadById(req.params.id, req.user);

      res.status(200).json({
        success: true,
        lead: toLeadDto(lead),
      });
    } catch (err) {
      next(err);
    }
  }

  async createLead(req, res, next) {
    try {
      const lead = await leadService.createLead(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Lead created successfully.',
        lead: toLeadDto(lead),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateLead(req, res, next) {
    try {
      const lead = await leadService.updateLead(req.params.id, req.body, req.user);

      res.status(200).json({
        success: true,
        message: 'Lead updated successfully.',
        lead: toLeadDto(lead),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateLeadStatus(req, res, next) {
    try {
      const lead = await leadService.updateLeadStatus(req.params.id, req.body.status, req.user);

      res.status(200).json({
        success: true,
        message: `Lead status updated to ${lead.status}.`,
        lead: toLeadDto(lead),
      });
    } catch (err) {
      next(err);
    }
  }

  async convertLead(req, res, next) {
    try {
      const { lead, customer, opportunity } = await leadService.convertLead(
        req.params.id,
        req.body,
        req.user
      );

      res.status(200).json({
        success: true,
        message: 'Lead converted successfully to Customer and Opportunity.',
        lead: toLeadDto(lead),
        customer: toCustomerDto(customer),
        opportunityId: opportunity._id.toString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteLead(req, res, next) {
    try {
      const result = await leadService.deleteLead(req.params.id, req.user);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LeadController();
