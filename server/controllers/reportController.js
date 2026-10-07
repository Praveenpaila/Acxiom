const reportService = require('../services/reportService');

class ReportController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await reportService.getDashboardSummary(req.user);
      res.status(200).json({
        success: true,
        stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getReport(req, res, next) {
    try {
      const { type } = req.params;
      const result = await reportService.getReportData(type, req.user);
      res.status(200).json({
        success: true,
        type,
        columns: result.columns,
        data: result.data,
      });
    } catch (err) {
      next(err);
    }
  }

  async exportCsv(req, res, next) {
    try {
      const { type } = req.params;
      const csv = await reportService.exportReportToCsv(type, req.user);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="acxiomcrm-${type}-report-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
