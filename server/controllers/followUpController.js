const followUpService = require('../services/followUpService');
const { toFollowUpDto } = require('../utils/followUpDto');

class FollowUpController {
  async getFollowUps(req, res, next) {
    try {
      const { followUps, pagination } = await followUpService.listFollowUps(req.query, req.user);

      res.status(200).json({
        success: true,
        followUps: followUps.map(toFollowUpDto),
        pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getFollowUpById(req, res, next) {
    try {
      const item = await followUpService.getFollowUpById(req.params.id, req.user);

      res.status(200).json({
        success: true,
        followUp: toFollowUpDto(item),
      });
    } catch (err) {
      next(err);
    }
  }

  async createFollowUp(req, res, next) {
    try {
      const item = await followUpService.createFollowUp(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Follow-up activity scheduled successfully.',
        followUp: toFollowUpDto(item),
      });
    } catch (err) {
      next(err);
    }
  }

  async rescheduleFollowUp(req, res, next) {
    try {
      const item = await followUpService.rescheduleFollowUp(req.params.id, req.body, req.user);

      res.status(200).json({
        success: true,
        message: 'Follow-up rescheduled successfully.',
        followUp: toFollowUpDto(item),
      });
    } catch (err) {
      next(err);
    }
  }

  async completeFollowUp(req, res, next) {
    try {
      const item = await followUpService.completeFollowUp(req.params.id, req.body, req.user);

      res.status(200).json({
        success: true,
        message: 'Follow-up marked as completed.',
        followUp: toFollowUpDto(item),
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteFollowUp(req, res, next) {
    try {
      const result = await followUpService.deleteFollowUp(req.params.id, req.user);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FollowUpController();
