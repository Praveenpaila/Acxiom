const auditService = require('../services/auditService');

class AuditController {
  async listLogs(req, res, next) {
    try {
      const result = await auditService.listLogs(req.query);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuditController();
