import api from './client';

export const auditApi = {
  getLogs: async (params = {}) => {
    const res = await api.get('/audit', { params });
    return res.data;
  },
};
