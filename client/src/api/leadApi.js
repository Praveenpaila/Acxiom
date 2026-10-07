import api from './client';

export const leadApi = {
  getLeads: async (params = {}) => {
    const res = await api.get('/leads', { params });
    return res.data;
  },

  getLeadById: async (id) => {
    const res = await api.get(`/leads/${id}`);
    return res.data;
  },

  createLead: async (leadData) => {
    const res = await api.post('/leads', leadData);
    return res.data;
  },

  updateLead: async (id, leadData) => {
    const res = await api.put(`/leads/${id}`, leadData);
    return res.data;
  },

  updateLeadStatus: async (id, status) => {
    const res = await api.patch(`/leads/${id}/status`, { status });
    return res.data;
  },

  convertLead: async (id, convertData = {}) => {
    const res = await api.post(`/leads/${id}/convert`, convertData);
    return res.data;
  },

  deleteLead: async (id) => {
    const res = await api.delete(`/leads/${id}`);
    return res.data;
  },
};
