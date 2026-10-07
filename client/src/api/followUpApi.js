import api from './client';

export const followUpApi = {
  getFollowUps: async (params = {}) => {
    const res = await api.get('/followups', { params });
    return res.data;
  },

  getFollowUpById: async (id) => {
    const res = await api.get(`/followups/${id}`);
    return res.data;
  },

  createFollowUp: async (data) => {
    const res = await api.post('/followups', data);
    return res.data;
  },

  rescheduleFollowUp: async (id, data) => {
    const res = await api.patch(`/followups/${id}/reschedule`, data);
    return res.data;
  },

  completeFollowUp: async (id, data) => {
    const res = await api.patch(`/followups/${id}/complete`, data);
    return res.data;
  },

  deleteFollowUp: async (id) => {
    const res = await api.delete(`/followups/${id}`);
    return res.data;
  },
};
