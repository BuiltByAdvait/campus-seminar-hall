import api from './client';

export const hallsApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/halls', { params });
    return res.data.data.halls;
  },
  getById: async (id) => {
    const res = await api.get(`/halls/${id}`);
    return res.data.data.hall;
  },
  getAvailability: async (id, date) => {
    const res = await api.get(`/halls/${id}/availability`, { params: { date } });
    return res.data.data;
  },
  create: async (hallData) => {
    const res = await api.post('/halls', hallData);
    return res.data.data.hall;
  },
  update: async (id, updates) => {
    const res = await api.patch(`/halls/${id}`, updates);
    return res.data.data.hall;
  },
  remove: async (id) => {
    const res = await api.delete(`/halls/${id}`);
    return res.data;
  }
};
