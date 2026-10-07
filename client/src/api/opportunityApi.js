import api from './client';

export const opportunityApi = {
  getOpportunities: async (params = {}) => {
    const res = await api.get('/opportunities', { params });
    return res.data;
  },

  getPipelineStats: async () => {
    const res = await api.get('/opportunities/pipeline');
    return res.data;
  },

  getOpportunityById: async (id) => {
    const res = await api.get(`/opportunities/${id}`);
    return res.data;
  },

  createOpportunity: async (data) => {
    const res = await api.post('/opportunities', data);
    return res.data;
  },

  updateOpportunity: async (id, data) => {
    const res = await api.put(`/opportunities/${id}`, data);
    return res.data;
  },

  deleteOpportunity: async (id) => {
    const res = await api.delete(`/opportunities/${id}`);
    return res.data;
  },
};
