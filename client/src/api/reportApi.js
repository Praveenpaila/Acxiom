import api from './client';

export const reportApi = {
  getDashboardStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },

  getReport: async (type) => {
    const res = await api.get(`/reports/${type}`);
    return res.data;
  },

  downloadCsv: async (type) => {
    const res = await api.get(`/reports/${type}/export`, {
      responseType: 'blob',
    });

    // Create a blob URL and trigger file download in browser
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `acxiomcrm-${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
