import api from './client';

export const userApi = {
  getUsers: async (params = {}) => {
    const res = await api.get('/users', { params });
    return res.data;
  },

  getAssignable: async () => {
    const res = await api.get('/users/assignable');
    return res.data;
  },

  getUserById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  createUser: async (userData) => {
    const res = await api.post('/users', userData);
    return res.data;
  },

  updateUser: async (id, userData) => {
    const res = await api.put(`/users/${id}`, userData);
    return res.data;
  },

  toggleStatus: async (id, isActive) => {
    const res = await api.patch(`/users/${id}/status`, { isActive });
    return res.data;
  },

  resetLockout: async (id) => {
    const res = await api.post(`/users/${id}/reset-lockout`);
    return res.data;
  },

  resetPassword: async (id, password) => {
    const res = await api.post(`/users/${id}/reset-password`, { password });
    return res.data;
  },
};
