const opportunityService = require('../services/opportunityService');
const { toOpportunityDto } = require('../utils/opportunityDto');

class OpportunityController {
  async getOpportunities(req, res, next) {
    try {
      const { opportunities, pagination } = await opportunityService.listOpportunities(
        req.query,
        req.user
      );

      res.status(200).json({
        success: true,
        opportunities: opportunities.map(toOpportunityDto),
        pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getOpportunityById(req, res, next) {
    try {
      const opp = await opportunityService.getOpportunityById(req.params.id, req.user);

      res.status(200).json({
        success: true,
        opportunity: toOpportunityDto(opp),
      });
    } catch (err) {
      next(err);
    }
  }

  async createOpportunity(req, res, next) {
    try {
      const opp = await opportunityService.createOpportunity(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Opportunity created successfully.',
        opportunity: toOpportunityDto(opp),
      });
    } catch (err) {
      next(err);
    }
  }

  async updateOpportunity(req, res, next) {
    try {
      const opp = await opportunityService.updateOpportunity(req.params.id, req.body, req.user);

      res.status(200).json({
        success: true,
        message: 'Opportunity updated successfully.',
        opportunity: toOpportunityDto(opp),
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteOpportunity(req, res, next) {
    try {
      const result = await opportunityService.deleteOpportunity(req.params.id, req.user);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPipelineReport(req, res, next) {
    try {
      const stats = await opportunityService.getPipelineReport(req.user);

      res.status(200).json({
        success: true,
        stats,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OpportunityController();
